import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { authUsers, deadlineReminderPreferences } from "@/db/schema";
import { verifyDeadlineUnsubscribeToken } from "@/lib/email/deadline-security";

export function unsubscribeUserFromToken(token: string) {
  const secret = process.env.REMINDER_UNSUBSCRIBE_SECRET;
  return secret ? verifyDeadlineUnsubscribeToken(token, secret) : null;
}

export async function recordDeadlineUnsubscribe(userId: string) {
  const [user] = await db
    .select({ id: authUsers.id })
    .from(authUsers)
    .where(eq(authUsers.id, userId))
    .limit(1);
  if (!user) return;
  await db
    .insert(deadlineReminderPreferences)
    .values({ authUserId: userId })
    .onConflictDoNothing();
}
