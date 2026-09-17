import "server-only";

import type { RenderedDeadlineReminderEmail } from "@/emails/render-deadline-reminder";

export function reminderSiteOrigin() {
  if (
    process.env.VERCEL_ENV === "production" &&
    !process.env.NEXT_PUBLIC_SITE_URL
  ) {
    throw new Error("Production reminder site URL is not configured.");
  }
  const origin = new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://fantasy.ppfootball.net",
  ).origin;
  if (
    process.env.VERCEL_ENV === "production" &&
    !origin.startsWith("https://")
  ) {
    throw new Error("Reminder links require an HTTPS production site URL.");
  }
  return origin;
}

export function reminderReadiness() {
  const missing: string[] = [];
  if (process.env.VERCEL_ENV !== "production")
    missing.push("Production deployment");
  if (process.env.REMINDER_SEND_ENABLED !== "true")
    missing.push("REMINDER_SEND_ENABLED=true");
  if (!process.env.REMINDER_RESEND_API_KEY)
    missing.push("REMINDER_RESEND_API_KEY");
  if (
    !process.env.REMINDER_EMAIL_FROM ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(process.env.REMINDER_EMAIL_FROM)
  )
    missing.push("REMINDER_EMAIL_FROM (verified address)");
  if (!process.env.REMINDER_UNSUBSCRIBE_SECRET)
    missing.push("REMINDER_UNSUBSCRIBE_SECRET");
  if (!process.env.RESEND_REMINDER_WEBHOOK_SECRET)
    missing.push("RESEND_REMINDER_WEBHOOK_SECRET");
  if (!process.env.AUTH_EMAIL_HASH_SECRET)
    missing.push("AUTH_EMAIL_HASH_SECRET");
  try {
    reminderSiteOrigin();
  } catch {
    missing.push("NEXT_PUBLIC_SITE_URL (HTTPS)");
  }
  return { ready: missing.length === 0, missing };
}

export type ReminderProviderResult =
  | { kind: "accepted"; messageId: string }
  | { kind: "failed"; errorCode: string }
  | { kind: "uncertain"; errorCode: string };

export async function sendDeadlineReminderWithResend(input: {
  to: string;
  email: RenderedDeadlineReminderEmail;
  unsubscribePostUrl: string;
  idempotencyKey: string;
  recipientId: string;
}): Promise<ReminderProviderResult> {
  const apiKey = process.env.REMINDER_RESEND_API_KEY;
  const from = process.env.REMINDER_EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Reminder sender is not configured.");

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        from: `PP Thai League Fantasy <${from}>`,
        to: [input.to],
        reply_to: process.env.REMINDER_REPLY_TO ?? "support@ppfootball.net",
        subject: input.email.subject,
        html: input.email.html,
        text: input.email.text,
        headers: {
          "List-Unsubscribe": `<${input.unsubscribePostUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        tags: [{ name: "reminder_recipient", value: input.recipientId }],
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return { kind: "uncertain", errorCode: "provider_network_ambiguous" };
  }

  const body = (await response.json().catch(() => null)) as {
    id?: unknown;
    name?: unknown;
  } | null;
  if (!response.ok) {
    return {
      kind: response.status >= 500 ? "uncertain" : "failed",
      errorCode: `provider_http_${response.status}`,
    };
  }
  if (typeof body?.id !== "string" || !body.id) {
    return { kind: "uncertain", errorCode: "provider_missing_message_id" };
  }
  return { kind: "accepted", messageId: body.id };
}
