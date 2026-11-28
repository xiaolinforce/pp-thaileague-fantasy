"use server";

import { refresh, updateTag } from "next/cache";
import { transactionDb } from "@/db/transaction";
import { getCompetitionSeasonId, STANDINGS_CACHE_TAG } from "@/data/standings";
import { requireAdmin } from "@/lib/auth/context";
import type { StandingsSubmission } from "@/lib/fantasy/competition-standings";
import {
  saveCompetitionStandings,
  StandingsSaveError,
} from "@/lib/fantasy/competition-standings-service";

const REASON_LIMIT = 500;

export async function saveStandingsAction(input: {
  submission: StandingsSubmission;
  expectedUpdatedAt: string | null;
  reason: string;
}) {
  const { auditActor } = await requireAdmin();
  const reason = input.reason.trim().slice(0, REASON_LIMIT) || null;
  try {
    const seasonId = await getCompetitionSeasonId();
    const result = await transactionDb.transaction((tx) =>
      saveCompetitionStandings(tx, {
        seasonId,
        submission: {
          throughMatchweek: input.submission.throughMatchweek,
          rows: input.submission.rows.map((row) => ({
            entryId: String(row.entryId),
            won: row.won,
            drawn: row.drawn,
            lost: row.lost,
            goalsFor: row.goalsFor,
            goalsAgainst: row.goalsAgainst,
            pointsAdjustment: row.pointsAdjustment,
          })),
        },
        expectedUpdatedAt: input.expectedUpdatedAt,
        reason,
        changedBy: auditActor,
      }),
    );
    if (!result.unchanged) {
      updateTag(STANDINGS_CACHE_TAG);
      refresh();
    }
    return { ok: true as const, ...result };
  } catch (error) {
    if (error instanceof StandingsSaveError)
      return {
        ok: false as const,
        message: { th: error.messageTh, en: error.message },
      };
    throw error;
  }
}
