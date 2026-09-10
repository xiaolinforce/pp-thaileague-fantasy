import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  clubs,
  clubVisualIdentities,
  fantasyPlayerMatchPoints,
  fantasyPlayerMatchStats,
  fantasyPlayers,
  fantasyTeamGameweekScores,
  fantasyTeamSelectionPlayers,
  fantasyTeamSelections,
  fantasyTeams,
  fixtures,
  players,
} from "@/db/schema";
import type { FantasyPointsSquadMember, PlayerPointsRow } from "@/data/fantasy";
import { getAdminContext, param, type AdminParams } from "./admin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getAdminTeamPoints(teamId: string, params: AdminParams) {
  const context = await getAdminContext();
  if (!UUID_PATTERN.test(teamId)) return null;

  const team = await db.query.fantasyTeams.findFirst({
    where: and(
      eq(fantasyTeams.id, teamId),
      eq(fantasyTeams.fantasySeasonId, context.season.id),
    ),
  });
  if (!team) return null;

  const requested = param(params, "gw");
  const latestScored = [...context.weeks]
    .reverse()
    .find((week) => week.status === "provisional" || week.status === "final");
  const week =
    context.weeks.find((candidate) => String(candidate.number) === requested) ??
    latestScored ??
    context.current;

  if (!week) {
    return {
      ...context,
      team,
      week: null,
      state: "missing_week" as const,
    };
  }

  const selection = await db.query.fantasyTeamSelections.findFirst({
    where: and(
      eq(fantasyTeamSelections.fantasyTeamId, team.id),
      eq(fantasyTeamSelections.fantasyGameweekId, week.id),
    ),
  });
  if (!selection) {
    return {
      ...context,
      team,
      week,
      state: "empty_squad" as const,
    };
  }

  const scoringStarted =
    week.status === "provisional" || week.status === "final";
  const memberRowsPromise = db
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
    .innerJoin(clubs, eq(fantasyTeamSelectionPlayers.clubIdSnapshot, clubs.id))
    .leftJoin(
      clubVisualIdentities,
      eq(
        fantasyTeamSelectionPlayers.clubIdSnapshot,
        clubVisualIdentities.clubId,
      ),
    )
    .where(eq(fantasyTeamSelectionPlayers.selectionId, selection.id));

  const scorePromise = scoringStarted
    ? db.query.fantasyTeamGameweekScores.findFirst({
        where: eq(fantasyTeamGameweekScores.selectionId, selection.id),
      })
    : Promise.resolve(undefined);
  const fixtureRowsPromise = scoringStarted
    ? db
        .select({ id: fixtures.id })
        .from(fixtures)
        .where(
          and(
            eq(
              fixtures.competitionSeasonId,
              context.season.competitionSeasonId,
            ),
            eq(fixtures.matchweek, week.number),
          ),
        )
    : Promise.resolve([]);
  const [memberRows, score, fixtureRows] = await Promise.all([
    memberRowsPromise,
    scorePromise,
    fixtureRowsPromise,
  ]);

  if (memberRows.length === 0) {
    return {
      ...context,
      team,
      week,
      state: "empty_squad" as const,
    };
  }

  const squad: FantasyPointsSquadMember[] = memberRows
    .map((row) => ({
      fantasyPlayerId: row.member.fantasyPlayerId,
      clubId: row.member.clubIdSnapshot,
      position: row.member
        .positionSnapshot as FantasyPointsSquadMember["position"],
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
    .sort((left, right) => {
      if (left.lineupRole !== right.lineupRole) {
        return left.lineupRole === "starter" ? -1 : 1;
      }
      return (left.benchOrder ?? -1) - (right.benchOrder ?? -1);
    });

  const fixtureIds = fixtureRows.map((fixture) => fixture.id);
  const playerIds = squad.map((member) => member.fantasyPlayerId);
  const pointRows =
    scoringStarted && fixtureIds.length > 0 && playerIds.length > 0
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
          .where(
            and(
              inArray(fantasyPlayerMatchStats.fixtureId, fixtureIds),
              inArray(fantasyPlayerMatchStats.fantasyPlayerId, playerIds),
            ),
          )
      : [];

  const pointsByPlayer = new Map<string, PlayerPointsRow>();
  for (const row of pointRows) {
    const current = pointsByPlayer.get(row.stats.fantasyPlayerId) ?? {
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
    pointsByPlayer.set(row.stats.fantasyPlayerId, current);
  }

  if (week.scoreComplete) {
    for (const fantasyPlayerId of playerIds) {
      if (pointsByPlayer.has(fantasyPlayerId)) continue;
      pointsByPlayer.set(fantasyPlayerId, {
        fantasyPlayerId,
        minutes: 0,
        totalPoints: 0,
        breakdown: { appearance: 0 },
      });
    }
  }

  return {
    ...context,
    team,
    week,
    state: "ready" as const,
    squad,
    players: [...pointsByPlayer.values()],
    activeChip: selection.activeChip,
    score: score
      ? {
          totalPoints: score.totalPoints,
          autoSubstitutions: score.autoSubstitutions,
        }
      : null,
  };
}
