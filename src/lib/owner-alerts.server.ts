// Owner alert copies — every important money / sign-up event on the site is
// mirrored to the site owner's inbox. Server-only.

export const OWNER_EMAIL = "seanjordanw@gmail.com";

/**
 * Sends a copy of an activity event to the site owner. Never throws — an
 * owner alert must not break the user-facing flow that triggered it.
 */
export async function notifyOwner(
  title: string,
  lines: Array<string | undefined | null>,
  idempotencyKey?: string,
): Promise<void> {
  try {
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    await sendTemplateEmail("account-notification", OWNER_EMAIL, {
      templateData: {
        name: "Admin",
        title,
        message: lines.filter(Boolean).join("\n"),
      },
      idempotencyKey: idempotencyKey ?? `owner-${title}-${Date.now()}`,
    });
  } catch (err) {
    console.error("[email] owner alert failed", title, err);
  }
}
