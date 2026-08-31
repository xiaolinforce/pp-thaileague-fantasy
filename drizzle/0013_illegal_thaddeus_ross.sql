CREATE TABLE "fantasy_league_standings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fantasy_league_id" uuid NOT NULL,
	"fantasy_team_id" uuid NOT NULL,
	"through_gameweek_id" uuid NOT NULL,
	"status" "fantasy_score_status" NOT NULL,
	"rank" integer NOT NULL,
	"gameweek_points" integer DEFAULT 0 NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"transfer_count" integer DEFAULT 0 NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fantasy_league_standings_values_check" CHECK ("fantasy_league_standings"."rank" >= 1 and "fantasy_league_standings"."transfer_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "fantasy_league_standings" ADD CONSTRAINT "fantasy_league_standings_fantasy_league_id_fantasy_leagues_id_fk" FOREIGN KEY ("fantasy_league_id") REFERENCES "public"."fantasy_leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_league_standings" ADD CONSTRAINT "fantasy_league_standings_fantasy_team_id_fantasy_teams_id_fk" FOREIGN KEY ("fantasy_team_id") REFERENCES "public"."fantasy_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_league_standings" ADD CONSTRAINT "fantasy_league_standings_through_gameweek_id_fantasy_gameweeks_id_fk" FOREIGN KEY ("through_gameweek_id") REFERENCES "public"."fantasy_gameweeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_league_standings_league_team_unique" ON "fantasy_league_standings" USING btree ("fantasy_league_id","fantasy_team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_league_standings_league_rank_unique" ON "fantasy_league_standings" USING btree ("fantasy_league_id","rank");--> statement-breakpoint
CREATE INDEX "fantasy_league_standings_team_league_idx" ON "fantasy_league_standings" USING btree ("fantasy_team_id","fantasy_league_id");--> statement-breakpoint
CREATE INDEX "fantasy_league_standings_gameweek_idx" ON "fantasy_league_standings" USING btree ("through_gameweek_id");