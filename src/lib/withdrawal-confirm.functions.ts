import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

const money = (v: number) =>
  `$${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/**
 * Emails a 6-digit confirmation code for a withdrawal the investor just
 * created. Only the hash is stored, so the code exists solely in the inbox.
 */
export const sendWithdrawalCode = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { requestId: string }) => ({ requestId: String(data.requestId) }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { generateEmailCode, sha256: hashToken, clientIp: currentClientIp, requestUserAgent: currentUserAgent, describeDevice } = await import('./security.server')

    const { data: row } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('id, user_id, user_email, user_name, amount, bank_name, tx_code, payout_status, confirmed_at')
      .eq('id', data.requestId)
      .eq('user_id', context.userId)
      .maybeSingle()
    if (!row) return { ok: false as const, error: 'Withdrawal not found' }
    if (row.confirmed_at) return { ok: false as const, error: 'This withdrawal is already confirmed' }
    if (row.payout_status !== 'awaiting_confirmation') {
      return { ok: false as const, error: 'This withdrawal can no longer be confirmed' }
    }

    const code = generateEmailCode()
    const { data: stored, error } = await supabaseAdmin.rpc('set_withdrawal_confirmation', {
      _id: row.id,
      _user_id: context.userId,
      _code_hash: await hashToken(code),
    })
    if (error) throw error
    const res = stored as { ok: boolean; error?: string } | null
    if (!res?.ok) return { ok: false as const, error: res?.error ?? 'Could not prepare confirmation' }

    const to = row.user_email || context.claims?.email
    if (!to) return { ok: false as const, error: 'No email address on file for this account' }

    const { sendTemplateEmail } = await import('@/lib/email-templates/send-email')
    const sent = await sendTemplateEmail('withdrawal-code', to, {
      templateData: {
        name: row.user_name || 'there',
        code,
        amount: money(Number(row.amount)),
        destination: row.bank_name || 'your payout destination',
        txCode: row.tx_code,
      },
      idempotencyKey: `withdrawal-code-${row.id}-${Math.floor(Date.now() / 60000)}`,
    })

    await supabaseAdmin.from('auth_events').insert({
      user_id: context.userId,
      email: to,
      event_type: 'withdrawal_code_sent',
      ip: currentClientIp(),
      device_label: describeDevice(currentUserAgent()).label,
      metadata: { tx_code: row.tx_code } as never,
    })

    return {
      ok: true as const,
      emailed: sent.sent,
      suppressed: !sent.sent,
      maskedEmail: to.replace(/^(.).*(@.*)$/, (_m, a: string, b: string) => `${a}•••${b}`),
    }
  })

/**
 * Verifies the emailed code (plus a TOTP code when 2FA is on) and releases the
 * withdrawal into the payout queue.
 */
export const confirmWithdrawal = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { requestId: string; code: string; totp?: string }) => ({
    requestId: String(data.requestId),
    code: String(data.code ?? '').replace(/\D/g, '').slice(0, 6),
    totp: data.totp ? String(data.totp).trim().slice(0, 12) : undefined,
  }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { sha256: hashToken, clientIp: currentClientIp, requestUserAgent: currentUserAgent, describeDevice, verifyTotpForUser } = await import('./security.server')

    // Step-up: when the investor has 2FA on, a withdrawal also needs a TOTP code.
    const { data: twoFa } = await supabaseAdmin
      .from('user_2fa')
      .select('enabled')
      .eq('user_id', context.userId)
      .maybeSingle()

    if (twoFa?.enabled) {
      if (!data.totp) return { ok: false as const, error: 'Enter your authenticator code', needsTotp: true }
      const check = await verifyTotpForUser(context.userId, context.claims?.email ?? 'investor', data.totp)
      if (!check.ok) return { ok: false as const, error: check.error, needsTotp: true }
    }

    const { data: rpc, error } = await supabaseAdmin.rpc('confirm_withdrawal_request', {
      _id: data.requestId,
      _user_id: context.userId,
      _code_hash: await hashToken(data.code),
    })
    if (error) throw error
    const res = rpc as { ok: boolean; error?: string; tx_code?: string; already?: boolean } | null
    if (!res?.ok) return { ok: false as const, error: res?.error ?? 'Could not confirm withdrawal' }

    await supabaseAdmin.from('auth_events').insert({
      user_id: context.userId,
      email: context.claims?.email ?? null,
      event_type: 'withdrawal_confirmed',
      ip: currentClientIp(),
      device_label: describeDevice(currentUserAgent()).label,
      metadata: { tx_code: res.tx_code } as never,
    })

    return { ok: true as const, txCode: res.tx_code ?? null }
  })
