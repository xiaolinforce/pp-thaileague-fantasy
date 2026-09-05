import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { connection } from "next/server";

import { db } from "@/db";
import {
  clubs,
  clubVisualIdentities,
  competitionEntries,
  competitionSeasons,
  fantasyGameweeks,
  fantasySeasons,
  fixtures,
  venues,
} from "@/db/schema";
import type {
  ClubColorPalette,
  CompetitionClubView,
  CompetitionDataset,
  CompetitionFixtureView,
  LocalizedText,
} from "@/lib/competition-types";
import { getInitialFixtureMatchweek } from "@/lib/fixture-matchweeks";
import { logServerTiming } from "@/lib/server/performance";

const COMPETITION_SEASON_EXTERNAL_ID = "224";
const DEFAULT_CLUB_COLORS: ClubColorPalette = [
  "#E7E5E4",
  "#D6D3D1",
  "#D6D3D1",
  "#E7E5E4",
];

export type FixturesDataset = Pick<
  CompetitionDataset,
  "fixtures" | "matchweeks" | "currentGameweek"
>;

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

async function loadFixturesDataset(): Promise<FixturesDataset> {
  const startedAt = Date.now();
  const season = await db.query.competitionSeasons.findFirst({
    where: eq(competitionSeasons.externalId, COMPETITION_SEASON_EXTERNAL_ID),
  });
  if (!season) throw new Error("Competition season 2026/27 was not found.");

  const [entryRows, fixtureRows, venueRows, fantasySeason] = await Promise.all([
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
    db.query.fantasySeasons.findFirst({
      where: eq(fantasySeasons.competitionSeasonId, season.id),
    }),
  ]);
  const gameweeks = fantasySeason
    ? await db
        .select()
        .from(fantasyGameweeks)
        .where(eq(fantasyGameweeks.fantasySeasonId, fantasySeason.id))
        .orderBy(asc(fantasyGameweeks.number))
    : [];
  const initialFixtureMatchweek = getInitialFixtureMatchweek(fixtureRows);
  const currentGameweek =
    initialFixtureMatchweek !== null
      ? { number: initialFixtureMatchweek }
      : (gameweeks.find((gameweek) => gameweek.status === "open") ??
        gameweeks.find((gameweek) => gameweek.status === "planned") ??
        gameweeks.at(-1));

  const clubByEntry = new Map<string, CompetitionClubView>();
  for (const { entry, club, visualIdentity } of entryRows) {
    const colors: ClubColorPalette = visualIdentity
      ? [
          visualIdentity.topLeftColor,
          visualIdentity.topRightColor,
          visualIdentity.bottomLeftColor,
          visualIdentity.bottomRightColor,
        ]
      : DEFAULT_CLUB_COLORS;
    clubByEntry.set(entry.id, {
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
    });
  }
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
          homeScore: fixture.homeScore,
          awayScore: fixture.awayScore,
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
  const dataset = {
    fixtures: fixtureViews,
    matchweeks: [...new Set(fixtureViews.map((fixture) => fixture.matchweek))],
    currentGameweek: currentGameweek?.number ?? null,
  } satisfies FixturesDataset;
  logServerTiming("fixtures.dataset", startedAt, {
    fixtures: dataset.fixtures.length,
  });
  return dataset;
}

const getCachedFixturesDataset = unstable_cache(
  loadFixturesDataset,
  ["fixtures-dataset-v1"],
  { revalidate: 300, tags: ["fixtures-dataset"] },
);

export async function getFixturesDataset(): Promise<FixturesDataset> {
  await connection();
  return getCachedFixturesDataset();
}
