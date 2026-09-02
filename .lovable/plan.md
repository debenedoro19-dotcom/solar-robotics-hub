# Set up branded email (auth + activity) for the live site

## Goal
Make the project send real, branded emails from the connected domain for both authentication (OTP, magic link, password reset, etc.) and user activity (deposits, withdrawals, KYC, support tickets, giveaways, etc.).

## Current state
- The codebase already contains Lovable-managed email scaffolding:
  - Transactional sender: `src/lib/email-templates/send-email.ts`
  - Template registry: `src/lib/email-templates/registry.ts`
  - Activity server functions: `src/lib/email.functions.ts`
  - Auth webhook: `src/routes/lovable/email/auth/webhook.ts`
  - Auth templates: signup, magic-link, recovery, invite, email-change, reauthentication
- The configured sender domain in code is `notify.tradeenergy.app`.
- Some activity triggers may still be missing or still calling the removed legacy `/api/send-email` path.

## What I will do
1. **Verify email prerequisites**
   - Confirm the sender domain is verified and active in Lovable Cloud.
   - Confirm `LOVABLE_API_KEY` is provisioned.
2. **Audit activity email call sites**
   - Search the codebase for any remaining calls to the old `/api/send-email` or `emailService.ts` paths.
   - Wire real triggers for: welcome/sign-up, deposit submitted/approved, withdrawal requested/processed, KYC submitted/approved/rejected, support ticket created/replied, giveaway entry confirmed, investment purchased, job application received/stage change.
3. **Fix the admin "Send test email" button**
   - Replace the stale Resend-based test path with a call to the managed transactional sender so admins can actually test delivery.
4. **Verify auth email templates**
   - Ensure the auth webhook renders branded templates and that Supabase Auth is configured to send through it.
5. **End-to-end test**
   - Send a test auth/signup email and a test activity email, check logs, and confirm delivery.

## What requires your action first
Email domain setup must be completed by a workspace admin/owner in the Lovable UI. If `notify.tradeenergy.app` is not yet verified/active, you will need to finish domain verification before emails can send. Once the domain is active, the rest of the implementation can proceed automatically.
