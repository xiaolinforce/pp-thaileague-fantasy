import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  competitionEntries,
  fantasyPlayers,
  fantasySeasons,
  playerRegistrations,
  players,
} from "@/db/schema";
import type {
  CompetitionDataset,
  CompetitionPlayerView,
  CompetitionPosition,
} from "@/lib/competition-types";
import type { FantasyState } from "./fantasy";
import { mergeTeamPlayerData } from "@/lib/fantasy/team-player-data";
import { getCurrentPlayerClubs } from "@/lib/fantasy/player-club-service";

// Keep retained identities out of the general competition/market dataset.
export async function getTeamPlayerData(
  data: CompetitionDataset,
  fantasy: FantasyState,
) {
  const visibleIds = new Set(
    data.players.flatMap((player) =>
      player.fantasyPlayerId ? [player.fantasyPlayerId] : [],
    ),
  );
  const missingIds = [
    ...new Set([
      ...fantasy.selection.members.map((member) => member.fantasyPlayerId),
      ...fantasy.selection.baselineSquadIds,
    ]),
  ].filter((id) => !visibleIds.has(id));
  const rows = missingIds.length
    ? await db
        .select({
          player: players,
          fantasyPlayer: fantasyPlayers,
          clubId: competitionEntries.clubId,
        })
        .from(fantasyPlayers)
        .innerJoin(players, eq(players.id, fantasyPlayers.playerId))
        .innerJoin(
          fantasySeasons,
          eq(fantasySeasons.id, fantasyPlayers.fantasySeasonId),
        )
        .leftJoin(
          playerRegistrations,
          eq(playerRegistrations.playerId, players.id),
        )
        .leftJoin(
          competitionEntries,
          and(
            eq(competitionEntries.id, playerRegistrations.competitionEntryId),
            eq(
              competitionEntries.competitionSeasonId,
              fantasySeasons.competitionSeasonId,
            ),
          ),
        )
        .where(
          and(
            eq(fantasyPlayers.fantasySeasonId, fantasy.seasonId),
            inArray(fantasyPlayers.id, missingIds),
          ),
        )
        .orderBy(
          desc(playerRegistrations.registeredFrom),
          desc(playerRegistrations.updatedAt),
        )
    : [];
  const retained = new Map<string, CompetitionPlayerView>();
  const positions: Record<string, CompetitionPosition> = {
    goalkeeper: "GK",
    defender: "DEF",
    midfielder: "MID",
    forward: "FWD",
  };
  for (const row of rows) {
    if (retained.has(row.fantasyPlayer.id)) continue;
    const member = fantasy.selection.members.find(
      (member) => member.fantasyPlayerId === row.fantasyPlayer.id,
    );
    const club = data.clubs.find(
      (club) => club.id === (member?.clubId ?? row.clubId),
    );
    if (!club) continue;
    retained.set(row.fantasyPlayer.id, {
      id: row.player.id,
      fantasyPlayerId: row.fantasyPlayer.id,
      isAvailable: false,
      clubId: club.id,
      name: {
        th: row.player.fullNameTh ?? row.player.fullNameEn,
        en: row.player.fullNameEn,
      },
      shortName: {
        th:
          row.player.shortNameTh ??
          row.player.fullNameTh ??
          row.player.fullNameEn,
        en: row.player.shortNameEn ?? row.player.fullNameEn,
      },
      club: club.name,
      clubShort: club.shortName,
      position: positions[row.fantasyPlayer.lockedPosition] ?? "MID",
      tier: member?.tier ?? 4,
      price: member?.tier ?? 4,
      isThai: row.fantasyPlayer.isThai,
      points: 0,
      form: 0,
      fantasyAppearances: 0,
      selected: 0,
      next: { th: "ไม่พร้อมให้เลือก", en: "Unavailable" },
      recentMatches: [],
      color: club.colors[0],
      accent: club.colors[1],
    });
  }
  const season = await db.query.fantasySeasons.findFirst({
    where: eq(fantasySeasons.id, fantasy.seasonId),
  });
  if (!season) throw new Error("Fantasy season was not found.");
  const currentClubs = await getCurrentPlayerClubs({
    database: db,
    season,
    fantasyPlayerIds: [
      ...new Set(
        [...data.players, ...retained.values()].flatMap((player) =>
          player.fantasyPlayerId ? [player.fantasyPlayerId] : [],
        ),
      ),
    ],
  });
  const freshPlayers = [...data.players, ...retained.values()].map((player) => {
    const clubId = player.fantasyPlayerId
      ? currentClubs.get(player.fantasyPlayerId)
      : undefined;
    const club = data.clubs.find((club) => club.id === clubId);
    return {
      ...player,
      isAvailable: player.fantasyPlayerId ? !!clubId : player.isAvailable,
      ...(club
        ? {
            clubId: club.id,
            club: club.name,
            clubShort: club.shortName,
            color: club.colors[0],
            accent: club.colors[1],
          }
        : {}),
    };
  });
  return mergeTeamPlayerData(
    { ...data, players: freshPlayers },
    [],
    fantasy.selection.members,
  );
}
