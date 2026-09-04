import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

/**
 * Admin deposit / withdrawal actions.
 *
 * The state change AND the notification email happen server-side in the same
 * call, so an approval can never land without its email being attempted.
 */

const money = (v: number) =>
  `$${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

async function notify(
  email: string | null | undefined,
  name: string | null | undefined,
  title: string,
  message: string,
  idempotencyKey: string,
  detail?: string,
) {
  if (!email) return false
  const { sendTemplateEmail } = await import('@/lib/email-templates/send-email')
  try {
    const res = await sendTemplateEmail('account-notification', email, {
      templateData: { name: name || 'there', title, message, detail },
      idempotencyKey,
    })
    return res.sent
  } catch (err) {
    console.error('[admin-tx] email send failed', title, err)
    return false
  }
}

async function assertAdmin(supabase: any) {
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (isAdmin !== true) throw new Error('Forbidden')
}

async function recipientFor(supabase: any, userId: string | null, fallback?: string | null) {
  if (userId) {
    const { data } = await supabase
      .from('user_profiles')
      .select('email, full_name')
      .eq('id', userId)
      .maybeSingle()
    if (data?.email) return { email: data.email as string, name: (data.full_name as string) || null }
  }
  return { email: fallback ?? null, name: null }
}

/** Confirms a deposit (credits wallet) and emails the investor. */
export const adminConfirmDeposit = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { depositId: string; notes?: string }) => data)
  .handler(async ({ data, context }) => {
    const supabase = context.supabase
    await assertAdmin(supabase)

    const { data: deposit } = await supabase
      .from('deposit_records')
      .select('id, user_id, user_email, amount, deposit_status, tx_ref')
      .eq('id', data.depositId)
      .maybeSingle()
    if (!deposit) throw new Error('Deposit not found')

    if (deposit.deposit_status !== 'confirmed') {
      const { data: rpc, error } = await supabase.rpc('admin_approve_deposit', { _deposit_id: data.depositId })
      if (error) throw error
      const res = rpc as { ok: boolean; error?: string } | null
      if (!res?.ok) throw new Error(res?.error ?? 'Approval failed')
    }

    if (data.notes) {
      await supabase.from('deposit_records').update({ notes: data.notes }).eq('id', data.depositId)
    }

    const to = await recipientFor(supabase, deposit.user_id, deposit.user_email)
    const sent = await notify(
      to.email,
      to.name,
      'Deposit approved — funds credited',
      `Your deposit of ${money(Number(deposit.amount))} has been confirmed and credited to your wallet balance.`,
      `deposit-approved-${deposit.id}`,
      data.notes,
    )
    return { ok: true as const, emailed: sent, recipient: Boolean(to.email) }
  })

/** Rejects a deposit and emails the investor. */
export const adminRejectDeposit = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { depositId: string; notes?: string }) => data)
  .handler(async ({ data, context }) => {
    const supabase = context.supabase
    await assertAdmin(supabase)

    const { data: deposit } = await supabase
      .from('deposit_records')
      .select('id, user_id, user_email, amount')
      .eq('id', data.depositId)
      .maybeSingle()
    if (!deposit) throw new Error('Deposit not found')

    const { error } = await supabase
      .from('deposit_records')
      .update({ deposit_status: 'rejected', notes: data.notes || null, updated_at: new Date().toISOString() })
      .eq('id', data.depositId)
    if (error) throw error

    const to = await recipientFor(supabase, deposit.user_id, deposit.user_email)
    const sent = await notify(
      to.email,
      to.name,
      'Deposit could not be confirmed',
      data.notes
        ? `We could not confirm your deposit of ${money(Number(deposit.amount))}. ${data.notes}\n\nPlease resubmit or contact support.`
        : `We could not confirm your deposit of ${money(Number(deposit.amount))}. Please review your transaction and resubmit, or contact support.`,
      `deposit-rejected-${deposit.id}`,
    )
    return { ok: true as const, emailed: sent, recipient: Boolean(to.email) }
  })

/**
 * Updates a withdrawal's payout status.
 *
 * - `paid`      → enqueued on the background payout queue, then the queue is
 *                 drained once (bounded). The queue settles the request with
 *                 proper balance locking and sends the investor email.
 * - `rejected`  → settled immediately (reserved funds are refunded) + email.
 * - `processing`→ enqueued, left for the background worker.
 * - `pending`   → plain status change.
 */
export const adminSetWithdrawalStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { withdrawalId: string; status: 'pending' | 'processing' | 'paid' | 'rejected'; notes?: string }) => data,
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase
    await assertAdmin(supabase)

    const { data: row } = await supabase
      .from('withdrawal_requests')
      .select('id, user_id, user_email, user_name, amount, bank_name, tx_code, payout_status')
      .eq('id', data.withdrawalId)
      .maybeSingle()
    if (!row) throw new Error('Withdrawal not found')

    if (data.notes !== undefined) {
      await supabase.from('withdrawal_requests').update({ notes: data.notes || null }).eq('id', data.withdrawalId)
    }

    // ── Rejected: settle now (refunds the reserved balance) ────────────────
    if (data.status === 'rejected') {
      const { data: rpc, error } = await supabase.rpc('settle_withdrawal', {
        _id: data.withdrawalId,
        _status: 'rejected',
        _notes: data.notes ?? undefined,
      })
      if (error) throw error
      const res = rpc as { ok: boolean; error?: string } | null
      if (!res?.ok) throw new Error(res?.error ?? 'Settlement failed')

      const to = await recipientFor(supabase, row.user_id, row.user_email)
      const sent = await notify(
        to.email,
        to.name || row.user_name,
        'Withdrawal request declined',
        `Your withdrawal request for ${money(Number(row.amount))} was declined and the amount has been returned to your wallet.${data.notes ? ` ${data.notes}` : ''}`,
        `withdrawal-rejected-${row.id}`,
        row.tx_code ? `Transaction ID: ${row.tx_code}` : undefined,
      )
      return {
        ok: true as const,
        processedAt: new Date().toISOString(),
        emailed: sent,
        recipient: Boolean(to.email),
        txCode: row.tx_code ?? null,
        queued: false,
      }
    }

    // ── Paid / processing: run through the payout queue ────────────────────
    if (data.status === 'paid' || data.status === 'processing') {
      const { data: rpc, error } = await supabase.rpc('admin_queue_withdrawal', { _id: data.withdrawalId })
      if (error) throw error
      const res = rpc as { ok: boolean; error?: string } | null
      if (!res?.ok) throw new Error(res?.error ?? 'Could not queue withdrawal')

      if (data.status === 'paid') {
        const { drainWithdrawalQueue } = await import('@/lib/withdrawal-queue.server')
        const drain = await drainWithdrawalQueue(10)
        return {
          ok: true as const,
          processedAt: new Date().toISOString(),
          emailed: drain.processed > 0,
          recipient: Boolean(row.user_email),
          txCode: row.tx_code ?? null,
          queued: true,
        }
      }

      return {
        ok: true as const,
        processedAt: null,
        emailed: false,
        recipient: Boolean(row.user_email),
        txCode: row.tx_code ?? null,
        queued: true,
      }
    }

    // ── Back to pending ────────────────────────────────────────────────────
    const { error } = await supabase
      .from('withdrawal_requests')
      .update({ payout_status: 'pending', queue_status: 'none', processed_at: null })
      .eq('id', data.withdrawalId)
    if (error) throw error

    return {
      ok: true as const,
      processedAt: null,
      emailed: false,
      recipient: Boolean(row.user_email),
      txCode: row.tx_code ?? null,
      queued: false,
    }
  })
