import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

export const ORDER_STATUSES = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]
export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Awaiting payment confirmation',
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const delivery = z.object({
  itemId: z.string().min(1),
  itemName: z.string().optional(),
  itemPrice: z.number().optional(),
  itemCategory: z.string().optional(),
  itemImage: z.string().optional(),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(40),
  addressLine: z.string().trim().min(3).max(200),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(2).max(20),
  country: z.string().trim().min(2).max(80),
  notes: z.string().trim().max(500).optional(),
})

const fmt = (n: number) => `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}`

type OrderRow = {
  id: string; order_number: string; item_name: string; amount: number; payment_method: string
  order_status: string; full_name: string; email: string; address_line: string; city: string
  state: string; postal_code: string; country: string; tracking_number: string | null; phone: string
}

async function mailOrder(o: OrderRow, heading: string, intro: string, note?: string) {
  const { sendTemplateEmail } = await import('@/lib/email-templates/send-email')
  const address = `${o.address_line}, ${o.city}, ${o.state} ${o.postal_code}, ${o.country}`
  const data = {
    name: o.full_name,
    heading,
    intro,
    orderNumber: o.order_number,
    itemName: o.item_name,
    amount: fmt(o.amount),
    paymentMethod: o.payment_method === 'wallet' ? 'Wallet balance' : 'Crypto / bank transfer',
    status: STATUS_LABEL[o.order_status as OrderStatus] ?? o.order_status,
    tracking: o.tracking_number ?? undefined,
    address,
    note,
  }
  try {
    if (o.email) {
      await sendTemplateEmail('inventory-order', o.email, {
        templateData: data,
        idempotencyKey: `inv-${o.id}-${o.order_status}`,
      })
    }
  } catch (err) {
    console.error('[email] order email failed', err)
  }
}

const SELECT = 'id,order_number,item_name,amount,payment_method,order_status,full_name,email,address_line,city,state,postal_code,country,tracking_number,phone'
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const placeWalletOrder = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => delivery.parse(d))
  .handler(async ({ data, context }) => {
    let resolvedItemId: string | null = null;
    let resolvedItem: { id: string; name: string; category: string; image_url: string; price: string } | null = null;

    if (UUID_REGEX.test(data.itemId)) {
      resolvedItemId = data.itemId;
    } else {
      // Try resolving by numeric sort_order or item name
      const num = Number(data.itemId);
      if (!isNaN(num) && num > 0) {
        const { data: item } = await context.supabase
          .from('inventory_items')
          .select('id,name,category,image_url,price')
          .eq('sort_order', num)
          .maybeSingle();
        if (item) {
          resolvedItemId = item.id;
          resolvedItem = item;
        }
      }
      if (!resolvedItemId && data.itemName) {
        const { data: item } = await context.supabase
          .from('inventory_items')
          .select('id,name,category,image_url,price')
          .ilike('name', `%${data.itemName.trim()}%`)
          .maybeSingle();
        if (item) {
          resolvedItemId = item.id;
          resolvedItem = item;
        }
      }
    }

    // Try calling the database RPC if item UUID is known
    if (resolvedItemId) {
      const { data: res, error } = await context.supabase.rpc('purchase_inventory_wallet', {
        _item_id: resolvedItemId,
        _full_name: data.fullName,
        _phone: data.phone,
        _address_line: data.addressLine,
        _city: data.city,
        _state: data.state,
        _postal_code: data.postalCode,
        _country: data.country,
        _notes: data.notes ?? '',
      });

      if (!error && res) {
        const r = res as { ok: boolean; error?: string; order_id?: string; order_number?: string };
        if (r.ok && r.order_id && r.order_number) {
          const { data: o } = await context.supabase.from('inventory_orders').select(SELECT).eq('id', r.order_id).single();
          if (o) {
            await mailOrder(
              o as OrderRow,
              'Order confirmed',
              'Thank you for your purchase. The amount has been deducted from your wallet balance and your order is confirmed. Our logistics partner (FedEx Freight) is preparing dispatch.'
            );
            const { notifyOwner } = await import('@/lib/owner-alerts.server');
            await notifyOwner(
              'New inventory purchase (wallet) — Trade Tesla',
              [`Order: ${o.order_number}`, `Item: ${o.item_name}`, `Amount: ${fmt(o.amount)}`, `Customer: ${o.full_name} (${o.email})`, `Phone: ${o.phone}`],
              `owner-inv-${o.id}`
            );
          }
          return { ok: true as const, orderNumber: r.order_number };
        }
      }
    }

    // Direct fallback wallet purchase flow if RPC was unavailable or item was static
    const uid = context.userId;
    const price = data.itemPrice || (resolvedItem ? Number(String(resolvedItem.price).replace(/[^0-9.]/g, '')) : 0);
    if (price <= 0) {
      return { ok: false as const, error: 'Could not determine asset price' };
    }

    const { data: bal } = await context.supabase.from('user_balance').select('*').eq('user_id', uid).maybeSingle();
    const available = Number(bal?.available_balance ?? 0);
    if (available < price) {
      return {
        ok: false as const,
        error: `Insufficient wallet balance. You have $${available.toLocaleString('en-US', { minimumFractionDigits: 2 })} but this item costs $${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`,
      };
    }

    // Deduct balance
    const { error: balErr } = await context.supabase
      .from('user_balance')
      .update({ available_balance: available - price, updated_at: new Date().toISOString() })
      .eq('user_id', uid);
    if (balErr) {
      return { ok: false as const, error: 'Could not deduct wallet balance. Please try again.' };
    }

    const orderNumber = 'TT-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const itemName = data.itemName || resolvedItem?.name || 'Tesla Asset';
    const itemCategory = data.itemCategory || resolvedItem?.category || 'Vehicles';
    const itemImage = data.itemImage || resolvedItem?.image_url || '';

    const { data: profile } = await context.supabase.from('user_profiles').select('email').eq('id', uid).maybeSingle();

    const { data: o, error: ordErr } = await context.supabase.from('inventory_orders').insert({
      order_number: orderNumber,
      user_id: uid,
      item_id: resolvedItemId || null,
      item_name: itemName,
      item_category: itemCategory,
      item_image: itemImage,
      amount: price,
      payment_method: 'wallet',
      order_status: 'paid',
      full_name: data.fullName,
      email: profile?.email ?? '',
      phone: data.phone,
      address_line: data.addressLine,
      city: data.city,
      state: data.state,
      postal_code: data.postalCode,
      country: data.country,
      notes: data.notes || null,
    }).select(SELECT).single();

    if (ordErr || !o) {
      // Refund balance on insertion failure
      await context.supabase.from('user_balance').update({ available_balance: available, updated_at: new Date().toISOString() }).eq('user_id', uid);
      return { ok: false as const, error: 'Could not record order. Please try again.' };
    }

    // Record balance transaction ledger entry
    await context.supabase.from('balance_transactions').insert({
      user_id: uid,
      type: 'purchase',
      amount: -price,
      status: 'completed',
      description: `Inventory purchase: ${itemName}`,
      reference: orderNumber,
    });

    await mailOrder(
      o as OrderRow,
      'Order confirmed',
      'Thank you for your purchase. The amount has been deducted from your wallet balance and your order is confirmed. Our logistics partner (FedEx Freight) is preparing dispatch.'
    );

    return { ok: true as const, orderNumber };
  })

export const placeExternalOrder = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    delivery.extend({
      txReference: z.string().trim().max(200).optional(),
      proofPath: z.string().trim().max(300).optional(),
      network: z.string().trim().max(80),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context
    if (data.proofPath && !data.proofPath.startsWith(`${userId}/`)) return { ok: false as const, error: 'Invalid proof file' }

    let resolvedItemId: string | null = null;
    let resolvedItem: { id: string; name: string; category: string; image_url: string; price: string } | null = null;

    if (UUID_REGEX.test(data.itemId)) {
      const { data: item } = await supabase.from('inventory_items').select('id,name,category,image_url,price').eq('id', data.itemId).eq('is_active', true).maybeSingle();
      if (item) {
        resolvedItemId = item.id;
        resolvedItem = item;
      }
    } else {
      const num = Number(data.itemId);
      if (!isNaN(num) && num > 0) {
        const { data: item } = await supabase.from('inventory_items').select('id,name,category,image_url,price').eq('sort_order', num).eq('is_active', true).maybeSingle();
        if (item) {
          resolvedItemId = item.id;
          resolvedItem = item;
        }
      }
      if (!resolvedItemId && data.itemName) {
        const { data: item } = await supabase.from('inventory_items').select('id,name,category,image_url,price').ilike('name', `%${data.itemName.trim()}%`).eq('is_active', true).maybeSingle();
        if (item) {
          resolvedItemId = item.id;
          resolvedItem = item;
        }
      }
    }

    const itemName = resolvedItem?.name || data.itemName || 'Tesla Asset';
    const itemCategory = resolvedItem?.category || data.itemCategory || 'Vehicles';
    const itemImage = resolvedItem?.image_url || data.itemImage || '';
    const amount = resolvedItem ? Number(String(resolvedItem.price).replace(/[^0-9.]/g, '')) : (data.itemPrice || 0);

    const { data: profile } = await supabase.from('user_profiles').select('email').eq('id', userId).maybeSingle();
    const orderNumber = 'TT-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const { data: o, error } = await supabase.from('inventory_orders').insert({
      order_number: orderNumber,
      user_id: userId,
      item_id: resolvedItemId || null,
      item_name: itemName,
      item_category: itemCategory,
      item_image: itemImage,
      amount,
      payment_method: 'external',
      payment_proof_url: data.proofPath || null,
      tx_reference: [data.network, data.txReference].filter(Boolean).join(' · ') || null,
      order_status: 'pending_payment',
      full_name: data.fullName,
      email: profile?.email ?? '',
      phone: data.phone,
      address_line: data.addressLine,
      city: data.city,
      state: data.state,
      postal_code: data.postalCode,
      country: data.country,
      notes: data.notes || null,
    }).select(SELECT).single();

    if (error || !o) {
      console.error('[inventory] placeExternalOrder insert error:', error);
      return { ok: false as const, error: 'Could not place order. Please verify details and try again.' };
    }

    await mailOrder(o as OrderRow, 'Order received',
      'We received your order and payment details. Our finance and logistics team (FedEx Freight) are verifying your payment — you will get an email as soon as it is confirmed.');

    const { notifyOwner } = await import('@/lib/owner-alerts.server');
    await notifyOwner('New inventory order awaiting payment check — Trade Tesla',
      [`Order: ${o.order_number}`, `Item: ${o.item_name}`, `Amount: ${fmt(o.amount)}`, `Payment: ${data.network}`, `Reference: ${data.txReference || '—'}`, `Customer: ${o.full_name} (${o.email})`],
      `owner-inv-${o.id}`);

    return { ok: true as const, orderNumber: o.order_number };
  })

const STATUS_COPY: Record<OrderStatus, [string, string]> = {
  pending_payment: ['Order pending', 'Your order is waiting for payment confirmation.'],
  paid: ['Payment confirmed', 'Great news — your payment has been confirmed and your order is now paid.'],
  processing: ['Order processing', 'Your order is being prepared by our fulfillment and logistics team.'],
  shipped: ['Order shipped', 'Your order is on its way via our FedEx logistics partner.'],
  delivered: ['Order delivered', 'Your order has been delivered. Enjoy your new Tesla asset!'],
  cancelled: ['Order cancelled', 'Your order has been cancelled. If it was paid from your wallet, the full amount has been refunded to your balance.'],
}

export const adminUpdateOrder = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(ORDER_STATUSES),
      tracking: z.string().trim().max(120).optional(),
      notes: z.string().trim().max(1000).optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: res, error } = await context.supabase.rpc('admin_update_inventory_order', {
      _id: data.id, _status: data.status, _tracking: data.tracking ?? '', _notes: data.notes ?? null as unknown as string,
    })
    if (error) return { ok: false as const, error: error.message }
    const r = res as { ok: boolean; error?: string; previous?: string }
    if (!r.ok) return { ok: false as const, error: r.error ?? 'Update failed' }
    if (r.previous !== data.status) {
      const { data: o } = await context.supabase.from('inventory_orders').select(SELECT).eq('id', data.id).single()
      if (o) {
        const [h, intro] = STATUS_COPY[data.status]
        const safeNotes = data.notes
          ? String(data.notes)
              .replace(/[<>{}\\]/g, '')
              .replace(/https?:\/\/\S+/gi, '[link removed]')
              .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
              .trim()
              .slice(0, 500) || undefined
          : undefined
        await mailOrder(o as OrderRow, h, intro, safeNotes)
      }
    }
    return { ok: true as const }
  })
