import "server-only";
import { createHash } from "node:crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  fantasyAdminAuditLog,
  fantasyPlayerMatchPoints,
  fantasyPlayerMatchStats,
  fixtures,
} from "@/db/schema";
import { getMatchImportRoster } from "./match-import-service";
import type { FantasyTransaction } from "./season-lock";

export class GameweekOperationError extends Error {}

// Hold the exclusive season lock through readiness checks and finalization.
export async function completedGameweekRevision(
  db: FantasyTransaction,
  competitionSeasonId: string,
  week: { id: string; number: number },
) {
  const matches = await db
    .select({
      id: fixtures.id,
      status: fixtures.status,
      home: fixtures.homeScore,
      away: fixtures.awayScore,
    })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.competitionSeasonId, competitionSeasonId),
        eq(fixtures.matchweek, week.number),
      ),
    )
    .orderBy(fixtures.id);
  if (
    !matches.length ||
    matches.some(
      (m) => m.status !== "finished" || m.home === null || m.away === null,
    )
  ) {
    throw new GameweekOperationError("INCOMPLETE");
  }
  const ids = matches.map((match) => match.id);
  const stats = await db
    .select({
      fixtureId: fantasyPlayerMatchStats.fixtureId,
      playerId: fantasyPlayerMatchStats.fantasyPlayerId,
      status: fantasyPlayerMatchStats.status,
      minutes: fantasyPlayerMatchStats.minutes,
      goals: fantasyPlayerMatchStats.goals,
      ownGoals: fantasyPlayerMatchStats.ownGoals,
      points: fantasyPlayerMatchPoints.totalPoints,
      revision: sql<string>`md5(to_jsonb(fantasy_player_match_stats)::text || coalesce(to_jsonb(fantasy_player_match_points)::text,''))`,
    })
    .from(fantasyPlayerMatchStats)
    .leftJoin(
      fantasyPlayerMatchPoints,
      eq(
        fantasyPlayerMatchPoints.playerMatchStatsId,
        fantasyPlayerMatchStats.id,
      ),
    )
    .where(inArray(fantasyPlayerMatchStats.fixtureId, ids))
    .orderBy(fantasyPlayerMatchStats.id);
  for (const match of matches) {
    const roster = await getMatchImportRoster(db, match.id);
    const matchStats = stats.filter((s) => s.fixtureId === match.id);
    const byPlayer = new Map(matchStats.map((s) => [s.playerId, s]));
    const goals = { home: 0, away: 0 };
    const appearances = { home: 0, away: 0 };
    if (!roster.length || roster.length !== byPlayer.size)
      throw new GameweekOperationError("INCOMPLETE");
    for (const player of roster) {
      const result = byPlayer.get(player.fantasyPlayerId);
      if (!result || result.points === null || result.status === "imported")
        throw new GameweekOperationError("INCOMPLETE");
      if (result.minutes > 0) appearances[player.side]++;
      goals[player.side] += result.goals;
      goals[player.side === "home" ? "away" : "home"] += result.ownGoals;
    }
    if (
      goals.home !== match.home ||
      goals.away !== match.away ||
      appearances.home < 11 ||
      appearances.away < 11
    )
      throw new GameweekOperationError("INCOMPLETE");
  }
  // Include event-only corrections in the audit revision of the finalized scores.
  const batches = await db
    .select({ id: fantasyAdminAuditLog.id })
    .from(fantasyAdminAuditLog)
    .where(
      and(
        inArray(fantasyAdminAuditLog.entityId, ids),
        eq(fantasyAdminAuditLog.entityType, "fixture"),
        eq(fantasyAdminAuditLog.action, "import_match_batch"),
      ),
    )
    .orderBy(desc(fantasyAdminAuditLog.id));
  return createHash("sha256")
    .update(JSON.stringify([week.id, matches, stats, batches]))
    .digest("hex");
}
