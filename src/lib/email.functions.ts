import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

/**
 * Activity emails.
 *
 * Sending is server-only and never accepts an arbitrary recipient from the
 * browser:
 *  - `sendMyActivityEmail` mails the signed-in user, address taken from their
 *    verified session.
 *  - `sendUserActivityEmail` is admin-only and resolves the recipient from
 *    `user_profiles` by id.
 */

type UserEvent =
  | 'welcome'
  | 'deposit_submitted'
  | 'support_ticket_created'
  | 'kyc_submitted'
  | 'withdrawal_requested'
  | 'session_booked'

type AdminEvent =
  | 'deposit_approved'
  | 'withdrawal_processed'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'support_ticket_updated'
  | 'notice'

interface EventInput {
  amount?: string
  reference?: string
  note?: string
  title?: string
  message?: string
}

function money(v?: string) {
  return v ? (v.startsWith('$') ? v : `$${v}`) : ''
}

function userCopy(event: UserEvent, name: string, input: EventInput) {
  switch (event) {
    case 'welcome':
      return { template: 'welcome' as const, title: 'Welcome to Tesla Trade', message: '' }
    case 'deposit_submitted':
      return {
        template: 'account-notification' as const,
        title: 'Deposit received — pending confirmation',
        message: `We received your deposit request of ${money(input.amount)}.\n\nYour wallet balance is credited as soon as our team confirms the payment.`,
      }
    case 'withdrawal_requested':
      return {
        template: 'account-notification' as const,
        title: 'Withdrawal request received',
        message: `Your withdrawal request for ${money(input.amount)} is being reviewed. You will get another email once it is processed.`,
      }
    case 'support_ticket_created':
      return {
        template: 'account-notification' as const,
        title: 'Support ticket received',
        message: `Thanks for reaching out, ${name}. Our team has your ticket and will reply shortly.`,
      }
    case 'kyc_submitted':
      return {
        template: 'account-notification' as const,
        title: 'Identity verification submitted',
        message:
          'We received your verification documents. Reviews normally complete within one business day.',
      }
    case 'session_booked':
      return {
        template: 'account-notification' as const,
        title: 'Strategy session booked',
        message:
          'Your session request is confirmed. An advisor will contact you with the final schedule.',
      }
  }
}

function adminCopy(event: AdminEvent, input: EventInput) {
  switch (event) {
    case 'deposit_approved':
      return {
        title: 'Deposit approved — funds credited',
        message: `Your deposit of ${money(input.amount)} has been confirmed and credited to your wallet balance.`,
      }
    case 'withdrawal_processed':
      return {
        title: 'Withdrawal processed',
        message: `Your withdrawal of ${money(input.amount)} has been processed and is on its way to your bank.`,
      }
    case 'kyc_approved':
      return {
        title: 'Identity verification approved',
        message: 'Your account is fully verified. All platform features are now unlocked.',
      }
    case 'kyc_rejected':
      return {
        title: 'Identity verification needs attention',
        message:
          'We could not verify your documents. Please resubmit from the verification page in your dashboard.',
      }
    case 'support_ticket_updated':
      return {
        title: 'Update on your support ticket',
        message: input.message || 'Your support ticket has been updated.',
      }
    case 'notice':
      return {
        title: input.title || 'Account notice',
        message: input.message || 'There is an update on your account.',
      }
  }
}

export const sendMyActivityEmail = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { event: UserEvent; input?: EventInput }) => data)
  .handler(async ({ data, context }) => {
    const email = (context.claims as { email?: string } | null)?.email
    if (!email) return { sent: false as const }

    const { data: profile } = await context.supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', context.userId)
      .maybeSingle()

    const name = profile?.full_name || email.split('@')[0] || 'there'
    const copy = userCopy(data.event, name, data.input ?? {})
    const { sendTemplateEmail } = await import('@/lib/email-templates/send-email')

    try {
      const result = await sendTemplateEmail(copy.template, email, {
        templateData: { name, title: copy.title, message: copy.message, detail: data.input?.reference },
        idempotencyKey: `${data.event}-${context.userId}-${data.input?.reference ?? Date.now()}`,
      })
      return { sent: result.sent }
    } catch (err) {
      console.error('[email] activity send failed', data.event, err)
      return { sent: false as const }
    }
  })

export const sendUserActivityEmail = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId?: string; email?: string; event: AdminEvent; input?: EventInput }) => data)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc('is_admin')
    if (isAdmin !== true) throw new Error('Forbidden')

    let query = context.supabase.from('user_profiles').select('email, full_name')
    query = data.userId ? query.eq('id', data.userId) : query.eq('email', data.email ?? '')
    const { data: profile } = await query.maybeSingle()
    if (!profile?.email) return { sent: false as const }

    const copy = adminCopy(data.event, data.input ?? {})
    const { sendTemplateEmail } = await import('@/lib/email-templates/send-email')

    try {
      const result = await sendTemplateEmail('account-notification', profile.email, {
        templateData: {
          name: profile.full_name || 'there',
          title: copy.title,
          message: copy.message,
          detail: data.input?.note,
        },
        idempotencyKey: `${data.event}-${profile.email}-${data.input?.reference ?? Date.now()}`,
      })
      return { sent: result.sent }
    } catch (err) {
      console.error('[email] admin send failed', data.event, err)
      return { sent: false as const }
    }
  })
