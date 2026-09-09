CREATE TABLE "fantasy_gameweek_optimal_team_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"optimal_team_id" uuid NOT NULL,
	"fantasy_gameweek_id" uuid NOT NULL,
	"fantasy_player_id" uuid NOT NULL,
	"lineup_role" "fantasy_lineup_role" NOT NULL,
	"bench_order" smallint,
	"captain_role" "fantasy_captain_role" DEFAULT 'none' NOT NULL,
	"minutes" integer DEFAULT 0 NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"breakdown" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fantasy_optimal_member_bench_captain_check" CHECK ("fantasy_gameweek_optimal_team_players"."lineup_role" <> 'bench' or "fantasy_gameweek_optimal_team_players"."captain_role" = 'none'),
	CONSTRAINT "fantasy_optimal_member_bench_order_check" CHECK (("fantasy_gameweek_optimal_team_players"."lineup_role" = 'starter' and "fantasy_gameweek_optimal_team_players"."bench_order" is null) or ("fantasy_gameweek_optimal_team_players"."lineup_role" = 'bench' and "fantasy_gameweek_optimal_team_players"."bench_order" is not null and "fantasy_gameweek_optimal_team_players"."bench_order" between 0 and 3)),
	CONSTRAINT "fantasy_optimal_member_minutes_check" CHECK ("fantasy_gameweek_optimal_team_players"."minutes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "fantasy_gameweek_optimal_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fantasy_season_id" uuid NOT NULL,
	"fantasy_gameweek_id" uuid NOT NULL,
	"status" "fantasy_score_status" NOT NULL,
	"lineup_points" integer NOT NULL,
	"bench_points" integer NOT NULL,
	"captain_bonus" integer NOT NULL,
	"total_points" integer NOT NULL,
	"auto_substitutions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"counted_player_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"player_pool_size" integer NOT NULL,
	"player_pool_source" text NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fantasy_optimal_team_pool_size_check" CHECK ("fantasy_gameweek_optimal_teams"."player_pool_size" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_optimal_team_id_gameweek_unique" ON "fantasy_gameweek_optimal_teams" USING btree ("id","fantasy_gameweek_id");--> statement-breakpoint
ALTER TABLE "fantasy_gameweek_optimal_team_players" ADD CONSTRAINT "fantasy_gameweek_optimal_team_players_optimal_team_id_fantasy_gameweek_optimal_teams_id_fk" FOREIGN KEY ("optimal_team_id") REFERENCES "public"."fantasy_gameweek_optimal_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_gameweek_optimal_team_players" ADD CONSTRAINT "fantasy_optimal_member_team_gameweek_fk" FOREIGN KEY ("optimal_team_id","fantasy_gameweek_id") REFERENCES "public"."fantasy_gameweek_optimal_teams"("id","fantasy_gameweek_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_gameweek_optimal_team_players" ADD CONSTRAINT "fantasy_optimal_member_pool_fk" FOREIGN KEY ("fantasy_gameweek_id","fantasy_player_id") REFERENCES "public"."fantasy_gameweek_player_pool"("fantasy_gameweek_id","fantasy_player_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_gameweek_optimal_teams" ADD CONSTRAINT "fantasy_gameweek_optimal_teams_fantasy_gameweek_id_fantasy_gameweeks_id_fk" FOREIGN KEY ("fantasy_gameweek_id") REFERENCES "public"."fantasy_gameweeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_gameweek_optimal_teams" ADD CONSTRAINT "fantasy_optimal_team_gameweek_season_fk" FOREIGN KEY ("fantasy_gameweek_id","fantasy_season_id") REFERENCES "public"."fantasy_gameweeks"("id","fantasy_season_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_optimal_member_team_player_unique" ON "fantasy_gameweek_optimal_team_players" USING btree ("optimal_team_id","fantasy_player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_optimal_member_bench_unique" ON "fantasy_gameweek_optimal_team_players" USING btree ("optimal_team_id","bench_order") WHERE "fantasy_gameweek_optimal_team_players"."lineup_role" = 'bench';--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_optimal_member_captain_unique" ON "fantasy_gameweek_optimal_team_players" USING btree ("optimal_team_id","captain_role") WHERE "fantasy_gameweek_optimal_team_players"."captain_role" <> 'none';--> statement-breakpoint
CREATE INDEX "fantasy_optimal_member_team_role_idx" ON "fantasy_gameweek_optimal_team_players" USING btree ("optimal_team_id","lineup_role");--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_optimal_team_gameweek_unique" ON "fantasy_gameweek_optimal_teams" USING btree ("fantasy_gameweek_id");
