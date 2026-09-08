import "server-only";

import { and, asc, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";

import {
  competitionEntries,
  fantasyGameweekPlayerPool,
  fantasyGameweeks,
  fantasyPlayers,
  fantasyPlayerTiers,
  fantasySeasons,
  players,
  playerRegistrations,
} from "@/db/schema";
import type { FantasyTransaction } from "./season-lock";

type PoolDatabase = Pick<FantasyTransaction, "select" | "insert">;

export async function snapshotFantasyGameweekPlayerPool({
  database,
  season,
  gameweek,
}: {
  database: PoolDatabase;
  season: typeof fantasySeasons.$inferSelect;
  gameweek: typeof fantasyGameweeks.$inferSelect;
}) {
  const existing = await database
    .select({ id: fantasyGameweekPlayerPool.id })
    .from(fantasyGameweekPlayerPool)
    .where(eq(fantasyGameweekPlayerPool.fantasyGameweekId, gameweek.id))
    .limit(1);
  if (existing.length) return { created: false };

  const deadlineDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(gameweek.deadlineAt);
  const rows = await database
    .select({
      fantasyPlayerId: fantasyPlayers.id,
      clubId: competitionEntries.clubId,
      position: fantasyPlayers.lockedPosition,
      isThai: fantasyPlayers.isThai,
    })
    .from(fantasyPlayers)
    .innerJoin(players, eq(fantasyPlayers.playerId, players.id))
    .innerJoin(
      playerRegistrations,
      eq(fantasyPlayers.playerId, playerRegistrations.playerId),
    )
    .innerJoin(
      competitionEntries,
      eq(playerRegistrations.competitionEntryId, competitionEntries.id),
    )
    .where(
      and(
        eq(fantasyPlayers.fantasySeasonId, season.id),
        eq(fantasyPlayers.isAvailable, true),
        eq(players.isActive, true),
        eq(playerRegistrations.status, "active"),
        lte(playerRegistrations.registeredFrom, deadlineDate),
        or(
          isNull(playerRegistrations.registeredUntil),
          gte(playerRegistrations.registeredUntil, deadlineDate),
        ),
        eq(competitionEntries.competitionSeasonId, season.competitionSeasonId),
        eq(competitionEntries.isActive, true),
      ),
    )
    .orderBy(asc(fantasyPlayers.id), asc(competitionEntries.id));

  const byPlayer = new Map<
    string,
    { clubId: string; position: string; isThai: boolean }
  >();
  for (const row of rows) {
    const existingPlayer = byPlayer.get(row.fantasyPlayerId);
    if (existingPlayer && existingPlayer.clubId !== row.clubId) {
      throw new Error(
        `Fantasy player ${row.fantasyPlayerId} has multiple eligible clubs at the Gameweek deadline.`,
      );
    }
    byPlayer.set(row.fantasyPlayerId, {
      clubId: row.clubId,
      position: row.position,
      isThai: row.isThai,
    });
  }
  const fantasyPlayerIds = [...byPlayer.keys()];
  if (!fantasyPlayerIds.length) {
    throw new Error("The Gameweek player pool is empty.");
  }

  const tierRows = await database
    .select({
      fantasyPlayerId: fantasyPlayerTiers.fantasyPlayerId,
      level: fantasyPlayerTiers.level,
      gameweekNumber: fantasyGameweeks.number,
    })
    .from(fantasyPlayerTiers)
    .innerJoin(
      fantasyGameweeks,
      eq(fantasyPlayerTiers.effectiveGameweekId, fantasyGameweeks.id),
    )
    .where(
      and(
        inArray(fantasyPlayerTiers.fantasyPlayerId, fantasyPlayerIds),
        eq(fantasyGameweeks.fantasySeasonId, season.id),
        lte(fantasyGameweeks.number, gameweek.number),
      ),
    )
    .orderBy(asc(fantasyGameweeks.number));
  const tierByPlayer = new Map<string, number>();
  for (const row of tierRows) {
    tierByPlayer.set(row.fantasyPlayerId, row.level);
  }

  const values = fantasyPlayerIds.map((fantasyPlayerId) => {
    const player = byPlayer.get(fantasyPlayerId)!;
    return {
      fantasySeasonId: season.id,
      fantasyGameweekId: gameweek.id,
      fantasyPlayerId,
      clubIdSnapshot: player.clubId,
      positionSnapshot: player.position as
        "goalkeeper" | "defender" | "midfielder" | "forward",
      tierSnapshot: tierByPlayer.get(fantasyPlayerId) ?? 4,
      isThaiSnapshot: player.isThai,
      sourceName: "gameweek-lock",
    };
  });
  for (let offset = 0; offset < values.length; offset += 500) {
    await database
      .insert(fantasyGameweekPlayerPool)
      .values(values.slice(offset, offset + 500));
  }
  return { created: true };
}
