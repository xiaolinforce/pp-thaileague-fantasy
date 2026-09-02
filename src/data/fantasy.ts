import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";
import { connection } from "next/server";

import { db } from "@/db";
import {
  clubs,
  clubVisualIdentities,
  fantasyGameweeks,
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
import { hasGameweekDeadlinePassed } from "@/lib/fantasy/points-gameweek";
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

export type FantasyState = {
  seasonId: string;
  seasonFinished: boolean;
  team: {
    id: string;
    name: string;
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
    id: string | null;
    status: "draft" | "locked";
    activeChip: FantasyChip | null;
    baselineSquadIds: string[];
    hasPendingChanges: boolean;
    netTransferCount: number;
    transferPoints: number;
    members: FantasySquadMember[];
  };
  chipsRemaining: Record<FantasyChip, number>;
};

export async function getFantasyState(): Promise<FantasyState> {
  await connection();
  const profile = await requireFantasyProfile();
  const fantasySeason = profile.season;
  const gameweek = profile.gameweek;
  const selection = profile.selection;
  const current = { team: profile.team };

  const [members, revisions] = selection
    ? await Promise.all([
        db
          .select()
          .from(fantasyTeamSelectionPlayers)
          .where(eq(fantasyTeamSelectionPlayers.selectionId, selection.id)),
        db
          .select()
          .from(fantasyTransferRevisions)
          .where(eq(fantasyTransferRevisions.selectionId, selection.id))
          .orderBy(asc(fantasyTransferRevisions.revision)),
      ])
    : [[], []];
  const baselineRevision = revisions[0]?.revision ?? 0;
  const baselineSquadIds = Array.isArray(revisions[0]?.squad)
    ? revisions[0].squad.filter(
        (fantasyPlayerId): fantasyPlayerId is string =>
          typeof fantasyPlayerId === "string",
      )
    : members.map((member) => member.fantasyPlayerId);
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

  return {
    seasonId: fantasySeason.id,
    seasonFinished: profile.seasonFinished,
    team: {
      id: current.team.id,
      name: current.team.name,
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
      id: selection?.id ?? null,
      status: selection?.status ?? "locked",
      activeChip: selection?.activeChip ?? null,
      baselineSquadIds,
      hasPendingChanges,
      netTransferCount: selection?.netTransferCount ?? 0,
      transferPoints: selection?.transferPoints ?? 0,
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
  const [season, gameweekRows, selectionRows] = await Promise.all([
    db.query.fantasySeasons.findFirst({
      where: eq(fantasySeasons.id, activeFantasy.seasonId),
    }),
    db
      .select()
      .from(fantasyGameweeks)
      .where(eq(fantasyGameweeks.fantasySeasonId, activeFantasy.seasonId))
      .orderBy(asc(fantasyGameweeks.number)),
    db
      .select({
        selection: fantasyTeamSelections,
        gameweek: fantasyGameweeks,
      })
      .from(fantasyTeamSelections)
      .innerJoin(
        fantasyGameweeks,
        eq(fantasyTeamSelections.fantasyGameweekId, fantasyGameweeks.id),
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

  const now = new Date();
  const deadlinePassedGameweeks = gameweekRows.filter((gameweek) =>
    hasGameweekDeadlinePassed(gameweek.deadlineAt, now),
  );
  const defaultGameweek = deadlinePassedGameweeks.at(-1);
  const selectedGameweek =
    (Number.isInteger(requestedGameweek) && requestedGameweek! > 0
      ? deadlinePassedGameweeks.find(
          (gameweek) => gameweek.number === requestedGameweek,
        )
      : undefined) ?? defaultGameweek;
  if (!selectedGameweek)
    throw new Error("No deadline-passed Fantasy Gameweek was found.");
  const selectedSelection = selectionRows.find(
    (row) => row.gameweek.id === selectedGameweek.id,
  )?.selection;

  const [fixtureRows, squadRows, teamScore] = await Promise.all([
    db
      .select({ id: fixtures.id })
      .from(fixtures)
      .where(
        and(
          eq(fixtures.competitionSeasonId, season.competitionSeasonId),
          eq(fixtures.matchweek, selectedGameweek.number),
        ),
      ),
    selectedSelection
      ? db
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
            eq(fantasyTeamSelectionPlayers.selectionId, selectedSelection.id),
          )
      : Promise.resolve([]),
    selectedSelection
      ? db.query.fantasyTeamGameweekScores.findFirst({
          where: eq(
            fantasyTeamGameweekScores.selectionId,
            selectedSelection.id,
          ),
        })
      : Promise.resolve(undefined),
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
      id: selectedGameweek.id,
      number: selectedGameweek.number,
      deadlineAt: selectedGameweek.deadlineAt.toISOString(),
      status: selectedGameweek.status,
      scoreComplete: selectedGameweek.scoreComplete,
    },
    selection: {
      id: selectedSelection?.id ?? null,
      status: selectedSelection?.status ?? "locked",
      activeChip: selectedSelection?.activeChip ?? null,
      baselineSquadIds: members.map((member) => member.fantasyPlayerId),
      hasPendingChanges: false,
      netTransferCount: selectedSelection?.netTransferCount ?? 0,
      transferPoints: selectedSelection?.transferPoints ?? 0,
      members,
    },
  };
  return {
    fantasy,
    gameweeks: deadlinePassedGameweeks.map((gameweek) => ({
      number: gameweek.number,
    })) satisfies FantasyPointsGameweek[],
    squad: members,
    players: [...byPlayer.values()],
    gameweekSummary: {
      averagePoints: selectedGameweek.averagePoints,
      highestPoints: selectedGameweek.highestPoints,
    },
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
