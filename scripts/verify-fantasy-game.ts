import { loadEnvConfig } from "@next/env";
import { and, asc, count, eq, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import {
  fantasyGameweeks,
  fantasyLeagueAuditLog,
  fantasyLeagueMembers,
  fantasyLeagues,
  fantasyLeagueStandings,
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
  fantasyLeagueStandings,
  fantasyLeagueAuditLog,
};

async function verifyFantasyGame() {
  for (const [name, table] of Object.entries(tables)) {
    const result = await db.select({ count: count() }).from(table);
    console.log(`${name}: ${result[0].count}`);
  }

  const leagueIntegrity = await db.execute<{
    seeded_managers: number;
    invalid_bot_identities: number;
    duplicate_team_names: number;
    missing_overall_leagues: number;
    teams_missing_overall: number;
    private_owners_missing_membership: number;
    cross_season_memberships: number;
    private_leagues_over_member_limit: number;
    teams_over_membership_limit: number;
    teams_over_owner_limit: number;
    invalid_standing_memberships: number;
    cross_season_standings: number;
    non_contiguous_standing_ranks: number;
    mixed_standing_gameweeks: number;
  }>(sql`
    select
      (select count(*)::int from fantasy_managers where status = 'seeded') as seeded_managers,
      (select count(*)::int from fantasy_managers
       where (is_bot and (status::text <> 'bot' or auth_user_id is not null
         or bot_key is null or length(trim(bot_key)) = 0
         or bot_batch_key is null or length(trim(bot_batch_key)) = 0))
         or (not is_bot and (status::text = 'bot' or bot_key is not null
         or bot_batch_key is not null))) as invalid_bot_identities,
      (
        select count(*)::int from (
          select fantasy_season_id, lower(name)
          from fantasy_teams
          group by fantasy_season_id, lower(name)
          having count(*) > 1
        ) duplicates
      ) as duplicate_team_names,
      (
        select count(*)::int
        from fantasy_seasons season
        where not exists (
          select 1 from fantasy_leagues league
          where league.fantasy_season_id = season.id and league.type = 'overall'
        )
      ) as missing_overall_leagues,
      (
        select count(*)::int
        from fantasy_teams team
        where not exists (
          select 1
          from fantasy_leagues league
          inner join fantasy_league_members member
            on member.fantasy_league_id = league.id
          where league.fantasy_season_id = team.fantasy_season_id
            and league.type = 'overall'
            and member.fantasy_team_id = team.id
        )
      ) as teams_missing_overall,
      (
        select count(*)::int
        from fantasy_leagues league
        where league.type = 'private'
          and not exists (
            select 1 from fantasy_league_members member
            where member.fantasy_league_id = league.id
              and member.fantasy_team_id = league.owner_team_id
          )
      ) as private_owners_missing_membership,
      (
        select count(*)::int
        from fantasy_league_members member
        inner join fantasy_leagues league on league.id = member.fantasy_league_id
        inner join fantasy_teams team on team.id = member.fantasy_team_id
        where league.fantasy_season_id <> team.fantasy_season_id
      ) as cross_season_memberships,
      (
        select count(*)::int from (
          select member.fantasy_league_id
          from fantasy_league_members member
          inner join fantasy_leagues league on league.id = member.fantasy_league_id
          where league.type = 'private'
          group by member.fantasy_league_id
          having count(*) > 100
        ) oversized_leagues
      ) as private_leagues_over_member_limit,
      (
        select count(*)::int from (
          select member.fantasy_team_id
          from fantasy_league_members member
          inner join fantasy_leagues league on league.id = member.fantasy_league_id
          where league.type = 'private'
          group by member.fantasy_team_id
          having count(*) > 20
        ) oversized_memberships
      ) as teams_over_membership_limit,
      (
        select count(*)::int from (
          select league.owner_team_id
          from fantasy_leagues league
          where league.type = 'private'
          group by league.owner_team_id
          having count(*) > 10
        ) oversized_ownerships
      ) as teams_over_owner_limit,
      (
        select count(*)::int
        from fantasy_league_standings standing
        where not exists (
          select 1 from fantasy_league_members member
          where member.fantasy_league_id = standing.fantasy_league_id
            and member.fantasy_team_id = standing.fantasy_team_id
        )
      ) as invalid_standing_memberships,
      (
        select count(*)::int
        from fantasy_league_standings standing
        inner join fantasy_leagues league on league.id = standing.fantasy_league_id
        inner join fantasy_teams team on team.id = standing.fantasy_team_id
        inner join fantasy_gameweeks gameweek on gameweek.id = standing.through_gameweek_id
        where league.fantasy_season_id <> team.fantasy_season_id
          or league.fantasy_season_id <> gameweek.fantasy_season_id
      ) as cross_season_standings,
      (
        select count(*)::int from (
          select fantasy_league_id
          from fantasy_league_standings
          group by fantasy_league_id
          having min(rank) <> 1 or max(rank) <> count(*)
        ) invalid_ranks
      ) as non_contiguous_standing_ranks,
      (
        select count(*)::int from (
          select fantasy_league_id
          from fantasy_league_standings
          group by fantasy_league_id
          having count(distinct through_gameweek_id) > 1
        ) mixed_gameweeks
      ) as mixed_standing_gameweeks
  `);
  const leagueIssues = leagueIntegrity.rows[0];
  if (!leagueIssues) throw new Error("League integrity query returned no row.");
  const failedLeagueChecks = Object.entries(leagueIssues).filter(
    ([, value]) => Number(value) !== 0,
  );
  if (failedLeagueChecks.length > 0) {
    throw new Error(
      `League integrity failed: ${failedLeagueChecks
        .map(([name, value]) => `${name}=${value}`)
        .join(", ")}.`,
    );
  }
  console.log(
    "leagueIntegrity: unique seasonal team names; memberships and persisted standings verified",
  );

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
  const expectedTierSlots = [3, 3, 6, 3];
  if (
    tierDefinitions.length !== expectedTierSlots.length ||
    tierDefinitions.some(
      (definition, index) =>
        definition.level !== index + 1 ||
        definition.slotCount !== expectedTierSlots[index],
    )
  ) {
    throw new Error(
      "Fantasy tier definitions must be Level 1-4 with 3/3/6/3 slots.",
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
