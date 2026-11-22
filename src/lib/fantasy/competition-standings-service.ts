import "server-only";

import { and, eq } from "drizzle-orm";
import {
  competitionEntries,
  competitionSeasons,
  competitionStandings,
  fantasyAdminAuditLog,
} from "@/db/schema";
import {
  deriveStanding,
  validateStandingsSubmission,
  type StandingsSubmission,
} from "./competition-standings";
import type { FantasyTransaction } from "./season-lock";

export class StandingsSaveError extends Error {
  constructor(
    message: string,
    readonly messageTh: string,
  ) {
    super(message);
  }
}

/**
 * Replaces the season's league table in one transaction. Positions follow the
 * submitted order; played and points are always recomputed on the server.
 */
export async function saveCompetitionStandings(
  tx: FantasyTransaction,
  {
    seasonId,
    submission,
    expectedUpdatedAt,
    reason,
    changedBy,
  }: {
    seasonId: string;
    submission: StandingsSubmission;
    /** Last save time the editor loaded; null when it loaded an empty table. */
    expectedUpdatedAt: string | null;
    reason: string | null;
    changedBy: string;
  },
) {
  const [season] = await tx
    .select({ id: competitionSeasons.id })
    .from(competitionSeasons)
    .where(eq(competitionSeasons.id, seasonId))
    .for("update");
  if (!season) throw new Error("Competition season was not found.");

  const [entries, before] = await Promise.all([
    tx
      .select({ id: competitionEntries.id })
      .from(competitionEntries)
      .where(
        and(
          eq(competitionEntries.competitionSeasonId, seasonId),
          eq(competitionEntries.isActive, true),
        ),
      ),
    tx
      .select()
      .from(competitionStandings)
      .where(eq(competitionStandings.competitionSeasonId, seasonId)),
  ]);

  const lastSaved = before.reduce<Date | null>(
    (max, row) => (!max || row.updatedAt > max ? row.updatedAt : max),
    null,
  );
  if ((lastSaved?.toISOString() ?? null) !== expectedUpdatedAt)
    throw new StandingsSaveError(
      "The table changed in another window. Reload it before saving again.",
      "ตารางคะแนนถูกแก้ไขจากหน้าต่างอื่นแล้ว กรุณาโหลดหน้าใหม่ก่อนบันทึก",
    );

  const problem = validateStandingsSubmission(
    submission,
    entries.map((entry) => entry.id),
  );
  if (problem) throw new StandingsSaveError(problem.en, problem.th);

  const now = new Date();
  const values = submission.rows.map((row, index) => {
    const derived = deriveStanding(row);
    return {
      competitionSeasonId: seasonId,
      competitionEntryId: row.entryId,
      position: index + 1,
      played: derived.played,
      won: row.won,
      drawn: row.drawn,
      lost: row.lost,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
      pointsAdjustment: row.pointsAdjustment,
      points: derived.points,
      throughMatchweek: submission.throughMatchweek,
      updatedBy: changedBy,
      createdAt: now,
      updatedAt: now,
    };
  });

  const summary = (
    rows: Array<{
      competitionEntryId: string;
      position: number;
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
      pointsAdjustment: number;
      points: number;
      throughMatchweek: number | null;
    }>,
  ) => ({
    throughMatchweek: rows[0]?.throughMatchweek ?? null,
    rows: [...rows]
      .sort((a, b) => a.position - b.position)
      .map((row) => ({
        entryId: row.competitionEntryId,
        position: row.position,
        played: row.played,
        won: row.won,
        drawn: row.drawn,
        lost: row.lost,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        pointsAdjustment: row.pointsAdjustment,
        points: row.points,
      })),
  });
  const beforeSummary = summary(before);
  const afterSummary = summary(values);
  if (JSON.stringify(beforeSummary) === JSON.stringify(afterSummary))
    return { unchanged: true as const };

  await tx
    .delete(competitionStandings)
    .where(eq(competitionStandings.competitionSeasonId, seasonId));
  await tx.insert(competitionStandings).values(values);
  const previous = new Map(
    beforeSummary.rows.map((row) => [row.entryId, JSON.stringify(row)]),
  );
  const changedClubs = afterSummary.rows.filter(
    (row) => previous.get(row.entryId) !== JSON.stringify(row),
  ).length;
  await tx.insert(fantasyAdminAuditLog).values({
    action: before.length
      ? "update_competition_standings"
      : "create_competition_standings",
    entityType: "competition_standings",
    entityId: seasonId,
    reason,
    changedBy,
    before: before.length ? beforeSummary : null,
    after: { ...afterSummary, changedClubs },
  });
  return { unchanged: false as const, updatedAt: now.toISOString() };
}
