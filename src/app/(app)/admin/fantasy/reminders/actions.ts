"use server";

import { redirect } from "next/navigation";

import { getAdminContext } from "@/data/admin";
import { requireAdmin } from "@/lib/auth/context";
import {
  defaultDeadlineAudience,
  parseDeadlineAudience,
} from "@/lib/email/deadline-audience";
import {
  createDeadlineCampaign,
  markStaleDeadlineBatchUncertain,
  sendNextDeadlineBatch,
} from "@/lib/email/deadline-campaign-service";
import { sendAdminDeadlineTest } from "@/lib/email/deadline-admin-test";

function destination(gameweekNumber: number, audience: string, notice: string) {
  const query = new URLSearchParams({
    gw: String(gameweekNumber),
    audience,
    notice,
  });
  return `/admin/fantasy/reminders?${query}`;
}

export async function createDeadlineCampaignAction(formData: FormData) {
  const admin = await requireAdmin();
  const context = await getAdminContext();
  const week = context.weeks.find(
    (item) => item.id === formData.get("gameweekId"),
  );
  const audience = parseDeadlineAudience(
    String(formData.get("audience") ?? ""),
  );
  if (!week)
    redirect(
      destination(
        context.current?.number ?? 1,
        defaultDeadlineAudience,
        "invalid",
      ),
    );
  const previousWeek = context.weeks
    .filter((item) => item.number < week.number)
    .at(-1);
  let notice = "snapshot-error";
  try {
    const result = await createDeadlineCampaign({
      gameweekId: week.id,
      seasonId: context.season.id,
      previousWeekId: previousWeek?.id ?? null,
      squadSize: context.season.squadSize,
      gameweekNumber: week.number,
      audience,
      adminUserId: admin.user.id,
    });
    notice = result.created ? "snapshot-created" : "snapshot-exists";
  } catch {
    // The admin page shows only a bounded error; no recipient data enters logs.
  }
  redirect(destination(week.number, audience, notice));
}

export async function sendAdminDeadlineTestAction(formData: FormData) {
  const admin = await requireAdmin();
  const context = await getAdminContext();
  const week = context.weeks.find(
    (item) => item.id === formData.get("gameweekId"),
  );
  const audience = parseDeadlineAudience(
    String(formData.get("audience") ?? ""),
  );
  let notice = "test-error";
  if (week) {
    try {
      const result = await sendAdminDeadlineTest({
        adminUserId: admin.user.id,
        gameweekId: week.id,
        confirmation: String(formData.get("confirmation") ?? ""),
      });
      notice =
        result.kind === "accepted"
          ? "test-accepted"
          : result.kind === "uncertain"
            ? "test-uncertain"
            : "test-error";
    } catch {
      // Never reveal the administrator's address or provider details to the page.
    }
  }
  redirect(destination(week?.number ?? 1, audience, notice));
}

export async function sendDeadlineBatchAction(formData: FormData) {
  await requireAdmin();
  const gameweekNumber = Number(formData.get("gw"));
  const audience = parseDeadlineAudience(
    String(formData.get("audience") ?? ""),
  );
  const campaignId = formData.get("campaignId");
  let notice = "send-error";
  if (typeof campaignId === "string" && /^[0-9a-f-]{36}$/i.test(campaignId)) {
    try {
      const result = await sendNextDeadlineBatch({
        campaignId,
        confirmation: String(formData.get("confirmation") ?? ""),
        checksReviewed: formData.get("checksReviewed") === "on",
      });
      notice = result.uncertain
        ? "send-uncertain"
        : result.deferred
          ? "send-rate-limited"
          : result.claimed
            ? "send-batch-complete"
            : "send-no-pending";
    } catch {
      // A sending/uncertain row stays visible for manual review; never auto-retry.
    }
  }
  redirect(
    destination(
      Number.isSafeInteger(gameweekNumber) ? gameweekNumber : 1,
      audience,
      notice,
    ),
  );
}

export async function markStaleDeadlineBatchAction(formData: FormData) {
  await requireAdmin();
  const gameweekNumber = Number(formData.get("gw"));
  const audience = parseDeadlineAudience(
    String(formData.get("audience") ?? ""),
  );
  const campaignId = formData.get("campaignId");
  let notice = "invalid";
  if (typeof campaignId === "string" && /^[0-9a-f-]{36}$/i.test(campaignId)) {
    await markStaleDeadlineBatchUncertain(campaignId);
    notice = "stale-reviewed";
  }
  redirect(
    destination(
      Number.isSafeInteger(gameweekNumber) ? gameweekNumber : 1,
      audience,
      notice,
    ),
  );
}
