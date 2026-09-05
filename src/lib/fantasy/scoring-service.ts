import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { transactionDb } from "@/db/transaction";
import {
  fantasyGameweeks,
  fantasyPlayerMatchPoints,
  fantasyPlayerMatchStats,
  fantasyTeamGameweekScores,
  fantasyTeamSelectionPlayers,
  fantasyTeamSelections,
  fixtures,
} from "@/db/schema";
import {
  refreshOverallLeagueStandings,
  type LeagueStandingsDatabase,
} from "./league-standings-service.ts";
import { lockFantasySeason } from "./season-lock";
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
  const target = await database.query.fantasyGameweeks.findFirst({
    where: eq(fantasyGameweeks.id, fantasyGameweekId),
  });
  if (!target) throw new Error("Fantasy Gameweek was not found.");
  const season = await lockFantasySeason(database, target.fantasySeasonId);
  const gameweek = await database.query.fantasyGameweeks.findFirst({
    where: eq(fantasyGameweeks.id, fantasyGameweekId),
  });
  if (!gameweek) throw new Error("Fantasy Gameweek was not found.");
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
  const allMembers = selections.length
    ? await database
        .select()
        .from(fantasyTeamSelectionPlayers)
        .where(
          inArray(
            fantasyTeamSelectionPlayers.selectionId,
            selections.map((selection) => selection.id),
          ),
        )
    : [];
  const membersBySelection = Map.groupBy(
    allMembers,
    (member) => member.selectionId,
  );
  const playerResults = [...resultByPlayer.values()];
  const scoreValues: Array<typeof fantasyTeamGameweekScores.$inferInsert> = [];
  const scoredTeams: Array<{ playerCount: number; totalPoints: number }> = [];
  for (const selection of selections) {
    const members = membersBySelection.get(selection.id) ?? [];
    const score = resolveTeamScore({
      selection: members.map((member) => ({
        playerId: member.fantasyPlayerId,
        position: member.positionSnapshot as
          "goalkeeper" | "defender" | "midfielder" | "forward",
        lineupRole: member.lineupRole,
        benchOrder: member.benchOrder,
        captainRole: member.captainRole,
      })),
      playerResults,
      activeChip: selection.activeChip,
      transferPoints: selection.transferPoints,
    });
    scoredTeams.push({
      playerCount: members.length,
      totalPoints: score.totalPoints,
    });
    scoreValues.push({
      selectionId: selection.id,
      status: gameweek.scoreComplete ? "final" : "provisional",
      lineupPoints: score.lineupPoints,
      benchPoints: score.benchPoints,
      captainBonus: score.captainBonus,
      transferPoints: score.transferPoints,
      totalPoints: score.totalPoints,
      autoSubstitutions: score.autoSubstitutions,
      computedAt: new Date(),
    });
  }
  for (let offset = 0; offset < scoreValues.length; offset += 500) {
    await database
      .insert(fantasyTeamGameweekScores)
      .values(scoreValues.slice(offset, offset + 500))
      .onConflictDoUpdate({
        target: fantasyTeamGameweekScores.selectionId,
        set: {
          status: sql`excluded.status`,
          lineupPoints: sql`excluded.lineup_points`,
          benchPoints: sql`excluded.bench_points`,
          captainBonus: sql`excluded.captain_bonus`,
          transferPoints: sql`excluded.transfer_points`,
          totalPoints: sql`excluded.total_points`,
          autoSubstitutions: sql`excluded.auto_substitutions`,
          computedAt: sql`excluded.computed_at`,
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
