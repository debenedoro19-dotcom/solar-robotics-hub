# Fix "Send Test" email in Admin Settings

## What's wrong

The Test Email Delivery button still calls the old Resend endpoint (`/api/send-email`), which was removed when the site moved to Lovable's managed email system. The request 404s, so the panel always shows "Failed to send. Check your RESEND_API_KEY environment variable." — a message that no longer applies since Resend isn't used anymore.

## The fix

1. Add an admin-only test-send server function that sends a branded test email through the managed email system, using the sender name/address from the saved email settings.
2. Point the Send Test button at that function instead of the removed endpoint.
3. Replace the failure text with an accurate message that surfaces the real reason (e.g. domain not yet verified, recipient suppressed, rate limited) instead of mentioning Resend.
4. Show a clear success state confirming which address the test went to.

## Technical notes

- New `sendAdminTestEmail` in `src/lib/email.functions.ts`, guarded by `requireSupabaseAuth` + the `is_admin` RPC, rendering the existing `account-notification` template via `sendTemplateEmail`.
- The handler returns `{ sent, reason }` so the UI can display the actual failure cause.
- `sendTestEmail()` in `src/pages/admin-settings.tsx` calls the server function; the hardcoded RESEND_API_KEY error string is removed.
- No database or schema changes.

## Note on delivery

Test emails only deliver once `notify.tradeenergy.app` DNS verification completes. Until then the function will report "domain not verified" rather than a generic failure.
