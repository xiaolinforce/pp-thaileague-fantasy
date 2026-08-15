import { loadEnvConfig } from "@next/env";
import { and, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import {
  clubs,
  clubVisualIdentities,
  competitionEntries,
  competitions,
  competitionSeasons,
  fixtures,
  playerRegistrations,
  players,
  seasons,
  venues,
} from "../src/db/schema";
import {
  fetchThaiLeagueSourceData,
  sourceUrls,
  THAI_LEAGUE_SOURCE,
  TRANSFERMARKT_SOURCE,
} from "./sources/thai-league-2026-27";
import { normalizeClubName } from "./sources/club-name-normalization";
import {
  CLUB_COLOR_SOURCE_NAME,
  clubVisualIdentitySources,
} from "./sources/club-visual-identities";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const db = drizzle(databaseUrl);
const BATCH_SIZE = 100;

function excluded(column: { name: string }) {
  return sql.raw(`excluded."${column.name}"`);
}

function chunk<T>(values: T[], size = BATCH_SIZE): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeWebsite(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function toKickoff(date: string, time: string | null): Date | null {
  if (!time) return null;

  const kickoff = new Date(`${date}T${time}:00+07:00`);
  return Number.isNaN(kickoff.getTime()) ? null : kickoff;
}

function toFixtureStatus(
  matchStatus: number,
  isCancelled: boolean,
  startTime: string | null,
): typeof fixtures.$inferInsert.status {
  if (isCancelled) return "cancelled";
  if (!startTime) return "time_tbc";
  if (matchStatus === 1) return "live";
  if (matchStatus >= 2) return "finished";
  return "scheduled";
}

async function seedCompetitionData() {
  console.log("Fetching Thai League 1 2026/27 source data...");
  const source = await fetchThaiLeagueSourceData();
  const now = new Date();
  const totalSquadRows = source.squads.reduce(
    (total, squad) => total + squad.players.length,
    0,
  );

  console.log(
    `Validated ${source.teams.length} teams, ${source.stadiums.length} venues, ${source.fixtures.length} fixtures, and ${totalSquadRows} squad rows.`,
  );

  const [competition] = await db
    .insert(competitions)
    .values({
      code: "THA1",
      nameTh: "ไทยลีก 1",
      nameEn: "Thai League 1",
      type: "league",
      countryCode: "TH",
      level: 1,
      logoUrl: source.tournament.logo,
      sourceName: THAI_LEAGUE_SOURCE,
      sourceUrl: sourceUrls.tournament,
      externalId: "thai-league-1",
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [competitions.sourceName, competitions.externalId],
      set: {
        code: "THA1",
        nameTh: "ไทยลีก 1",
        nameEn: "Thai League 1",
        type: "league",
        countryCode: "TH",
        level: 1,
        logoUrl: source.tournament.logo,
        sourceUrl: sourceUrls.tournament,
        updatedAt: now,
      },
    })
    .returning({ id: competitions.id });

  const [season] = await db
    .insert(seasons)
    .values({
      name: "2026/27",
      startsOn: source.season.start_date,
      endsOn: source.season.end_date,
      sourceName: THAI_LEAGUE_SOURCE,
      sourceUrl: `${sourceUrls.officialApi}season-dropdown-public/`,
      externalId: source.season.id.toString(),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [seasons.sourceName, seasons.externalId],
      set: {
        name: "2026/27",
        startsOn: source.season.start_date,
        endsOn: source.season.end_date,
        sourceUrl: `${sourceUrls.officialApi}season-dropdown-public/`,
        updatedAt: now,
      },
    })
    .returning({ id: seasons.id });

  const fixtureDates = source.fixtures
    .map((fixture) => fixture.start_date)
    .sort();
  const [competitionSeason] = await db
    .insert(competitionSeasons)
    .values({
      competitionId: competition.id,
      seasonId: season.id,
      nameTh: source.tournament.name,
      nameEn: source.tournament.name_en,
      status: "planned",
      startsOn: fixtureDates[0],
      endsOn: fixtureDates.at(-1) ?? source.tournament.end_date,
      logoUrl: source.tournament.logo,
      sourceName: THAI_LEAGUE_SOURCE,
      sourceUrl: sourceUrls.officialArticle,
      externalId: source.tournament.id.toString(),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [competitionSeasons.sourceName, competitionSeasons.externalId],
      set: {
        competitionId: competition.id,
        seasonId: season.id,
        nameTh: source.tournament.name,
        nameEn: source.tournament.name_en,
        status: "planned",
        startsOn: fixtureDates[0],
        endsOn: fixtureDates.at(-1) ?? source.tournament.end_date,
        logoUrl: source.tournament.logo,
        sourceUrl: sourceUrls.officialArticle,
        updatedAt: now,
      },
    })
    .returning({ id: competitionSeasons.id });

  const venueRows: (typeof venues.$inferInsert)[] = source.stadiums.map(
    (stadium) => ({
      nameTh: stadium.name,
      nameEn: stadium.name_en,
      provinceTh: stadium.province?.trim() || null,
      provinceEn: null,
      capacity: stadium.capacity,
      address: stadium.address?.trim() || null,
      latitude: stadium.latitude,
      longitude: stadium.longitude,
      photoUrl: stadium.photo,
      sourceName: THAI_LEAGUE_SOURCE,
      sourceUrl: `${sourceUrls.officialApi}stadium-public/${stadium.id}`,
      externalId: stadium.id.toString(),
      updatedAt: now,
    }),
  );

  for (const batch of chunk(venueRows)) {
    await db
      .insert(venues)
      .values(batch)
      .onConflictDoUpdate({
        target: [venues.sourceName, venues.externalId],
        set: {
          nameTh: excluded(venues.nameTh),
          nameEn: excluded(venues.nameEn),
          provinceTh: excluded(venues.provinceTh),
          provinceEn: excluded(venues.provinceEn),
          capacity: excluded(venues.capacity),
          address: excluded(venues.address),
          latitude: excluded(venues.latitude),
          longitude: excluded(venues.longitude),
          photoUrl: excluded(venues.photoUrl),
          sourceUrl: excluded(venues.sourceUrl),
          updatedAt: now,
        },
      });
  }

  const venueRecords = await db
    .select({ id: venues.id, externalId: venues.externalId })
    .from(venues)
    .where(
      and(
        eq(venues.sourceName, THAI_LEAGUE_SOURCE),
        inArray(
          venues.externalId,
          source.stadiums.map((stadium) => stadium.id.toString()),
        ),
      ),
    );
  const venueIdByExternalId = new Map(
    venueRecords.map((venue) => [venue.externalId, venue.id]),
  );

  const aliases = new Map<number, string>();
  for (const fixture of source.fixtures) {
    if (fixture.home_team_alias) {
      aliases.set(fixture.home_team, fixture.home_team_alias);
    }
    if (fixture.away_team_alias) {
      aliases.set(fixture.away_team, fixture.away_team_alias);
    }
  }

  const clubRows: (typeof clubs.$inferInsert)[] = source.teams.map((team) => {
    const nameEn = normalizeClubName(team.name_en);

    return {
      slug: slugify(nameEn),
      nameTh: team.name,
      nameEn,
      shortNameTh: team.name,
      shortNameEn: nameEn,
      abbreviation: aliases.get(team.id) ?? null,
      logoUrl: team.logo,
      websiteUrl: normalizeWebsite(team.website),
      isActive: true,
      sourceName: THAI_LEAGUE_SOURCE,
      sourceUrl: sourceUrls.teams,
      externalId: team.club.toString(),
      updatedAt: now,
    };
  });

  for (const batch of chunk(clubRows)) {
    await db
      .insert(clubs)
      .values(batch)
      .onConflictDoUpdate({
        target: [clubs.sourceName, clubs.externalId],
        set: {
          slug: excluded(clubs.slug),
          nameTh: excluded(clubs.nameTh),
          nameEn: excluded(clubs.nameEn),
          shortNameTh: excluded(clubs.shortNameTh),
          shortNameEn: excluded(clubs.shortNameEn),
          abbreviation: excluded(clubs.abbreviation),
          logoUrl: excluded(clubs.logoUrl),
          websiteUrl: excluded(clubs.websiteUrl),
          isActive: true,
          sourceUrl: excluded(clubs.sourceUrl),
          updatedAt: now,
        },
      });
  }

  const clubRecords = await db
    .select({ id: clubs.id, externalId: clubs.externalId, nameEn: clubs.nameEn })
    .from(clubs)
    .where(
      and(
        eq(clubs.sourceName, THAI_LEAGUE_SOURCE),
        inArray(
          clubs.externalId,
          source.teams.map((team) => team.club.toString()),
        ),
      ),
    );

  const visualIdentityByClubName = new Map(
    clubVisualIdentitySources.map((identity) => [identity.clubNameEn, identity]),
  );
  const missingVisualIdentities = clubRecords.filter(
    (club) => !visualIdentityByClubName.has(club.nameEn),
  );

  if (missingVisualIdentities.length) {
    throw new Error(
      `Visual identities are missing for: ${missingVisualIdentities.map((club) => club.nameEn).join(", ")}.`,
    );
  }

  const visualIdentityRows: (typeof clubVisualIdentities.$inferInsert)[] =
    clubRecords.map((club) => {
      const identity = visualIdentityByClubName.get(club.nameEn)!;

      return {
        clubId: club.id,
        topLeftColor: identity.colors[0],
        topRightColor: identity.colors[1],
        bottomLeftColor: identity.colors[2],
        bottomRightColor: identity.colors[3],
        sourceName: CLUB_COLOR_SOURCE_NAME,
        sourceUrl: identity.sourceUrl,
        notes: identity.notes,
        updatedAt: now,
      };
    });

  await db
    .insert(clubVisualIdentities)
    .values(visualIdentityRows)
    .onConflictDoUpdate({
      target: clubVisualIdentities.clubId,
      set: {
        topLeftColor: excluded(clubVisualIdentities.topLeftColor),
        topRightColor: excluded(clubVisualIdentities.topRightColor),
        bottomLeftColor: excluded(clubVisualIdentities.bottomLeftColor),
        bottomRightColor: excluded(clubVisualIdentities.bottomRightColor),
        sourceName: excluded(clubVisualIdentities.sourceName),
        sourceUrl: excluded(clubVisualIdentities.sourceUrl),
        notes: excluded(clubVisualIdentities.notes),
        updatedAt: now,
      },
    });

  const clubIdByExternalId = new Map(
    clubRecords.map((club) => [club.externalId, club.id]),
  );
  const entryRows: (typeof competitionEntries.$inferInsert)[] =
    source.teams.map((team) => {
      const clubId = clubIdByExternalId.get(team.club.toString());

      if (!clubId) {
        throw new Error(`Club record is missing for ${team.name_en}.`);
      }

      return {
        competitionSeasonId: competitionSeason.id,
        clubId,
        homeVenueId:
          venueIdByExternalId.get(team.stadium_id.toString()) ?? null,
        displayNameTh: team.name,
        displayNameEn: normalizeClubName(team.name_en),
        abbreviation: aliases.get(team.id) ?? null,
        logoUrl: team.logo,
        isActive: true,
        sourceName: THAI_LEAGUE_SOURCE,
        sourceUrl: sourceUrls.teams,
        externalId: team.id.toString(),
        updatedAt: now,
      };
    });

  for (const batch of chunk(entryRows)) {
    await db
      .insert(competitionEntries)
      .values(batch)
      .onConflictDoUpdate({
        target: [competitionEntries.sourceName, competitionEntries.externalId],
        set: {
          competitionSeasonId: competitionSeason.id,
          clubId: excluded(competitionEntries.clubId),
          homeVenueId: excluded(competitionEntries.homeVenueId),
          displayNameTh: excluded(competitionEntries.displayNameTh),
          displayNameEn: excluded(competitionEntries.displayNameEn),
          abbreviation: excluded(competitionEntries.abbreviation),
          logoUrl: excluded(competitionEntries.logoUrl),
          isActive: true,
          sourceUrl: excluded(competitionEntries.sourceUrl),
          updatedAt: now,
        },
      });
  }

  const entryRecords = await db
    .select({
      id: competitionEntries.id,
      externalId: competitionEntries.externalId,
    })
    .from(competitionEntries)
    .where(
      and(
        eq(competitionEntries.competitionSeasonId, competitionSeason.id),
        eq(competitionEntries.sourceName, THAI_LEAGUE_SOURCE),
      ),
    );
  const entryIdByExternalId = new Map(
    entryRecords.map((entry) => [entry.externalId, entry.id]),
  );
  const uniquePlayers = new Map<string, typeof players.$inferInsert>();

  for (const squad of source.squads) {
    for (const player of squad.players) {
      uniquePlayers.set(player.externalId, {
        fullNameTh: null,
        fullNameEn: player.fullNameEn,
        knownAs: null,
        birthDate: null,
        nationality: player.nationality,
        primaryPosition: player.position,
        positionDetail: player.positionDetail,
        photoUrl: player.photoUrl,
        isActive: true,
        sourceName: TRANSFERMARKT_SOURCE,
        sourceUrl: player.sourceUrl,
        externalId: player.externalId,
        updatedAt: now,
      });
    }
  }

  for (const batch of chunk(Array.from(uniquePlayers.values()))) {
    await db
      .insert(players)
      .values(batch)
      .onConflictDoUpdate({
        target: [players.sourceName, players.externalId],
        set: {
          fullNameEn: excluded(players.fullNameEn),
          nationality: excluded(players.nationality),
          primaryPosition: excluded(players.primaryPosition),
          positionDetail: excluded(players.positionDetail),
          photoUrl: excluded(players.photoUrl),
          isActive: true,
          sourceUrl: excluded(players.sourceUrl),
          updatedAt: now,
        },
      });
  }

  const playerRecords = await db
    .select({ id: players.id, externalId: players.externalId })
    .from(players)
    .where(
      and(
        eq(players.sourceName, TRANSFERMARKT_SOURCE),
        inArray(players.externalId, Array.from(uniquePlayers.keys())),
      ),
    );
  const playerIdByExternalId = new Map(
    playerRecords.map((player) => [player.externalId, player.id]),
  );
  const entryIds = entryRecords.map((entry) => entry.id);

  await db
    .update(playerRegistrations)
    .set({ status: "inactive", updatedAt: now })
    .where(
      and(
        eq(playerRegistrations.sourceName, TRANSFERMARKT_SOURCE),
        inArray(playerRegistrations.competitionEntryId, entryIds),
      ),
    );

  const registrationRows: (typeof playerRegistrations.$inferInsert)[] = [];
  for (const squad of source.squads) {
    const entryId = entryIdByExternalId.get(squad.tournamentTeamId.toString());

    if (!entryId) {
      throw new Error(
        `Competition entry is missing for tournament team ${squad.tournamentTeamId}.`,
      );
    }

    for (const player of squad.players) {
      const playerId = playerIdByExternalId.get(player.externalId);

      if (!playerId) {
        throw new Error(`Player record is missing for ${player.fullNameEn}.`);
      }

      registrationRows.push({
        competitionEntryId: entryId,
        playerId,
        shirtNumber: player.shirtNumber,
        registeredPosition: player.position,
        registeredFrom: source.season.start_date,
        registeredUntil: null,
        status: "active",
        sourceName: TRANSFERMARKT_SOURCE,
        sourceUrl: squad.sourceUrl,
        externalId: `2026:${squad.tournamentTeamId}:${player.externalId}`,
        updatedAt: now,
      });
    }
  }

  for (const batch of chunk(registrationRows)) {
    await db
      .insert(playerRegistrations)
      .values(batch)
      .onConflictDoUpdate({
        target: [
          playerRegistrations.sourceName,
          playerRegistrations.externalId,
        ],
        set: {
          competitionEntryId: excluded(playerRegistrations.competitionEntryId),
          playerId: excluded(playerRegistrations.playerId),
          shirtNumber: excluded(playerRegistrations.shirtNumber),
          registeredPosition: excluded(playerRegistrations.registeredPosition),
          registeredFrom: excluded(playerRegistrations.registeredFrom),
          registeredUntil: excluded(playerRegistrations.registeredUntil),
          status: "active",
          sourceUrl: excluded(playerRegistrations.sourceUrl),
          updatedAt: now,
        },
      });
  }

  const fixtureRows: (typeof fixtures.$inferInsert)[] = source.fixtures.map(
    (fixture) => {
      const homeEntryId = entryIdByExternalId.get(fixture.home_team.toString());
      const awayEntryId = entryIdByExternalId.get(fixture.away_team.toString());
      const status = toFixtureStatus(
        fixture.match_status,
        fixture.is_cancel,
        fixture.start_time,
      );

      if (!homeEntryId || !awayEntryId) {
        throw new Error(`Fixture ${fixture.id} references an unknown team.`);
      }

      return {
        competitionSeasonId: competitionSeason.id,
        homeEntryId,
        awayEntryId,
        venueId:
          fixture.stadium_name?.trim().toUpperCase() === "TBC" ||
          fixture.stadium === null
            ? null
            : (venueIdByExternalId.get(fixture.stadium.toString()) ?? null),
        matchNumber: fixture.match_no,
        matchweek: Number.parseInt(fixture.match_day_name, 10),
        kickoffAt: toKickoff(fixture.start_date, fixture.start_time),
        status,
        homeScore: status === "finished" ? fixture.home_goal_count : null,
        awayScore: status === "finished" ? fixture.away_goal_count : null,
        homePenaltyScore:
          status === "finished" && fixture.home_penalty_goal_count > 0
            ? fixture.home_penalty_goal_count
            : null,
        awayPenaltyScore:
          status === "finished" && fixture.away_penalty_goal_count > 0
            ? fixture.away_penalty_goal_count
            : null,
        attendance:
          status === "finished" && fixture.attendance_number > 0
            ? fixture.attendance_number
            : null,
        sourceName: THAI_LEAGUE_SOURCE,
        sourceUrl: `${sourceUrls.officialApi}match-day-match-public/${fixture.id}`,
        externalId: fixture.id.toString(),
        updatedAt: now,
      };
    },
  );

  for (const batch of chunk(fixtureRows)) {
    await db
      .insert(fixtures)
      .values(batch)
      .onConflictDoUpdate({
        target: [fixtures.sourceName, fixtures.externalId],
        set: {
          competitionSeasonId: competitionSeason.id,
          homeEntryId: excluded(fixtures.homeEntryId),
          awayEntryId: excluded(fixtures.awayEntryId),
          venueId: excluded(fixtures.venueId),
          matchNumber: excluded(fixtures.matchNumber),
          matchweek: excluded(fixtures.matchweek),
          kickoffAt: excluded(fixtures.kickoffAt),
          status: excluded(fixtures.status),
          homeScore: excluded(fixtures.homeScore),
          awayScore: excluded(fixtures.awayScore),
          homePenaltyScore: excluded(fixtures.homePenaltyScore),
          awayPenaltyScore: excluded(fixtures.awayPenaltyScore),
          attendance: excluded(fixtures.attendance),
          sourceUrl: excluded(fixtures.sourceUrl),
          updatedAt: now,
        },
      });
  }

  console.log("Competition data seed completed.");
  console.log(`Competition seasons: 1`);
  console.log(`Clubs and entries: ${entryRows.length}`);
  console.log(`Club visual identities: ${visualIdentityRows.length}`);
  console.log(`Venues: ${venueRows.length}`);
  console.log(`Unique players: ${uniquePlayers.size}`);
  console.log(`Active registrations: ${registrationRows.length}`);
  console.log(`Fixtures: ${fixtureRows.length}`);
}

seedCompetitionData().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
