/**
 * Background withdrawal payout queue.
 *
 * Bounded batch, single-flight lease in `public.job_state`, idempotent
 * settlement (`settle_withdrawal` is a no-op once a request is terminal) and a
 * circuit breaker that parks the job after repeated failures.
 */

const JOB_KEY = 'withdrawal_payouts';
const LEASE_MINUTES = 5;
const MAX_CONSECUTIVE_FAILURES = 5;

const money = (v: number) =>
  `$${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export interface DrainResult {
  ok: boolean;
  skipped?: 'paused' | 'locked';
  reason?: string;
  processed: number;
  failed: number;
  txCodes: string[];
}

export async function drainWithdrawalQueue(batchSize = 10): Promise<DrainResult> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const empty: DrainResult = { ok: true, processed: 0, failed: 0, txCodes: [] };

  // ── paused-state guard + single-flight lease ──────────────────────────────
  const { data: state } = await supabaseAdmin
    .from('job_state')
    .select('*')
    .eq('key', JOB_KEY)
    .maybeSingle();

  if (state?.paused) {
    return { ...empty, ok: false, skipped: 'paused', reason: state.pause_reason ?? 'Job paused' };
  }

  const now = Date.now();
  const leaseHeld = state?.lease_until ? new Date(state.lease_until).getTime() > now : false;
  if (leaseHeld) return { ...empty, skipped: 'locked' };

  const leaseUntil = new Date(now + LEASE_MINUTES * 60_000).toISOString();
  const { error: leaseErr } = await supabaseAdmin
    .from('job_state')
    .update({ lease_until: leaseUntil, last_run_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('key', JOB_KEY)
    .or(`lease_until.is.null,lease_until.lt.${new Date(now).toISOString()}`);
  if (leaseErr) return { ...empty, skipped: 'locked', reason: leaseErr.message };

  let processed = 0;
  let failed = 0;
  const txCodes: string[] = [];
  let lastError: string | null = null;

  try {
    const { data: batch, error: claimErr } = await supabaseAdmin.rpc('claim_withdrawal_batch', {
      _limit: Math.min(Math.max(batchSize, 1), 25),
    });
    if (claimErr) throw claimErr;

    for (const row of batch ?? []) {
      try {
        const { data: settled, error: settleErr } = await supabaseAdmin.rpc('settle_withdrawal', {
          _id: row.id,
          _status: 'paid',
        });
        if (settleErr) throw settleErr;
        const res = settled as { ok: boolean; already?: boolean; error?: string; tx_code?: string } | null;
        if (!res?.ok) throw new Error(res?.error ?? 'Settlement failed');

        processed += 1;
        if (res.tx_code) txCodes.push(res.tx_code);

        if (!res.already && row.user_email) {
          const { sendTemplateEmail } = await import('@/lib/email-templates/send-email');
          await sendTemplateEmail('account-notification', row.user_email, {
            templateData: {
              name: row.user_name || 'there',
              title: 'Withdrawal processed',
              message: `Your withdrawal of ${money(Number(row.amount))} has been processed and is on its way to ${row.bank_name || 'your account'}.`,
              detail: row.tx_code ? `Transaction ID: ${row.tx_code}` : undefined,
            },
            idempotencyKey: `withdrawal-paid-${row.id}`,
          }).catch((err: unknown) => {
            console.error('[withdrawal-queue] email failed', row.id, err);
          });
        }
      } catch (err) {
        failed += 1;
        lastError = err instanceof Error ? err.message : String(err);
        console.error('[withdrawal-queue] item failed', row.id, err);
        await supabaseAdmin
          .from('withdrawal_requests')
          .update({ queue_status: 'queued', queue_last_error: lastError, queue_lease_until: null })
          .eq('id', row.id);
      }
    }

    const failures = failed > 0 ? (state?.consecutive_failures ?? 0) + 1 : 0;
    const shouldPause = failures >= MAX_CONSECUTIVE_FAILURES;
    await supabaseAdmin
      .from('job_state')
      .update({
        lease_until: null,
        consecutive_failures: failures,
        last_error: lastError,
        paused: shouldPause,
        pause_reason: shouldPause ? `Paused after ${failures} consecutive failed runs: ${lastError}` : null,
        updated_at: new Date().toISOString(),
      })
      .eq('key', JOB_KEY);

    return { ok: failed === 0, processed, failed, txCodes };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const failures = (state?.consecutive_failures ?? 0) + 1;
    const shouldPause = failures >= MAX_CONSECUTIVE_FAILURES;
    await supabaseAdmin
      .from('job_state')
      .update({
        lease_until: null,
        consecutive_failures: failures,
        last_error: message,
        paused: shouldPause,
        pause_reason: shouldPause ? `Paused after ${failures} consecutive failed runs: ${message}` : null,
        updated_at: new Date().toISOString(),
      })
      .eq('key', JOB_KEY);
    return { ok: false, processed, failed: failed + 1, txCodes, reason: message };
  }
}
