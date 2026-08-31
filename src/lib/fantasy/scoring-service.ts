import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { transactionDb } from "@/db/transaction";
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
import {
  refreshOverallLeagueStandings,
  type LeagueStandingsDatabase,
} from "./league-standings-service.ts";
import { summarizeGameweekScores } from "./points-presentation.ts";
import { resolveTeamScore, type GameweekPlayerResult } from "./scoring.ts";

type ScoringDatabase = Pick<
  typeof transactionDb,
  "query" | "select" | "insert" | "update" | "delete"
> &
  LeagueStandingsDatabase;

export async function recalculateGameweek(
  fantasyGameweekId: string,
  database?: ScoringDatabase,
) {
  if (!database) {
    return transactionDb.transaction((tx) =>
      recalculateGameweekInTransaction(fantasyGameweekId, tx),
    );
  }
  return recalculateGameweekInTransaction(fantasyGameweekId, database);
}

async function recalculateGameweekInTransaction(
  fantasyGameweekId: string,
  database: ScoringDatabase,
) {
  const gameweek = await database.query.fantasyGameweeks.findFirst({
    where: eq(fantasyGameweeks.id, fantasyGameweekId),
  });
  if (!gameweek) throw new Error("Fantasy Gameweek was not found.");
  const season = await database.query.fantasySeasons.findFirst({
    where: eq(fantasySeasons.id, gameweek.fantasySeasonId),
  });
  if (!season) throw new Error("Fantasy season was not found.");
  const fixtureRows = await database
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
    ? await database
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

  const selections = await database
    .select()
    .from(fantasyTeamSelections)
    .where(
      and(
        eq(fantasyTeamSelections.fantasyGameweekId, gameweek.id),
        eq(fantasyTeamSelections.status, "locked"),
      ),
    );
  const scoredTeams: Array<{ playerCount: number; totalPoints: number }> = [];
  for (const selection of selections) {
    const members = await database
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
    scoredTeams.push({
      playerCount: members.length,
      totalPoints: score.totalPoints,
    });
    await database
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
  const gameweekSummary = summarizeGameweekScores(scoredTeams);
  await database
    .update(fantasyGameweeks)
    .set({
      averagePoints: gameweekSummary.averagePoints,
      highestPoints: gameweekSummary.highestPoints,
      updatedAt: new Date(),
    })
    .where(eq(fantasyGameweeks.id, gameweek.id));
  const leagueStandings = await refreshOverallLeagueStandings(
    gameweek.fantasySeasonId,
    database,
  );

  return {
    selections: selections.length,
    players: resultByPlayer.size,
    leagueStandings,
    ...gameweekSummary,
  };
}
