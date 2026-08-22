CREATE TYPE "public"."fantasy_ranking_confidence" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."fantasy_ranking_status" AS ENUM('draft', 'published', 'superseded');--> statement-breakpoint
CREATE TABLE "fantasy_player_rankings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ranking_run_id" uuid NOT NULL,
	"fantasy_player_id" uuid NOT NULL,
	"overall_rank" integer NOT NULL,
	"position_rank" integer NOT NULL,
	"position_snapshot" "player_position" NOT NULL,
	"tier_level" smallint NOT NULL,
	"model_projected_points" double precision NOT NULL,
	"manual_adjustment" double precision DEFAULT 0 NOT NULL,
	"projected_points" double precision NOT NULL,
	"projected_minutes" integer NOT NULL,
	"previous_season_points" double precision NOT NULL,
	"previous_season_minutes" integer NOT NULL,
	"market_value_eur" integer,
	"confidence" "fantasy_ranking_confidence" NOT NULL,
	"match_method" varchar(32) NOT NULL,
	"match_score" double precision,
	"source_player_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_facts" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"model_components" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fantasy_player_rankings_values_check" CHECK ("fantasy_player_rankings"."overall_rank" > 0 and "fantasy_player_rankings"."position_rank" > 0 and "fantasy_player_rankings"."tier_level" > 0 and "fantasy_player_rankings"."projected_minutes" >= 0 and "fantasy_player_rankings"."previous_season_minutes" >= 0 and "fantasy_player_rankings"."projected_points" >= 0 and "fantasy_player_rankings"."model_projected_points" >= 0 and "fantasy_player_rankings"."previous_season_points" >= 0 and ("fantasy_player_rankings"."market_value_eur" is null or "fantasy_player_rankings"."market_value_eur" >= 0) and ("fantasy_player_rankings"."match_score" is null or ("fantasy_player_rankings"."match_score" >= 0 and "fantasy_player_rankings"."match_score" <= 1)))
);
--> statement-breakpoint
CREATE TABLE "fantasy_ranking_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fantasy_season_id" uuid NOT NULL,
	"effective_gameweek_id" uuid NOT NULL,
	"version" varchar(80) NOT NULL,
	"status" "fantasy_ranking_status" DEFAULT 'draft' NOT NULL,
	"model_version" varchar(80) NOT NULL,
	"data_cutoff" date NOT NULL,
	"total_players" integer NOT NULL,
	"level_one_count" integer NOT NULL,
	"level_two_count" integer NOT NULL,
	"source_name" text NOT NULL,
	"source_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"configuration" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"notes" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fantasy_ranking_runs_counts_check" CHECK ("fantasy_ranking_runs"."total_players" > 0 and "fantasy_ranking_runs"."level_one_count" >= 0 and "fantasy_ranking_runs"."level_two_count" >= 0 and "fantasy_ranking_runs"."level_one_count" + "fantasy_ranking_runs"."level_two_count" <= "fantasy_ranking_runs"."total_players"),
	CONSTRAINT "fantasy_ranking_runs_published_at_check" CHECK (("fantasy_ranking_runs"."status" = 'published' and "fantasy_ranking_runs"."published_at" is not null) or ("fantasy_ranking_runs"."status" <> 'published'))
);
--> statement-breakpoint
ALTER TABLE "fantasy_player_rankings" ADD CONSTRAINT "fantasy_player_rankings_ranking_run_id_fantasy_ranking_runs_id_fk" FOREIGN KEY ("ranking_run_id") REFERENCES "public"."fantasy_ranking_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_player_rankings" ADD CONSTRAINT "fantasy_player_rankings_fantasy_player_id_fantasy_players_id_fk" FOREIGN KEY ("fantasy_player_id") REFERENCES "public"."fantasy_players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_ranking_runs" ADD CONSTRAINT "fantasy_ranking_runs_fantasy_season_id_fantasy_seasons_id_fk" FOREIGN KEY ("fantasy_season_id") REFERENCES "public"."fantasy_seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_ranking_runs" ADD CONSTRAINT "fantasy_ranking_runs_effective_gameweek_id_fantasy_gameweeks_id_fk" FOREIGN KEY ("effective_gameweek_id") REFERENCES "public"."fantasy_gameweeks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_player_rankings_run_player_unique" ON "fantasy_player_rankings" USING btree ("ranking_run_id","fantasy_player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_player_rankings_run_rank_unique" ON "fantasy_player_rankings" USING btree ("ranking_run_id","overall_rank");--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_player_rankings_run_position_rank_unique" ON "fantasy_player_rankings" USING btree ("ranking_run_id","position_snapshot","position_rank");--> statement-breakpoint
CREATE INDEX "fantasy_player_rankings_player_idx" ON "fantasy_player_rankings" USING btree ("fantasy_player_id");--> statement-breakpoint
CREATE INDEX "fantasy_player_rankings_run_tier_idx" ON "fantasy_player_rankings" USING btree ("ranking_run_id","tier_level");--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_ranking_runs_season_version_unique" ON "fantasy_ranking_runs" USING btree ("fantasy_season_id","version");--> statement-breakpoint
CREATE INDEX "fantasy_ranking_runs_season_status_idx" ON "fantasy_ranking_runs" USING btree ("fantasy_season_id","status");--> statement-breakpoint
CREATE INDEX "fantasy_ranking_runs_effective_gameweek_idx" ON "fantasy_ranking_runs" USING btree ("effective_gameweek_id");