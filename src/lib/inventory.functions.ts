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
  itemId: z.string().uuid(),
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

export const placeWalletOrder = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => delivery.parse(d))
  .handler(async ({ data, context }) => {
    const { data: res, error } = await context.supabase.rpc('purchase_inventory_wallet', {
      _item_id: data.itemId, _full_name: data.fullName, _phone: data.phone, _address_line: data.addressLine,
      _city: data.city, _state: data.state, _postal_code: data.postalCode, _country: data.country,
      _notes: data.notes ?? '',
    })
    if (error) return { ok: false as const, error: 'Could not place order. Please try again.' }
    const r = res as { ok: boolean; error?: string; order_id?: string; order_number?: string }
    if (!r.ok) return { ok: false as const, error: r.error ?? 'Order failed' }
    const { data: o } = await context.supabase.from('inventory_orders').select(SELECT).eq('id', r.order_id!).single()
    if (o) {
      await mailOrder(o as OrderRow, 'Order confirmed',
        'Thank you for your purchase. The amount has been deducted from your wallet balance and your order is confirmed. We will email you again when it ships.')
      const { notifyOwner } = await import('@/lib/owner-alerts.server')
      await notifyOwner('New inventory purchase (wallet) — Trade Tesla',
        [`Order: ${o.order_number}`, `Item: ${o.item_name}`, `Amount: ${fmt(o.amount)}`, `Customer: ${o.full_name} (${o.email})`, `Phone: ${o.phone}`],
        `owner-inv-${o.id}`)
    }
    return { ok: true as const, orderNumber: r.order_number! }
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
    const { data: item } = await supabase.from('inventory_items').select('id,name,category,image_url,price').eq('id', data.itemId).eq('is_active', true).maybeSingle()
    if (!item) return { ok: false as const, error: 'Item not available' }
    const amount = Number(String(item.price).replace(/[^0-9.]/g, ''))
    const { data: profile } = await supabase.from('user_profiles').select('email').eq('id', userId).maybeSingle()
    const { data: o, error } = await supabase.from('inventory_orders').insert({
      user_id: userId, item_id: item.id, item_name: item.name, item_category: item.category, item_image: item.image_url,
      amount, payment_method: 'external', payment_proof_url: data.proofPath || null,
      tx_reference: [data.network, data.txReference].filter(Boolean).join(' · ') || null,
      order_status: 'pending_payment', full_name: data.fullName, email: profile?.email ?? '', phone: data.phone,
      address_line: data.addressLine, city: data.city, state: data.state, postal_code: data.postalCode,
      country: data.country, notes: data.notes || null,
    }).select(SELECT).single()
    if (error || !o) return { ok: false as const, error: 'Could not place order. Please try again.' }
    await mailOrder(o as OrderRow, 'Order received',
      'We received your order and payment details. Our team is verifying your payment — you will get an email as soon as it is confirmed.')
    const { notifyOwner } = await import('@/lib/owner-alerts.server')
    await notifyOwner('New inventory order awaiting payment check — Trade Tesla',
      [`Order: ${o.order_number}`, `Item: ${o.item_name}`, `Amount: ${fmt(o.amount)}`, `Payment: ${data.network}`, `Reference: ${data.txReference || '—'}`, `Customer: ${o.full_name} (${o.email})`],
      `owner-inv-${o.id}`)
    return { ok: true as const, orderNumber: o.order_number }
  })

const STATUS_COPY: Record<OrderStatus, [string, string]> = {
  pending_payment: ['Order pending', 'Your order is waiting for payment confirmation.'],
  paid: ['Payment confirmed', 'Great news — your payment has been confirmed and your order is now paid.'],
  processing: ['Order processing', 'Your order is being prepared by our fulfilment team.'],
  shipped: ['Order shipped', 'Your order is on its way to your delivery address.'],
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
        await mailOrder(o as OrderRow, h, intro, data.notes || undefined)
      }
    }
    return { ok: true as const }
  })
