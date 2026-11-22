import "server-only";

import { and, asc, eq, isNotNull } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { connection } from "next/server";

import { db } from "@/db";
import {
  clubs,
  clubVisualIdentities,
  competitionEntries,
  competitionSeasons,
  competitionStandings,
  fixtures,
} from "@/db/schema";
import type {
  ClubColorPalette,
  CompetitionClubView,
  LocalizedText,
} from "@/lib/competition-types";
import {
  compareStandings,
  EMPTY_STANDING_COUNTS,
  recentForm,
  standingsFromResults,
  type FormResult,
  type MatchResult,
  type StandingEntryInput,
} from "@/lib/fantasy/competition-standings";

export const STANDINGS_CACHE_TAG = "competition-standings";
const COMPETITION_SEASON_EXTERNAL_ID = "224";
const DEFAULT_CLUB_COLORS: ClubColorPalette = [
  "#E7E5E4",
  "#D6D3D1",
  "#D6D3D1",
  "#E7E5E4",
];

export type LeagueTableRow = {
  entryId: string;
  position: number;
  club: CompetitionClubView;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  pointsAdjustment: number;
  points: number;
  form: FormResult[];
};

export type LeagueTableData = {
  rows: LeagueTableRow[];
  throughMatchweek: number | null;
  updatedAt: string | null;
};

export type AdminStandingsClub = {
  entryId: string;
  name: LocalizedText;
  colors: ClubColorPalette;
};

export type AdminStandingsEditorData = {
  clubs: AdminStandingsClub[];
  /** Saved table in position order, or every club at zero when none exists. */
  rows: StandingEntryInput[];
  throughMatchweek: number | null;
  updatedAt: string | null;
  updatedBy: string | null;
  saved: boolean;
  /** Suggested table built from completed fixtures with recorded scores. */
  fromResults: {
    rows: StandingEntryInput[];
    throughMatchweek: number | null;
    resultCount: number;
  };
};

function localized(
  th: string | null,
  en: string | null,
  fallback: string,
): LocalizedText {
  return { th: th || en || fallback, en: en || th || fallback };
}

export async function getCompetitionSeasonId() {
  const season = await db.query.competitionSeasons.findFirst({
    columns: { id: true },
    where: eq(competitionSeasons.externalId, COMPETITION_SEASON_EXTERNAL_ID),
  });
  if (!season) throw new Error("Competition season 2026/27 was not found.");
  return season.id;
}

async function loadClubs(seasonId: string) {
  const rows = await db
    .select({
      entry: competitionEntries,
      club: clubs,
      identity: clubVisualIdentities,
    })
    .from(competitionEntries)
    .innerJoin(clubs, eq(competitionEntries.clubId, clubs.id))
    .leftJoin(clubVisualIdentities, eq(clubVisualIdentities.clubId, clubs.id))
    .where(
      and(
        eq(competitionEntries.competitionSeasonId, seasonId),
        eq(competitionEntries.isActive, true),
      ),
    );
  return new Map<string, CompetitionClubView>(
    rows.map(({ entry, club, identity }) => [
      entry.id,
      {
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
        colors: identity
          ? [
              identity.topLeftColor,
              identity.topRightColor,
              identity.bottomLeftColor,
              identity.bottomRightColor,
            ]
          : DEFAULT_CLUB_COLORS,
      },
    ]),
  );
}

/** Completed fixtures with scores, oldest first. */
async function loadResults(seasonId: string) {
  const rows = await db
    .select({
      homeEntryId: fixtures.homeEntryId,
      awayEntryId: fixtures.awayEntryId,
      homeScore: fixtures.homeScore,
      awayScore: fixtures.awayScore,
      matchweek: fixtures.matchweek,
    })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.competitionSeasonId, seasonId),
        eq(fixtures.status, "finished"),
        isNotNull(fixtures.homeScore),
        isNotNull(fixtures.awayScore),
      ),
    )
    .orderBy(asc(fixtures.kickoffAt), asc(fixtures.matchweek));
  return rows.map((row) => ({
    homeEntryId: row.homeEntryId,
    awayEntryId: row.awayEntryId,
    homeScore: row.homeScore ?? 0,
    awayScore: row.awayScore ?? 0,
    matchweek: row.matchweek,
  })) satisfies Array<MatchResult & { matchweek: number }>;
}

async function loadSavedStandings(seasonId: string) {
  return db
    .select()
    .from(competitionStandings)
    .where(eq(competitionStandings.competitionSeasonId, seasonId))
    .orderBy(asc(competitionStandings.position));
}

async function loadLeagueTable(): Promise<LeagueTableData> {
  const seasonId = await getCompetitionSeasonId();
  const [clubByEntry, results, saved] = await Promise.all([
    loadClubs(seasonId),
    loadResults(seasonId),
    loadSavedStandings(seasonId),
  ]);
  const rows = saved.flatMap((row): LeagueTableRow[] => {
    const club = clubByEntry.get(row.competitionEntryId);
    if (!club) return [];
    return [
      {
        entryId: row.competitionEntryId,
        position: row.position,
        club,
        played: row.played,
        won: row.won,
        drawn: row.drawn,
        lost: row.lost,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        goalDifference: row.goalsFor - row.goalsAgainst,
        pointsAdjustment: row.pointsAdjustment,
        points: row.points,
        form: recentForm(row.competitionEntryId, results),
      },
    ];
  });
  const latest = saved.reduce<Date | null>(
    (max, row) => (!max || row.updatedAt > max ? row.updatedAt : max),
    null,
  );
  return {
    rows,
    throughMatchweek: saved[0]?.throughMatchweek ?? null,
    updatedAt: latest?.toISOString() ?? null,
  };
}

const getCachedLeagueTable = unstable_cache(
  loadLeagueTable,
  ["competition-standings-table-v1"],
  { revalidate: 300, tags: [STANDINGS_CACHE_TAG, "fixtures-dataset"] },
);

export async function getLeagueTable(): Promise<LeagueTableData> {
  await connection();
  return getCachedLeagueTable();
}

export async function getAdminStandingsEditor(): Promise<AdminStandingsEditorData> {
  await connection();
  const seasonId = await getCompetitionSeasonId();
  const [clubByEntry, results, saved] = await Promise.all([
    loadClubs(seasonId),
    loadResults(seasonId),
    loadSavedStandings(seasonId),
  ]);
  const clubList = [...clubByEntry.entries()]
    .map(([entryId, club]) => ({
      entryId,
      name: club.name,
      colors: club.colors,
    }))
    .sort((a, b) => a.name.th.localeCompare(b.name.th, "th"));
  const entryIds = clubList.map((club) => club.entryId);
  const order = new Map(clubList.map((club, index) => [club.entryId, index]));

  const savedRows = saved
    .filter((row) => clubByEntry.has(row.competitionEntryId))
    .map((row) => ({
      entryId: row.competitionEntryId,
      won: row.won,
      drawn: row.drawn,
      lost: row.lost,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
      pointsAdjustment: row.pointsAdjustment,
    }));
  // Clubs added after the last save join the bottom of the table at zero.
  const savedIds = new Set(savedRows.map((row) => row.entryId));
  const rows = [
    ...savedRows,
    ...entryIds
      .filter((id) => !savedIds.has(id))
      .map((entryId) => ({ entryId, ...EMPTY_STANDING_COUNTS })),
  ];

  const computed = standingsFromResults(entryIds, results);
  const computedRows = entryIds
    .map((entryId) => ({
      entryId,
      ...(computed.get(entryId) ?? EMPTY_STANDING_COUNTS),
    }))
    .sort(
      (a, b) =>
        compareStandings(a, b) ||
        (order.get(a.entryId) ?? 0) - (order.get(b.entryId) ?? 0),
    );
  const lastSaved = saved.reduce<(typeof saved)[number] | null>(
    (max, row) => (!max || row.updatedAt > max.updatedAt ? row : max),
    null,
  );

  return {
    clubs: clubList,
    rows,
    throughMatchweek: saved[0]?.throughMatchweek ?? null,
    updatedAt: lastSaved?.updatedAt.toISOString() ?? null,
    updatedBy: lastSaved?.updatedBy ?? null,
    saved: saved.length > 0,
    fromResults: {
      rows: computedRows,
      throughMatchweek: results.reduce<number | null>(
        (max, r) => (max === null || r.matchweek > max ? r.matchweek : max),
        null,
      ),
      resultCount: results.length,
    },
  };
}
