import "server-only";

import { and, asc, count, eq, inArray, lte, sql } from "drizzle-orm";
import { connection } from "next/server";

import { db } from "@/db";
import {
  fantasyLeagueMembers,
  fantasyLeagues,
  fantasyLeagueStandings,
  fantasyTeamGameweekScores,
  fantasyTeamSelections,
  fantasyTeams,
} from "@/db/schema";
import { requireFantasyProfile } from "@/lib/auth/context";
import {
  LEAGUE_STANDINGS_PAGE_SIZE,
  OVERALL_STANDINGS_LIMIT,
  PRIVATE_LEAGUE_MEMBER_LIMIT,
  PRIVATE_LEAGUE_MEMBERSHIP_LIMIT,
  PRIVATE_LEAGUE_OWNER_LIMIT,
  rankLeagueStandings,
} from "@/lib/fantasy/leagues";

export type LeagueStanding = {
  teamId: string;
  teamName: string;
  joinedAt: string;
  gameweekPoints: number;
  totalPoints: number;
  transferCount: number;
  rank: number;
  mine: boolean;
  owner: boolean;
};

type LeagueRow = typeof fantasyLeagues.$inferSelect;

async function getStandingsForLeagues(input: {
  leagues: LeagueRow[];
  currentTeamId: string;
  gameweekId: string;
}) {
  const leagueIds = input.leagues.map((league) => league.id);
  if (leagueIds.length === 0) return new Map<string, LeagueStanding[]>();

  const memberRows = await db
    .select({
      leagueId: fantasyLeagueMembers.fantasyLeagueId,
      joinedAt: fantasyLeagueMembers.joinedAt,
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
    ? await db
        .select({
          teamId: fantasyTeamSelections.fantasyTeamId,
          totalPoints: sql<number>`coalesce(sum(${fantasyTeamGameweekScores.totalPoints}), 0)::int`,
          gameweekPoints: sql<number>`coalesce(sum(case when ${fantasyTeamSelections.fantasyGameweekId} = ${input.gameweekId} then ${fantasyTeamGameweekScores.totalPoints} else 0 end), 0)::int`,
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
  const leagueById = new Map(
    input.leagues.map((league) => [league.id, league]),
  );
  const standingsByLeague = new Map<string, LeagueStanding[]>();

  for (const leagueId of leagueIds) {
    const league = leagueById.get(leagueId)!;
    const standings = rankLeagueStandings(
      memberRows
        .filter((row) => row.leagueId === leagueId)
        .map((row) => {
          const score = scoreByTeam.get(row.teamId);
          return {
            teamId: row.teamId,
            teamName: row.teamName,
            joinedAt: row.joinedAt.toISOString(),
            gameweekPoints: score?.gameweekPoints ?? 0,
            totalPoints: score?.totalPoints ?? 0,
            transferCount: score?.transferCount ?? 0,
            mine: row.teamId === input.currentTeamId,
            owner: row.teamId === league.ownerTeamId,
          };
        }),
    );
    standingsByLeague.set(leagueId, standings);
  }
  return standingsByLeague;
}

export async function getLeagueOverview() {
  await connection();
  const profile = await requireFantasyProfile();
  const leagueRows = await db
    .select({ league: fantasyLeagues })
    .from(fantasyLeagueMembers)
    .innerJoin(
      fantasyLeagues,
      eq(fantasyLeagueMembers.fantasyLeagueId, fantasyLeagues.id),
    )
    .where(
      and(
        eq(fantasyLeagueMembers.fantasyTeamId, profile.team.id),
        eq(fantasyLeagues.fantasySeasonId, profile.season.id),
      ),
    );
  const leagues = leagueRows.map((row) => row.league);
  const overallLeague = leagues.find((league) => league.type === "overall");
  const privateLeagueRows = leagues.filter(
    (league) => league.type === "private",
  );
  const [standingsByLeague, overallMemberCountRows, overallStandingRows] =
    await Promise.all([
      getStandingsForLeagues({
        leagues: privateLeagueRows,
        currentTeamId: profile.team.id,
        gameweekId: profile.gameweek.id,
      }),
      overallLeague
        ? db
            .select({ count: count() })
            .from(fantasyLeagueMembers)
            .where(eq(fantasyLeagueMembers.fantasyLeagueId, overallLeague.id))
        : Promise.resolve([]),
      overallLeague
        ? db
            .select()
            .from(fantasyLeagueStandings)
            .where(
              and(
                eq(fantasyLeagueStandings.fantasyLeagueId, overallLeague.id),
                eq(fantasyLeagueStandings.fantasyTeamId, profile.team.id),
              ),
            )
            .limit(1)
        : Promise.resolve([]),
    ]);
  const overallStanding = overallStandingRows[0];
  const overall = overallLeague
    ? {
        id: overallLeague.id,
        name: overallLeague.name,
        type: overallLeague.type,
        memberCount: overallMemberCountRows[0]?.count ?? 0,
        rank: overallStanding?.rank ?? null,
        gameweekPoints: overallStanding?.gameweekPoints ?? 0,
        totalPoints: overallStanding?.totalPoints ?? 0,
        isOwner: false,
        updatedAt: (
          overallStanding?.computedAt ?? overallLeague.updatedAt
        ).toISOString(),
      }
    : null;
  const summaries = privateLeagueRows.map((league) => {
    const standings = standingsByLeague.get(league.id) ?? [];
    const mine = standings.find((standing) => standing.mine);
    return {
      id: league.id,
      name: league.name,
      type: league.type,
      memberCount: standings.length,
      rank: mine?.rank ?? null,
      gameweekPoints: mine?.gameweekPoints ?? 0,
      totalPoints: mine?.totalPoints ?? 0,
      isOwner: league.ownerTeamId === profile.team.id,
      updatedAt: league.updatedAt.toISOString(),
    };
  });
  const privateLeagues = summaries
    .filter((league) => league.type === "private")
    .sort(
      (a, b) =>
        Number(b.isOwner) - Number(a.isOwner) ||
        b.updatedAt.localeCompare(a.updatedAt),
    );

  return {
    isGuest: profile.isAnonymous,
    teamId: profile.team.id,
    gameweek: {
      number: profile.gameweek.number,
      scoreComplete: profile.gameweek.scoreComplete,
    },
    overall,
    privateLeagues,
    limits: {
      owned: privateLeagues.filter((league) => league.isOwner).length,
      memberships: privateLeagues.length,
      ownerLimit: PRIVATE_LEAGUE_OWNER_LIMIT,
      membershipLimit: PRIVATE_LEAGUE_MEMBERSHIP_LIMIT,
      memberLimit: PRIVATE_LEAGUE_MEMBER_LIMIT,
    },
  };
}

export async function getLeagueDetail(leagueId: string, requestedPage = 1) {
  await connection();
  const profile = await requireFantasyProfile();
  const rows = await db
    .select({ league: fantasyLeagues })
    .from(fantasyLeagueMembers)
    .innerJoin(
      fantasyLeagues,
      eq(fantasyLeagueMembers.fantasyLeagueId, fantasyLeagues.id),
    )
    .where(
      and(
        eq(fantasyLeagueMembers.fantasyTeamId, profile.team.id),
        eq(fantasyLeagues.id, leagueId),
        eq(fantasyLeagues.fantasySeasonId, profile.season.id),
      ),
    )
    .limit(1);
  const league = rows[0]?.league;
  if (!league) return null;
  if (league.type === "overall") {
    const [memberCountRows, standingRows] = await Promise.all([
      db
        .select({ count: count() })
        .from(fantasyLeagueMembers)
        .where(eq(fantasyLeagueMembers.fantasyLeagueId, league.id)),
      db
        .select({
          teamId: fantasyTeams.id,
          teamName: fantasyTeams.name,
          joinedAt: fantasyLeagueMembers.joinedAt,
          gameweekPoints: fantasyLeagueStandings.gameweekPoints,
          totalPoints: fantasyLeagueStandings.totalPoints,
          transferCount: fantasyLeagueStandings.transferCount,
          rank: fantasyLeagueStandings.rank,
        })
        .from(fantasyLeagueStandings)
        .innerJoin(
          fantasyTeams,
          eq(fantasyLeagueStandings.fantasyTeamId, fantasyTeams.id),
        )
        .innerJoin(
          fantasyLeagueMembers,
          and(
            eq(
              fantasyLeagueStandings.fantasyLeagueId,
              fantasyLeagueMembers.fantasyLeagueId,
            ),
            eq(
              fantasyLeagueStandings.fantasyTeamId,
              fantasyLeagueMembers.fantasyTeamId,
            ),
          ),
        )
        .where(
          and(
            eq(fantasyLeagueStandings.fantasyLeagueId, league.id),
            lte(fantasyLeagueStandings.rank, OVERALL_STANDINGS_LIMIT),
          ),
        )
        .orderBy(asc(fantasyLeagueStandings.rank)),
    ]);
    return {
      id: league.id,
      name: league.name,
      type: league.type,
      inviteCode: null,
      memberCount: memberCountRows[0]?.count ?? 0,
      isOwner: false,
      myStanding: null,
      standings: standingRows.map((standing) => ({
        ...standing,
        joinedAt: standing.joinedAt.toISOString(),
        mine: false,
        owner: false,
      })),
      pagination: {
        page: 1,
        pageCount: 1,
        pageSize: OVERALL_STANDINGS_LIMIT,
      },
      gameweek: {
        number: profile.gameweek.number,
        scoreComplete: profile.gameweek.scoreComplete,
      },
    };
  }
  const standings =
    (
      await getStandingsForLeagues({
        leagues: [league],
        currentTeamId: profile.team.id,
        gameweekId: profile.gameweek.id,
      })
    ).get(league.id) ?? [];
  const pageCount = Math.max(
    1,
    Math.ceil(standings.length / LEAGUE_STANDINGS_PAGE_SIZE),
  );
  const page = Math.min(
    pageCount,
    Math.max(1, Number.isInteger(requestedPage) ? requestedPage : 1),
  );
  const pageStart = (page - 1) * LEAGUE_STANDINGS_PAGE_SIZE;

  return {
    id: league.id,
    name: league.name,
    type: league.type,
    inviteCode:
      league.type === "private" && league.ownerTeamId === profile.team.id
        ? league.inviteCode
        : null,
    memberCount: standings.length,
    isOwner: league.ownerTeamId === profile.team.id,
    myStanding: standings.find((standing) => standing.mine) ?? null,
    standings: standings.slice(
      pageStart,
      pageStart + LEAGUE_STANDINGS_PAGE_SIZE,
    ),
    pagination: { page, pageCount, pageSize: LEAGUE_STANDINGS_PAGE_SIZE },
    gameweek: {
      number: profile.gameweek.number,
      scoreComplete: profile.gameweek.scoreComplete,
    },
  };
}

export async function getPrivateLeagueInvitePreview(
  inviteCode: string,
  currentTeamId: string,
  seasonId: string,
) {
  const rows = await db
    .select({
      id: fantasyLeagues.id,
      name: fantasyLeagues.name,
      ownerTeamId: fantasyLeagues.ownerTeamId,
      memberCount: sql<number>`count(${fantasyLeagueMembers.id})::int`,
    })
    .from(fantasyLeagues)
    .leftJoin(
      fantasyLeagueMembers,
      eq(fantasyLeagueMembers.fantasyLeagueId, fantasyLeagues.id),
    )
    .where(
      and(
        eq(fantasyLeagues.fantasySeasonId, seasonId),
        eq(fantasyLeagues.type, "private"),
        eq(fantasyLeagues.inviteCode, inviteCode),
      ),
    )
    .groupBy(fantasyLeagues.id)
    .limit(1);
  const league = rows[0];
  if (!league) return null;
  const membership = await db
    .select({ id: fantasyLeagueMembers.id })
    .from(fantasyLeagueMembers)
    .where(
      and(
        eq(fantasyLeagueMembers.fantasyLeagueId, league.id),
        eq(fantasyLeagueMembers.fantasyTeamId, currentTeamId),
      ),
    )
    .limit(1);
  return {
    id: league.id,
    name: league.name,
    memberCount: league.memberCount,
    alreadyMember: Boolean(membership[0]),
    full: league.memberCount >= PRIVATE_LEAGUE_MEMBER_LIMIT,
  };
}
