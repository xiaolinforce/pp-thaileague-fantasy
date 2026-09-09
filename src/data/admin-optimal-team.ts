import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  clubs,
  clubVisualIdentities,
  fantasyGameweekOptimalTeamPlayers,
  fantasyGameweekOptimalTeams,
  fantasyGameweekPlayerPool,
  fantasyPlayers,
  players,
} from "@/db/schema";
import type { FantasyPointsSquadMember, PlayerPointsRow } from "@/data/fantasy";
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

  const saved = await db.query.fantasyGameweekOptimalTeams.findFirst({
    where: eq(fantasyGameweekOptimalTeams.fantasyGameweekId, week.id),
  });
  if (!saved) {
    return { ...context, week, state: "missing_result" as const };
  }

  const rows = await db
    .select({
      fantasyPlayerId: fantasyGameweekOptimalTeamPlayers.fantasyPlayerId,
      lineupRole: fantasyGameweekOptimalTeamPlayers.lineupRole,
      benchOrder: fantasyGameweekOptimalTeamPlayers.benchOrder,
      captainRole: fantasyGameweekOptimalTeamPlayers.captainRole,
      minutes: fantasyGameweekOptimalTeamPlayers.minutes,
      totalPoints: fantasyGameweekOptimalTeamPlayers.totalPoints,
      breakdown: fantasyGameweekOptimalTeamPlayers.breakdown,
      clubId: fantasyGameweekPlayerPool.clubIdSnapshot,
      position: fantasyGameweekPlayerPool.positionSnapshot,
      tier: fantasyGameweekPlayerPool.tierSnapshot,
      isThai: fantasyGameweekPlayerPool.isThaiSnapshot,
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
    .from(fantasyGameweekOptimalTeamPlayers)
    .innerJoin(
      fantasyGameweekPlayerPool,
      and(
        eq(
          fantasyGameweekOptimalTeamPlayers.fantasyGameweekId,
          fantasyGameweekPlayerPool.fantasyGameweekId,
        ),
        eq(
          fantasyGameweekOptimalTeamPlayers.fantasyPlayerId,
          fantasyGameweekPlayerPool.fantasyPlayerId,
        ),
      ),
    )
    .innerJoin(
      fantasyPlayers,
      eq(fantasyGameweekOptimalTeamPlayers.fantasyPlayerId, fantasyPlayers.id),
    )
    .innerJoin(players, eq(fantasyPlayers.playerId, players.id))
    .innerJoin(clubs, eq(fantasyGameweekPlayerPool.clubIdSnapshot, clubs.id))
    .leftJoin(clubVisualIdentities, eq(clubs.id, clubVisualIdentities.clubId))
    .where(eq(fantasyGameweekOptimalTeamPlayers.optimalTeamId, saved.id));

  if (rows.length !== 15) {
    return { ...context, week, state: "missing_result" as const };
  }

  const squad: FantasyPointsSquadMember[] = rows.map((row) => ({
    fantasyPlayerId: row.fantasyPlayerId,
    clubId: row.clubId,
    position: row.position as FantasyPointsSquadMember["position"],
    tier: row.tier,
    isThai: row.isThai,
    lineupRole: row.lineupRole,
    benchOrder: row.benchOrder,
    captainRole: row.captainRole,
    name: {
      th: row.fullNameTh ?? row.fullNameEn,
      en: row.fullNameEn,
    },
    shortName: {
      th:
        row.shortNameTh ?? row.shortNameEn ?? row.fullNameTh ?? row.fullNameEn,
      en: row.shortNameEn ?? row.fullNameEn,
    },
    club: { th: row.clubNameTh, en: row.clubNameEn },
    clubShort: {
      th: row.clubShortNameTh ?? row.clubAbbreviation ?? row.clubNameTh,
      en: row.clubShortNameEn ?? row.clubAbbreviation ?? row.clubNameEn,
    },
    color: row.color ?? "#1b6a55",
    accent: row.accent ?? "#f4f1eb",
  }));
  const playerPoints: PlayerPointsRow[] = rows.map((row) => ({
    fantasyPlayerId: row.fantasyPlayerId,
    minutes: row.minutes,
    totalPoints: row.totalPoints,
    breakdown: row.breakdown,
  }));

  return {
    ...context,
    week,
    state: "ready" as const,
    score: {
      lineupPoints: saved.lineupPoints,
      benchPoints: saved.benchPoints,
      captainBonus: saved.captainBonus,
      transferPoints: 0,
      totalPoints: saved.totalPoints,
      autoSubstitutions: saved.autoSubstitutions,
      countedPlayerIds: saved.countedPlayerIds,
    },
    squad,
    players: playerPoints,
    actualHighest: week.highestPoints,
    poolSize: saved.playerPoolSize,
    poolSource: saved.playerPoolSource,
    computedAt: saved.computedAt.toISOString(),
  };
}
