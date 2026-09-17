import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import {
  authUsers,
  deadlineReminderPreferences,
  deadlineReminderSuppressions,
  fantasyGameweeks,
} from "@/db/schema";
import { renderDeadlineReminderEmail } from "@/emails/render-deadline-reminder";
import { getReminderDeadlineLabels } from "@/lib/fantasy/deadline-presentation";
import { createDeadlineUnsubscribeToken } from "@/lib/email/deadline-security";
import {
  reminderSiteOrigin,
  reminderTestReadiness,
  sendDeadlineReminderWithResend,
} from "@/lib/email/deadline-delivery";

/** A controlled production test to the signed-in administrator's own verified address. */
export async function sendAdminDeadlineTest(input: {
  adminUserId: string;
  gameweekId: string;
  confirmation: string;
}) {
  const readiness = reminderTestReadiness();
  if (!readiness.ready) throw new Error("Reminder test is not configured.");

  const [week] = await db
    .select({
      id: fantasyGameweeks.id,
      number: fantasyGameweeks.number,
      status: fantasyGameweeks.status,
      deadlineAt: fantasyGameweeks.deadlineAt,
    })
    .from(fantasyGameweeks)
    .where(eq(fantasyGameweeks.id, input.gameweekId))
    .limit(1);
  if (
    !week ||
    week.status !== "open" ||
    week.deadlineAt.getTime() <= Date.now() ||
    input.confirmation !== `TEST GW${week.number}`
  ) {
    throw new Error("Reminder test confirmation or Gameweek is invalid.");
  }

  const [admin] = await db
    .select({ email: authUsers.email })
    .from(authUsers)
    .leftJoin(
      deadlineReminderPreferences,
      eq(deadlineReminderPreferences.authUserId, authUsers.id),
    )
    .leftJoin(
      deadlineReminderSuppressions,
      eq(deadlineReminderSuppressions.authUserId, authUsers.id),
    )
    .where(
      and(
        eq(authUsers.id, input.adminUserId),
        eq(authUsers.role, "admin"),
        eq(authUsers.emailVerified, true),
        isNull(deadlineReminderPreferences.authUserId),
        isNull(deadlineReminderSuppressions.authUserId),
      ),
    )
    .limit(1);
  if (!admin) throw new Error("Administrator email is not eligible.");

  const origin = reminderSiteOrigin();
  const secret = process.env.REMINDER_UNSUBSCRIBE_SECRET!;
  const token = createDeadlineUnsubscribeToken(input.adminUserId, secret);
  const labels = getReminderDeadlineLabels(week.deadlineAt.toISOString());
  const rendered = await renderDeadlineReminderEmail({
    gameweekNumber: week.number,
    deadlineTh: labels.th,
    deadlineEn: labels.en,
    brandLogoUrl: `${origin}/logo.png`,
    teamUrl: `${origin}/team`,
    unsubscribeUrl: `${origin}/email/unsubscribe?token=${encodeURIComponent(token)}`,
  });
  const result = await sendDeadlineReminderWithResend({
    to: admin.email,
    email: { ...rendered, subject: `[TEST] ${rendered.subject}` },
    unsubscribePostUrl: `${origin}/api/email/deadline-unsubscribe?token=${encodeURIComponent(token)}`,
    idempotencyKey: `deadline-test/${week.id}/${input.adminUserId}`,
  });
  return result;
}
