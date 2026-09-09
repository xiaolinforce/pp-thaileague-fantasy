import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import {
  fantasyGameweeks,
  fantasyGameweekOptimalTeamPlayers,
  fantasyGameweekOptimalTeams,
  fantasyGameweekPlayerPool,
  fantasyPlayerMatchPoints,
  fantasyPlayerMatchStats,
  fixtures,
} from "@/db/schema";
import { transactionDb } from "@/db/transaction";
import {
  findOptimalTeam,
  OPTIMAL_TEAM_ALGORITHM_VERSION,
} from "./optimal-team";
import type { FantasyPosition } from "./rules";
import { lockFantasySeason } from "./season-lock";

type OptimalTeamDatabase = Pick<
  typeof transactionDb,
  "select" | "insert" | "delete"
>;

export type OptimalTeamPlayerResult = {
  playerId: string;
  minutes: number;
  points: number;
  breakdown: Record<string, number>;
};

export async function recalculateGameweekOptimalTeam(
  fantasyGameweekId: string,
  database?: OptimalTeamDatabase & Pick<typeof transactionDb, "query">,
) {
  if (!database) {
    return transactionDb.transaction((tx) =>
      recalculateGameweekOptimalTeamInTransaction(fantasyGameweekId, tx),
    );
  }
  return recalculateGameweekOptimalTeamInTransaction(
    fantasyGameweekId,
    database,
  );
}

async function recalculateGameweekOptimalTeamInTransaction(
  fantasyGameweekId: string,
  database: OptimalTeamDatabase & Pick<typeof transactionDb, "query">,
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
  if (gameweek.status !== "provisional" && gameweek.status !== "final") {
    return { state: "not_scored" } as const;
  }

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
          fantasyPlayerId: fantasyPlayerMatchStats.fantasyPlayerId,
          minutes: fantasyPlayerMatchStats.minutes,
          totalPoints: fantasyPlayerMatchPoints.totalPoints,
          breakdown: fantasyPlayerMatchPoints.breakdown,
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
  const resultByPlayer = new Map<string, OptimalTeamPlayerResult>();
  for (const row of pointRows) {
    const result = resultByPlayer.get(row.fantasyPlayerId) ?? {
      playerId: row.fantasyPlayerId,
      minutes: 0,
      points: 0,
      breakdown: {},
    };
    result.minutes += row.minutes;
    result.points += row.totalPoints;
    for (const [key, value] of Object.entries(row.breakdown)) {
      result.breakdown[key] = (result.breakdown[key] ?? 0) + value;
    }
    resultByPlayer.set(row.fantasyPlayerId, result);
  }

  return persistGameweekOptimalTeam({
    database,
    gameweek,
    playerResults: [...resultByPlayer.values()],
  });
}

export async function persistGameweekOptimalTeam({
  database,
  gameweek,
  playerResults,
}: {
  database: OptimalTeamDatabase;
  gameweek: {
    id: string;
    fantasySeasonId: string;
    status: "planned" | "open" | "locked" | "provisional" | "final";
    scoreComplete: boolean;
  };
  playerResults: OptimalTeamPlayerResult[];
}) {
  const pool = await database
    .select()
    .from(fantasyGameweekPlayerPool)
    .where(eq(fantasyGameweekPlayerPool.fantasyGameweekId, gameweek.id));

  const resultByPlayer = new Map(
    playerResults.map((result) => [result.playerId, result]),
  );
  const optimal = findOptimalTeam(
    pool.map((member) => {
      const result = resultByPlayer.get(member.fantasyPlayerId);
      return {
        id: member.fantasyPlayerId,
        clubId: member.clubIdSnapshot,
        position: member.positionSnapshot as FantasyPosition,
        tier: member.tierSnapshot,
        isThai: member.isThaiSnapshot,
        minutes: result?.minutes ?? 0,
        points: result?.points ?? 0,
      };
    }),
  );

  if (!optimal || pool.length === 0) {
    await database
      .delete(fantasyGameweekOptimalTeams)
      .where(eq(fantasyGameweekOptimalTeams.fantasyGameweekId, gameweek.id));
    return {
      state: pool.length === 0 ? "missing_pool" : "no_legal_team",
    } as const;
  }

  const computedAt = new Date();
  const [saved] = await database
    .insert(fantasyGameweekOptimalTeams)
    .values({
      fantasySeasonId: gameweek.fantasySeasonId,
      fantasyGameweekId: gameweek.id,
      status: gameweek.scoreComplete ? "final" : "provisional",
      lineupPoints: optimal.score.lineupPoints,
      benchPoints: optimal.score.benchPoints,
      captainBonus: optimal.score.captainBonus,
      totalPoints: optimal.score.totalPoints,
      autoSubstitutions: optimal.score.autoSubstitutions,
      countedPlayerIds: optimal.score.countedPlayerIds,
      playerPoolSize: pool.length,
      playerPoolSource: pool[0].sourceName,
      algorithmVersion: OPTIMAL_TEAM_ALGORITHM_VERSION,
      computedAt,
    })
    .onConflictDoUpdate({
      target: fantasyGameweekOptimalTeams.fantasyGameweekId,
      set: {
        status: sql`excluded.status`,
        lineupPoints: sql`excluded.lineup_points`,
        benchPoints: sql`excluded.bench_points`,
        captainBonus: sql`excluded.captain_bonus`,
        totalPoints: sql`excluded.total_points`,
        autoSubstitutions: sql`excluded.auto_substitutions`,
        countedPlayerIds: sql`excluded.counted_player_ids`,
        playerPoolSize: sql`excluded.player_pool_size`,
        playerPoolSource: sql`excluded.player_pool_source`,
        algorithmVersion: sql`excluded.algorithm_version`,
        computedAt: sql`excluded.computed_at`,
        updatedAt: computedAt,
      },
    })
    .returning({ id: fantasyGameweekOptimalTeams.id });

  await database
    .delete(fantasyGameweekOptimalTeamPlayers)
    .where(eq(fantasyGameweekOptimalTeamPlayers.optimalTeamId, saved.id));
  await database.insert(fantasyGameweekOptimalTeamPlayers).values(
    optimal.members.map((member) => {
      const result = resultByPlayer.get(member.id);
      return {
        optimalTeamId: saved.id,
        fantasyGameweekId: gameweek.id,
        fantasyPlayerId: member.id,
        lineupRole: member.lineupRole,
        benchOrder: member.benchOrder,
        captainRole: member.captainRole,
        minutes: result?.minutes ?? 0,
        totalPoints: result?.points ?? 0,
        breakdown:
          result?.breakdown ??
          (gameweek.scoreComplete ? { appearance: 0 } : {}),
      };
    }),
  );

  return {
    state: "ready",
    players: optimal.members.length,
    totalPoints: optimal.score.totalPoints,
  } as const;
}
