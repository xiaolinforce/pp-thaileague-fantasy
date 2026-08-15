import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const competitionTypeEnum = pgEnum("competition_type", [
  "league",
  "cup",
]);

export const competitionSeasonStatusEnum = pgEnum("competition_season_status", [
  "planned",
  "active",
  "completed",
  "cancelled",
]);

export const playerPositionEnum = pgEnum("player_position", [
  "goalkeeper",
  "defender",
  "midfielder",
  "forward",
  "unknown",
]);

export const playerRegistrationStatusEnum = pgEnum(
  "player_registration_status",
  ["active", "inactive"],
);

export const fixtureStatusEnum = pgEnum("fixture_status", [
  "scheduled",
  "time_tbc",
  "live",
  "finished",
  "postponed",
  "cancelled",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const competitions = pgTable(
  "competitions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 32 }).notNull(),
    nameTh: text("name_th").notNull(),
    nameEn: text("name_en").notNull(),
    type: competitionTypeEnum("type").default("league").notNull(),
    countryCode: varchar("country_code", { length: 2 }).default("TH").notNull(),
    level: smallint("level"),
    logoUrl: text("logo_url"),
    sourceName: text("source_name").notNull(),
    sourceUrl: text("source_url").notNull(),
    externalId: text("external_id").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("competitions_code_unique").on(table.code),
    uniqueIndex("competitions_source_external_unique").on(
      table.sourceName,
      table.externalId,
    ),
  ],
);

export const seasons = pgTable(
  "seasons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 16 }).notNull(),
    startsOn: date("starts_on", { mode: "string" }).notNull(),
    endsOn: date("ends_on", { mode: "string" }).notNull(),
    sourceName: text("source_name").notNull(),
    sourceUrl: text("source_url").notNull(),
    externalId: text("external_id").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("seasons_name_unique").on(table.name),
    uniqueIndex("seasons_source_external_unique").on(
      table.sourceName,
      table.externalId,
    ),
    check(
      "seasons_date_order_check",
      sql`${table.endsOn} >= ${table.startsOn}`,
    ),
  ],
);

export const competitionSeasons = pgTable(
  "competition_seasons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    competitionId: uuid("competition_id")
      .notNull()
      .references(() => competitions.id, { onDelete: "cascade" }),
    seasonId: uuid("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    nameTh: text("name_th").notNull(),
    nameEn: text("name_en").notNull(),
    status: competitionSeasonStatusEnum("status").default("planned").notNull(),
    startsOn: date("starts_on", { mode: "string" }).notNull(),
    endsOn: date("ends_on", { mode: "string" }).notNull(),
    logoUrl: text("logo_url"),
    sourceName: text("source_name").notNull(),
    sourceUrl: text("source_url").notNull(),
    externalId: text("external_id").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("competition_seasons_competition_season_unique").on(
      table.competitionId,
      table.seasonId,
    ),
    uniqueIndex("competition_seasons_source_external_unique").on(
      table.sourceName,
      table.externalId,
    ),
    index("competition_seasons_status_idx").on(table.status),
    check(
      "competition_seasons_date_order_check",
      sql`${table.endsOn} >= ${table.startsOn}`,
    ),
  ],
);

export const venues = pgTable(
  "venues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nameTh: text("name_th").notNull(),
    nameEn: text("name_en"),
    provinceTh: text("province_th"),
    provinceEn: text("province_en"),
    capacity: integer("capacity"),
    address: text("address"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    photoUrl: text("photo_url"),
    sourceName: text("source_name").notNull(),
    sourceUrl: text("source_url").notNull(),
    externalId: text("external_id").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("venues_source_external_unique").on(
      table.sourceName,
      table.externalId,
    ),
    index("venues_name_th_idx").on(table.nameTh),
    check(
      "venues_capacity_nonnegative_check",
      sql`${table.capacity} is null or ${table.capacity} >= 0`,
    ),
    check(
      "venues_latitude_range_check",
      sql`${table.latitude} is null or (${table.latitude} >= -90 and ${table.latitude} <= 90)`,
    ),
    check(
      "venues_longitude_range_check",
      sql`${table.longitude} is null or (${table.longitude} >= -180 and ${table.longitude} <= 180)`,
    ),
  ],
);

export const clubs = pgTable(
  "clubs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull(),
    nameTh: text("name_th").notNull(),
    nameEn: text("name_en").notNull(),
    shortNameTh: text("short_name_th"),
    shortNameEn: text("short_name_en"),
    abbreviation: varchar("abbreviation", { length: 24 }),
    logoUrl: text("logo_url"),
    websiteUrl: text("website_url"),
    isActive: boolean("is_active").default(true).notNull(),
    sourceName: text("source_name").notNull(),
    sourceUrl: text("source_url").notNull(),
    externalId: text("external_id").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("clubs_slug_unique").on(table.slug),
    uniqueIndex("clubs_source_external_unique").on(
      table.sourceName,
      table.externalId,
    ),
    index("clubs_name_th_idx").on(table.nameTh),
    index("clubs_name_en_idx").on(table.nameEn),
  ],
);

export const clubVisualIdentities = pgTable(
  "club_visual_identities",
  {
    clubId: uuid("club_id")
      .primaryKey()
      .references(() => clubs.id, { onDelete: "cascade" }),
    topLeftColor: varchar("top_left_color", { length: 7 }).notNull(),
    topRightColor: varchar("top_right_color", { length: 7 }).notNull(),
    bottomLeftColor: varchar("bottom_left_color", { length: 7 }).notNull(),
    bottomRightColor: varchar("bottom_right_color", { length: 7 }).notNull(),
    sourceName: text("source_name").notNull(),
    sourceUrl: text("source_url").notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    check(
      "club_visual_identities_top_left_hex_check",
      sql`${table.topLeftColor} ~ '^#[0-9A-Fa-f]{6}$'`,
    ),
    check(
      "club_visual_identities_top_right_hex_check",
      sql`${table.topRightColor} ~ '^#[0-9A-Fa-f]{6}$'`,
    ),
    check(
      "club_visual_identities_bottom_left_hex_check",
      sql`${table.bottomLeftColor} ~ '^#[0-9A-Fa-f]{6}$'`,
    ),
    check(
      "club_visual_identities_bottom_right_hex_check",
      sql`${table.bottomRightColor} ~ '^#[0-9A-Fa-f]{6}$'`,
    ),
  ],
);

export const competitionEntries = pgTable(
  "competition_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    competitionSeasonId: uuid("competition_season_id")
      .notNull()
      .references(() => competitionSeasons.id, { onDelete: "cascade" }),
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "restrict" }),
    homeVenueId: uuid("home_venue_id").references(() => venues.id, {
      onDelete: "set null",
    }),
    displayNameTh: text("display_name_th").notNull(),
    displayNameEn: text("display_name_en").notNull(),
    abbreviation: varchar("abbreviation", { length: 24 }),
    logoUrl: text("logo_url"),
    isActive: boolean("is_active").default(true).notNull(),
    sourceName: text("source_name").notNull(),
    sourceUrl: text("source_url").notNull(),
    externalId: text("external_id").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("competition_entries_season_club_unique").on(
      table.competitionSeasonId,
      table.clubId,
    ),
    uniqueIndex("competition_entries_source_external_unique").on(
      table.sourceName,
      table.externalId,
    ),
    index("competition_entries_competition_season_idx").on(
      table.competitionSeasonId,
    ),
  ],
);

export const players = pgTable(
  "players",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullNameTh: text("full_name_th"),
    fullNameEn: text("full_name_en").notNull(),
    knownAs: text("known_as"),
    birthDate: date("birth_date", { mode: "string" }),
    nationality: text("nationality"),
    primaryPosition: playerPositionEnum("primary_position")
      .default("unknown")
      .notNull(),
    positionDetail: text("position_detail"),
    photoUrl: text("photo_url"),
    isActive: boolean("is_active").default(true).notNull(),
    sourceName: text("source_name").notNull(),
    sourceUrl: text("source_url").notNull(),
    externalId: text("external_id").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("players_source_external_unique").on(
      table.sourceName,
      table.externalId,
    ),
    index("players_full_name_en_idx").on(table.fullNameEn),
    index("players_primary_position_idx").on(table.primaryPosition),
  ],
);

export const playerRegistrations = pgTable(
  "player_registrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    competitionEntryId: uuid("competition_entry_id")
      .notNull()
      .references(() => competitionEntries.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    shirtNumber: smallint("shirt_number"),
    registeredPosition: playerPositionEnum("registered_position")
      .default("unknown")
      .notNull(),
    registeredFrom: date("registered_from", { mode: "string" }).notNull(),
    registeredUntil: date("registered_until", { mode: "string" }),
    status: playerRegistrationStatusEnum("status").default("active").notNull(),
    sourceName: text("source_name").notNull(),
    sourceUrl: text("source_url").notNull(),
    externalId: text("external_id").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("player_registrations_source_external_unique").on(
      table.sourceName,
      table.externalId,
    ),
    uniqueIndex("player_registrations_entry_player_from_unique").on(
      table.competitionEntryId,
      table.playerId,
      table.registeredFrom,
    ),
    index("player_registrations_entry_status_idx").on(
      table.competitionEntryId,
      table.status,
    ),
    index("player_registrations_player_idx").on(table.playerId),
    check(
      "player_registrations_shirt_number_check",
      sql`${table.shirtNumber} is null or (${table.shirtNumber} >= 0 and ${table.shirtNumber} <= 999)`,
    ),
    check(
      "player_registrations_date_order_check",
      sql`${table.registeredUntil} is null or ${table.registeredUntil} >= ${table.registeredFrom}`,
    ),
  ],
);

export const fixtures = pgTable(
  "fixtures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    competitionSeasonId: uuid("competition_season_id")
      .notNull()
      .references(() => competitionSeasons.id, { onDelete: "cascade" }),
    homeEntryId: uuid("home_entry_id")
      .notNull()
      .references(() => competitionEntries.id, { onDelete: "restrict" }),
    awayEntryId: uuid("away_entry_id")
      .notNull()
      .references(() => competitionEntries.id, { onDelete: "restrict" }),
    venueId: uuid("venue_id").references(() => venues.id, {
      onDelete: "set null",
    }),
    matchNumber: integer("match_number"),
    matchweek: smallint("matchweek").notNull(),
    kickoffAt: timestamp("kickoff_at", { withTimezone: true }),
    status: fixtureStatusEnum("status").default("scheduled").notNull(),
    homeScore: smallint("home_score"),
    awayScore: smallint("away_score"),
    homePenaltyScore: smallint("home_penalty_score"),
    awayPenaltyScore: smallint("away_penalty_score"),
    attendance: integer("attendance"),
    sourceName: text("source_name").notNull(),
    sourceUrl: text("source_url").notNull(),
    externalId: text("external_id").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("fixtures_source_external_unique").on(
      table.sourceName,
      table.externalId,
    ),
    uniqueIndex("fixtures_season_teams_unique").on(
      table.competitionSeasonId,
      table.homeEntryId,
      table.awayEntryId,
    ),
    index("fixtures_season_kickoff_idx").on(
      table.competitionSeasonId,
      table.kickoffAt,
    ),
    index("fixtures_season_matchweek_idx").on(
      table.competitionSeasonId,
      table.matchweek,
    ),
    index("fixtures_home_entry_idx").on(table.homeEntryId),
    index("fixtures_away_entry_idx").on(table.awayEntryId),
    index("fixtures_status_idx").on(table.status),
    check(
      "fixtures_distinct_teams_check",
      sql`${table.homeEntryId} <> ${table.awayEntryId}`,
    ),
    check(
      "fixtures_scores_nonnegative_check",
      sql`(${table.homeScore} is null or ${table.homeScore} >= 0) and (${table.awayScore} is null or ${table.awayScore} >= 0) and (${table.homePenaltyScore} is null or ${table.homePenaltyScore} >= 0) and (${table.awayPenaltyScore} is null or ${table.awayPenaltyScore} >= 0)`,
    ),
    check(
      "fixtures_attendance_nonnegative_check",
      sql`${table.attendance} is null or ${table.attendance} >= 0`,
    ),
  ],
);
