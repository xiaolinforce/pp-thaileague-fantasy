CREATE TYPE "public"."competition_season_status" AS ENUM('planned', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."competition_type" AS ENUM('league', 'cup');--> statement-breakpoint
CREATE TYPE "public"."fixture_status" AS ENUM('scheduled', 'time_tbc', 'live', 'finished', 'postponed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."player_position" AS ENUM('goalkeeper', 'defender', 'midfielder', 'forward', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."player_registration_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name_th" text NOT NULL,
	"name_en" text NOT NULL,
	"short_name_th" text,
	"short_name_en" text,
	"abbreviation" varchar(24),
	"logo_url" text,
	"website_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"source_name" text NOT NULL,
	"source_url" text NOT NULL,
	"external_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competition_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competition_season_id" uuid NOT NULL,
	"club_id" uuid NOT NULL,
	"home_venue_id" uuid,
	"display_name_th" text NOT NULL,
	"display_name_en" text NOT NULL,
	"abbreviation" varchar(24),
	"logo_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"source_name" text NOT NULL,
	"source_url" text NOT NULL,
	"external_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competition_seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competition_id" uuid NOT NULL,
	"season_id" uuid NOT NULL,
	"name_th" text NOT NULL,
	"name_en" text NOT NULL,
	"status" "competition_season_status" DEFAULT 'planned' NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"logo_url" text,
	"source_name" text NOT NULL,
	"source_url" text NOT NULL,
	"external_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "competition_seasons_date_order_check" CHECK ("competition_seasons"."ends_on" >= "competition_seasons"."starts_on")
);
--> statement-breakpoint
CREATE TABLE "competitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"name_th" text NOT NULL,
	"name_en" text NOT NULL,
	"type" "competition_type" DEFAULT 'league' NOT NULL,
	"country_code" varchar(2) DEFAULT 'TH' NOT NULL,
	"level" smallint,
	"logo_url" text,
	"source_name" text NOT NULL,
	"source_url" text NOT NULL,
	"external_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fixtures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competition_season_id" uuid NOT NULL,
	"home_entry_id" uuid NOT NULL,
	"away_entry_id" uuid NOT NULL,
	"venue_id" uuid,
	"match_number" integer,
	"matchweek" smallint NOT NULL,
	"kickoff_at" timestamp with time zone,
	"status" "fixture_status" DEFAULT 'scheduled' NOT NULL,
	"home_score" smallint,
	"away_score" smallint,
	"home_penalty_score" smallint,
	"away_penalty_score" smallint,
	"attendance" integer,
	"source_name" text NOT NULL,
	"source_url" text NOT NULL,
	"external_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fixtures_distinct_teams_check" CHECK ("fixtures"."home_entry_id" <> "fixtures"."away_entry_id"),
	CONSTRAINT "fixtures_scores_nonnegative_check" CHECK (("fixtures"."home_score" is null or "fixtures"."home_score" >= 0) and ("fixtures"."away_score" is null or "fixtures"."away_score" >= 0) and ("fixtures"."home_penalty_score" is null or "fixtures"."home_penalty_score" >= 0) and ("fixtures"."away_penalty_score" is null or "fixtures"."away_penalty_score" >= 0)),
	CONSTRAINT "fixtures_attendance_nonnegative_check" CHECK ("fixtures"."attendance" is null or "fixtures"."attendance" >= 0)
);
--> statement-breakpoint
CREATE TABLE "player_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competition_entry_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"shirt_number" smallint,
	"registered_position" "player_position" DEFAULT 'unknown' NOT NULL,
	"registered_from" date NOT NULL,
	"registered_until" date,
	"status" "player_registration_status" DEFAULT 'active' NOT NULL,
	"source_name" text NOT NULL,
	"source_url" text NOT NULL,
	"external_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_registrations_shirt_number_check" CHECK ("player_registrations"."shirt_number" is null or ("player_registrations"."shirt_number" >= 0 and "player_registrations"."shirt_number" <= 999)),
	CONSTRAINT "player_registrations_date_order_check" CHECK ("player_registrations"."registered_until" is null or "player_registrations"."registered_until" >= "player_registrations"."registered_from")
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name_th" text,
	"full_name_en" text NOT NULL,
	"known_as" text,
	"birth_date" date,
	"nationality" text,
	"primary_position" "player_position" DEFAULT 'unknown' NOT NULL,
	"position_detail" text,
	"photo_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"source_name" text NOT NULL,
	"source_url" text NOT NULL,
	"external_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(16) NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"source_name" text NOT NULL,
	"source_url" text NOT NULL,
	"external_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seasons_date_order_check" CHECK ("seasons"."ends_on" >= "seasons"."starts_on")
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_th" text NOT NULL,
	"name_en" text,
	"province_th" text,
	"province_en" text,
	"capacity" integer,
	"address" text,
	"latitude" double precision,
	"longitude" double precision,
	"photo_url" text,
	"source_name" text NOT NULL,
	"source_url" text NOT NULL,
	"external_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "venues_capacity_nonnegative_check" CHECK ("venues"."capacity" is null or "venues"."capacity" >= 0),
	CONSTRAINT "venues_latitude_range_check" CHECK ("venues"."latitude" is null or ("venues"."latitude" >= -90 and "venues"."latitude" <= 90)),
	CONSTRAINT "venues_longitude_range_check" CHECK ("venues"."longitude" is null or ("venues"."longitude" >= -180 and "venues"."longitude" <= 180))
);
--> statement-breakpoint
ALTER TABLE "competition_entries" ADD CONSTRAINT "competition_entries_competition_season_id_competition_seasons_id_fk" FOREIGN KEY ("competition_season_id") REFERENCES "public"."competition_seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_entries" ADD CONSTRAINT "competition_entries_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_entries" ADD CONSTRAINT "competition_entries_home_venue_id_venues_id_fk" FOREIGN KEY ("home_venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_seasons" ADD CONSTRAINT "competition_seasons_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_seasons" ADD CONSTRAINT "competition_seasons_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_competition_season_id_competition_seasons_id_fk" FOREIGN KEY ("competition_season_id") REFERENCES "public"."competition_seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_home_entry_id_competition_entries_id_fk" FOREIGN KEY ("home_entry_id") REFERENCES "public"."competition_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_away_entry_id_competition_entries_id_fk" FOREIGN KEY ("away_entry_id") REFERENCES "public"."competition_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_registrations" ADD CONSTRAINT "player_registrations_competition_entry_id_competition_entries_id_fk" FOREIGN KEY ("competition_entry_id") REFERENCES "public"."competition_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_registrations" ADD CONSTRAINT "player_registrations_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "clubs_slug_unique" ON "clubs" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "clubs_source_external_unique" ON "clubs" USING btree ("source_name","external_id");--> statement-breakpoint
CREATE INDEX "clubs_name_th_idx" ON "clubs" USING btree ("name_th");--> statement-breakpoint
CREATE INDEX "clubs_name_en_idx" ON "clubs" USING btree ("name_en");--> statement-breakpoint
CREATE UNIQUE INDEX "competition_entries_season_club_unique" ON "competition_entries" USING btree ("competition_season_id","club_id");--> statement-breakpoint
CREATE UNIQUE INDEX "competition_entries_source_external_unique" ON "competition_entries" USING btree ("source_name","external_id");--> statement-breakpoint
CREATE INDEX "competition_entries_competition_season_idx" ON "competition_entries" USING btree ("competition_season_id");--> statement-breakpoint
CREATE UNIQUE INDEX "competition_seasons_competition_season_unique" ON "competition_seasons" USING btree ("competition_id","season_id");--> statement-breakpoint
CREATE UNIQUE INDEX "competition_seasons_source_external_unique" ON "competition_seasons" USING btree ("source_name","external_id");--> statement-breakpoint
CREATE INDEX "competition_seasons_status_idx" ON "competition_seasons" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "competitions_code_unique" ON "competitions" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "competitions_source_external_unique" ON "competitions" USING btree ("source_name","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fixtures_source_external_unique" ON "fixtures" USING btree ("source_name","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fixtures_season_teams_unique" ON "fixtures" USING btree ("competition_season_id","home_entry_id","away_entry_id");--> statement-breakpoint
CREATE INDEX "fixtures_season_kickoff_idx" ON "fixtures" USING btree ("competition_season_id","kickoff_at");--> statement-breakpoint
CREATE INDEX "fixtures_season_matchweek_idx" ON "fixtures" USING btree ("competition_season_id","matchweek");--> statement-breakpoint
CREATE INDEX "fixtures_home_entry_idx" ON "fixtures" USING btree ("home_entry_id");--> statement-breakpoint
CREATE INDEX "fixtures_away_entry_idx" ON "fixtures" USING btree ("away_entry_id");--> statement-breakpoint
CREATE INDEX "fixtures_status_idx" ON "fixtures" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "player_registrations_source_external_unique" ON "player_registrations" USING btree ("source_name","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_registrations_entry_player_from_unique" ON "player_registrations" USING btree ("competition_entry_id","player_id","registered_from");--> statement-breakpoint
CREATE INDEX "player_registrations_entry_status_idx" ON "player_registrations" USING btree ("competition_entry_id","status");--> statement-breakpoint
CREATE INDEX "player_registrations_player_idx" ON "player_registrations" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "players_source_external_unique" ON "players" USING btree ("source_name","external_id");--> statement-breakpoint
CREATE INDEX "players_full_name_en_idx" ON "players" USING btree ("full_name_en");--> statement-breakpoint
CREATE INDEX "players_primary_position_idx" ON "players" USING btree ("primary_position");--> statement-breakpoint
CREATE UNIQUE INDEX "seasons_name_unique" ON "seasons" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "seasons_source_external_unique" ON "seasons" USING btree ("source_name","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "venues_source_external_unique" ON "venues" USING btree ("source_name","external_id");--> statement-breakpoint
CREATE INDEX "venues_name_th_idx" ON "venues" USING btree ("name_th");