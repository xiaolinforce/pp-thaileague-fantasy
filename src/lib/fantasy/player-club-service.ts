import "server-only";

import { and, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";
import type { db } from "@/db";
import {
  competitionEntries,
  fantasyPlayers,
  players,
  playerRegistrations,
} from "@/db/schema";
import type { FantasyTransaction } from "./season-lock";
import { resolvePlayerClubs } from "./player-club";

export async function getCurrentPlayerClubs({
  database,
  season,
  fantasyPlayerIds,
  at = new Date(),
}: {
  database: Pick<typeof db, "select"> | Pick<FantasyTransaction, "select">;
  season: { id: string; competitionSeasonId: string };
  fantasyPlayerIds: string[];
  at?: Date;
}) {
  if (!fantasyPlayerIds.length) return new Map<string, string>();
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
  const rows = await database
    .select({
      fantasyPlayerId: fantasyPlayers.id,
      clubId: competitionEntries.clubId,
    })
    .from(fantasyPlayers)
    .innerJoin(players, eq(players.id, fantasyPlayers.playerId))
    .innerJoin(
      playerRegistrations,
      eq(playerRegistrations.playerId, players.id),
    )
    .innerJoin(
      competitionEntries,
      eq(competitionEntries.id, playerRegistrations.competitionEntryId),
    )
    .where(
      and(
        inArray(fantasyPlayers.id, fantasyPlayerIds),
        eq(fantasyPlayers.fantasySeasonId, season.id),
        eq(fantasyPlayers.isAvailable, true),
        eq(players.isActive, true),
        eq(competitionEntries.competitionSeasonId, season.competitionSeasonId),
        eq(competitionEntries.isActive, true),
        eq(playerRegistrations.status, "active"),
        lte(playerRegistrations.registeredFrom, date),
        or(
          isNull(playerRegistrations.registeredUntil),
          gte(playerRegistrations.registeredUntil, date),
        ),
      ),
    );
  return resolvePlayerClubs(rows);
}
