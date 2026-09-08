import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  clubs,
  clubVisualIdentities,
  fantasyGameweekPlayerPool,
  fantasyPlayerMatchPoints,
  fantasyPlayerMatchStats,
  fantasyPlayers,
  fixtures,
  players,
} from "@/db/schema";
import type { FantasyPointsSquadMember, PlayerPointsRow } from "@/data/fantasy";
import {
  findOptimalTeam,
  type OptimalTeamCandidate,
} from "@/lib/fantasy/optimal-team";
import type { FantasyPosition } from "@/lib/fantasy/rules";
import { getAdminContext, param, type AdminParams } from "./admin";

export async function getAdminOptimalTeam(params: AdminParams) {
  const context = await getAdminContext();
  const requested = param(params, "gw");
  const latestScored = [...context.weeks]
    .reverse()
    .find((week) => week.status === "provisional" || week.status === "final");
  const week =
    context.weeks.find((item) => String(item.number) === requested) ??
    latestScored ??
    context.current;

  if (!week) return { ...context, week: null, state: "missing_week" as const };
  if (week.status === "planned" || week.status === "open") {
    return { ...context, week, state: "not_scored" as const };
  }

  const poolRows = await db
    .select({
      fantasyPlayerId: fantasyGameweekPlayerPool.fantasyPlayerId,
      clubId: fantasyGameweekPlayerPool.clubIdSnapshot,
      position: fantasyGameweekPlayerPool.positionSnapshot,
      tier: fantasyGameweekPlayerPool.tierSnapshot,
      isThai: fantasyGameweekPlayerPool.isThaiSnapshot,
      sourceName: fantasyGameweekPlayerPool.sourceName,
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
    .from(fantasyGameweekPlayerPool)
    .innerJoin(
      fantasyPlayers,
      eq(fantasyGameweekPlayerPool.fantasyPlayerId, fantasyPlayers.id),
    )
    .innerJoin(players, eq(fantasyPlayers.playerId, players.id))
    .innerJoin(clubs, eq(fantasyGameweekPlayerPool.clubIdSnapshot, clubs.id))
    .leftJoin(clubVisualIdentities, eq(clubs.id, clubVisualIdentities.clubId))
    .where(eq(fantasyGameweekPlayerPool.fantasyGameweekId, week.id));

  if (!poolRows.length) {
    return { ...context, week, state: "missing_pool" as const };
  }

  const fixtureRows = await db
    .select({ id: fixtures.id })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.competitionSeasonId, context.season.competitionSeasonId),
        eq(fixtures.matchweek, week.number),
      ),
    );
  const fixtureIds = fixtureRows.map((fixture) => fixture.id);
  const pointRows = fixtureIds.length
    ? await db
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

  if (!pointRows.length && !week.scoreComplete) {
    return { ...context, week, state: "missing_scores" as const };
  }

  const results = new Map<string, PlayerPointsRow>();
  for (const row of pointRows) {
    const result = results.get(row.fantasyPlayerId) ?? {
      fantasyPlayerId: row.fantasyPlayerId,
      minutes: 0,
      totalPoints: 0,
      breakdown: {},
    };
    result.minutes += row.minutes;
    result.totalPoints += row.totalPoints;
    for (const [key, value] of Object.entries(row.breakdown)) {
      result.breakdown[key] = (result.breakdown[key] ?? 0) + value;
    }
    results.set(row.fantasyPlayerId, result);
  }
  if (week.scoreComplete) {
    for (const row of poolRows) {
      if (!results.has(row.fantasyPlayerId)) {
        results.set(row.fantasyPlayerId, {
          fantasyPlayerId: row.fantasyPlayerId,
          minutes: 0,
          totalPoints: 0,
          breakdown: { appearance: 0 },
        });
      }
    }
  }

  const candidates: OptimalTeamCandidate[] = poolRows.map((row) => {
    const result = results.get(row.fantasyPlayerId);
    return {
      id: row.fantasyPlayerId,
      clubId: row.clubId,
      position: row.position as FantasyPosition,
      tier: row.tier,
      isThai: row.isThai,
      minutes: result?.minutes ?? 0,
      points: result?.totalPoints ?? 0,
    };
  });
  const optimal = findOptimalTeam(candidates);
  if (!optimal) {
    return {
      ...context,
      week,
      state: "no_legal_team" as const,
      poolSize: poolRows.length,
    };
  }

  const rowById = new Map(poolRows.map((row) => [row.fantasyPlayerId, row]));
  const squad: FantasyPointsSquadMember[] = optimal.members.map((member) => {
    const row = rowById.get(member.id)!;
    return {
      fantasyPlayerId: member.id,
      clubId: member.clubId,
      position: member.position,
      tier: member.tier,
      isThai: member.isThai,
      lineupRole: member.lineupRole,
      benchOrder: member.benchOrder,
      captainRole: member.captainRole,
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
    };
  });

  return {
    ...context,
    week,
    state: "ready" as const,
    score: optimal.score,
    squad,
    players: optimal.members.map(
      (member) =>
        results.get(member.id) ?? {
          fantasyPlayerId: member.id,
          minutes: 0,
          totalPoints: 0,
          breakdown: { appearance: 0 },
        },
    ),
    actualHighest: week.highestPoints,
    poolSize: poolRows.length,
    poolSource: poolRows[0].sourceName,
  };
}
