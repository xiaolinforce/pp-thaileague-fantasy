import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { transactionDb } from "@/db/transaction";
import {
  fantasyGameweeks,
  fantasyLeagueMembers,
  fantasyLeagues,
  fantasyLeagueStandings,
  fantasyTeamGameweekScores,
  fantasyTeamSelections,
  fantasyTeams,
} from "@/db/schema";
import { rankLeagueStandings } from "./leagues.ts";

export type LeagueStandingsDatabase = Pick<
  typeof transactionDb,
  "select" | "insert" | "delete"
>;

const STANDINGS_WRITE_BATCH_SIZE = 500;

export async function refreshOverallLeagueStandings(
  fantasySeasonId: string,
  database: LeagueStandingsDatabase,
) {
  const latestGameweekRows = await database
    .select({
      id: fantasyGameweeks.id,
      number: fantasyGameweeks.number,
      scoreComplete: fantasyGameweeks.scoreComplete,
    })
    .from(fantasyGameweeks)
    .where(
      and(
        eq(fantasyGameweeks.fantasySeasonId, fantasySeasonId),
        inArray(fantasyGameweeks.status, ["provisional", "final"]),
      ),
    )
    .orderBy(desc(fantasyGameweeks.number))
    .limit(1);
  const latestGameweek = latestGameweekRows[0];
  if (!latestGameweek) {
    return { leagues: 0, standings: 0, throughGameweekNumber: null };
  }

  const leagueRows = await database
    .select({ id: fantasyLeagues.id })
    .from(fantasyLeagues)
    .where(
      and(
        eq(fantasyLeagues.fantasySeasonId, fantasySeasonId),
        eq(fantasyLeagues.type, "overall"),
      ),
    );
  const leagueIds = leagueRows.map((league) => league.id);
  if (leagueIds.length === 0) {
    return {
      leagues: 0,
      standings: 0,
      throughGameweekNumber: latestGameweek.number,
    };
  }

  const memberRows = await database
    .select({
      leagueId: fantasyLeagueMembers.fantasyLeagueId,
      teamId: fantasyTeams.id,
      teamName: fantasyTeams.name,
    })
    .from(fantasyLeagueMembers)
    .innerJoin(
      fantasyTeams,
      eq(fantasyLeagueMembers.fantasyTeamId, fantasyTeams.id),
    )
    .where(inArray(fantasyLeagueMembers.fantasyLeagueId, leagueIds));
  const teamIds = [...new Set(memberRows.map((row) => row.teamId))];
  const scoreRows = teamIds.length
    ? await database
        .select({
          teamId: fantasyTeamSelections.fantasyTeamId,
          totalPoints: sql<number>`coalesce(sum(${fantasyTeamGameweekScores.totalPoints}), 0)::int`,
          gameweekPoints: sql<number>`coalesce(sum(case when ${fantasyTeamSelections.fantasyGameweekId} = ${latestGameweek.id} then ${fantasyTeamGameweekScores.totalPoints} else 0 end), 0)::int`,
          transferCount: sql<number>`coalesce(sum(case when ${fantasyTeamSelections.status} = 'locked' and ${fantasyTeamSelections.activeChip} is distinct from 'wildcard' then ${fantasyTeamSelections.netTransferCount} else 0 end), 0)::int`,
        })
        .from(fantasyTeamSelections)
        .leftJoin(
          fantasyTeamGameweekScores,
          eq(fantasyTeamSelections.id, fantasyTeamGameweekScores.selectionId),
        )
        .where(inArray(fantasyTeamSelections.fantasyTeamId, teamIds))
        .groupBy(fantasyTeamSelections.fantasyTeamId)
    : [];
  const scoreByTeam = new Map(scoreRows.map((row) => [row.teamId, row]));
  const computedAt = new Date();
  const standings = leagueIds.flatMap((leagueId) =>
    rankLeagueStandings(
      memberRows
        .filter((member) => member.leagueId === leagueId)
        .map((member) => {
          const score = scoreByTeam.get(member.teamId);
          return {
            ...member,
            totalPoints: score?.totalPoints ?? 0,
            gameweekPoints: score?.gameweekPoints ?? 0,
            transferCount: score?.transferCount ?? 0,
          };
        }),
    ).map((standing) => ({
      fantasyLeagueId: standing.leagueId,
      fantasyTeamId: standing.teamId,
      throughGameweekId: latestGameweek.id,
      status: latestGameweek.scoreComplete
        ? ("final" as const)
        : ("provisional" as const),
      rank: standing.rank,
      gameweekPoints: standing.gameweekPoints,
      totalPoints: standing.totalPoints,
      transferCount: standing.transferCount,
      computedAt,
    })),
  );

  await database
    .delete(fantasyLeagueStandings)
    .where(inArray(fantasyLeagueStandings.fantasyLeagueId, leagueIds));
  for (
    let offset = 0;
    offset < standings.length;
    offset += STANDINGS_WRITE_BATCH_SIZE
  ) {
    await database
      .insert(fantasyLeagueStandings)
      .values(standings.slice(offset, offset + STANDINGS_WRITE_BATCH_SIZE));
  }

  return {
    leagues: leagueIds.length,
    standings: standings.length,
    throughGameweekNumber: latestGameweek.number,
  };
}
