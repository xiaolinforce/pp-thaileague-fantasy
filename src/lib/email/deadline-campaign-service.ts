import "server-only";

import { createHash } from "node:crypto";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { transactionDb } from "@/db/transaction";
import {
  deadlineReminderCampaigns,
  deadlineReminderRecipients,
  fantasyGameweeks,
} from "@/db/schema";
import {
  deadlineAudienceCandidates,
  deadlineAudienceCondition,
} from "@/data/admin-deadline-reminders";
import { renderDeadlineReminderEmail } from "@/emails/render-deadline-reminder";
import { deadlineReminderSubject } from "@/emails/deadline-reminder";
import { getReminderDeadlineLabels } from "@/lib/fantasy/deadline-presentation";
import type { DeadlineAudienceId } from "@/lib/email/deadline-audience";
import {
  createDeadlineUnsubscribeToken,
  hashRecipientEmail,
} from "@/lib/email/deadline-security";
import {
  reminderReadiness,
  reminderSiteOrigin,
  sendDeadlineReminderWithResend,
} from "@/lib/email/deadline-delivery";

function recipientHashSecret() {
  const secret = process.env.AUTH_EMAIL_HASH_SECRET;
  if (!secret) throw new Error("Recipient hash secret is not configured.");
  return secret;
}

function unsubscribeSecret() {
  const secret = process.env.REMINDER_UNSUBSCRIBE_SECRET;
  if (!secret)
    throw new Error("Reminder unsubscribe secret is not configured.");
  return secret;
}

async function renderForCampaign(
  gameweekNumber: number,
  deadlineAt: Date,
  unsubscribeUrl: string,
) {
  const origin = reminderSiteOrigin();
  const labels = getReminderDeadlineLabels(deadlineAt.toISOString());
  return renderDeadlineReminderEmail({
    gameweekNumber,
    deadlineTh: labels.th,
    deadlineEn: labels.en,
    brandLogoUrl: `${origin}/logo.png`,
    teamUrl: `${origin}/team`,
    unsubscribeUrl,
  });
}

async function templateFingerprint(gameweekNumber: number, deadlineAt: Date) {
  const rendered = await renderForCampaign(
    gameweekNumber,
    deadlineAt,
    `${reminderSiteOrigin()}/email/unsubscribe?token=preview`,
  );
  return createHash("sha256")
    .update(`${rendered.subject}\n${rendered.html}\n${rendered.text}`)
    .digest("hex");
}

export async function getDeadlineCampaignSummary(
  gameweekId: string,
  audience: DeadlineAudienceId,
) {
  const [campaign] = await db
    .select()
    .from(deadlineReminderCampaigns)
    .where(
      and(
        eq(deadlineReminderCampaigns.fantasyGameweekId, gameweekId),
        eq(deadlineReminderCampaigns.audience, audience),
      ),
    )
    .limit(1);
  if (!campaign) return null;
  const counts = await db.execute<{ status: string; total: number }>(sql`
    select status, count(*)::int total
    from deadline_reminder_recipients
    where campaign_id = ${campaign.id}::uuid
    group by status
  `);
  return {
    ...campaign,
    counts: Object.fromEntries(
      counts.rows.map((row) => [row.status, row.total]),
    ),
  };
}

export async function createDeadlineCampaign(input: {
  gameweekId: string;
  seasonId: string;
  previousWeekId: string | null;
  squadSize: number;
  gameweekNumber: number;
  audience: DeadlineAudienceId;
  adminUserId: string;
}) {
  const hashSecret = recipientHashSecret();
  const condition = deadlineAudienceCondition(input.audience);
  const candidates = deadlineAudienceCandidates(
    input.seasonId,
    input.gameweekId,
    input.previousWeekId,
    input.squadSize,
  );

  return transactionDb.transaction(async (tx) => {
    const weeks = await tx.execute<{
      deadline_at: Date;
      status: string;
      number: number;
    }>(sql`
      select deadline_at, status, number
      from fantasy_gameweeks
      where id = ${input.gameweekId}::uuid
        and fantasy_season_id = ${input.seasonId}::uuid
      for update
    `);
    const week = weeks.rows[0];
    if (
      !week ||
      week.status !== "open" ||
      new Date(week.deadline_at).getTime() <= Date.now() ||
      week.number !== input.gameweekNumber
    ) {
      throw new Error("Gameweek is not open before its deadline.");
    }

    const [existing] = await tx
      .select({ id: deadlineReminderCampaigns.id })
      .from(deadlineReminderCampaigns)
      .where(
        and(
          eq(deadlineReminderCampaigns.fantasyGameweekId, input.gameweekId),
          eq(deadlineReminderCampaigns.audience, input.audience),
        ),
      )
      .limit(1);
    if (existing) return { campaignId: existing.id, created: false, count: 0 };

    const eligible = await tx.execute<{ auth_user_id: string; email: string }>(
      sql`${candidates}
        select auth_user_id, email from candidates
        where email_ready and not unsubscribed and not suppressed and ${condition}
        order by auth_user_id`,
    );
    if (!eligible.rows.length) {
      throw new Error("No eligible recipients remain for this audience.");
    }

    const deadlineAt = new Date(week.deadline_at);
    const [campaign] = await tx
      .insert(deadlineReminderCampaigns)
      .values({
        fantasyGameweekId: input.gameweekId,
        audience: input.audience,
        deadlineAtSnapshot: deadlineAt,
        subjectSnapshot: deadlineReminderSubject(input.gameweekNumber),
        templateHash: await templateFingerprint(
          input.gameweekNumber,
          deadlineAt,
        ),
        createdByAuthUserId: input.adminUserId,
      })
      .returning({ id: deadlineReminderCampaigns.id });

    let count = 0;
    for (let offset = 0; offset < eligible.rows.length; offset += 100) {
      const inserted = await tx
        .insert(deadlineReminderRecipients)
        .values(
          eligible.rows.slice(offset, offset + 100).map((recipient) => ({
            campaignId: campaign.id,
            fantasyGameweekId: input.gameweekId,
            authUserId: recipient.auth_user_id,
            emailHash: hashRecipientEmail(recipient.email, hashSecret),
          })),
        )
        .onConflictDoNothing()
        .returning({ id: deadlineReminderRecipients.id });
      count += inserted.length;
    }
    return { campaignId: campaign.id, created: true, count };
  });
}

type ClaimedRecipient = {
  id: string;
  auth_user_id: string;
  email_hash: string;
};

async function claimReminderBatch(campaignId: string, gameweekId: string) {
  return transactionDb.transaction(async (tx) => {
    await tx.execute(sql`
      select id from deadline_reminder_campaigns
      where id = ${campaignId}::uuid for update
    `);
    const active = await tx.execute<{ total: number }>(sql`
      select count(*)::int total from deadline_reminder_recipients
      where campaign_id = ${campaignId}::uuid
        and status in ('sending', 'uncertain')
    `);
    if (active.rows[0]?.total) {
      throw new Error(
        "A reminder batch is in progress or has an uncertain outcome.",
      );
    }
    const claimed = await tx.execute<ClaimedRecipient>(sql`
      update deadline_reminder_recipients
      set status = 'sending', claimed_at = now(), updated_at = now()
      where id in (
        select id from deadline_reminder_recipients
        where campaign_id = ${campaignId}::uuid
          and fantasy_gameweek_id = ${gameweekId}::uuid
          and status = 'pending'
        order by created_at, id
        limit 5 for update skip locked
      )
      returning id, auth_user_id, email_hash
    `);
    return claimed.rows;
  });
}

async function currentRecipient(
  recipient: ClaimedRecipient,
  gameweekId: string,
  audience: string,
) {
  const rows = await db.execute<{
    email: string;
    current_confirmed_at: Date | null;
  }>(sql`
    select u.email, selection.confirmed_at current_confirmed_at
    from auth_users u
    join fantasy_managers m on m.auth_user_id = u.id
    join fantasy_gameweeks gw on gw.id = ${gameweekId}::uuid
    join fantasy_teams t on t.manager_id = m.id
      and t.fantasy_season_id = gw.fantasy_season_id
    left join fantasy_team_selections selection
      on selection.fantasy_team_id = t.id
      and selection.fantasy_gameweek_id = gw.id
    left join deadline_reminder_preferences preference
      on preference.auth_user_id = u.id
    left join deadline_reminder_suppressions suppression
      on suppression.auth_user_id = u.id
    where u.id = ${recipient.auth_user_id}
      and u.email_verified and not coalesce(u.is_anonymous, false)
      and m.status = 'member' and not m.is_bot and t.is_active
      and gw.status = 'open' and gw.deadline_at > now()
      and preference.auth_user_id is null
      and suppression.auth_user_id is null
  `);
  const current = rows.rows[0];
  if (
    !current ||
    hashRecipientEmail(current.email, recipientHashSecret()) !==
      recipient.email_hash ||
    (audience === "previous-unsaved" && current.current_confirmed_at)
  ) {
    return null;
  }
  return current.email;
}

async function updateRecipient(
  id: string,
  status: string,
  fields: { providerMessageId?: string; errorCode?: string } = {},
) {
  await db
    .update(deadlineReminderRecipients)
    .set({
      status,
      providerMessageId: fields.providerMessageId ?? null,
      errorCode: fields.errorCode ?? null,
      claimedAt: status === "pending" ? null : undefined,
      acceptedAt: status === "accepted" ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(deadlineReminderRecipients.id, id),
        eq(deadlineReminderRecipients.status, "sending"),
      ),
    );
}

export async function sendNextDeadlineBatch(input: {
  campaignId: string;
  confirmation: string;
  checksReviewed: boolean;
}) {
  const readiness = reminderReadiness();
  if (!readiness.ready) {
    throw new Error(
      `Reminder sending is not ready: ${readiness.missing.join(", ")}`,
    );
  }
  const [campaign] = await db
    .select({
      id: deadlineReminderCampaigns.id,
      audience: deadlineReminderCampaigns.audience,
      fantasyGameweekId: deadlineReminderCampaigns.fantasyGameweekId,
      deadlineAtSnapshot: deadlineReminderCampaigns.deadlineAtSnapshot,
      subjectSnapshot: deadlineReminderCampaigns.subjectSnapshot,
      templateHash: deadlineReminderCampaigns.templateHash,
      gameweekNumber: fantasyGameweeks.number,
      currentDeadlineAt: fantasyGameweeks.deadlineAt,
      gameweekStatus: fantasyGameweeks.status,
    })
    .from(deadlineReminderCampaigns)
    .innerJoin(
      fantasyGameweeks,
      eq(deadlineReminderCampaigns.fantasyGameweekId, fantasyGameweeks.id),
    )
    .where(eq(deadlineReminderCampaigns.id, input.campaignId))
    .limit(1);
  if (
    !campaign ||
    !input.checksReviewed ||
    input.confirmation !== `SEND GW${campaign.gameweekNumber}`
  ) {
    throw new Error("The campaign confirmation does not match.");
  }
  if (
    campaign.gameweekStatus !== "open" ||
    campaign.currentDeadlineAt.getTime() <= Date.now() ||
    campaign.currentDeadlineAt.getTime() !==
      campaign.deadlineAtSnapshot.getTime() ||
    campaign.subjectSnapshot !==
      deadlineReminderSubject(campaign.gameweekNumber) ||
    campaign.templateHash !==
      (await templateFingerprint(
        campaign.gameweekNumber,
        campaign.currentDeadlineAt,
      ))
  ) {
    throw new Error("Campaign preview or Gameweek changed. Sending stopped.");
  }

  const claimed = await claimReminderBatch(
    campaign.id,
    campaign.fantasyGameweekId,
  );
  const origin = reminderSiteOrigin();
  const secret = unsubscribeSecret();
  const results = {
    accepted: 0,
    skipped: 0,
    failed: 0,
    uncertain: 0,
    deferred: 0,
  };
  for (const [index, recipient] of claimed.entries()) {
    if (campaign.currentDeadlineAt.getTime() <= Date.now()) {
      await updateRecipient(recipient.id, "skipped", {
        errorCode: "deadline_passed",
      });
      results.skipped++;
      continue;
    }
    const email = await currentRecipient(
      recipient,
      campaign.fantasyGameweekId,
      campaign.audience,
    );
    if (!email) {
      await updateRecipient(recipient.id, "skipped", {
        errorCode: "no_longer_eligible",
      });
      results.skipped++;
      continue;
    }
    const token = createDeadlineUnsubscribeToken(
      recipient.auth_user_id,
      secret,
    );
    const unsubscribePageUrl = `${origin}/email/unsubscribe?token=${encodeURIComponent(token)}`;
    const unsubscribePostUrl = `${origin}/api/email/deadline-unsubscribe?token=${encodeURIComponent(token)}`;
    const rendered = await renderForCampaign(
      campaign.gameweekNumber,
      campaign.currentDeadlineAt,
      unsubscribePageUrl,
    );
    const result = await sendDeadlineReminderWithResend({
      to: email,
      email: rendered,
      unsubscribePostUrl,
      idempotencyKey: `deadline/${campaign.fantasyGameweekId}/${recipient.auth_user_id}`,
      recipientId: recipient.id,
    });
    if (result.kind === "failed" && result.errorCode === "provider_http_429") {
      for (const deferred of claimed.slice(index)) {
        await updateRecipient(deferred.id, "pending", {
          errorCode: "provider_rate_limited",
        });
        results.deferred++;
      }
      break;
    }
    if (result.kind === "accepted") {
      await updateRecipient(recipient.id, "accepted", {
        providerMessageId: result.messageId,
      });
      results.accepted++;
    } else {
      await updateRecipient(recipient.id, result.kind, {
        errorCode: result.errorCode,
      });
      results[result.kind]++;
      if (result.kind === "uncertain") {
        for (const deferred of claimed.slice(index + 1)) {
          await updateRecipient(deferred.id, "pending", {
            errorCode: "batch_stopped_uncertain",
          });
          results.deferred++;
        }
        break;
      }
    }
  }
  return { claimed: claimed.length, ...results };
}

export async function markStaleDeadlineBatchUncertain(campaignId: string) {
  return db.execute(sql`
    update deadline_reminder_recipients
    set status = 'uncertain', error_code = 'stale_claim_requires_review',
      updated_at = now()
    where campaign_id = ${campaignId}::uuid
      and status = 'sending'
      and claimed_at < now() - interval '2 minutes'
  `);
}
