import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { render } from '@react-email/render'
import { sendLovableEmail } from '@lovable.dev/email-js'
import { SignupEmail } from '@/lib/email-templates/signup'
import { InviteEmail } from '@/lib/email-templates/invite'
import { MagicLinkEmail } from '@/lib/email-templates/magic-link'
import { RecoveryEmail } from '@/lib/email-templates/recovery'
import { EmailChangeEmail } from '@/lib/email-templates/email-change'
import { ReauthenticationEmail } from '@/lib/email-templates/reauthentication'

// Supabase Auth (GoTrue) "Send Email" hook endpoint.
// This project uses an external Supabase project, so the hook is pointed here
// directly and verified with the standard-webhooks signature GoTrue sends.

const SITE_NAME = 'Tesla Energy Hub'
const SENDER_DOMAIN = 'notify.tradeenergy.app'
const FROM_DOMAIN = 'tradeenergy.app'
const SITE_URL = `https://${FROM_DOMAIN}`

interface HookPayload {
  user: { email: string; new_email?: string | null }
  email_data: {
    token: string
    token_hash: string
    redirect_to: string
    email_action_type: string
    site_url?: string
    token_new?: string
    token_hash_new?: string
  }
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64)
  const out = new Uint8Array(new ArrayBuffer(bin.length))
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function bytesToBase64(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes)
  let bin = ''
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]!)
  return btoa(bin)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function verifySignature(req: Request, body: string, secret: string): Promise<boolean> {
  const id = req.headers.get('webhook-id')
  const timestamp = req.headers.get('webhook-timestamp')
  const signatureHeader = req.headers.get('webhook-signature')
  if (!id || !timestamp || !signatureHeader) return false

  // Reject replays older than 5 minutes.
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false

  const rawSecret = secret.replace(/^v1,\s*/, '').replace(/^whsec_/, '')
  const key = await crypto.subtle.importKey(
    'raw',
    base64ToBytes(rawSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signed = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${id}.${timestamp}.${body}`)
  )
  const expected = bytesToBase64(signed)

  return signatureHeader
    .split(' ')
    .map((part) => part.split(',')[1] ?? '')
    .some((candidate) => timingSafeEqual(candidate, expected))
}

function supabaseUrl(): string {
  return (
    process.env['SUPABASE_URL'] ||
    process.env['VITE_SUPABASE_URL'] ||
    'https://oeflzmzxbmyuvikubcyx.supabase.co'
  ).replace(/\/$/, '')
}

function verifyUrl(
  tokenHash: string,
  type: string,
  redirectTo: string | undefined
): string {
  const params = new URLSearchParams({ token: tokenHash, type })
  if (redirectTo) params.set('redirect_to', redirectTo)
  return `${supabaseUrl()}/auth/v1/verify?${params.toString()}`
}

function buildEmail(payload: HookPayload): { subject: string; element: React.ReactElement } {
  const { user, email_data: d } = payload
  const action = d.email_action_type

  switch (action) {
    case 'invite':
      return {
        subject: "You've been invited",
        element: React.createElement(InviteEmail, {
          siteName: SITE_NAME,
          siteUrl: SITE_URL,
          confirmationUrl: verifyUrl(d.token_hash, 'invite', d.redirect_to),
        }),
      }
    case 'magiclink':
      return {
        subject: 'Your login link',
        element: React.createElement(MagicLinkEmail, {
          siteName: SITE_NAME,
          confirmationUrl: verifyUrl(d.token_hash, 'magiclink', d.redirect_to),
        }),
      }
    case 'recovery':
      return {
        subject: 'Reset your password',
        element: React.createElement(RecoveryEmail, {
          siteName: SITE_NAME,
          confirmationUrl: verifyUrl(d.token_hash, 'recovery', d.redirect_to),
        }),
      }
    case 'email_change':
    case 'email_change_current':
    case 'email_change_new':
      return {
        subject: 'Confirm your new email',
        element: React.createElement(EmailChangeEmail, {
          siteName: SITE_NAME,
          oldEmail: user.email,
          email: user.email,
          newEmail: user.new_email ?? '',
          confirmationUrl: verifyUrl(
            action === 'email_change_new' ? (d.token_hash_new ?? d.token_hash) : d.token_hash,
            'email_change',
            d.redirect_to
          ),
        }),
      }
    case 'reauthentication':
      return {
        subject: 'Your verification code',
        element: React.createElement(ReauthenticationEmail, { token: d.token }),
      }
    case 'signup':
    default:
      return {
        subject: 'Confirm your email',
        element: React.createElement(SignupEmail, {
          siteName: SITE_NAME,
          siteUrl: SITE_URL,
          recipient: user.email,
          confirmationUrl: verifyUrl(d.token_hash, 'signup', d.redirect_to),
        }),
      }
  }
}

export const Route = createFileRoute('/api/public/auth-email-hook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env['LOVABLE_API_KEY']
        const hookSecret = process.env['SEND_EMAIL_HOOK_SECRET']
        if (!apiKey || !hookSecret) {
          console.error('[auth-email-hook] missing LOVABLE_API_KEY or SEND_EMAIL_HOOK_SECRET')
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const body = await request.text()
        if (!(await verifySignature(request, body, hookSecret))) {
          return Response.json({ error: 'Invalid signature' }, { status: 401 })
        }

        let payload: HookPayload
        try {
          payload = JSON.parse(body) as HookPayload
        } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }

        const recipient =
          payload.email_data?.email_action_type === 'email_change_new'
            ? (payload.user?.new_email ?? payload.user?.email)
            : payload.user?.email
        if (!recipient || !payload.email_data) {
          return Response.json({ error: 'Invalid payload' }, { status: 400 })
        }

        try {
          const { subject, element } = buildEmail(payload)
          const html = await render(element)
          const text = await render(element, { plainText: true })
          const webhookId = request.headers.get('webhook-id')
          const idempotencyKey = webhookId
            ? `auth-${webhookId}`
            : `auth-${payload.email_data.email_action_type}-${payload.email_data.token_hash}`

          await sendLovableEmail(
            {
              to: recipient,
              from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
              sender_domain: SENDER_DOMAIN,
              subject,
              html,
              text,
              purpose: 'transactional',
              label: `supabase-${payload.email_data.email_action_type}`,
              idempotency_key: idempotencyKey,
            },
            { apiKey, sendUrl: process.env['LOVABLE_SEND_URL'] }
          )
        } catch (error) {
          console.error('[auth-email-hook] send failed:', error)
          return Response.json(
            { error: { http_code: 500, message: 'Failed to send email' } },
            { status: 500 }
          )
        }

        return Response.json({})
      },
    },
  },
})
