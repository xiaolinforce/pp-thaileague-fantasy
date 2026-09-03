import "server-only";

import { and, asc, desc, eq, inArray, lte } from "drizzle-orm";

import { db } from "@/db";
import {
  competitionEntries,
  fantasyGameweeks,
  fantasyPlayerRankings,
  fantasyPlayers,
  fantasyPlayerTiers,
  fantasyRankingRuns,
  fantasySeasons,
  players,
  playerRegistrations,
} from "@/db/schema";
import {
  classifyLikelyClubStartingGoalkeepers,
  type AutoFillCandidate,
} from "@/lib/fantasy/auto-fill";
import type { FantasyPosition } from "@/lib/fantasy/rules";

export async function getFantasyAutoFillCandidates(
  season: typeof fantasySeasons.$inferSelect,
  gameweek: typeof fantasyGameweeks.$inferSelect,
) {
  const publishedRuns = await db
    .select({
      id: fantasyRankingRuns.id,
    })
    .from(fantasyRankingRuns)
    .innerJoin(
      fantasyGameweeks,
      eq(fantasyRankingRuns.effectiveGameweekId, fantasyGameweeks.id),
    )
    .where(
      and(
        eq(fantasyRankingRuns.fantasySeasonId, season.id),
        eq(fantasyRankingRuns.status, "published"),
        lte(fantasyGameweeks.number, gameweek.number),
      ),
    )
    .orderBy(
      desc(fantasyGameweeks.number),
      desc(fantasyRankingRuns.publishedAt),
    )
    .limit(1);
  const publishedRun = publishedRuns[0];
  if (!publishedRun) return null;

  const rows = await db
    .select({
      fantasyPlayerId: fantasyPlayers.id,
      clubId: competitionEntries.clubId,
      position: fantasyPlayers.lockedPosition,
      overallRank: fantasyPlayerRankings.overallRank,
      projectedPoints: fantasyPlayerRankings.projectedPoints,
      isThai: fantasyPlayers.isThai,
    })
    .from(fantasyPlayerRankings)
    .innerJoin(
      fantasyPlayers,
      eq(fantasyPlayerRankings.fantasyPlayerId, fantasyPlayers.id),
    )
    .innerJoin(players, eq(fantasyPlayers.playerId, players.id))
    .innerJoin(
      playerRegistrations,
      eq(fantasyPlayers.playerId, playerRegistrations.playerId),
    )
    .innerJoin(
      competitionEntries,
      eq(playerRegistrations.competitionEntryId, competitionEntries.id),
    )
    .where(
      and(
        eq(fantasyPlayerRankings.rankingRunId, publishedRun.id),
        eq(fantasyPlayers.fantasySeasonId, season.id),
        eq(fantasyPlayers.isAvailable, true),
        eq(players.isActive, true),
        eq(playerRegistrations.status, "active"),
        eq(competitionEntries.competitionSeasonId, season.competitionSeasonId),
      ),
    )
    .orderBy(asc(fantasyPlayers.id), asc(competitionEntries.id));
  const fantasyPlayerIds = [...new Set(rows.map((row) => row.fantasyPlayerId))];
  if (fantasyPlayerIds.length === 0) return [];

  const tierRows = await db
    .select({
      fantasyPlayerId: fantasyPlayerTiers.fantasyPlayerId,
      level: fantasyPlayerTiers.level,
      gameweekNumber: fantasyGameweeks.number,
    })
    .from(fantasyPlayerTiers)
    .innerJoin(
      fantasyGameweeks,
      eq(fantasyPlayerTiers.effectiveGameweekId, fantasyGameweeks.id),
    )
    .where(
      and(
        inArray(fantasyPlayerTiers.fantasyPlayerId, fantasyPlayerIds),
        eq(fantasyGameweeks.fantasySeasonId, season.id),
        lte(fantasyGameweeks.number, gameweek.number),
      ),
    )
    .orderBy(asc(fantasyGameweeks.number));
  const tierByPlayer = new Map<string, number>();
  for (const row of tierRows) {
    tierByPlayer.set(row.fantasyPlayerId, row.level);
  }

  const candidatesById = new Map<string, AutoFillCandidate>();
  for (const row of rows) {
    if (candidatesById.has(row.fantasyPlayerId)) continue;
    candidatesById.set(row.fantasyPlayerId, {
      id: row.fantasyPlayerId,
      clubId: row.clubId,
      position: row.position as FantasyPosition,
      tier: tierByPlayer.get(row.fantasyPlayerId) ?? 4,
      overallRank: row.overallRank,
      projectedPoints: row.projectedPoints,
      isThai: row.isThai,
      isLikelyClubStartingGoalkeeper: false,
    });
  }

  return classifyLikelyClubStartingGoalkeepers([...candidatesById.values()]);
}
