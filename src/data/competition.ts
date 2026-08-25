import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import {
  clubs,
  clubVisualIdentities,
  competitionEntries,
  competitionSeasons,
  fixtures,
  fantasyGameweeks,
  fantasyPlayerMatchPoints,
  fantasyPlayerMatchStats,
  fantasyPlayers,
  fantasyPlayerTiers,
  fantasySeasons,
  fantasyTeamSelectionPlayers,
  fantasyTeamSelections,
  playerRegistrations,
  players,
  venues,
} from "@/db/schema";
import type {
  CompetitionClubView,
  ClubColorPalette,
  CompetitionDataset,
  CompetitionFixtureView,
  CompetitionPlayerView,
  CompetitionPosition,
  LocalizedText,
} from "@/lib/competition-types";

const COMPETITION_SEASON_EXTERNAL_ID = "224";

const DEFAULT_CLUB_COLORS: ClubColorPalette = [
  "#E7E5E4",
  "#D6D3D1",
  "#D6D3D1",
  "#E7E5E4",
];

function toPosition(position: string): CompetitionPosition | null {
  if (position === "goalkeeper") return "GK";
  if (position === "defender") return "DEF";
  if (position === "midfielder") return "MID";
  if (position === "forward") return "FWD";
  return null;
}

function localized(
  th: string | null,
  en: string | null,
  fallback: string,
): LocalizedText {
  return { th: th || en || fallback, en: en || th || fallback };
}

function formatFixtureDate(date: Date | null): LocalizedText {
  if (!date) return { th: "วันและเวลารอยืนยัน", en: "Date and time TBC" };
  return {
    th: new Intl.DateTimeFormat("th-TH", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Bangkok",
    }).format(date),
    en: new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Bangkok",
    }).format(date),
  };
}

function formatFixtureTime(date: Date | null): LocalizedText {
  if (!date) return { th: "รอยืนยัน", en: "TBC" };
  const time = new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  }).format(date);
  return { th: time, en: time };
}

export async function getCompetitionDataset(): Promise<CompetitionDataset> {
  await connection();

  const season = await db.query.competitionSeasons.findFirst({
    where: eq(competitionSeasons.externalId, COMPETITION_SEASON_EXTERNAL_ID),
  });
  if (!season) throw new Error("Competition season 2026/27 was not found.");

  const [entryRows, fixtureRows, venueRows] = await Promise.all([
    db
      .select({
        entry: competitionEntries,
        club: clubs,
        visualIdentity: clubVisualIdentities,
      })
      .from(competitionEntries)
      .innerJoin(clubs, eq(competitionEntries.clubId, clubs.id))
      .leftJoin(clubVisualIdentities, eq(clubVisualIdentities.clubId, clubs.id))
      .where(
        and(
          eq(competitionEntries.competitionSeasonId, season.id),
          eq(competitionEntries.isActive, true),
        ),
      ),
    db
      .select()
      .from(fixtures)
      .where(eq(fixtures.competitionSeasonId, season.id))
      .orderBy(asc(fixtures.matchweek), asc(fixtures.kickoffAt)),
    db.select().from(venues),
  ]);

  const fantasySeason = await db.query.fantasySeasons.findFirst({
    where: eq(fantasySeasons.competitionSeasonId, season.id),
  });
  const [fantasyPlayerRows, fantasyGameweekRows] = fantasySeason
    ? await Promise.all([
        db
          .select()
          .from(fantasyPlayers)
          .where(eq(fantasyPlayers.fantasySeasonId, fantasySeason.id)),
        db
          .select()
          .from(fantasyGameweeks)
          .where(eq(fantasyGameweeks.fantasySeasonId, fantasySeason.id))
          .orderBy(asc(fantasyGameweeks.number)),
      ])
    : [[], []];
  const fantasyPlayerIds = fantasyPlayerRows.map((player) => player.id);
  const fantasyTierRows = fantasyPlayerIds.length
    ? await db
        .select({ tier: fantasyPlayerTiers, gameweek: fantasyGameweeks })
        .from(fantasyPlayerTiers)
        .innerJoin(
          fantasyGameweeks,
          eq(fantasyPlayerTiers.effectiveGameweekId, fantasyGameweeks.id),
        )
        .where(inArray(fantasyPlayerTiers.fantasyPlayerId, fantasyPlayerIds))
    : [];
  const currentFantasyGameweek =
    fantasyGameweekRows.find((gameweek) => gameweek.status === "open") ??
    fantasyGameweekRows.find((gameweek) => gameweek.status === "planned") ??
    fantasyGameweekRows.at(-1);
  const [fantasyPointRows, ownershipRows] = fantasyPlayerIds.length
    ? await Promise.all([
        db
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
            inArray(fantasyPlayerMatchStats.fantasyPlayerId, fantasyPlayerIds),
          ),
        currentFantasyGameweek
          ? db
              .select({
                fantasyPlayerId: fantasyTeamSelectionPlayers.fantasyPlayerId,
                selectionId: fantasyTeamSelections.id,
              })
              .from(fantasyTeamSelectionPlayers)
              .innerJoin(
                fantasyTeamSelections,
                eq(
                  fantasyTeamSelectionPlayers.selectionId,
                  fantasyTeamSelections.id,
                ),
              )
              .where(
                eq(
                  fantasyTeamSelections.fantasyGameweekId,
                  currentFantasyGameweek.id,
                ),
              )
          : Promise.resolve([]),
      ])
    : [[], []];
  const fantasyPlayerByPlayerId = new Map(
    fantasyPlayerRows.map((player) => [player.playerId, player]),
  );
  const tierByFantasyPlayerId = new Map<string, number>();
  for (const row of fantasyTierRows
    .filter(
      (row) =>
        !currentFantasyGameweek ||
        row.gameweek.number <= currentFantasyGameweek.number,
    )
    .sort((a, b) => a.gameweek.number - b.gameweek.number)) {
    tierByFantasyPlayerId.set(row.tier.fantasyPlayerId, row.tier.level);
  }
  const pointsByFantasyPlayer = new Map<
    string,
    Array<{ fixtureId: string; matchweek: number; points: number }>
  >();
  const fixtureById = new Map(
    fixtureRows.map((fixture) => [fixture.id, fixture]),
  );
  for (const row of fantasyPointRows) {
    const fixture = fixtureById.get(row.stats.fixtureId);
    const list = pointsByFantasyPlayer.get(row.stats.fantasyPlayerId) ?? [];
    list.push({
      fixtureId: row.stats.fixtureId,
      matchweek: fixture?.matchweek ?? 0,
      points: row.points.totalPoints,
    });
    pointsByFantasyPlayer.set(row.stats.fantasyPlayerId, list);
  }
  const ownershipByFantasyPlayer = new Map<string, number>();
  for (const row of ownershipRows) {
    ownershipByFantasyPlayer.set(
      row.fantasyPlayerId,
      (ownershipByFantasyPlayer.get(row.fantasyPlayerId) ?? 0) + 1,
    );
  }
  const selectionCount = new Set(ownershipRows.map((row) => row.selectionId))
    .size;

  const entryIds = entryRows.map(({ entry }) => entry.id);
  const registrationRows = entryIds.length
    ? await db
        .select({ registration: playerRegistrations, player: players })
        .from(playerRegistrations)
        .innerJoin(players, eq(playerRegistrations.playerId, players.id))
        .where(
          and(
            inArray(playerRegistrations.competitionEntryId, entryIds),
            eq(playerRegistrations.status, "active"),
            eq(players.isActive, true),
          ),
        )
        .orderBy(asc(players.fullNameEn))
    : [];

  const clubByEntry = new Map<string, CompetitionClubView>();
  const clubRowsByEntry = new Map(entryRows.map((row) => [row.entry.id, row]));
  const clubViews = entryRows.map(({ entry, club, visualIdentity }) => {
    const colors: ClubColorPalette = visualIdentity
      ? [
          visualIdentity.topLeftColor,
          visualIdentity.topRightColor,
          visualIdentity.bottomLeftColor,
          visualIdentity.bottomRightColor,
        ]
      : DEFAULT_CLUB_COLORS;
    const view: CompetitionClubView = {
      id: club.id,
      name: localized(entry.displayNameTh, entry.displayNameEn, club.nameEn),
      shortName: localized(
        club.shortNameTh,
        club.shortNameEn,
        entry.abbreviation || club.nameEn,
      ),
      abbreviation:
        entry.abbreviation ||
        club.abbreviation ||
        club.nameEn.slice(0, 3).toUpperCase(),
      colors,
    };
    clubByEntry.set(entry.id, view);
    return view;
  });
  const venueById = new Map(venueRows.map((venue) => [venue.id, venue]));

  const fixtureViews: CompetitionFixtureView[] = fixtureRows.flatMap(
    (fixture) => {
      const home = clubByEntry.get(fixture.homeEntryId);
      const away = clubByEntry.get(fixture.awayEntryId);
      if (!home || !away) return [];
      const venue = fixture.venueId ? venueById.get(fixture.venueId) : null;
      return [
        {
          id: fixture.id,
          matchweek: fixture.matchweek,
          kickoffAt: fixture.kickoffAt?.toISOString() ?? null,
          dateLabel: formatFixtureDate(fixture.kickoffAt),
          timeLabel: formatFixtureTime(fixture.kickoffAt),
          home,
          away,
          venue: venue
            ? localized(venue.nameTh, venue.nameEn, venue.nameTh)
            : null,
          status: fixture.status,
        },
      ];
    },
  );

  const fixturesByEntry = new Map<string, typeof fixtureRows>();
  for (const fixture of fixtureRows) {
    for (const entryId of [fixture.homeEntryId, fixture.awayEntryId]) {
      const list = fixturesByEntry.get(entryId) ?? [];
      list.push(fixture);
      fixturesByEntry.set(entryId, list);
    }
  }

  const playerViews: CompetitionPlayerView[] = registrationRows.flatMap(
    ({ registration, player }) => {
      const position = toPosition(
        registration.registeredPosition || player.primaryPosition,
      );
      const club = clubByEntry.get(registration.competitionEntryId);
      const clubRow = clubRowsByEntry.get(registration.competitionEntryId);
      if (!position || !club || !clubRow) return [];
      const nextFixture = (fixturesByEntry.get(
        registration.competitionEntryId,
      ) ?? [])[0];
      let next: LocalizedText = { th: "ยังไม่มีโปรแกรม", en: "No fixture" };
      if (nextFixture) {
        const isHome =
          nextFixture.homeEntryId === registration.competitionEntryId;
        const opponent = clubByEntry.get(
          isHome ? nextFixture.awayEntryId : nextFixture.homeEntryId,
        );
        if (opponent) {
          next = {
            th: `${opponent.shortName.th} (${isHome ? "H" : "A"})`,
            en: `${opponent.shortName.en} (${isHome ? "H" : "A"})`,
          };
        }
      }
      const [color, accent] = club.colors;
      const fantasyPlayer = fantasyPlayerByPlayerId.get(player.id);
      const tier = fantasyPlayer
        ? (tierByFantasyPlayerId.get(fantasyPlayer.id) ?? 4)
        : 4;
      const matchPoints = fantasyPlayer
        ? (pointsByFantasyPlayer.get(fantasyPlayer.id) ?? []).sort(
            (a, b) => b.matchweek - a.matchweek,
          )
        : [];
      const recentPoints = matchPoints.slice(0, 5);
      const pointsByFixtureId = new Map(
        matchPoints.map((match) => [match.fixtureId, match.points]),
      );
      const recentMatches = [
        ...(fixturesByEntry.get(registration.competitionEntryId) ?? []),
      ]
        .filter((fixture) => fixture.status === "finished")
        .sort((fixtureA, fixtureB) => {
          const kickoffA = fixtureA.kickoffAt?.getTime() ?? 0;
          const kickoffB = fixtureB.kickoffAt?.getTime() ?? 0;
          return kickoffB - kickoffA || fixtureB.matchweek - fixtureA.matchweek;
        })
        .slice(0, 5)
        .map((fixture) => ({
          fixtureId: fixture.id,
          matchweek: fixture.matchweek,
          points: pointsByFixtureId.get(fixture.id) ?? 0,
        }));
      return [
        {
          id: player.id,
          fantasyPlayerId: fantasyPlayer?.id ?? null,
          clubId: clubRow.club.id,
          photoUrl: player.photoUrl,
          name: localized(
            player.fullNameTh,
            player.fullNameEn,
            player.fullNameEn,
          ),
          shortName: localized(
            player.shortNameTh,
            player.shortNameEn,
            player.fullNameEn,
          ),
          club: club.name,
          clubShort: club.shortName,
          position,
          price: tier,
          points: matchPoints.reduce((sum, item) => sum + item.points, 0),
          form:
            recentPoints.length > 0
              ? Number(
                  (
                    recentPoints.reduce((sum, item) => sum + item.points, 0) /
                    recentPoints.length
                  ).toFixed(1),
                )
              : 0,
          selected:
            fantasyPlayer && selectionCount > 0
              ? Number(
                  (
                    ((ownershipByFantasyPlayer.get(fantasyPlayer.id) ?? 0) /
                      selectionCount) *
                    100
                  ).toFixed(1),
                )
              : 0,
          trend: "same" as const,
          tier,
          isThai: fantasyPlayer?.isThai ?? false,
          next,
          recentMatches,
          color,
          accent,
        },
      ];
    },
  );

  return {
    season: localized(season.nameTh, season.nameEn, "2026/27"),
    players: playerViews,
    fixtures: fixtureViews,
    clubs: clubViews.sort((a, b) => a.name.en.localeCompare(b.name.en)),
    matchweeks: [...new Set(fixtureViews.map((fixture) => fixture.matchweek))],
  };
}
