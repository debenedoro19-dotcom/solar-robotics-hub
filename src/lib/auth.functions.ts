import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional(),
  password: z.string().min(8).max(128),
})

const confirmSchema = z.object({
  email: z.string().trim().email().max(160),
})

async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const normalized = email.trim().toLowerCase()

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .ilike('email', normalized)
    .maybeSingle()

  if (profile?.id) return profile.id

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 })
    if (error || !data?.users?.length) break
    const match = data.users.find((u) => (u.email || '').toLowerCase() === normalized)
    if (match) return match.id
    if (data.users.length < 200) break
  }

  return null
}

/**
 * Registers a user directly with `email_confirm: true` so no verification
 * email is sent and new accounts can sign in immediately.
 */
export const registerWithoutVerification = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => registerSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const normalizedEmail = data.email.trim().toLowerCase()

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.name.trim(),
        phone: data.phone?.trim() || '',
      },
    })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
        return {
          ok: false as const,
          error: 'An account already exists for this email. Please sign in instead.',
        }
      }
      return {
        ok: false as const,
        error: error.message || 'Could not create account. Please try again.',
      }
    }

    if (created.user?.id) {
      try {
        const { notifyOwner } = await import('@/lib/owner-alerts.server')
        await notifyOwner(
          'New user registered — Trade Tesla',
          [`Name: ${data.name.trim()}`, `Email: ${normalizedEmail}`, `Time: ${new Date().toUTCString()}`],
          `owner-signup-${created.user.id}`,
        )
      } catch {
        /* non-blocking */
      }
    }

    return { ok: true as const }
  })

/**
 * Marks an existing unconfirmed account as confirmed when email verification
 * is disconnected so Supabase Auth password sign-in succeeds cleanly.
 */
export const confirmUnverifiedUser = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => confirmSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const userId = await findAuthUserIdByEmail(data.email)
    if (!userId) {
      return { ok: false as const }
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    })

    if (error) {
      return { ok: false as const }
    }

    return { ok: true as const }
  })
