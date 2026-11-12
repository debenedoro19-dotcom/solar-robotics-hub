import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { calculateOrderTotals, GIVEAWAY_SHIPPING_FEE } from '@/lib/orderPricing'

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
  applyHeroesDiscount: z.boolean().optional(),
  heroRole: z.string().trim().max(80).optional(),
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

async function resolveInventoryItem(
  supabase: any,
  itemId: string,
  itemName?: string,
) {
  let resolvedItemId: string | null = null;
  let resolvedItem: { id: string; name: string; category: string; image_url: string; price: string } | null = null;

  if (UUID_REGEX.test(itemId)) {
    resolvedItemId = itemId;
    const { data: item } = await supabase
      .from('inventory_items')
      .select('id,name,category,image_url,price')
      .eq('id', itemId)
      .maybeSingle();
    if (item) resolvedItem = item;
  } else {
    const num = Number(itemId);
    if (!isNaN(num) && num > 0) {
      const { data: item } = await supabase
        .from('inventory_items')
        .select('id,name,category,image_url,price')
        .eq('sort_order', num)
        .maybeSingle();
      if (item) {
        resolvedItemId = item.id;
        resolvedItem = item;
      }
    }
    if (!resolvedItemId && itemName) {
      const { data: item } = await supabase
        .from('inventory_items')
        .select('id,name,category,image_url,price')
        .ilike('name', `%${itemName.trim()}%`)
        .maybeSingle();
      if (item) {
        resolvedItemId = item.id;
        resolvedItem = item;
      }
    }
  }
  return { resolvedItemId, resolvedItem };
}

function buildOrderNote(
  userNotes: string | undefined,
  shippingFee: number,
  heroesDiscount: number,
  heroRole?: string,
) {
  const parts: string[] = [`Shipping: ${fmt(shippingFee)}`];
  if (heroesDiscount > 0) {
    parts.push(`Our Heroes Discount: -${fmt(heroesDiscount)}${heroRole ? ` (${heroRole})` : ''}`);
  }
  if (userNotes?.trim()) parts.push(`Notes: ${userNotes.trim()}`);
  return parts.join(' | ');
}

export const placeWalletOrder = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => delivery.parse(d))
  .handler(async ({ data, context }) => {
    const uid = context.userId;
    const { resolvedItemId, resolvedItem } = await resolveInventoryItem(
      context.supabase,
      data.itemId,
      data.itemName,
    );

    const dbPrice = resolvedItem ? Number(String(resolvedItem.price).replace(/[^0-9.]/g, '')) : 0;
    const assetPrice = dbPrice > 0 ? dbPrice : Number(data.itemPrice || 0);
    if (assetPrice <= 0) {
      return { ok: false as const, error: 'Could not determine asset price' };
    }

    const itemName = resolvedItem?.name || data.itemName || 'Tesla Asset';
    const itemCategory = resolvedItem?.category || data.itemCategory || 'Vehicles';
    const itemImage = resolvedItem?.image_url || data.itemImage || '';

    const pricing = calculateOrderTotals({
      assetPrice,
      category: itemCategory,
      applyHeroesDiscount: Boolean(data.applyHeroesDiscount),
    });

    await context.supabase.from('user_balance').insert({ user_id: uid }).select().maybeSingle();
    const { data: bal } = await context.supabase.from('user_balance').select('*').eq('user_id', uid).maybeSingle();
    const available = Number(bal?.available_balance ?? 0);

    if (available < pricing.totalDue) {
      return {
        ok: false as const,
        error: `Insufficient wallet balance. Available: ${fmt(available)}, Total due (incl. ${fmt(pricing.shippingFee)} shipping${pricing.heroesDiscount > 0 ? ` less ${fmt(pricing.heroesDiscount)} Heroes credit` : ''}): ${fmt(pricing.totalDue)}.`,
      };
    }

    const { error: balErr } = await context.supabase
      .from('user_balance')
      .update({ available_balance: available - pricing.totalDue, updated_at: new Date().toISOString() })
      .eq('user_id', uid);
    if (balErr) {
      return { ok: false as const, error: 'Could not deduct wallet balance. Please try again.' };
    }

    const orderNumber = 'TT-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const { data: profile } = await context.supabase.from('user_profiles').select('email').eq('id', uid).maybeSingle();

    const orderNotes = buildOrderNote(
      data.notes,
      pricing.shippingFee,
      pricing.heroesDiscount,
      data.heroRole,
    );

    const { data: o, error: ordErr } = await context.supabase.from('inventory_orders').insert({
      order_number: orderNumber,
      user_id: uid,
      item_id: resolvedItemId || null,
      item_name: itemName,
      item_category: itemCategory,
      item_image: itemImage,
      amount: pricing.totalDue,
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
      notes: orderNotes,
    }).select(SELECT).single();

    if (ordErr || !o) {
      await context.supabase.from('user_balance').update({ available_balance: available, updated_at: new Date().toISOString() }).eq('user_id', uid);
      return { ok: false as const, error: 'Could not record order. Please try again.' };
    }

    await context.supabase.from('balance_transactions').insert({
      user_id: uid,
      type: 'purchase',
      amount: -pricing.totalDue,
      status: 'completed',
      description: `Order ${orderNumber}: ${itemName} (incl. ${fmt(pricing.shippingFee)} shipping${pricing.heroesDiscount > 0 ? `, -${fmt(pricing.heroesDiscount)} Heroes` : ''})`,
      reference: orderNumber,
    });

    await mailOrder(
      o as OrderRow,
      'Order confirmed',
      `Thank you for your purchase. ${fmt(pricing.totalDue)} (including ${fmt(pricing.shippingFee)} enclosed freight delivery${pricing.heroesDiscount > 0 ? ` and -${fmt(pricing.heroesDiscount)} Our Heroes credit` : ''}) has been deducted from your wallet balance.`,
      orderNotes,
    );

    const { notifyOwner } = await import('@/lib/owner-alerts.server');
    await notifyOwner(
      'New inventory purchase (wallet) — Trade Tesla',
      [
        `Order: ${o.order_number}`,
        `Item: ${o.item_name}`,
        `Asset: ${fmt(pricing.assetPrice)} | Shipping: ${fmt(pricing.shippingFee)} | Heroes Discount: -${fmt(pricing.heroesDiscount)}`,
        `Total Paid: ${fmt(pricing.totalDue)}`,
        `Customer: ${o.full_name} (${o.email})`,
        `Phone: ${o.phone}`,
      ],
      `owner-inv-${o.id}`,
    );

    return { ok: true as const, orderNumber, totalPaid: pricing.totalDue };
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

    const { resolvedItemId, resolvedItem } = await resolveInventoryItem(
      supabase,
      data.itemId,
      data.itemName,
    );

    const itemName = resolvedItem?.name || data.itemName || 'Tesla Asset';
    const itemCategory = resolvedItem?.category || data.itemCategory || 'Vehicles';
    const itemImage = resolvedItem?.image_url || data.itemImage || '';
    const dbPrice = resolvedItem ? Number(String(resolvedItem.price).replace(/[^0-9.]/g, '')) : 0;
    const assetPrice = dbPrice > 0 ? dbPrice : Number(data.itemPrice || 0);

    const pricing = calculateOrderTotals({
      assetPrice,
      category: itemCategory,
      applyHeroesDiscount: Boolean(data.applyHeroesDiscount),
    });

    const { data: profile } = await supabase.from('user_profiles').select('email').eq('id', userId).maybeSingle();
    const orderNumber = 'TT-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const orderNotes = buildOrderNote(
      data.notes,
      pricing.shippingFee,
      pricing.heroesDiscount,
      data.heroRole,
    );

    const { data: o, error } = await supabase.from('inventory_orders').insert({
      order_number: orderNumber,
      user_id: userId,
      item_id: resolvedItemId || null,
      item_name: itemName,
      item_category: itemCategory,
      item_image: itemImage,
      amount: pricing.totalDue,
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
      notes: orderNotes,
    }).select(SELECT).single();

    if (error || !o) {
      console.error('[inventory] placeExternalOrder insert error:', error);
      return { ok: false as const, error: 'Could not place order. Please verify details and try again.' };
    }

    await mailOrder(
      o as OrderRow,
      'Order received',
      `We received your order and payment details for ${fmt(pricing.totalDue)} (incl. ${fmt(pricing.shippingFee)} delivery${pricing.heroesDiscount > 0 ? ` less -${fmt(pricing.heroesDiscount)} Our Heroes discount` : ''}). Our settlement team is verifying payment prior to dispatch.`,
      orderNotes,
    );

    const { notifyOwner } = await import('@/lib/owner-alerts.server');
    await notifyOwner('New inventory order awaiting payment check — Trade Tesla',
      [
        `Order: ${o.order_number}`,
        `Item: ${o.item_name}`,
        `Asset: ${fmt(pricing.assetPrice)} | Shipping: ${fmt(pricing.shippingFee)} | Heroes Discount: -${fmt(pricing.heroesDiscount)}`,
        `Total Due: ${fmt(pricing.totalDue)}`,
        `Payment: ${data.network}`,
        `Reference: ${data.txReference || '—'}`,
        `Customer: ${o.full_name} (${o.email})`,
      ],
      `owner-inv-${o.id}`);

    return { ok: true as const, orderNumber: o.order_number, totalPaid: pricing.totalDue };
  })

const giveawayDeliverySchema = z.object({
  giveawayId: z.string().min(1),
  giveawayTitle: z.string().trim().min(1).max(200),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(5).max(40),
  addressLine: z.string().trim().min(3).max(200),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(2).max(20),
  country: z.string().trim().min(2).max(80),
  notes: z.string().trim().max(500).optional(),
});

export const payGiveawayShippingWallet = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => giveawayDeliverySchema.parse(d))
  .handler(async ({ data, context }) => {
    const uid = context.userId;
    const fee = GIVEAWAY_SHIPPING_FEE;

    await context.supabase.from('user_balance').insert({ user_id: uid }).select().maybeSingle();
    const { data: bal } = await context.supabase.from('user_balance').select('*').eq('user_id', uid).maybeSingle();
    const available = Number(bal?.available_balance ?? 0);

    if (available < fee) {
      return {
        ok: false as const,
        error: `Insufficient wallet balance for freight delivery (${fmt(fee)}). Available balance: ${fmt(available)}. Deposit funds or settle with crypto/wire.`,
      };
    }

    const { error: balErr } = await context.supabase
      .from('user_balance')
      .update({ available_balance: available - fee, updated_at: new Date().toISOString() })
      .eq('user_id', uid);
    if (balErr) {
      return { ok: false as const, error: 'Could not deduct delivery fee from wallet.' };
    }

    const randDigits = Math.floor(10000000 + Math.random() * 90000000);
    const trackingNumber = `FX-TSLA-${randDigits}US`;

    if (UUID_REGEX.test(data.giveawayId)) {
      await context.supabase.from('giveaway_entries').insert({
        giveaway_id: data.giveawayId,
        user_id: uid,
        giveaway_title: data.giveawayTitle,
        amount_paid: fee,
        status: 'paid',
      });
    }

    await context.supabase.from('inventory_orders').insert({
      order_number: trackingNumber,
      user_id: uid,
      item_id: null,
      item_name: `Giveaway Delivery · ${data.giveawayTitle}`,
      item_category: 'Giveaway Freight',
      item_image: '',
      amount: fee,
      payment_method: 'wallet',
      order_status: 'paid',
      tracking_number: trackingNumber,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      address_line: data.addressLine,
      city: data.city,
      state: data.state,
      postal_code: data.postalCode,
      country: data.country,
      notes: ['FedEx Freight Shipping (Free Prize Claim)', data.notes ?? ''].filter(Boolean).join(' | '),
    });

    await context.supabase.from('balance_transactions').insert({
      user_id: uid,
      type: 'giveaway',
      amount: -fee,
      status: 'completed',
      description: `Giveaway freight delivery: ${data.giveawayTitle}`,
      reference: trackingNumber,
    });

    const { notifyOwner } = await import('@/lib/owner-alerts.server');
    await notifyOwner(
      'Giveaway delivery shipping paid (wallet) — Trade Tesla',
      [
        `Campaign: ${data.giveawayTitle}`,
        `Shipping Paid: ${fmt(fee)}`,
        `Tracking: ${trackingNumber}`,
        `Recipient: ${data.fullName} (${data.email}) · ${data.phone}`,
        `Address: ${data.addressLine}, ${data.city}, ${data.state} ${data.postalCode}, ${data.country}`,
      ],
      `owner-gv-${trackingNumber}`,
    );

    return { ok: true as const, trackingNumber, shippingPaid: fee };
  });

export const submitGiveawayShippingExternal = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    giveawayDeliverySchema.extend({
      txReference: z.string().trim().max(200).optional(),
      proofPath: z.string().trim().max(300).optional(),
      network: z.string().trim().max(80),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const uid = context.userId;
    if (data.proofPath && !data.proofPath.startsWith(`${uid}/`)) {
      return { ok: false as const, error: 'Invalid payment proof upload path.' };
    }

    const fee = GIVEAWAY_SHIPPING_FEE;
    const randDigits = Math.floor(10000000 + Math.random() * 90000000);
    const trackingNumber = `FX-TSLA-${randDigits}US`;

    if (UUID_REGEX.test(data.giveawayId)) {
      await context.supabase.from('giveaway_entries').insert({
        giveaway_id: data.giveawayId,
        user_id: uid,
        giveaway_title: data.giveawayTitle,
        amount_paid: fee,
        status: 'pending',
      });
    }

    await context.supabase.from('inventory_orders').insert({
      order_number: trackingNumber,
      user_id: uid,
      item_id: null,
      item_name: `Giveaway Delivery · ${data.giveawayTitle}`,
      item_category: 'Giveaway Freight',
      item_image: '',
      amount: fee,
      payment_method: 'external',
      payment_proof_url: data.proofPath || null,
      tx_reference: [data.network, data.txReference].filter(Boolean).join(' · ') || null,
      order_status: 'pending_payment',
      tracking_number: trackingNumber,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      address_line: data.addressLine,
      city: data.city,
      state: data.state,
      postal_code: data.postalCode,
      country: data.country,
      notes: ['FedEx Freight Shipping (Free Prize Claim)', data.notes ?? ''].filter(Boolean).join(' | '),
    });

    const { notifyOwner } = await import('@/lib/owner-alerts.server');
    await notifyOwner(
      'Giveaway delivery shipping awaiting check — Trade Tesla',
      [
        `Campaign: ${data.giveawayTitle}`,
        `Shipping Fee: ${fmt(fee)}`,
        `Payment: ${data.network} | Ref: ${data.txReference || 'Screenshot uploaded'}`,
        `Tracking: ${trackingNumber}`,
        `Recipient: ${data.fullName} (${data.email}) · ${data.phone}`,
      ],
      `owner-gv-ext-${trackingNumber}`,
    );

    return { ok: true as const, trackingNumber, shippingPaid: fee };
  });

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

export const submitAeroBooking = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z.object({
      mode: z.enum(['prebook', 'test_drive']),
      vehicle: z.string().trim().min(2).max(120),
      edition: z.string().trim().min(1).max(120),
      fullName: z.string().trim().min(2).max(120),
      email: z.string().trim().email().max(160),
      phone: z.string().trim().min(5).max(40),
      hub: z.string().trim().min(2).max(120),
      preferredDate: z.string().trim().max(80).optional(),
      experienceType: z.string().trim().max(80).optional(),
      notes: z.string().trim().max(500).optional(),
    }).parse(d))
  .handler(async ({ data }) => {
    const prefix = data.mode === 'prebook' ? 'TT-AERO' : 'TT-DRV';
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    const reservationCode = `${prefix}-${rand}`;

    const { notifyOwner } = await import('@/lib/owner-alerts.server');
    await notifyOwner(
      data.mode === 'prebook'
        ? `New Flying Car Pre-Book (${reservationCode}) — Trade Tesla`
        : `New Prototype Test Drive Scheduled (${reservationCode}) — Trade Tesla`,
      [
        `Reservation Code: ${reservationCode}`,
        `Mode: ${data.mode === 'prebook' ? 'Flying Car Priority Pre-Book' : 'Test Drive / Flight Briefing'}`,
        `Vehicle: ${data.vehicle} (${data.edition})`,
        `Hub / Target: ${data.hub}${data.preferredDate ? ` · ${data.preferredDate}` : ''}`,
        data.experienceType ? `Format: ${data.experienceType}` : undefined,
        `Applicant: ${data.fullName} · ${data.email} · ${data.phone}`,
        data.notes ? `Notes: ${data.notes}` : undefined,
      ],
      `owner-aero-${reservationCode}`,
    );

    return {
      ok: true as const,
      reservationCode,
      createdAt: new Date().toISOString(),
    };
  })
