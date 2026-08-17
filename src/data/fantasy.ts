import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";
import { connection } from "next/server";

import { db } from "@/db";
import {
  fantasyGameweeks,
  fantasyLeagueMembers,
  fantasyLeagues,
  fantasyManagers,
  fantasyPlayerMatchPoints,
  fantasyPlayerMatchStats,
  fantasySeasons,
  fantasyTeamGameweekScores,
  fantasyTransferRevisions,
  fantasyTeamSelectionPlayers,
  fantasyTeamSelections,
  fantasyTeams,
  fixtures,
} from "@/db/schema";
import type { FantasyChip } from "@/lib/fantasy/rules";

const FANTASY_SEASON_SLUG = "thai-league-1-2026-27";
const DEMO_MANAGER_NAME = "Piyawat K.";

export type DemoSquadMember = {
  fantasyPlayerId: string;
  clubId: string;
  position: "goalkeeper" | "defender" | "midfielder" | "forward";
  tier: number;
  isThai: boolean;
  lineupRole: "starter" | "bench";
  benchOrder: number | null;
  captainRole: "none" | "captain" | "vice_captain";
};

export type ClassicStanding = {
  teamId: string;
  teamName: string;
  managerName: string;
  gameweekPoints: number;
  totalPoints: number;
  transferCount: number;
  rank: number;
  mine: boolean;
};

export type DemoFantasyState = {
  seasonId: string;
  team: {
    id: string;
    name: string;
    managerName: string;
    freeTransfers: number;
  };
  gameweek: {
    id: string;
    number: number;
    deadlineAt: string;
    status: string;
    scoreComplete: boolean;
  };
  selection: {
    id: string;
    status: "draft" | "locked";
    activeChip: FantasyChip | null;
    hasPendingChanges: boolean;
    netTransferCount: number;
    transferPoints: number;
    members: DemoSquadMember[];
  };
  chipsRemaining: Record<FantasyChip, number>;
  leagues: Array<{
    id: string;
    name: string;
    type: "overall" | "private";
    inviteCode: string | null;
    standings: ClassicStanding[];
  }>;
};

export async function getDemoFantasyState(): Promise<DemoFantasyState> {
  await connection();

  const fantasySeason = await db.query.fantasySeasons.findFirst({
    where: eq(fantasySeasons.slug, FANTASY_SEASON_SLUG),
  });
  if (!fantasySeason) throw new Error("Fantasy season has not been seeded.");

  const gameweeks = await db
    .select()
    .from(fantasyGameweeks)
    .where(eq(fantasyGameweeks.fantasySeasonId, fantasySeason.id))
    .orderBy(asc(fantasyGameweeks.number));
  const gameweek =
    gameweeks.find((item) => item.status === "open") ??
    gameweeks.find((item) => item.status === "planned") ??
    gameweeks.at(-1);
  if (!gameweek) throw new Error("Fantasy Gameweeks have not been seeded.");

  const teamRows = await db
    .select({ team: fantasyTeams, manager: fantasyManagers })
    .from(fantasyTeams)
    .innerJoin(fantasyManagers, eq(fantasyTeams.managerId, fantasyManagers.id))
    .where(
      and(
        eq(fantasyTeams.fantasySeasonId, fantasySeason.id),
        eq(fantasyManagers.displayName, DEMO_MANAGER_NAME),
      ),
    )
    .limit(1);
  const demo = teamRows[0];
  if (!demo) throw new Error("Demo fantasy team has not been seeded.");

  const selection = await db.query.fantasyTeamSelections.findFirst({
    where: and(
      eq(fantasyTeamSelections.fantasyTeamId, demo.team.id),
      eq(fantasyTeamSelections.fantasyGameweekId, gameweek.id),
    ),
  });
  if (!selection) throw new Error("Demo team selection has not been seeded.");

  const members = await db
    .select()
    .from(fantasyTeamSelectionPlayers)
    .where(eq(fantasyTeamSelectionPlayers.selectionId, selection.id));
  const revisions = await db
    .select()
    .from(fantasyTransferRevisions)
    .where(eq(fantasyTransferRevisions.selectionId, selection.id))
    .orderBy(asc(fantasyTransferRevisions.revision));
  const baselineRevision = revisions[0]?.revision ?? 0;
  const hasPendingChanges = revisions.some(
    (revision) =>
      revision.revision > baselineRevision && revision.status === "confirmed",
  );

  const allSelections = await db
    .select()
    .from(fantasyTeamSelections)
    .innerJoin(
      fantasyTeams,
      eq(fantasyTeamSelections.fantasyTeamId, fantasyTeams.id),
    )
    .where(eq(fantasyTeams.fantasySeasonId, fantasySeason.id));
  const chipUses: Record<FantasyChip, number> = {
    triple_captain: 0,
    bench_boost: 0,
    wildcard: 0,
  };
  for (const row of allSelections) {
    if (
      row.fantasy_team_selections.fantasyTeamId === demo.team.id &&
      row.fantasy_team_selections.status === "locked" &&
      row.fantasy_team_selections.activeChip
    ) {
      chipUses[row.fantasy_team_selections.activeChip] += 1;
    }
  }

  const [leagueRows, memberRows, scoreRows] = await Promise.all([
    db
      .select()
      .from(fantasyLeagues)
      .where(eq(fantasyLeagues.fantasySeasonId, fantasySeason.id)),
    db
      .select({
        member: fantasyLeagueMembers,
        team: fantasyTeams,
        manager: fantasyManagers,
      })
      .from(fantasyLeagueMembers)
      .innerJoin(
        fantasyTeams,
        eq(fantasyLeagueMembers.fantasyTeamId, fantasyTeams.id),
      )
      .innerJoin(
        fantasyManagers,
        eq(fantasyTeams.managerId, fantasyManagers.id),
      ),
    db
      .select({
        score: fantasyTeamGameweekScores,
        selection: fantasyTeamSelections,
      })
      .from(fantasyTeamGameweekScores)
      .innerJoin(
        fantasyTeamSelections,
        eq(fantasyTeamGameweekScores.selectionId, fantasyTeamSelections.id),
      ),
  ]);
  const scoresByTeam = new Map<string, { total: number; gameweek: number }>();
  for (const row of scoreRows) {
    const current = scoresByTeam.get(row.selection.fantasyTeamId) ?? {
      total: 0,
      gameweek: 0,
    };
    current.total += row.score.totalPoints;
    if (row.selection.fantasyGameweekId === gameweek.id) {
      current.gameweek = row.score.totalPoints;
    }
    scoresByTeam.set(row.selection.fantasyTeamId, current);
  }
  const transfersByTeam = new Map<string, number>();
  for (const row of allSelections) {
    const item = row.fantasy_team_selections;
    if (item.status !== "locked" || item.activeChip === "wildcard") continue;
    transfersByTeam.set(
      item.fantasyTeamId,
      (transfersByTeam.get(item.fantasyTeamId) ?? 0) + item.netTransferCount,
    );
  }

  const leagues = leagueRows.map((league) => {
    const standings = memberRows
      .filter((row) => row.member.fantasyLeagueId === league.id)
      .map((row) => ({
        teamId: row.team.id,
        teamName: row.team.name,
        managerName: row.manager.displayName,
        gameweekPoints: scoresByTeam.get(row.team.id)?.gameweek ?? 0,
        totalPoints: scoresByTeam.get(row.team.id)?.total ?? 0,
        transferCount: transfersByTeam.get(row.team.id) ?? 0,
        mine: row.team.id === demo.team.id,
      }))
      .sort(
        (a, b) =>
          b.totalPoints - a.totalPoints ||
          a.transferCount - b.transferCount ||
          a.teamName.localeCompare(b.teamName),
      )
      .map((row, index) => ({ ...row, rank: index + 1 }));
    return {
      id: league.id,
      name: league.name,
      type: league.type,
      inviteCode: league.inviteCode,
      standings,
    };
  });

  return {
    seasonId: fantasySeason.id,
    team: {
      id: demo.team.id,
      name: demo.team.name,
      managerName: demo.manager.displayName,
      freeTransfers: demo.team.freeTransfers,
    },
    gameweek: {
      id: gameweek.id,
      number: gameweek.number,
      deadlineAt: gameweek.deadlineAt.toISOString(),
      status: gameweek.status,
      scoreComplete: gameweek.scoreComplete,
    },
    selection: {
      id: selection.id,
      status: selection.status,
      activeChip: selection.activeChip,
      hasPendingChanges,
      netTransferCount: selection.netTransferCount,
      transferPoints: selection.transferPoints,
      members: members.map((member) => ({
        fantasyPlayerId: member.fantasyPlayerId,
        clubId: member.clubIdSnapshot,
        position: member.positionSnapshot as DemoSquadMember["position"],
        tier: member.tierSnapshot,
        isThai: member.isThaiSnapshot,
        lineupRole: member.lineupRole,
        benchOrder: member.benchOrder,
        captainRole: member.captainRole,
      })),
    },
    chipsRemaining: {
      triple_captain: fantasySeason.chipUsesPerSeason - chipUses.triple_captain,
      bench_boost: fantasySeason.chipUsesPerSeason - chipUses.bench_boost,
      wildcard: fantasySeason.chipUsesPerSeason - chipUses.wildcard,
    },
    leagues,
  };
}

export type DemoPlayerPointsRow = {
  fantasyPlayerId: string;
  minutes: number;
  totalPoints: number;
  breakdown: Record<string, number>;
};

export async function getDemoPointsState() {
  const fantasy = await getDemoFantasyState();
  const season = await db.query.fantasySeasons.findFirst({
    where: eq(fantasySeasons.id, fantasy.seasonId),
  });
  if (!season) throw new Error("Fantasy season was not found.");
  const fixtureRows = await db
    .select({ id: fixtures.id })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.competitionSeasonId, season.competitionSeasonId),
        eq(fixtures.matchweek, fantasy.gameweek.number),
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
  const byPlayer = new Map<string, DemoPlayerPointsRow>();
  for (const row of pointRows) {
    const current = byPlayer.get(row.stats.fantasyPlayerId) ?? {
      fantasyPlayerId: row.stats.fantasyPlayerId,
      minutes: 0,
      totalPoints: 0,
      breakdown: {},
    };
    current.minutes += row.stats.minutes;
    current.totalPoints += row.points.totalPoints;
    for (const [key, value] of Object.entries(row.points.breakdown)) {
      current.breakdown[key] = (current.breakdown[key] ?? 0) + value;
    }
    byPlayer.set(row.stats.fantasyPlayerId, current);
  }
  const teamScore = await db.query.fantasyTeamGameweekScores.findFirst({
    where: eq(fantasyTeamGameweekScores.selectionId, fantasy.selection.id),
  });
  return {
    fantasy,
    players: [...byPlayer.values()],
    teamScore: teamScore
      ? {
          status: teamScore.status,
          lineupPoints: teamScore.lineupPoints,
          benchPoints: teamScore.benchPoints,
          captainBonus: teamScore.captainBonus,
          transferPoints: teamScore.transferPoints,
          totalPoints: teamScore.totalPoints,
        }
      : null,
  };
}

export async function getFantasyAdminGameweeks() {
  await connection();
  const season = await db.query.fantasySeasons.findFirst({
    where: eq(fantasySeasons.slug, FANTASY_SEASON_SLUG),
  });
  if (!season) return [];
  return db
    .select()
    .from(fantasyGameweeks)
    .where(eq(fantasyGameweeks.fantasySeasonId, season.id))
    .orderBy(asc(fantasyGameweeks.number));
}
