import { verifyResendWebhook } from "@/lib/email/deadline-security";
import { recordResendReminderEvent } from "@/lib/email/deadline-webhook";

export async function POST(request: Request) {
  const secret = process.env.RESEND_REMINDER_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook not configured", { status: 503 });
  const payload = await request.text();
  if (payload.length > 65536)
    return new Response("Payload too large", { status: 413 });
  const headers = {
    id: request.headers.get("svix-id"),
    timestamp: request.headers.get("svix-timestamp"),
    signature: request.headers.get("svix-signature"),
  };
  if (!verifyResendWebhook(payload, headers, secret)) {
    return new Response("Invalid signature", { status: 400 });
  }
  let event: unknown;
  try {
    event = JSON.parse(payload);
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }
  if (!event || typeof event !== "object") {
    return new Response("Invalid payload", { status: 400 });
  }
  await recordResendReminderEvent(headers.id!, event);
  return new Response(null, { status: 204 });
}
