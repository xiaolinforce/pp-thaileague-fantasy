import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";
import { connection } from "next/server";

import { db } from "@/db";
import {
  clubs,
  clubVisualIdentities,
  fantasyGameweeks,
  fantasyLeagueMembers,
  fantasyLeagues,
  fantasyManagers,
  fantasyPlayerMatchPoints,
  fantasyPlayerMatchStats,
  fantasyPlayers,
  fantasySeasons,
  fantasyTeamGameweekScores,
  fantasyTransferRevisions,
  fantasyTeamSelectionPlayers,
  fantasyTeamSelections,
  fantasyTeams,
  fixtures,
  players,
} from "@/db/schema";
import type { FantasyChip } from "@/lib/fantasy/rules";
import { requireAdmin, requireFantasyProfile } from "@/lib/auth/context";

const FANTASY_SEASON_SLUG = "thai-league-1-2026-27";

export type FantasySquadMember = {
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

export type FantasyState = {
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
    members: FantasySquadMember[];
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

export async function getFantasyState(): Promise<FantasyState> {
  await connection();
  const profile = await requireFantasyProfile();
  const fantasySeason = profile.season;
  const gameweek = profile.gameweek;
  const selection = profile.selection;
  const current = { team: profile.team, manager: profile.manager };

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
      row.fantasy_team_selections.fantasyTeamId === current.team.id &&
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
        mine: row.team.id === current.team.id,
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
      id: current.team.id,
      name: current.team.name,
      managerName: current.manager.displayName,
      freeTransfers: current.team.freeTransfers,
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
        position: member.positionSnapshot as FantasySquadMember["position"],
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

export type PlayerPointsRow = {
  fantasyPlayerId: string;
  minutes: number;
  totalPoints: number;
  breakdown: Record<string, number>;
};

export type FantasyPointsGameweek = {
  number: number;
  status: string;
  scoreComplete: boolean;
  hasScore: boolean;
};

export type FantasyPointsSquadMember = FantasySquadMember & {
  name: { th: string; en: string };
  shortName: { th: string; en: string };
  club: { th: string; en: string };
  clubShort: { th: string; en: string };
  color: string;
  accent: string;
};

export async function getFantasyPointsState(requestedGameweek?: number) {
  const activeFantasy = await getFantasyState();
  const [season, selectionRows] = await Promise.all([
    db.query.fantasySeasons.findFirst({
      where: eq(fantasySeasons.id, activeFantasy.seasonId),
    }),
    db
      .select({
        selection: fantasyTeamSelections,
        gameweek: fantasyGameweeks,
        scoreId: fantasyTeamGameweekScores.id,
      })
      .from(fantasyTeamSelections)
      .innerJoin(
        fantasyGameweeks,
        eq(fantasyTeamSelections.fantasyGameweekId, fantasyGameweeks.id),
      )
      .leftJoin(
        fantasyTeamGameweekScores,
        eq(fantasyTeamGameweekScores.selectionId, fantasyTeamSelections.id),
      )
      .where(
        and(
          eq(fantasyTeamSelections.fantasyTeamId, activeFantasy.team.id),
          eq(fantasyGameweeks.fantasySeasonId, activeFantasy.seasonId),
        ),
      )
      .orderBy(asc(fantasyGameweeks.number)),
  ]);
  if (!season) throw new Error("Fantasy season was not found.");

  const defaultSelection =
    [...selectionRows]
      .reverse()
      .find(
        (row) =>
          row.scoreId !== null ||
          row.gameweek.status === "provisional" ||
          row.gameweek.status === "final",
      ) ??
    selectionRows.find(
      (row) => row.gameweek.id === activeFantasy.gameweek.id,
    ) ??
    selectionRows.at(-1);
  const selected =
    (Number.isInteger(requestedGameweek) && requestedGameweek! > 0
      ? selectionRows.find((row) => row.gameweek.number === requestedGameweek)
      : undefined) ?? defaultSelection;
  if (!selected) throw new Error("No Fantasy selection was found.");

  const [fixtureRows, squadRows, teamScore] = await Promise.all([
    db
      .select({ id: fixtures.id })
      .from(fixtures)
      .where(
        and(
          eq(fixtures.competitionSeasonId, season.competitionSeasonId),
          eq(fixtures.matchweek, selected.gameweek.number),
        ),
      ),
    db
      .select({
        member: fantasyTeamSelectionPlayers,
        fullNameTh: players.fullNameTh,
        fullNameEn: players.fullNameEn,
        shortNameTh: players.shortNameTh,
        shortNameEn: players.shortNameEn,
        clubNameTh: clubs.nameTh,
        clubNameEn: clubs.nameEn,
        clubShortNameTh: clubs.shortNameTh,
        clubShortNameEn: clubs.shortNameEn,
        clubAbbreviation: clubs.abbreviation,
        color: clubVisualIdentities.topLeftColor,
        accent: clubVisualIdentities.topRightColor,
      })
      .from(fantasyTeamSelectionPlayers)
      .innerJoin(
        fantasyPlayers,
        eq(fantasyTeamSelectionPlayers.fantasyPlayerId, fantasyPlayers.id),
      )
      .innerJoin(players, eq(fantasyPlayers.playerId, players.id))
      .innerJoin(
        clubs,
        eq(fantasyTeamSelectionPlayers.clubIdSnapshot, clubs.id),
      )
      .leftJoin(
        clubVisualIdentities,
        eq(
          fantasyTeamSelectionPlayers.clubIdSnapshot,
          clubVisualIdentities.clubId,
        ),
      )
      .where(
        eq(fantasyTeamSelectionPlayers.selectionId, selected.selection.id),
      ),
    db.query.fantasyTeamGameweekScores.findFirst({
      where: eq(fantasyTeamGameweekScores.selectionId, selected.selection.id),
    }),
  ]);
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
  const byPlayer = new Map<string, PlayerPointsRow>();
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
  const members: FantasyPointsSquadMember[] = squadRows
    .map((row) => ({
      fantasyPlayerId: row.member.fantasyPlayerId,
      clubId: row.member.clubIdSnapshot,
      position: row.member.positionSnapshot as FantasySquadMember["position"],
      tier: row.member.tierSnapshot,
      isThai: row.member.isThaiSnapshot,
      lineupRole: row.member.lineupRole,
      benchOrder: row.member.benchOrder,
      captainRole: row.member.captainRole,
      name: {
        th: row.fullNameTh ?? row.fullNameEn,
        en: row.fullNameEn,
      },
      shortName: {
        th:
          row.shortNameTh ??
          row.shortNameEn ??
          row.fullNameTh ??
          row.fullNameEn,
        en: row.shortNameEn ?? row.fullNameEn,
      },
      club: { th: row.clubNameTh, en: row.clubNameEn },
      clubShort: {
        th: row.clubShortNameTh ?? row.clubAbbreviation ?? row.clubNameTh,
        en: row.clubShortNameEn ?? row.clubAbbreviation ?? row.clubNameEn,
      },
      color: row.color ?? "#1b6a55",
      accent: row.accent ?? "#f4f1eb",
    }))
    .sort((a, b) => {
      if (a.lineupRole !== b.lineupRole)
        return a.lineupRole === "starter" ? -1 : 1;
      return (a.benchOrder ?? -1) - (b.benchOrder ?? -1);
    });
  const fantasy: FantasyState = {
    ...activeFantasy,
    gameweek: {
      id: selected.gameweek.id,
      number: selected.gameweek.number,
      deadlineAt: selected.gameweek.deadlineAt.toISOString(),
      status: selected.gameweek.status,
      scoreComplete: selected.gameweek.scoreComplete,
    },
    selection: {
      id: selected.selection.id,
      status: selected.selection.status,
      activeChip: selected.selection.activeChip,
      hasPendingChanges: false,
      netTransferCount: selected.selection.netTransferCount,
      transferPoints: selected.selection.transferPoints,
      members,
    },
  };

  return {
    fantasy,
    gameweeks: selectionRows.map(({ gameweek, scoreId }) => ({
      number: gameweek.number,
      status: gameweek.status,
      scoreComplete: gameweek.scoreComplete,
      hasScore: scoreId !== null,
    })) satisfies FantasyPointsGameweek[],
    squad: members,
    players: [...byPlayer.values()],
    teamScore: teamScore
      ? {
          status: teamScore.status,
          lineupPoints: teamScore.lineupPoints,
          benchPoints: teamScore.benchPoints,
          captainBonus: teamScore.captainBonus,
          transferPoints: teamScore.transferPoints,
          totalPoints: teamScore.totalPoints,
          autoSubstitutions: teamScore.autoSubstitutions,
          computedAt: teamScore.computedAt.toISOString(),
        }
      : null,
  };
}

export async function getFantasyAdminGameweeks() {
  await connection();
  await requireAdmin();
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
