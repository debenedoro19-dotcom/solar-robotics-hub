import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'District of Columbia','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota',
  'Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey',
  'New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon',
  'Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah',
  'Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming',
] as const

const STATE_SET = new Set<string>(US_STATES as readonly string[])

export type ActivityKind = 'deposit' | 'investment' | 'withdrawal'

export interface ActivityEvent {
  kind: ActivityKind
  name: string
  state: string
  amount: number
  at: string
}

const inputSchema = z.object({
  minAmount: z.number().min(0).default(0),
  maxAmount: z.number().min(0).default(1_000_000_000),
  limit: z.number().int().min(1).max(30).default(12),
})

/** "James Miller" -> "James M." ; never returns the full surname. */
function anonymize(fullName: string): string | null {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return null
  const first = parts[0].slice(0, 20)
  const initial = parts.length > 1 ? `${parts[parts.length - 1][0].toUpperCase()}.` : ''
  return initial ? `${first} ${initial}` : first
}

function shuffle<T>(list: T[]): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Public, unauthenticated read of REAL platform activity, anonymized.
 * Only users with an approved U.S. KYC submission carrying a valid state
 * are eligible, and only confirmed deposits, active investments and paid
 * withdrawals are surfaced. Returns the minimum fields the pop-up renders.
 */
export const getPublicActivity = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => inputSchema.parse(data ?? {}))
  .handler(async ({ data }): Promise<ActivityEvent[]> => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const min = Math.min(data.minAmount, data.maxAmount)
    const max = Math.max(data.minAmount, data.maxAmount)

    const { data: kyc } = await supabaseAdmin
      .from('kyc_submissions')
      .select('user_id, country, state')
      .eq('kyc_status', 'approved')
      .limit(1000)

    const eligible = new Map<string, string>()
    for (const row of kyc ?? []) {
      const country = String(row.country ?? '').trim().toLowerCase()
      const isUS =
        country === 'united states' || country === 'usa' || country === 'us' ||
        country === 'united states of america'
      const state = String((row as { state?: string | null }).state ?? '').trim()
      if (isUS && STATE_SET.has(state) && row.user_id) eligible.set(row.user_id, state)
    }
    if (eligible.size === 0) return []

    const userIds = [...eligible.keys()]

    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id, full_name')
      .in('id', userIds)

    const names = new Map<string, string>()
    for (const p of profiles ?? []) {
      const short = anonymize(p.full_name ?? '')
      if (short) names.set(p.id, short)
    }
    if (names.size === 0) return []

    const usable = userIds.filter((id) => names.has(id))
    const since = new Date(Date.now() - 30 * 24 * 3600_000).toISOString()

    const [deposits, investments, withdrawals] = await Promise.all([
      supabaseAdmin
        .from('deposit_records')
        .select('user_id, amount, confirmed_at, created_at')
        .eq('deposit_status', 'confirmed')
        .in('user_id', usable)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(40),
      supabaseAdmin
        .from('user_investments')
        .select('user_id, principal, started_at')
        .eq('status', 'active')
        .in('user_id', usable)
        .gte('started_at', since)
        .order('started_at', { ascending: false })
        .limit(40),
      supabaseAdmin
        .from('withdrawal_requests')
        .select('user_id, amount, processed_at, created_at')
        .eq('payout_status', 'paid')
        .in('user_id', usable)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(40),
    ])

    const events: ActivityEvent[] = []

    const push = (kind: ActivityKind, userId: string | null, amount: unknown, at: unknown) => {
      if (!userId) return
      const name = names.get(userId)
      const state = eligible.get(userId)
      const value = Number(amount)
      if (!name || !state || !Number.isFinite(value) || value <= 0) return
      if (value < min || value > max) return
      events.push({ kind, name, state, amount: value, at: String(at ?? '') })
    }

    for (const d of deposits.data ?? []) push('deposit', d.user_id, d.amount, d.confirmed_at ?? d.created_at)
    for (const i of investments.data ?? []) push('investment', i.user_id, i.principal, i.started_at)
    for (const w of withdrawals.data ?? []) push('withdrawal', w.user_id, w.amount, w.processed_at ?? w.created_at)

    return shuffle(events).slice(0, data.limit)
  })
