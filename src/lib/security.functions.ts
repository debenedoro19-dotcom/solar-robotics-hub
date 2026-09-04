import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

const ISSUER = 'Tesla Energy Hub'

// ── helpers ───────────────────────────────────────────────────────────────
async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function clientIp(): string {
  try {
    const req = getRequest()
    const fwd = req.headers.get('x-forwarded-for') ?? ''
    return (
      fwd.split(',')[0]?.trim() ||
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') ||
      'unknown'
    )
  } catch {
    return 'unknown'
  }
}

function requestUserAgent(): string {
  try {
    return getRequest().headers.get('user-agent') ?? ''
  } catch {
    return ''
  }
}

/** Human label like "Chrome on Windows" from a user-agent string. */
export function describeDevice(ua: string): { label: string; browser: string; os: string } {
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Safari\//.test(ua)
          ? 'Safari'
          : /Firefox\//.test(ua)
            ? 'Firefox'
            : 'Browser'
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Android/.test(ua)
      ? 'Android'
      : /iPhone|iPad|iOS/.test(ua)
        ? 'iOS'
        : /Mac OS X|Macintosh/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'Unknown OS'
  return { label: `${browser} on ${os}`, browser, os }
}

function randomDigits(length: number): string {
  const buf = new Uint32Array(length)
  crypto.getRandomValues(buf)
  return Array.from(buf, (n) => String(n % 10)).join('')
}

function randomBackupCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const buf = new Uint32Array(10)
  crypto.getRandomValues(buf)
  const raw = Array.from(buf, (n) => alphabet[n % alphabet.length]).join('')
  return `${raw.slice(0, 5)}-${raw.slice(5)}`
}

// ── device + activity logging ─────────────────────────────────────────────

/**
 * Records a security event, upserts the device fingerprint and emails the
 * investor when the sign-in comes from a device we have not seen before.
 */
export const recordSecurityEvent = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { eventType: string; metadata?: Record<string, unknown> }) => ({
    eventType: String(data.eventType).slice(0, 40),
    metadata: data.metadata ?? {},
  }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const userId = context.userId
    const ua = requestUserAgent()
    const ip = clientIp()
    const { label, browser, os } = describeDevice(ua)
    const deviceHash = await sha256(`${userId}|${ua}|${ip.split('.').slice(0, 2).join('.')}`)

    const { data: existing } = await supabaseAdmin
      .from('user_devices')
      .select('id, first_seen_at')
      .eq('user_id', userId)
      .eq('device_hash', deviceHash)
      .maybeSingle()

    const isNewDevice = !existing

    await supabaseAdmin.from('user_devices').upsert(
      {
        user_id: userId,
        device_hash: deviceHash,
        label,
        browser,
        os,
        last_ip: ip,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,device_hash' },
    )

    await supabaseAdmin.from('auth_events').insert({
      user_id: userId,
      email: context.claims?.email ?? null,
      event_type: data.eventType,
      ip,
      user_agent: ua.slice(0, 400),
      device_label: label,
      new_device: isNewDevice,
      metadata: data.metadata as never,
    })

    // New-login alert: only for genuinely unrecognised devices.
    if (isNewDevice && data.eventType === 'login') {
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('email, full_name')
        .eq('id', userId)
        .maybeSingle()
      const to = profile?.email ?? context.claims?.email
      if (to) {
        const { sendTemplateEmail } = await import('@/lib/email-templates/send-email')
        await sendTemplateEmail('security-alert', to, {
          templateData: {
            name: profile?.full_name ?? 'there',
            title: 'New sign-in to your account',
            device: label,
            ip,
            when: new Date().toISOString().replace('T', ' ').slice(0, 19),
          },
          idempotencyKey: `login-alert-${deviceHash.slice(0, 24)}-${new Date().toISOString().slice(0, 13)}`,
        }).catch((err: unknown) => console.error('[security] login alert failed', err))
      }
    }

    return { ok: true as const, newDevice: isNewDevice, device: label, ip }
  })

/** Paginated security activity + known devices for the signed-in investor. */
export const listSecurityActivity = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { page?: number; pageSize?: number } = {}) => ({
    page: Math.max(0, Number(data.page ?? 0)),
    pageSize: Math.min(50, Math.max(5, Number(data.pageSize ?? 10))),
  }))
  .handler(async ({ data, context }) => {
    const from = data.page * data.pageSize
    const [events, devices] = await Promise.all([
      context.supabase
        .from('auth_events')
        .select('id, event_type, ip, device_label, new_device, success, created_at', { count: 'exact' })
        .eq('user_id', context.userId)
        .order('created_at', { ascending: false })
        .range(from, from + data.pageSize - 1),
      context.supabase
        .from('user_devices')
        .select('id, label, last_ip, last_seen_at, first_seen_at')
        .eq('user_id', context.userId)
        .order('last_seen_at', { ascending: false })
        .limit(10),
    ])
    return {
      events: events.data ?? [],
      total: events.count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
      devices: devices.data ?? [],
    }
  })

// ── two-factor authentication (TOTP) ──────────────────────────────────────

export const get2FAStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc('get_2fa_status')
    return (data ?? { enabled: false, backup_codes_left: 0 }) as {
      enabled: boolean
      confirmed_at: string | null
      backup_codes_left: number
      last_used_at: string | null
    }
  })

/** Creates (or replaces) a pending TOTP secret and returns the enrolment URI. */
export const start2FAEnrollment = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const OTPAuth = await import('otpauth')

    const { data: existing } = await supabaseAdmin
      .from('user_2fa')
      .select('enabled')
      .eq('user_id', context.userId)
      .maybeSingle()
    if (existing?.enabled) return { ok: false as const, error: 'Two-factor authentication is already enabled' }

    const secret = new OTPAuth.Secret({ size: 20 })
    const label = context.claims?.email ?? 'investor'
    const totp = new OTPAuth.TOTP({ issuer: ISSUER, label, algorithm: 'SHA1', digits: 6, period: 30, secret })

    await supabaseAdmin.from('user_2fa').upsert(
      {
        user_id: context.userId,
        secret: secret.base32,
        enabled: false,
        confirmed_at: null,
        backup_codes: [],
        failed_attempts: 0,
      },
      { onConflict: 'user_id' },
    )

    return { ok: true as const, uri: totp.toString(), secret: secret.base32, account: label }
  })

/** Verifies the first code, enables 2FA and returns one-time backup codes. */
export const confirm2FAEnrollment = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { code: string }) => ({ code: String(data.code ?? '').replace(/\D/g, '').slice(0, 6) }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const OTPAuth = await import('otpauth')

    const { data: row } = await supabaseAdmin
      .from('user_2fa')
      .select('secret, enabled')
      .eq('user_id', context.userId)
      .maybeSingle()
    if (!row) return { ok: false as const, error: 'Start the setup again' }
    if (row.enabled) return { ok: false as const, error: 'Two-factor authentication is already enabled' }

    const totp = new OTPAuth.TOTP({
      issuer: ISSUER,
      label: context.claims?.email ?? 'investor',
      secret: OTPAuth.Secret.fromBase32(row.secret),
    })
    if (totp.validate({ token: data.code, window: 1 }) === null) {
      return { ok: false as const, error: 'That code is not valid. Check your authenticator and try again.' }
    }

    const plainCodes = Array.from({ length: 8 }, randomBackupCode)
    const hashed = await Promise.all(plainCodes.map((c) => sha256(c)))

    await supabaseAdmin
      .from('user_2fa')
      .update({
        enabled: true,
        confirmed_at: new Date().toISOString(),
        backup_codes: hashed,
        failed_attempts: 0,
        last_used_at: new Date().toISOString(),
      })
      .eq('user_id', context.userId)

    await supabaseAdmin.from('auth_events').insert({
      user_id: context.userId,
      email: context.claims?.email ?? null,
      event_type: '2fa_enabled',
      ip: clientIp(),
      device_label: describeDevice(requestUserAgent()).label,
    })

    return { ok: true as const, backupCodes: plainCodes }
  })

/** Verifies a TOTP code (or a backup code) for the signed-in investor. */
export const verify2FACode = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { code: string }) => ({ code: String(data.code ?? '').trim().toUpperCase().slice(0, 12) }))
  .handler(async ({ data, context }) => {
    const result = await verifyTotpForUser(context.userId, context.claims?.email ?? 'investor', data.code)
    return result
  })

export const disable2FA = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { code: string }) => ({ code: String(data.code ?? '').trim().toUpperCase().slice(0, 12) }))
  .handler(async ({ data, context }) => {
    const check = await verifyTotpForUser(context.userId, context.claims?.email ?? 'investor', data.code)
    if (!check.ok) return check

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    await supabaseAdmin.from('user_2fa').delete().eq('user_id', context.userId)
    await supabaseAdmin.from('auth_events').insert({
      user_id: context.userId,
      email: context.claims?.email ?? null,
      event_type: '2fa_disabled',
      ip: clientIp(),
      device_label: describeDevice(requestUserAgent()).label,
    })

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('email, full_name')
      .eq('id', context.userId)
      .maybeSingle()
    if (profile?.email) {
      const { sendTemplateEmail } = await import('@/lib/email-templates/send-email')
      await sendTemplateEmail('security-alert', profile.email, {
        templateData: {
          name: profile.full_name ?? 'there',
          title: 'Two-factor authentication turned off',
          message:
            'Two-factor authentication was just disabled on your Tesla Energy Hub account. If this was not you, re-enable it and change your password immediately.',
          device: describeDevice(requestUserAgent()).label,
          ip: clientIp(),
        },
        idempotencyKey: `2fa-disabled-${context.userId}-${Date.now()}`,
      }).catch(() => {})
    }

    return { ok: true as const }
  })

/**
 * Shared TOTP/backup-code check. Exported for other server modules
 * (withdrawal confirmation) — never import this from client code.
 */
export async function verifyTotpForUser(
  userId: string,
  label: string,
  code: string,
): Promise<{ ok: true; usedBackupCode: boolean } | { ok: false; error: string }> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const OTPAuth = await import('otpauth')

  const { data: row } = await supabaseAdmin
    .from('user_2fa')
    .select('secret, enabled, backup_codes, failed_attempts, locked_until')
    .eq('user_id', userId)
    .maybeSingle()

  if (!row?.enabled) return { ok: false, error: 'Two-factor authentication is not enabled' }
  if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
    return { ok: false, error: 'Too many incorrect codes. Try again in a few minutes.' }
  }

  const cleaned = code.trim().toUpperCase()
  const totp = new OTPAuth.TOTP({ issuer: ISSUER, label, secret: OTPAuth.Secret.fromBase32(row.secret) })
  const totpOk = totp.validate({ token: cleaned.replace(/\D/g, ''), window: 1 }) !== null

  let usedBackupCode = false
  if (!totpOk) {
    const hash = await sha256(cleaned)
    const remaining = (row.backup_codes ?? []).filter((c: string) => c !== hash)
    if (remaining.length === (row.backup_codes ?? []).length) {
      const attempts = (row.failed_attempts ?? 0) + 1
      await supabaseAdmin
        .from('user_2fa')
        .update({
          failed_attempts: attempts,
          locked_until: attempts >= 5 ? new Date(Date.now() + 10 * 60_000).toISOString() : null,
        })
        .eq('user_id', userId)
      return { ok: false, error: 'Incorrect authentication code' }
    }
    usedBackupCode = true
    await supabaseAdmin.from('user_2fa').update({ backup_codes: remaining }).eq('user_id', userId)
  }

  await supabaseAdmin
    .from('user_2fa')
    .update({ failed_attempts: 0, locked_until: null, last_used_at: new Date().toISOString() })
    .eq('user_id', userId)

  return { ok: true, usedBackupCode }
}

/** Emailed 6-digit code generator shared with withdrawal confirmation. */
export function generateEmailCode(): string {
  return randomDigits(6)
}

export { sha256 as hashToken, clientIp as currentClientIp, requestUserAgent as currentUserAgent }
