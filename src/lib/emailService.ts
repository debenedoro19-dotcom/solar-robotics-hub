// Activity emails.
//
// The browser never sends email directly and never chooses a recipient: these
// helpers call authenticated server functions, which resolve the recipient from
// the signed-in session (user events) or from `user_profiles` after an admin
// role check (admin events), then send through Lovable's managed email API.

import { sendMyActivityEmail, sendUserActivityEmail } from '@/lib/email.functions';

type Result = boolean;

async function mine(
  event: Parameters<typeof sendMyActivityEmail>[0] extends { data: infer D }
    ? D extends { event: infer E }
      ? E
      : never
    : never,
  input?: { amount?: string; reference?: string; note?: string; title?: string; message?: string },
): Promise<Result> {
  try {
    const res = await sendMyActivityEmail({ data: { event, input } });
    return res.sent;
  } catch (err) {
    console.error('Email send failed', err);
    return false;
  }
}

async function toUser(
  event: 'deposit_approved' | 'withdrawal_processed' | 'kyc_approved' | 'kyc_rejected' | 'support_ticket_updated' | 'notice',
  target: { userId?: string; email?: string },
  input?: { amount?: string; reference?: string; note?: string; title?: string; message?: string },
): Promise<Result> {
  try {
    const res = await sendUserActivityEmail({ data: { ...target, event, input } });
    return res.sent;
  } catch (err) {
    console.error('Email send failed', err);
    return false;
  }
}

// ── Signed-in user events ─────────────────────────────────────────────────────

export const sendWelcomeEmail = (_to?: string, _name?: string) => mine('welcome');

export const sendDepositSubmittedEmail = (amount: string, reference?: string) =>
  mine('deposit_submitted', { amount, reference });

export const sendWithdrawalRequestedEmail = (amount: string) =>
  mine('withdrawal_requested', { amount });

export const sendSupportTicketReceivedEmail = (
  _to: string,
  _name: string,
  ticketNumber: string,
  _description?: string,
) => mine('support_ticket_created', { reference: ticketNumber });

export const sendKYCSubmittedEmail = () => mine('kyc_submitted');

export const sendSessionBookedEmail = () => mine('session_booked');

// ── Admin-triggered events ────────────────────────────────────────────────────

export const sendDepositApprovedEmail = (
  target: { userId?: string; email?: string },
  amount: string,
  note?: string,
) => toUser('deposit_approved', target, { amount, note });

export const sendWithdrawalConfirmedEmail = (
  to: string,
  _name: string,
  amount: string,
  notes?: string,
) => toUser('withdrawal_processed', { email: to }, { amount, note: notes });

export const sendKYCApprovedEmail = (to: string, _name: string, adminNote?: string) =>
  toUser('kyc_approved', { email: to }, { note: adminNote });

export const sendKYCRejectedEmail = (to: string, adminNote?: string) =>
  toUser('kyc_rejected', { email: to }, { note: adminNote });

export const sendSupportTicketUpdatedEmail = (
  to: string,
  _name: string,
  newStatus: string,
  adminReply?: string,
) =>
  toUser('support_ticket_updated', { email: to }, {
    message: adminReply || `Your ticket status is now: ${newStatus}.`,
  });

export const sendAccountNotificationEmail = (
  to: string,
  _name: string,
  subject: string,
  message: string,
) => toUser('notice', { email: to }, { title: subject, message });

// ── Legacy no-op-safe helpers kept for existing call sites ────────────────────

export const sendPortfolioModifiedEmail = (to: string, name: string) =>
  sendAccountNotificationEmail(to, name, 'Portfolio updated', 'Your portfolio has been updated by our team.');

export const sendReturnsUpdatedEmail = (to: string, name: string) =>
  sendAccountNotificationEmail(to, name, 'Returns updated', 'New returns have been credited to your portfolio.');

export async function sendPasswordResetEmail(): Promise<Result> {
  // Password reset mail is delivered by Supabase Auth, not this helper.
  return true;
}
