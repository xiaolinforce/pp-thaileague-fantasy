import { loadEnvConfig } from "@next/env";
import { and, asc, count, eq, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import {
  fantasyGameweeks,
  fantasyLeagueMembers,
  fantasyLeagues,
  fantasyManagers,
  fantasyPlayers,
  fantasyPlayerRankings,
  fantasyPlayerTiers,
  fantasyRankingRuns,
  fantasySeasons,
  fantasyTeams,
  fantasyTeamGameweekScores,
  fantasyTeamSelectionPlayers,
  fantasyTeamSelections,
  fantasyTierDefinitions,
} from "../src/db/schema";
import { summarizeGameweekScores } from "../src/lib/fantasy/points-presentation";

loadEnvConfig(process.cwd());
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
const db = drizzle(databaseUrl);

const tables = {
  fantasySeasons,
  fantasyGameweeks,
  fantasyPlayers,
  fantasyPlayerTiers,
  fantasyRankingRuns,
  fantasyPlayerRankings,
  fantasyManagers,
  fantasyTeams,
  fantasyTeamSelections,
  fantasyTeamSelectionPlayers,
  fantasyTeamGameweekScores,
  fantasyTierDefinitions,
  fantasyLeagues,
  fantasyLeagueMembers,
};

async function verifyFantasyGame() {
  for (const [name, table] of Object.entries(tables)) {
    const result = await db.select({ count: count() }).from(table);
    console.log(`${name}: ${result[0].count}`);
  }

  const gameweekRows = await db
    .select({
      id: fantasyGameweeks.id,
      seasonId: fantasyGameweeks.fantasySeasonId,
      number: fantasyGameweeks.number,
      status: fantasyGameweeks.status,
      averagePoints: fantasyGameweeks.averagePoints,
      highestPoints: fantasyGameweeks.highestPoints,
    })
    .from(fantasyGameweeks)
    .orderBy(
      asc(fantasyGameweeks.fantasySeasonId),
      asc(fantasyGameweeks.number),
    );
  for (const season of await db.select().from(fantasySeasons)) {
    const seasonGameweeks = gameweekRows.filter(
      (gameweek) => gameweek.seasonId === season.id,
    );
    if (
      seasonGameweeks.length !== 30 ||
      seasonGameweeks.some((gameweek, index) => gameweek.number !== index + 1)
    ) {
      throw new Error(
        `Fantasy season ${season.slug} must contain contiguous Gameweeks 1-30.`,
      );
    }
    const openGameweekCount = seasonGameweeks.filter(
      (gameweek) => gameweek.status === "open",
    ).length;
    const hasPlannedGameweek = seasonGameweeks.some(
      (gameweek) => gameweek.status === "planned",
    );
    if (
      openGameweekCount > 1 ||
      (openGameweekCount === 0 && hasPlannedGameweek)
    ) {
      throw new Error(
        `Fantasy season ${season.slug} must have one open Gameweek until its schedule is exhausted.`,
      );
    }
  }

  const [scoreRows, nonEmptySelectionRows] = await Promise.all([
    db
      .select({
        gameweekId: fantasyTeamSelections.fantasyGameweekId,
        selectionId: fantasyTeamSelections.id,
        totalPoints: fantasyTeamGameweekScores.totalPoints,
      })
      .from(fantasyTeamGameweekScores)
      .innerJoin(
        fantasyTeamSelections,
        eq(fantasyTeamGameweekScores.selectionId, fantasyTeamSelections.id),
      )
      .where(eq(fantasyTeamSelections.status, "locked")),
    db
      .selectDistinct({ selectionId: fantasyTeamSelectionPlayers.selectionId })
      .from(fantasyTeamSelectionPlayers),
  ]);
  const nonEmptySelectionIds = new Set(
    nonEmptySelectionRows.map((row) => row.selectionId),
  );
  for (const gameweek of gameweekRows) {
    const expected = summarizeGameweekScores(
      scoreRows
        .filter((score) => score.gameweekId === gameweek.id)
        .map((score) => ({
          playerCount: nonEmptySelectionIds.has(score.selectionId) ? 1 : 0,
          totalPoints: score.totalPoints,
        })),
    );
    if (
      gameweek.averagePoints !== expected.averagePoints ||
      gameweek.highestPoints !== expected.highestPoints
    ) {
      throw new Error(
        `Gameweek ${gameweek.number} score summary is stale: stored ${gameweek.averagePoints}/${gameweek.highestPoints}, expected ${expected.averagePoints}/${expected.highestPoints}.`,
      );
    }
  }

  const tierDefinitions = await db
    .select()
    .from(fantasyTierDefinitions)
    .orderBy(asc(fantasyTierDefinitions.level));
  const expectedTierSlots = [3, 3, 3, 6];
  if (
    tierDefinitions.length !== expectedTierSlots.length ||
    tierDefinitions.some(
      (definition, index) =>
        definition.level !== index + 1 ||
        definition.slotCount !== expectedTierSlots[index],
    )
  ) {
    throw new Error(
      "Fantasy tier definitions must be Level 1-4 with 3/3/3/6 slots.",
    );
  }

  const publishedRuns = await db
    .select()
    .from(fantasyRankingRuns)
    .where(eq(fantasyRankingRuns.status, "published"));
  const publishedBySeason = new Map<string, number>();
  for (const run of publishedRuns) {
    publishedBySeason.set(
      run.fantasySeasonId,
      (publishedBySeason.get(run.fantasySeasonId) ?? 0) + 1,
    );
  }
  if ([...publishedBySeason.values()].some((runCount) => runCount > 1)) {
    throw new Error("A Fantasy season has multiple published ranking runs.");
  }
  for (const run of publishedRuns) {
    const rankings = await db
      .select()
      .from(fantasyPlayerRankings)
      .where(eq(fantasyPlayerRankings.rankingRunId, run.id))
      .orderBy(asc(fantasyPlayerRankings.overallRank));
    if (rankings.length !== run.totalPlayers) {
      throw new Error(
        `Ranking ${run.version} has ${rankings.length}/${run.totalPlayers} rows.`,
      );
    }
    if (rankings.some((ranking, index) => ranking.overallRank !== index + 1)) {
      throw new Error(`Ranking ${run.version} is not contiguous from 1.`);
    }
    const tierOne = rankings.filter(
      (ranking) => ranking.tierLevel === 1,
    ).length;
    const tierTwo = rankings.filter(
      (ranking) => ranking.tierLevel === 2,
    ).length;
    const tierThree = rankings.filter(
      (ranking) => ranking.tierLevel === 3,
    ).length;
    const tierFour = rankings.filter(
      (ranking) => ranking.tierLevel === 4,
    ).length;
    if (
      tierOne !== run.levelOneCount ||
      tierTwo !== run.levelTwoCount ||
      tierThree !== run.levelThreeCount ||
      tierOne + tierTwo + tierThree + tierFour !== run.totalPlayers
    ) {
      throw new Error(
        `Ranking ${run.version} tier totals do not match its run.`,
      );
    }
    const effectiveTierRows = await db
      .select({ count: count() })
      .from(fantasyPlayerRankings)
      .innerJoin(
        fantasyPlayerTiers,
        and(
          eq(
            fantasyPlayerRankings.fantasyPlayerId,
            fantasyPlayerTiers.fantasyPlayerId,
          ),
          eq(fantasyPlayerTiers.effectiveGameweekId, run.effectiveGameweekId),
        ),
      )
      .where(eq(fantasyPlayerRankings.rankingRunId, run.id));
    if (effectiveTierRows[0].count !== rankings.length) {
      throw new Error(`Ranking ${run.version} is missing effective tier rows.`);
    }
    const inconsistentTiers = await db
      .select({ count: count() })
      .from(fantasyPlayerRankings)
      .innerJoin(
        fantasyPlayerTiers,
        and(
          eq(
            fantasyPlayerRankings.fantasyPlayerId,
            fantasyPlayerTiers.fantasyPlayerId,
          ),
          eq(fantasyPlayerTiers.effectiveGameweekId, run.effectiveGameweekId),
        ),
      )
      .where(
        and(
          eq(fantasyPlayerRankings.rankingRunId, run.id),
          ne(fantasyPlayerRankings.tierLevel, fantasyPlayerTiers.level),
        ),
      );
    if (inconsistentTiers[0].count !== 0) {
      throw new Error(`Ranking ${run.version} disagrees with effective tiers.`);
    }
    const staleDraftSnapshots = await db
      .select({ count: count() })
      .from(fantasyTeamSelectionPlayers)
      .innerJoin(
        fantasyTeamSelections,
        eq(fantasyTeamSelectionPlayers.selectionId, fantasyTeamSelections.id),
      )
      .innerJoin(
        fantasyPlayerRankings,
        and(
          eq(
            fantasyTeamSelectionPlayers.fantasyPlayerId,
            fantasyPlayerRankings.fantasyPlayerId,
          ),
          eq(fantasyPlayerRankings.rankingRunId, run.id),
        ),
      )
      .where(
        and(
          eq(fantasyTeamSelections.fantasyGameweekId, run.effectiveGameweekId),
          eq(fantasyTeamSelections.status, "draft"),
          ne(
            fantasyTeamSelectionPlayers.tierSnapshot,
            fantasyPlayerRankings.tierLevel,
          ),
        ),
      );
    if (staleDraftSnapshots[0].count !== 0) {
      throw new Error(
        `Ranking ${run.version} left stale tier snapshots in draft selections.`,
      );
    }
    console.log(
      `publishedRanking ${run.version}: ranks 1-${rankings.length}; L1=${tierOne}, L2=${tierTwo}, L3=${tierThree}, L4=${tierFour}`,
    );
  }
}

verifyFantasyGame().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
