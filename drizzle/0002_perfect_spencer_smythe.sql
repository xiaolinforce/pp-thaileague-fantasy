CREATE TYPE "public"."fantasy_captain_role" AS ENUM('none', 'captain', 'vice_captain');--> statement-breakpoint
CREATE TYPE "public"."fantasy_chip" AS ENUM('triple_captain', 'bench_boost', 'wildcard');--> statement-breakpoint
CREATE TYPE "public"."fantasy_gameweek_status" AS ENUM('planned', 'open', 'locked', 'provisional', 'final');--> statement-breakpoint
CREATE TYPE "public"."fantasy_league_type" AS ENUM('overall', 'private');--> statement-breakpoint
CREATE TYPE "public"."fantasy_lineup_role" AS ENUM('starter', 'bench');--> statement-breakpoint
CREATE TYPE "public"."fantasy_revision_status" AS ENUM('confirmed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."fantasy_score_status" AS ENUM('provisional', 'final');--> statement-breakpoint
CREATE TYPE "public"."fantasy_selection_status" AS ENUM('draft', 'locked');--> statement-breakpoint
CREATE TYPE "public"."fantasy_stats_status" AS ENUM('imported', 'reviewed', 'corrected');--> statement-breakpoint
CREATE TABLE "fantasy_admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" varchar(120) NOT NULL,
	"entity_type" varchar(80) NOT NULL,
	"entity_id" uuid,
	"reason" text,
	"changed_by" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fantasy_gameweeks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fantasy_season_id" uuid NOT NULL,
	"number" smallint NOT NULL,
	"deadline_at" timestamp with time zone NOT NULL,
	"status" "fantasy_gameweek_status" DEFAULT 'planned' NOT NULL,
	"score_complete" boolean DEFAULT false NOT NULL,
	"finalized_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fantasy_gameweeks_number_check" CHECK ("fantasy_gameweeks"."number" > 0)
);
--> statement-breakpoint
CREATE TABLE "fantasy_league_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fantasy_league_id" uuid NOT NULL,
	"fantasy_team_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fantasy_leagues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fantasy_season_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "fantasy_league_type" NOT NULL,
	"invite_code" varchar(32),
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fantasy_managers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"is_demo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fantasy_player_match_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_match_stats_id" uuid NOT NULL,
	"breakdown" jsonb NOT NULL,
	"total_points" integer NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fantasy_player_match_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fixture_id" uuid NOT NULL,
	"fantasy_player_id" uuid NOT NULL,
	"status" "fantasy_stats_status" DEFAULT 'imported' NOT NULL,
	"source_name" text NOT NULL,
	"minutes" smallint DEFAULT 0 NOT NULL,
	"goals" smallint DEFAULT 0 NOT NULL,
	"source_assists" smallint DEFAULT 0 NOT NULL,
	"fantasy_assists" smallint,
	"goals_conceded_while_playing" smallint DEFAULT 0 NOT NULL,
	"saves" smallint DEFAULT 0 NOT NULL,
	"penalty_saves" smallint DEFAULT 0 NOT NULL,
	"penalty_misses" smallint DEFAULT 0 NOT NULL,
	"yellow_cards" smallint DEFAULT 0 NOT NULL,
	"red_cards" smallint DEFAULT 0 NOT NULL,
	"own_goals" smallint DEFAULT 0 NOT NULL,
	"source_payload" jsonb,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fantasy_player_match_stats_nonnegative_check" CHECK ("fantasy_player_match_stats"."minutes" >= 0 and "fantasy_player_match_stats"."goals" >= 0 and "fantasy_player_match_stats"."source_assists" >= 0 and ("fantasy_player_match_stats"."fantasy_assists" is null or "fantasy_player_match_stats"."fantasy_assists" >= 0) and "fantasy_player_match_stats"."goals_conceded_while_playing" >= 0 and "fantasy_player_match_stats"."saves" >= 0 and "fantasy_player_match_stats"."penalty_saves" >= 0 and "fantasy_player_match_stats"."penalty_misses" >= 0 and "fantasy_player_match_stats"."yellow_cards" >= 0 and "fantasy_player_match_stats"."red_cards" >= 0 and "fantasy_player_match_stats"."own_goals" >= 0)
);
--> statement-breakpoint
CREATE TABLE "fantasy_player_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fantasy_player_id" uuid NOT NULL,
	"effective_gameweek_id" uuid NOT NULL,
	"level" smallint NOT NULL,
	"source_name" text NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fantasy_player_tiers_level_check" CHECK ("fantasy_player_tiers"."level" > 0)
);
--> statement-breakpoint
CREATE TABLE "fantasy_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fantasy_season_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"locked_position" "player_position" NOT NULL,
	"is_thai" boolean DEFAULT false NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"nationality_source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fantasy_seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competition_season_id" uuid NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name_th" text NOT NULL,
	"name_en" text NOT NULL,
	"squad_size" smallint DEFAULT 15 NOT NULL,
	"same_club_limit" smallint DEFAULT 3 NOT NULL,
	"foreign_player_limit" smallint DEFAULT 7 NOT NULL,
	"weekly_free_transfers" smallint DEFAULT 2 NOT NULL,
	"maximum_free_transfers" smallint DEFAULT 4 NOT NULL,
	"transfer_point_cost" smallint DEFAULT 4 NOT NULL,
	"deadline_offset_minutes" smallint DEFAULT 90 NOT NULL,
	"chip_uses_per_season" smallint DEFAULT 2 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fantasy_seasons_squad_size_check" CHECK ("fantasy_seasons"."squad_size" > 0),
	CONSTRAINT "fantasy_seasons_limits_check" CHECK ("fantasy_seasons"."same_club_limit" > 0 and "fantasy_seasons"."foreign_player_limit" >= 0 and "fantasy_seasons"."weekly_free_transfers" >= 0 and "fantasy_seasons"."maximum_free_transfers" >= "fantasy_seasons"."weekly_free_transfers"),
	CONSTRAINT "fantasy_seasons_transfer_cost_check" CHECK ("fantasy_seasons"."transfer_point_cost" >= 0 and "fantasy_seasons"."deadline_offset_minutes" >= 0 and "fantasy_seasons"."chip_uses_per_season" > 0)
);
--> statement-breakpoint
CREATE TABLE "fantasy_stat_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_match_stats_id" uuid NOT NULL,
	"field_name" varchar(80) NOT NULL,
	"previous_value" jsonb,
	"next_value" jsonb NOT NULL,
	"reason" text NOT NULL,
	"changed_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fantasy_team_gameweek_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"selection_id" uuid NOT NULL,
	"status" "fantasy_score_status" DEFAULT 'provisional' NOT NULL,
	"lineup_points" integer DEFAULT 0 NOT NULL,
	"bench_points" integer DEFAULT 0 NOT NULL,
	"captain_bonus" integer DEFAULT 0 NOT NULL,
	"transfer_points" integer DEFAULT 0 NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"auto_substitutions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fantasy_team_selection_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"selection_id" uuid NOT NULL,
	"fantasy_player_id" uuid NOT NULL,
	"club_id_snapshot" uuid NOT NULL,
	"position_snapshot" "player_position" NOT NULL,
	"tier_snapshot" smallint NOT NULL,
	"is_thai_snapshot" boolean NOT NULL,
	"lineup_role" "fantasy_lineup_role" NOT NULL,
	"bench_order" smallint,
	"captain_role" "fantasy_captain_role" DEFAULT 'none' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fantasy_selection_players_tier_check" CHECK ("fantasy_team_selection_players"."tier_snapshot" > 0),
	CONSTRAINT "fantasy_selection_players_bench_order_check" CHECK (("fantasy_team_selection_players"."lineup_role" = 'starter' and "fantasy_team_selection_players"."bench_order" is null) or ("fantasy_team_selection_players"."lineup_role" = 'bench' and "fantasy_team_selection_players"."bench_order" between 0 and 3))
);
--> statement-breakpoint
CREATE TABLE "fantasy_team_selections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fantasy_team_id" uuid NOT NULL,
	"fantasy_gameweek_id" uuid NOT NULL,
	"status" "fantasy_selection_status" DEFAULT 'draft' NOT NULL,
	"active_chip" "fantasy_chip",
	"free_transfers_before" smallint DEFAULT 0 NOT NULL,
	"free_transfers_after" smallint,
	"net_transfer_count" smallint DEFAULT 0 NOT NULL,
	"transfer_points" smallint DEFAULT 0 NOT NULL,
	"confirmed_at" timestamp with time zone,
	"locked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fantasy_team_selections_transfer_values_check" CHECK ("fantasy_team_selections"."free_transfers_before" >= 0 and ("fantasy_team_selections"."free_transfers_after" is null or "fantasy_team_selections"."free_transfers_after" >= 0) and "fantasy_team_selections"."net_transfer_count" >= 0 and "fantasy_team_selections"."transfer_points" >= 0)
);
--> statement-breakpoint
CREATE TABLE "fantasy_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fantasy_season_id" uuid NOT NULL,
	"manager_id" uuid NOT NULL,
	"name" text NOT NULL,
	"free_transfers" smallint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fantasy_teams_free_transfers_check" CHECK ("fantasy_teams"."free_transfers" >= 0)
);
--> statement-breakpoint
CREATE TABLE "fantasy_tier_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fantasy_season_id" uuid NOT NULL,
	"level" smallint NOT NULL,
	"slot_count" smallint NOT NULL,
	"name_th" text NOT NULL,
	"name_en" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fantasy_tier_definitions_values_check" CHECK ("fantasy_tier_definitions"."level" > 0 and "fantasy_tier_definitions"."slot_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "fantasy_transfer_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"selection_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"status" "fantasy_revision_status" DEFAULT 'confirmed' NOT NULL,
	"squad" jsonb NOT NULL,
	"lineup" jsonb NOT NULL,
	"active_chip" "fantasy_chip",
	"net_transfer_count" smallint DEFAULT 0 NOT NULL,
	"transfer_points" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fantasy_transfer_revisions_values_check" CHECK ("fantasy_transfer_revisions"."revision" > 0 and "fantasy_transfer_revisions"."net_transfer_count" >= 0 and "fantasy_transfer_revisions"."transfer_points" >= 0)
);
--> statement-breakpoint
ALTER TABLE "fantasy_gameweeks" ADD CONSTRAINT "fantasy_gameweeks_fantasy_season_id_fantasy_seasons_id_fk" FOREIGN KEY ("fantasy_season_id") REFERENCES "public"."fantasy_seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_league_members" ADD CONSTRAINT "fantasy_league_members_fantasy_league_id_fantasy_leagues_id_fk" FOREIGN KEY ("fantasy_league_id") REFERENCES "public"."fantasy_leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_league_members" ADD CONSTRAINT "fantasy_league_members_fantasy_team_id_fantasy_teams_id_fk" FOREIGN KEY ("fantasy_team_id") REFERENCES "public"."fantasy_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_leagues" ADD CONSTRAINT "fantasy_leagues_fantasy_season_id_fantasy_seasons_id_fk" FOREIGN KEY ("fantasy_season_id") REFERENCES "public"."fantasy_seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_player_match_points" ADD CONSTRAINT "fantasy_player_match_points_player_match_stats_id_fantasy_player_match_stats_id_fk" FOREIGN KEY ("player_match_stats_id") REFERENCES "public"."fantasy_player_match_stats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_player_match_stats" ADD CONSTRAINT "fantasy_player_match_stats_fixture_id_fixtures_id_fk" FOREIGN KEY ("fixture_id") REFERENCES "public"."fixtures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_player_match_stats" ADD CONSTRAINT "fantasy_player_match_stats_fantasy_player_id_fantasy_players_id_fk" FOREIGN KEY ("fantasy_player_id") REFERENCES "public"."fantasy_players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_player_tiers" ADD CONSTRAINT "fantasy_player_tiers_fantasy_player_id_fantasy_players_id_fk" FOREIGN KEY ("fantasy_player_id") REFERENCES "public"."fantasy_players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_player_tiers" ADD CONSTRAINT "fantasy_player_tiers_effective_gameweek_id_fantasy_gameweeks_id_fk" FOREIGN KEY ("effective_gameweek_id") REFERENCES "public"."fantasy_gameweeks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_players" ADD CONSTRAINT "fantasy_players_fantasy_season_id_fantasy_seasons_id_fk" FOREIGN KEY ("fantasy_season_id") REFERENCES "public"."fantasy_seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_players" ADD CONSTRAINT "fantasy_players_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_seasons" ADD CONSTRAINT "fantasy_seasons_competition_season_id_competition_seasons_id_fk" FOREIGN KEY ("competition_season_id") REFERENCES "public"."competition_seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_stat_overrides" ADD CONSTRAINT "fantasy_stat_overrides_player_match_stats_id_fantasy_player_match_stats_id_fk" FOREIGN KEY ("player_match_stats_id") REFERENCES "public"."fantasy_player_match_stats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_team_gameweek_scores" ADD CONSTRAINT "fantasy_team_gameweek_scores_selection_id_fantasy_team_selections_id_fk" FOREIGN KEY ("selection_id") REFERENCES "public"."fantasy_team_selections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_team_selection_players" ADD CONSTRAINT "fantasy_team_selection_players_selection_id_fantasy_team_selections_id_fk" FOREIGN KEY ("selection_id") REFERENCES "public"."fantasy_team_selections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_team_selection_players" ADD CONSTRAINT "fantasy_team_selection_players_fantasy_player_id_fantasy_players_id_fk" FOREIGN KEY ("fantasy_player_id") REFERENCES "public"."fantasy_players"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_team_selection_players" ADD CONSTRAINT "fantasy_team_selection_players_club_id_snapshot_clubs_id_fk" FOREIGN KEY ("club_id_snapshot") REFERENCES "public"."clubs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_team_selections" ADD CONSTRAINT "fantasy_team_selections_fantasy_team_id_fantasy_teams_id_fk" FOREIGN KEY ("fantasy_team_id") REFERENCES "public"."fantasy_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_team_selections" ADD CONSTRAINT "fantasy_team_selections_fantasy_gameweek_id_fantasy_gameweeks_id_fk" FOREIGN KEY ("fantasy_gameweek_id") REFERENCES "public"."fantasy_gameweeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_teams" ADD CONSTRAINT "fantasy_teams_fantasy_season_id_fantasy_seasons_id_fk" FOREIGN KEY ("fantasy_season_id") REFERENCES "public"."fantasy_seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_teams" ADD CONSTRAINT "fantasy_teams_manager_id_fantasy_managers_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."fantasy_managers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_tier_definitions" ADD CONSTRAINT "fantasy_tier_definitions_fantasy_season_id_fantasy_seasons_id_fk" FOREIGN KEY ("fantasy_season_id") REFERENCES "public"."fantasy_seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_transfer_revisions" ADD CONSTRAINT "fantasy_transfer_revisions_selection_id_fantasy_team_selections_id_fk" FOREIGN KEY ("selection_id") REFERENCES "public"."fantasy_team_selections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fantasy_admin_audit_entity_idx" ON "fantasy_admin_audit_log" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_gameweeks_season_number_unique" ON "fantasy_gameweeks" USING btree ("fantasy_season_id","number");--> statement-breakpoint
CREATE INDEX "fantasy_gameweeks_deadline_idx" ON "fantasy_gameweeks" USING btree ("deadline_at");--> statement-breakpoint
CREATE INDEX "fantasy_gameweeks_status_idx" ON "fantasy_gameweeks" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_league_members_league_team_unique" ON "fantasy_league_members" USING btree ("fantasy_league_id","fantasy_team_id");--> statement-breakpoint
CREATE INDEX "fantasy_league_members_team_idx" ON "fantasy_league_members" USING btree ("fantasy_team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_leagues_invite_code_unique" ON "fantasy_leagues" USING btree ("invite_code");--> statement-breakpoint
CREATE INDEX "fantasy_leagues_season_type_idx" ON "fantasy_leagues" USING btree ("fantasy_season_id","type");--> statement-breakpoint
CREATE INDEX "fantasy_managers_demo_idx" ON "fantasy_managers" USING btree ("is_demo");--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_player_match_points_stats_unique" ON "fantasy_player_match_points" USING btree ("player_match_stats_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_player_match_stats_fixture_player_unique" ON "fantasy_player_match_stats" USING btree ("fixture_id","fantasy_player_id");--> statement-breakpoint
CREATE INDEX "fantasy_player_match_stats_fixture_status_idx" ON "fantasy_player_match_stats" USING btree ("fixture_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_player_tiers_player_gameweek_unique" ON "fantasy_player_tiers" USING btree ("fantasy_player_id","effective_gameweek_id");--> statement-breakpoint
CREATE INDEX "fantasy_player_tiers_gameweek_idx" ON "fantasy_player_tiers" USING btree ("effective_gameweek_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_players_season_player_unique" ON "fantasy_players" USING btree ("fantasy_season_id","player_id");--> statement-breakpoint
CREATE INDEX "fantasy_players_season_available_idx" ON "fantasy_players" USING btree ("fantasy_season_id","is_available");--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_seasons_competition_season_unique" ON "fantasy_seasons" USING btree ("competition_season_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_seasons_slug_unique" ON "fantasy_seasons" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "fantasy_stat_overrides_stats_created_idx" ON "fantasy_stat_overrides" USING btree ("player_match_stats_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_team_gameweek_scores_selection_unique" ON "fantasy_team_gameweek_scores" USING btree ("selection_id");--> statement-breakpoint
CREATE INDEX "fantasy_team_gameweek_scores_total_idx" ON "fantasy_team_gameweek_scores" USING btree ("total_points");--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_selection_players_selection_player_unique" ON "fantasy_team_selection_players" USING btree ("selection_id","fantasy_player_id");--> statement-breakpoint
CREATE INDEX "fantasy_selection_players_selection_role_idx" ON "fantasy_team_selection_players" USING btree ("selection_id","lineup_role");--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_team_selections_team_gameweek_unique" ON "fantasy_team_selections" USING btree ("fantasy_team_id","fantasy_gameweek_id");--> statement-breakpoint
CREATE INDEX "fantasy_team_selections_gameweek_status_idx" ON "fantasy_team_selections" USING btree ("fantasy_gameweek_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_teams_season_manager_unique" ON "fantasy_teams" USING btree ("fantasy_season_id","manager_id");--> statement-breakpoint
CREATE INDEX "fantasy_teams_season_active_idx" ON "fantasy_teams" USING btree ("fantasy_season_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_tier_definitions_season_level_unique" ON "fantasy_tier_definitions" USING btree ("fantasy_season_id","level");--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_transfer_revisions_selection_revision_unique" ON "fantasy_transfer_revisions" USING btree ("selection_id","revision");