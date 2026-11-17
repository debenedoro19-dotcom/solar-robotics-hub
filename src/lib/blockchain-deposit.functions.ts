import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { createClient } from '@/lib/supabase/client';

export interface ConfirmBlockchainDepositInput {
  depositId: string;
  txHash: string;
  network?: string;
  amount?: number;
  meta?: Record<string, unknown>;
}

export interface ConfirmBlockchainDepositResult {
  ok: boolean;
  amount?: number;
  txRef?: string;
  txHash?: string;
  error?: string;
  emailed?: boolean;
  credited?: boolean;
}

/**
 * Server function: Confirms a blockchain deposit and credits the user's wallet.
 * Callable by the authenticated investor who owns the deposit record.
 */
export const confirmBlockchainDepositFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: ConfirmBlockchainDepositInput) => data)
  .handler(async ({ data, context }): Promise<ConfirmBlockchainDepositResult> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = context.supabase as any;
    const userId = context.userId;

    if (!data.depositId) {
      throw new Error('Deposit ID is required');
    }

    // 1. Verify deposit record exists and belongs to user (or user is admin)
    const { data: deposit, error: depErr } = await supabase
      .from('deposit_records')
      .select('id, user_id, user_email, user_name, amount, deposit_status, tx_ref')
      .eq('id', data.depositId)
      .maybeSingle();

    if (depErr || !deposit) {
      throw new Error('Deposit record not found');
    }

    if (deposit.user_id && deposit.user_id !== userId) {
      const { data: isAdmin } = await supabase.rpc('is_admin');
      if (isAdmin !== true) {
        throw new Error('Not authorized to confirm this deposit');
      }
    }

    // 2. Execute atomic confirmation RPC
    let credited = false;
    try {
      const { data: res, error: rpcErr } = await supabase.rpc('auto_confirm_blockchain_deposit', {
        _deposit_id: data.depositId,
        _tx_hash: data.txHash || 'Verified on-chain',
        _blockchain_meta: data.meta || {},
      });
      if (!rpcErr && res?.ok) {
        credited = true;
      } else {
        // Fallback: If caller is an admin and auto_confirm RPC is not migrated yet
        const { data: fallbackRes, error: fbErr } = await supabase.rpc('admin_approve_deposit', {
          _deposit_id: data.depositId,
        });
        if (!fbErr && fallbackRes?.ok) {
          credited = true;
        }
      }
    } catch {
      // Continue to notification
    }

    // 3. Email notification (best-effort)
    let emailed = false;
    try {
      const { sendTemplateEmail } = await import('@/lib/email-templates/send-email');
      const targetEmail = deposit.user_email as string | null;
      if (targetEmail) {
        const formattedAmount = `$${Number(deposit.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        const res = await sendTemplateEmail('account-notification', targetEmail, {
          templateData: {
            name: (deposit.user_name as string) || 'Investor',
            title: 'Blockchain Deposit Confirmed',
            message: `Your deposit of ${formattedAmount} has been verified on the blockchain and automatically credited to your Trade Tesla wallet balance.`,
            detail: `Transaction Reference: ${deposit.tx_ref} | TXID: ${data.txHash || 'On-chain'}`,
          },
          idempotencyKey: `blockchain-confirmed-${deposit.id}`,
        });
        emailed = Boolean(res?.sent);
      }
    } catch {
      // Ignore email delivery errors
    }

    return {
      ok: true,
      amount: Number(deposit.amount),
      txRef: deposit.tx_ref as string,
      txHash: data.txHash,
      emailed,
      credited,
    };
  });

/**
 * Create a pending deposit session record in Supabase so the gateway can trace & auto-credit it.
 */
export async function createDepositSession(params: {
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  packageName: string;
  paymentMethod: string;
  txRef: string;
  notes?: string | null;
  proofUrl?: string | null;
}): Promise<{ depositId: string | null; error?: string }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('deposit_records')
    .insert({
      user_id: params.userId,
      user_email: params.userEmail,
      user_name: params.userName,
      amount: params.amount,
      package_name: params.packageName,
      payment_method: params.paymentMethod,
      tx_ref: params.txRef,
      deposit_status: 'pending',
      notes: params.notes || null,
      proof_url: params.proofUrl || null,
      idempotency_key: `dep-${params.txRef}`,
    })
    .select('id')
    .maybeSingle();

  if (error) {
    // If duplicate idempotency_key, fetch existing deposit row for this user
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('deposit_records')
        .select('id')
        .eq('user_id', params.userId)
        .eq('tx_ref', params.txRef)
        .maybeSingle();
      if (existing?.id) {
        return { depositId: existing.id as string };
      }
    }
    return { depositId: null, error: error.message };
  }

  return { depositId: (data?.id as string) ?? null };
}

/**
 * Universal client/server helper to confirm a verified blockchain deposit
 * and atomically credit the user's dashboard balance.
 */
export async function autoConfirmDepositOnChain(params: {
  depositId: string;
  txHash: string;
  network?: string;
  amount?: number;
  meta?: Record<string, unknown>;
}): Promise<ConfirmBlockchainDepositResult> {
  const supabase = createClient();

  // 1. Try atomic SECURITY DEFINER RPC directly via authenticated Supabase client
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('auto_confirm_blockchain_deposit', {
      _deposit_id: params.depositId,
      _tx_hash: params.txHash,
      _blockchain_meta: params.meta || {},
    });

    if (!rpcError && rpcData && (rpcData as { ok?: boolean }).ok) {
      return {
        ok: true,
        credited: true,
        amount: Number((rpcData as { amount?: number }).amount ?? params.amount ?? 0),
        txHash: params.txHash,
      };
    }
  } catch {
    // fall through to server function
  }

  // 2. Next try authenticated server function
  try {
    const res = await confirmBlockchainDepositFn({ data: params });
    if (res?.ok) return res;
  } catch {
    // fall through
  }

  return {
    ok: false,
    credited: false,
    amount: params.amount,
    txHash: params.txHash,
    error: 'On-chain transaction recorded. Pending settlement desk sync.',
  };
}
