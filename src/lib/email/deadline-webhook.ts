import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { transactionDb } from "@/db/transaction";
import {
  authUsers,
  deadlineReminderRecipients,
  deadlineReminderSuppressions,
  deadlineReminderWebhookEvents,
} from "@/db/schema";

type ResendEvent = {
  type?: unknown;
  data?: {
    email_id?: unknown;
    to?: unknown;
    tags?: unknown;
  };
};

const trackedEvents = new Map([
  ["email.delivered", "delivered"],
  ["email.bounced", "bounced"],
  ["email.complained", "complained"],
  ["email.suppressed", "suppressed"],
  ["email.failed", "failed"],
]);

export async function recordResendReminderEvent(
  eventId: string,
  event: ResendEvent,
) {
  if (eventId.length > 200) throw new Error("Invalid webhook event ID.");
  const type = typeof event.type === "string" ? event.type : "";
  const status = trackedEvents.get(type);
  if (!status) return;
  const messageId =
    typeof event.data?.email_id === "string" ? event.data.email_id : null;
  const recipientAddress =
    Array.isArray(event.data?.to) &&
    typeof event.data.to[0] === "string" &&
    event.data.to.length === 1
      ? event.data.to[0]
      : null;
  const tags = event.data?.tags;
  const taggedRecipientId =
    tags &&
    typeof tags === "object" &&
    "reminder_recipient" in tags &&
    typeof tags.reminder_recipient === "string" &&
    /^[0-9a-f-]{36}$/i.test(tags.reminder_recipient)
      ? tags.reminder_recipient
      : null;

  await transactionDb.transaction(async (tx) => {
    const inserted = await tx
      .insert(deadlineReminderWebhookEvents)
      .values({ id: eventId, type, providerMessageId: messageId })
      .onConflictDoNothing()
      .returning({ id: deadlineReminderWebhookEvents.id });
    if (!inserted.length) return;

    if (messageId || taggedRecipientId) {
      const recipientCondition = taggedRecipientId
        ? eq(deadlineReminderRecipients.id, taggedRecipientId)
        : eq(deadlineReminderRecipients.providerMessageId, messageId!);
      const allowedStatuses =
        status === "delivered"
          ? ["sending", "accepted", "uncertain"]
          : ["sending", "accepted", "delivered", "uncertain"];
      await tx
        .update(deadlineReminderRecipients)
        .set({
          status,
          providerMessageId: messageId ?? undefined,
          deliveredAt: status === "delivered" ? new Date() : undefined,
          errorCode: status === "delivered" ? undefined : type,
          updatedAt: new Date(),
        })
        .where(
          and(
            recipientCondition,
            inArray(deadlineReminderRecipients.status, allowedStatuses),
          ),
        );
    }

    if (
      recipientAddress &&
      ["bounced", "complained", "suppressed"].includes(status)
    ) {
      const users = await tx
        .select({ id: authUsers.id })
        .from(authUsers)
        .where(sql`lower(${authUsers.email}) = lower(${recipientAddress})`);
      for (const user of users) {
        await tx
          .insert(deadlineReminderSuppressions)
          .values({
            authUserId: user.id,
            reason:
              status === "bounced"
                ? "bounce"
                : status === "complained"
                  ? "complaint"
                  : "suppressed",
            providerMessageId: messageId,
          })
          .onConflictDoNothing();
      }
    }
  });
}
