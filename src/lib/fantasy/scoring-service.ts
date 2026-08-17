import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  fantasyGameweeks,
  fantasyPlayerMatchPoints,
  fantasyPlayerMatchStats,
  fantasyTeamGameweekScores,
  fantasyTeamSelectionPlayers,
  fantasyTeamSelections,
  fantasySeasons,
  fixtures,
} from "@/db/schema";
import { resolveTeamScore, type GameweekPlayerResult } from "./scoring.ts";

export async function recalculateGameweek(fantasyGameweekId: string) {
  const gameweek = await db.query.fantasyGameweeks.findFirst({
    where: eq(fantasyGameweeks.id, fantasyGameweekId),
  });
  if (!gameweek) throw new Error("Fantasy Gameweek was not found.");
  const season = await db.query.fantasySeasons.findFirst({
    where: eq(fantasySeasons.id, gameweek.fantasySeasonId),
  });
  if (!season) throw new Error("Fantasy season was not found.");
  const fixtureRows = await db
    .select({ id: fixtures.id })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.competitionSeasonId, season.competitionSeasonId),
        eq(fixtures.matchweek, gameweek.number),
      ),
    );
  const fixtureIds = fixtureRows.map((fixture) => fixture.id);
  const pointRows = fixtureIds.length
    ? await db
        .select({
          stats: fantasyPlayerMatchStats,
          points: fantasyPlayerMatchPoints,
        })
        .from(fantasyPlayerMatchStats)
        .innerJoin(
          fantasyPlayerMatchPoints,
          eq(
            fantasyPlayerMatchStats.id,
            fantasyPlayerMatchPoints.playerMatchStatsId,
          ),
        )
        .where(inArray(fantasyPlayerMatchStats.fixtureId, fixtureIds))
    : [];
  const resultByPlayer = new Map<string, GameweekPlayerResult>();
  for (const row of pointRows) {
    const current = resultByPlayer.get(row.stats.fantasyPlayerId) ?? {
      playerId: row.stats.fantasyPlayerId,
      minutes: 0,
      points: 0,
    };
    current.minutes += row.stats.minutes;
    current.points += row.points.totalPoints;
    resultByPlayer.set(row.stats.fantasyPlayerId, current);
  }

  const selections = await db
    .select()
    .from(fantasyTeamSelections)
    .where(
      and(
        eq(fantasyTeamSelections.fantasyGameweekId, gameweek.id),
        eq(fantasyTeamSelections.status, "locked"),
      ),
    );
  for (const selection of selections) {
    const members = await db
      .select()
      .from(fantasyTeamSelectionPlayers)
      .where(eq(fantasyTeamSelectionPlayers.selectionId, selection.id));
    const score = resolveTeamScore({
      selection: members.map((member) => ({
        playerId: member.fantasyPlayerId,
        position: member.positionSnapshot as
          "goalkeeper" | "defender" | "midfielder" | "forward",
        lineupRole: member.lineupRole,
        benchOrder: member.benchOrder,
        captainRole: member.captainRole,
      })),
      playerResults: [...resultByPlayer.values()],
      activeChip: selection.activeChip,
      transferPoints: selection.transferPoints,
    });
    await db
      .insert(fantasyTeamGameweekScores)
      .values({
        selectionId: selection.id,
        status: gameweek.scoreComplete ? "final" : "provisional",
        lineupPoints: score.lineupPoints,
        benchPoints: score.benchPoints,
        captainBonus: score.captainBonus,
        transferPoints: score.transferPoints,
        totalPoints: score.totalPoints,
        autoSubstitutions: score.autoSubstitutions,
        computedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: fantasyTeamGameweekScores.selectionId,
        set: {
          status: gameweek.scoreComplete ? "final" : "provisional",
          lineupPoints: score.lineupPoints,
          benchPoints: score.benchPoints,
          captainBonus: score.captainBonus,
          transferPoints: score.transferPoints,
          totalPoints: score.totalPoints,
          autoSubstitutions: score.autoSubstitutions,
          computedAt: new Date(),
          updatedAt: new Date(),
        },
      });
  }
  return { selections: selections.length, players: resultByPlayer.size };
}
