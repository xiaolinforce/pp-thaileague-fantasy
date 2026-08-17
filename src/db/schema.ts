import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
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

export const fantasyGameweekStatusEnum = pgEnum("fantasy_gameweek_status", [
  "planned",
  "open",
  "locked",
  "provisional",
  "final",
]);

export const fantasySelectionStatusEnum = pgEnum("fantasy_selection_status", [
  "draft",
  "locked",
]);

export const fantasyChipEnum = pgEnum("fantasy_chip", [
  "triple_captain",
  "bench_boost",
  "wildcard",
]);

export const fantasyLineupRoleEnum = pgEnum("fantasy_lineup_role", [
  "starter",
  "bench",
]);

export const fantasyCaptainRoleEnum = pgEnum("fantasy_captain_role", [
  "none",
  "captain",
  "vice_captain",
]);

export const fantasyRevisionStatusEnum = pgEnum("fantasy_revision_status", [
  "confirmed",
  "cancelled",
]);

export const fantasyStatsStatusEnum = pgEnum("fantasy_stats_status", [
  "imported",
  "reviewed",
  "corrected",
]);

export const fantasyScoreStatusEnum = pgEnum("fantasy_score_status", [
  "provisional",
  "final",
]);

export const fantasyLeagueTypeEnum = pgEnum("fantasy_league_type", [
  "overall",
  "private",
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

export const fantasySeasons = pgTable(
  "fantasy_seasons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    competitionSeasonId: uuid("competition_season_id")
      .notNull()
      .references(() => competitionSeasons.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 80 }).notNull(),
    nameTh: text("name_th").notNull(),
    nameEn: text("name_en").notNull(),
    squadSize: smallint("squad_size").default(15).notNull(),
    sameClubLimit: smallint("same_club_limit").default(3).notNull(),
    foreignPlayerLimit: smallint("foreign_player_limit").default(7).notNull(),
    weeklyFreeTransfers: smallint("weekly_free_transfers").default(2).notNull(),
    maximumFreeTransfers: smallint("maximum_free_transfers")
      .default(4)
      .notNull(),
    transferPointCost: smallint("transfer_point_cost").default(4).notNull(),
    deadlineOffsetMinutes: smallint("deadline_offset_minutes")
      .default(90)
      .notNull(),
    chipUsesPerSeason: smallint("chip_uses_per_season").default(2).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("fantasy_seasons_competition_season_unique").on(
      table.competitionSeasonId,
    ),
    uniqueIndex("fantasy_seasons_slug_unique").on(table.slug),
    check("fantasy_seasons_squad_size_check", sql`${table.squadSize} > 0`),
    check(
      "fantasy_seasons_limits_check",
      sql`${table.sameClubLimit} > 0 and ${table.foreignPlayerLimit} >= 0 and ${table.weeklyFreeTransfers} >= 0 and ${table.maximumFreeTransfers} >= ${table.weeklyFreeTransfers}`,
    ),
    check(
      "fantasy_seasons_transfer_cost_check",
      sql`${table.transferPointCost} >= 0 and ${table.deadlineOffsetMinutes} >= 0 and ${table.chipUsesPerSeason} > 0`,
    ),
  ],
);

export const fantasyGameweeks = pgTable(
  "fantasy_gameweeks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fantasySeasonId: uuid("fantasy_season_id")
      .notNull()
      .references(() => fantasySeasons.id, { onDelete: "cascade" }),
    number: smallint("number").notNull(),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }).notNull(),
    status: fantasyGameweekStatusEnum("status").default("planned").notNull(),
    scoreComplete: boolean("score_complete").default(false).notNull(),
    finalizedAt: timestamp("finalized_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("fantasy_gameweeks_season_number_unique").on(
      table.fantasySeasonId,
      table.number,
    ),
    index("fantasy_gameweeks_deadline_idx").on(table.deadlineAt),
    index("fantasy_gameweeks_status_idx").on(table.status),
    check("fantasy_gameweeks_number_check", sql`${table.number} > 0`),
  ],
);

export const fantasyTierDefinitions = pgTable(
  "fantasy_tier_definitions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fantasySeasonId: uuid("fantasy_season_id")
      .notNull()
      .references(() => fantasySeasons.id, { onDelete: "cascade" }),
    level: smallint("level").notNull(),
    slotCount: smallint("slot_count").notNull(),
    nameTh: text("name_th").notNull(),
    nameEn: text("name_en").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("fantasy_tier_definitions_season_level_unique").on(
      table.fantasySeasonId,
      table.level,
    ),
    check(
      "fantasy_tier_definitions_values_check",
      sql`${table.level} > 0 and ${table.slotCount} >= 0`,
    ),
  ],
);

export const fantasyPlayers = pgTable(
  "fantasy_players",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fantasySeasonId: uuid("fantasy_season_id")
      .notNull()
      .references(() => fantasySeasons.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "restrict" }),
    lockedPosition: playerPositionEnum("locked_position").notNull(),
    isThai: boolean("is_thai").default(false).notNull(),
    isAvailable: boolean("is_available").default(true).notNull(),
    nationalitySource: text("nationality_source"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("fantasy_players_season_player_unique").on(
      table.fantasySeasonId,
      table.playerId,
    ),
    index("fantasy_players_season_available_idx").on(
      table.fantasySeasonId,
      table.isAvailable,
    ),
  ],
);

export const fantasyPlayerTiers = pgTable(
  "fantasy_player_tiers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fantasyPlayerId: uuid("fantasy_player_id")
      .notNull()
      .references(() => fantasyPlayers.id, { onDelete: "cascade" }),
    effectiveGameweekId: uuid("effective_gameweek_id")
      .notNull()
      .references(() => fantasyGameweeks.id, { onDelete: "restrict" }),
    level: smallint("level").notNull(),
    sourceName: text("source_name").notNull(),
    reason: text("reason"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("fantasy_player_tiers_player_gameweek_unique").on(
      table.fantasyPlayerId,
      table.effectiveGameweekId,
    ),
    index("fantasy_player_tiers_gameweek_idx").on(table.effectiveGameweekId),
    check("fantasy_player_tiers_level_check", sql`${table.level} > 0`),
  ],
);

export const fantasyManagers = pgTable(
  "fantasy_managers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    displayName: text("display_name").notNull(),
    isDemo: boolean("is_demo").default(true).notNull(),
    ...timestamps,
  },
  (table) => [index("fantasy_managers_demo_idx").on(table.isDemo)],
);

export const fantasyTeams = pgTable(
  "fantasy_teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fantasySeasonId: uuid("fantasy_season_id")
      .notNull()
      .references(() => fantasySeasons.id, { onDelete: "cascade" }),
    managerId: uuid("manager_id")
      .notNull()
      .references(() => fantasyManagers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    freeTransfers: smallint("free_transfers").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("fantasy_teams_season_manager_unique").on(
      table.fantasySeasonId,
      table.managerId,
    ),
    index("fantasy_teams_season_active_idx").on(
      table.fantasySeasonId,
      table.isActive,
    ),
    check(
      "fantasy_teams_free_transfers_check",
      sql`${table.freeTransfers} >= 0`,
    ),
  ],
);

export const fantasyTeamSelections = pgTable(
  "fantasy_team_selections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fantasyTeamId: uuid("fantasy_team_id")
      .notNull()
      .references(() => fantasyTeams.id, { onDelete: "cascade" }),
    fantasyGameweekId: uuid("fantasy_gameweek_id")
      .notNull()
      .references(() => fantasyGameweeks.id, { onDelete: "cascade" }),
    status: fantasySelectionStatusEnum("status").default("draft").notNull(),
    activeChip: fantasyChipEnum("active_chip"),
    freeTransfersBefore: smallint("free_transfers_before").default(0).notNull(),
    freeTransfersAfter: smallint("free_transfers_after"),
    netTransferCount: smallint("net_transfer_count").default(0).notNull(),
    transferPoints: smallint("transfer_points").default(0).notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("fantasy_team_selections_team_gameweek_unique").on(
      table.fantasyTeamId,
      table.fantasyGameweekId,
    ),
    index("fantasy_team_selections_gameweek_status_idx").on(
      table.fantasyGameweekId,
      table.status,
    ),
    check(
      "fantasy_team_selections_transfer_values_check",
      sql`${table.freeTransfersBefore} >= 0 and (${table.freeTransfersAfter} is null or ${table.freeTransfersAfter} >= 0) and ${table.netTransferCount} >= 0 and ${table.transferPoints} >= 0`,
    ),
  ],
);

export const fantasyTeamSelectionPlayers = pgTable(
  "fantasy_team_selection_players",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    selectionId: uuid("selection_id")
      .notNull()
      .references(() => fantasyTeamSelections.id, { onDelete: "cascade" }),
    fantasyPlayerId: uuid("fantasy_player_id")
      .notNull()
      .references(() => fantasyPlayers.id, { onDelete: "restrict" }),
    clubIdSnapshot: uuid("club_id_snapshot")
      .notNull()
      .references(() => clubs.id, { onDelete: "restrict" }),
    positionSnapshot: playerPositionEnum("position_snapshot").notNull(),
    tierSnapshot: smallint("tier_snapshot").notNull(),
    isThaiSnapshot: boolean("is_thai_snapshot").notNull(),
    lineupRole: fantasyLineupRoleEnum("lineup_role").notNull(),
    benchOrder: smallint("bench_order"),
    captainRole: fantasyCaptainRoleEnum("captain_role")
      .default("none")
      .notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("fantasy_selection_players_selection_player_unique").on(
      table.selectionId,
      table.fantasyPlayerId,
    ),
    index("fantasy_selection_players_selection_role_idx").on(
      table.selectionId,
      table.lineupRole,
    ),
    check(
      "fantasy_selection_players_tier_check",
      sql`${table.tierSnapshot} > 0`,
    ),
    check(
      "fantasy_selection_players_bench_order_check",
      sql`(${table.lineupRole} = 'starter' and ${table.benchOrder} is null) or (${table.lineupRole} = 'bench' and ${table.benchOrder} between 0 and 3)`,
    ),
  ],
);

export const fantasyTransferRevisions = pgTable(
  "fantasy_transfer_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    selectionId: uuid("selection_id")
      .notNull()
      .references(() => fantasyTeamSelections.id, { onDelete: "cascade" }),
    revision: integer("revision").notNull(),
    status: fantasyRevisionStatusEnum("status").default("confirmed").notNull(),
    squad: jsonb("squad").$type<string[]>().notNull(),
    lineup: jsonb("lineup").$type<Record<string, unknown>>().notNull(),
    activeChip: fantasyChipEnum("active_chip"),
    netTransferCount: smallint("net_transfer_count").default(0).notNull(),
    transferPoints: smallint("transfer_points").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("fantasy_transfer_revisions_selection_revision_unique").on(
      table.selectionId,
      table.revision,
    ),
    check(
      "fantasy_transfer_revisions_values_check",
      sql`${table.revision} > 0 and ${table.netTransferCount} >= 0 and ${table.transferPoints} >= 0`,
    ),
  ],
);

export const fantasyPlayerMatchStats = pgTable(
  "fantasy_player_match_stats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fixtureId: uuid("fixture_id")
      .notNull()
      .references(() => fixtures.id, { onDelete: "cascade" }),
    fantasyPlayerId: uuid("fantasy_player_id")
      .notNull()
      .references(() => fantasyPlayers.id, { onDelete: "cascade" }),
    status: fantasyStatsStatusEnum("status").default("imported").notNull(),
    sourceName: text("source_name").notNull(),
    minutes: smallint("minutes").default(0).notNull(),
    goals: smallint("goals").default(0).notNull(),
    sourceAssists: smallint("source_assists").default(0).notNull(),
    fantasyAssists: smallint("fantasy_assists"),
    goalsConcededWhilePlaying: smallint("goals_conceded_while_playing")
      .default(0)
      .notNull(),
    saves: smallint("saves").default(0).notNull(),
    penaltySaves: smallint("penalty_saves").default(0).notNull(),
    penaltyMisses: smallint("penalty_misses").default(0).notNull(),
    yellowCards: smallint("yellow_cards").default(0).notNull(),
    redCards: smallint("red_cards").default(0).notNull(),
    ownGoals: smallint("own_goals").default(0).notNull(),
    sourcePayload: jsonb("source_payload").$type<Record<string, unknown>>(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("fantasy_player_match_stats_fixture_player_unique").on(
      table.fixtureId,
      table.fantasyPlayerId,
    ),
    index("fantasy_player_match_stats_fixture_status_idx").on(
      table.fixtureId,
      table.status,
    ),
    check(
      "fantasy_player_match_stats_nonnegative_check",
      sql`${table.minutes} >= 0 and ${table.goals} >= 0 and ${table.sourceAssists} >= 0 and (${table.fantasyAssists} is null or ${table.fantasyAssists} >= 0) and ${table.goalsConcededWhilePlaying} >= 0 and ${table.saves} >= 0 and ${table.penaltySaves} >= 0 and ${table.penaltyMisses} >= 0 and ${table.yellowCards} >= 0 and ${table.redCards} >= 0 and ${table.ownGoals} >= 0`,
    ),
  ],
);

export const fantasyStatOverrides = pgTable(
  "fantasy_stat_overrides",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerMatchStatsId: uuid("player_match_stats_id")
      .notNull()
      .references(() => fantasyPlayerMatchStats.id, { onDelete: "cascade" }),
    fieldName: varchar("field_name", { length: 80 }).notNull(),
    previousValue: jsonb("previous_value"),
    nextValue: jsonb("next_value").notNull(),
    reason: text("reason").notNull(),
    changedBy: text("changed_by").notNull(),
    ...timestamps,
  },
  (table) => [
    index("fantasy_stat_overrides_stats_created_idx").on(
      table.playerMatchStatsId,
      table.createdAt,
    ),
  ],
);

export const fantasyPlayerMatchPoints = pgTable(
  "fantasy_player_match_points",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerMatchStatsId: uuid("player_match_stats_id")
      .notNull()
      .references(() => fantasyPlayerMatchStats.id, { onDelete: "cascade" }),
    breakdown: jsonb("breakdown").$type<Record<string, number>>().notNull(),
    totalPoints: integer("total_points").notNull(),
    computedAt: timestamp("computed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("fantasy_player_match_points_stats_unique").on(
      table.playerMatchStatsId,
    ),
  ],
);

export const fantasyTeamGameweekScores = pgTable(
  "fantasy_team_gameweek_scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    selectionId: uuid("selection_id")
      .notNull()
      .references(() => fantasyTeamSelections.id, { onDelete: "cascade" }),
    status: fantasyScoreStatusEnum("status").default("provisional").notNull(),
    lineupPoints: integer("lineup_points").default(0).notNull(),
    benchPoints: integer("bench_points").default(0).notNull(),
    captainBonus: integer("captain_bonus").default(0).notNull(),
    transferPoints: integer("transfer_points").default(0).notNull(),
    totalPoints: integer("total_points").default(0).notNull(),
    autoSubstitutions: jsonb("auto_substitutions")
      .$type<Array<{ out: string; in: string }>>()
      .default([])
      .notNull(),
    computedAt: timestamp("computed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("fantasy_team_gameweek_scores_selection_unique").on(
      table.selectionId,
    ),
    index("fantasy_team_gameweek_scores_total_idx").on(table.totalPoints),
  ],
);

export const fantasyLeagues = pgTable(
  "fantasy_leagues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fantasySeasonId: uuid("fantasy_season_id")
      .notNull()
      .references(() => fantasySeasons.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: fantasyLeagueTypeEnum("type").notNull(),
    inviteCode: varchar("invite_code", { length: 32 }),
    isDemo: boolean("is_demo").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("fantasy_leagues_invite_code_unique").on(table.inviteCode),
    index("fantasy_leagues_season_type_idx").on(
      table.fantasySeasonId,
      table.type,
    ),
  ],
);

export const fantasyLeagueMembers = pgTable(
  "fantasy_league_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fantasyLeagueId: uuid("fantasy_league_id")
      .notNull()
      .references(() => fantasyLeagues.id, { onDelete: "cascade" }),
    fantasyTeamId: uuid("fantasy_team_id")
      .notNull()
      .references(() => fantasyTeams.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("fantasy_league_members_league_team_unique").on(
      table.fantasyLeagueId,
      table.fantasyTeamId,
    ),
    index("fantasy_league_members_team_idx").on(table.fantasyTeamId),
  ],
);

export const fantasyAdminAuditLog = pgTable(
  "fantasy_admin_audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    action: varchar("action", { length: 120 }).notNull(),
    entityType: varchar("entity_type", { length: 80 }).notNull(),
    entityId: uuid("entity_id"),
    reason: text("reason"),
    changedBy: text("changed_by").notNull(),
    before: jsonb("before").$type<Record<string, unknown>>(),
    after: jsonb("after").$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (table) => [
    index("fantasy_admin_audit_entity_idx").on(
      table.entityType,
      table.entityId,
      table.createdAt,
    ),
  ],
);
