CREATE UNIQUE INDEX "fantasy_teams_season_name_unique" ON "fantasy_teams" USING btree ("fantasy_season_id",lower("name"));--> statement-breakpoint
ALTER TABLE "fantasy_managers" DROP COLUMN "display_name";--> statement-breakpoint
ALTER TABLE "fantasy_managers" DROP COLUMN "name_change_available_at";