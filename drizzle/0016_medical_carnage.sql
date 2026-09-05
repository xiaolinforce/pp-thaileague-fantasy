-- Backfill only the redundant season key; existing snapshots and history remain intact.
-- Create referenced unique indexes before adding composite foreign keys.
ALTER TABLE "fantasy_team_selection_players" ADD COLUMN "fantasy_season_id" uuid;
--> statement-breakpoint
ALTER TABLE "fantasy_team_selections" ADD COLUMN "fantasy_season_id" uuid;
--> statement-breakpoint
UPDATE "fantasy_team_selections" s SET "fantasy_season_id" = t."fantasy_season_id" FROM "fantasy_teams" t WHERE t."id" = s."fantasy_team_id";
--> statement-breakpoint
UPDATE "fantasy_team_selection_players" p SET "fantasy_season_id" = s."fantasy_season_id" FROM "fantasy_team_selections" s WHERE s."id" = p."selection_id";
--> statement-breakpoint
ALTER TABLE "fantasy_team_selections" ALTER COLUMN "fantasy_season_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "fantasy_team_selection_players" ALTER COLUMN "fantasy_season_id" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_gameweeks_id_season_unique" ON "fantasy_gameweeks" USING btree ("id","fantasy_season_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_players_id_season_unique" ON "fantasy_players" USING btree ("id","fantasy_season_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_selection_players_bench_unique" ON "fantasy_team_selection_players" USING btree ("selection_id","bench_order") WHERE "fantasy_team_selection_players"."lineup_role" = 'bench';
--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_selection_players_captain_unique" ON "fantasy_team_selection_players" USING btree ("selection_id","captain_role") WHERE "fantasy_team_selection_players"."captain_role" <> 'none';
--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_team_selections_id_season_unique" ON "fantasy_team_selections" USING btree ("id","fantasy_season_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_teams_id_season_unique" ON "fantasy_teams" USING btree ("id","fantasy_season_id");
--> statement-breakpoint
ALTER TABLE "fantasy_team_selection_players" DROP CONSTRAINT "fantasy_selection_players_bench_order_check";
--> statement-breakpoint
ALTER TABLE "fantasy_team_selection_players" ADD CONSTRAINT "fantasy_member_selection_season_fk" FOREIGN KEY ("selection_id","fantasy_season_id") REFERENCES "public"."fantasy_team_selections"("id","fantasy_season_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "fantasy_team_selection_players" ADD CONSTRAINT "fantasy_member_player_season_fk" FOREIGN KEY ("fantasy_player_id","fantasy_season_id") REFERENCES "public"."fantasy_players"("id","fantasy_season_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "fantasy_team_selections" ADD CONSTRAINT "fantasy_selection_team_season_fk" FOREIGN KEY ("fantasy_team_id","fantasy_season_id") REFERENCES "public"."fantasy_teams"("id","fantasy_season_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "fantasy_team_selections" ADD CONSTRAINT "fantasy_selection_gameweek_season_fk" FOREIGN KEY ("fantasy_gameweek_id","fantasy_season_id") REFERENCES "public"."fantasy_gameweeks"("id","fantasy_season_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "fantasy_team_selection_players" ADD CONSTRAINT "fantasy_selection_players_bench_captain_check" CHECK ("fantasy_team_selection_players"."lineup_role" <> 'bench' or "fantasy_team_selection_players"."captain_role" = 'none');
--> statement-breakpoint
ALTER TABLE "fantasy_team_selection_players" ADD CONSTRAINT "fantasy_selection_players_bench_order_check" CHECK (("fantasy_team_selection_players"."lineup_role" = 'starter' and "fantasy_team_selection_players"."bench_order" is null) or ("fantasy_team_selection_players"."lineup_role" = 'bench' and "fantasy_team_selection_players"."bench_order" is not null and "fantasy_team_selection_players"."bench_order" between 0 and 3));
