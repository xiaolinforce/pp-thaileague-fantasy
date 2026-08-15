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

function stableNumber(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return Math.abs(result >>> 0);
}

function toPosition(position: string): CompetitionPosition | null {
  if (position === "goalkeeper") return "GK";
  if (position === "defender") return "DEF";
  if (position === "midfielder") return "MID";
  if (position === "forward") return "FWD";
  return null;
}

function fantasyValues(id: string, position: CompetitionPosition) {
  const seed = stableNumber(id);
  const basePrice = { GK: 4, DEF: 4, MID: 5, FWD: 5.5 }[position];
  return {
    price: Number((basePrice + (seed % 46) / 10).toFixed(1)),
    points: 18 + (seed % 70),
    form: Number((3.5 + (seed % 55) / 10).toFixed(1)),
    selected: Number((1 + (seed % 380) / 10).toFixed(1)),
  };
}

function localized(th: string | null, en: string | null, fallback: string): LocalizedText {
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
      .leftJoin(
        clubVisualIdentities,
        eq(clubVisualIdentities.clubId, clubs.id),
      )
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
      shortName: localized(club.shortNameTh, club.shortNameEn, entry.abbreviation || club.nameEn),
      abbreviation: entry.abbreviation || club.abbreviation || club.nameEn.slice(0, 3).toUpperCase(),
      colors,
    };
    clubByEntry.set(entry.id, view);
    return view;
  });
  const venueById = new Map(venueRows.map((venue) => [venue.id, venue]));

  const fixtureViews: CompetitionFixtureView[] = fixtureRows.flatMap((fixture) => {
    const home = clubByEntry.get(fixture.homeEntryId);
    const away = clubByEntry.get(fixture.awayEntryId);
    if (!home || !away) return [];
    const venue = fixture.venueId ? venueById.get(fixture.venueId) : null;
    return [{
      id: fixture.id,
      matchweek: fixture.matchweek,
      kickoffAt: fixture.kickoffAt?.toISOString() ?? null,
      dateLabel: formatFixtureDate(fixture.kickoffAt),
      timeLabel: formatFixtureTime(fixture.kickoffAt),
      home,
      away,
      venue: venue ? localized(venue.nameTh, venue.nameEn, venue.nameTh) : null,
      status: fixture.status,
    }];
  });

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
      const position = toPosition(registration.registeredPosition || player.primaryPosition);
      const club = clubByEntry.get(registration.competitionEntryId);
      const clubRow = clubRowsByEntry.get(registration.competitionEntryId);
      if (!position || !club || !clubRow) return [];
      const nextFixture = (fixturesByEntry.get(registration.competitionEntryId) ?? [])[0];
      let next: LocalizedText = { th: "ยังไม่มีโปรแกรม", en: "No fixture" };
      if (nextFixture) {
        const isHome = nextFixture.homeEntryId === registration.competitionEntryId;
        const opponent = clubByEntry.get(isHome ? nextFixture.awayEntryId : nextFixture.homeEntryId);
        if (opponent) {
          next = {
            th: `${opponent.abbreviation} (${isHome ? "H" : "A"})`,
            en: `${opponent.abbreviation} (${isHome ? "H" : "A"})`,
          };
        }
      }
      const [color, accent] = club.colors;
      return [{
        id: player.id,
        photoUrl: player.photoUrl,
        name: localized(player.fullNameTh, player.fullNameEn, player.fullNameEn),
        club: club.name,
        clubShort: club.shortName,
        position,
        ...fantasyValues(player.id, position),
        next,
        color,
        accent,
      }];
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
