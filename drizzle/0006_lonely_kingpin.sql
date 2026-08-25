ALTER TABLE "fantasy_ranking_runs" DROP CONSTRAINT "fantasy_ranking_runs_counts_check";--> statement-breakpoint
ALTER TABLE "fantasy_ranking_runs" ADD COLUMN "level_three_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "fantasy_ranking_runs"
SET "level_three_count" = "total_players" - "level_one_count" - "level_two_count";--> statement-breakpoint
ALTER TABLE "fantasy_ranking_runs" ADD CONSTRAINT "fantasy_ranking_runs_counts_check" CHECK ("fantasy_ranking_runs"."total_players" > 0 and "fantasy_ranking_runs"."level_one_count" >= 0 and "fantasy_ranking_runs"."level_two_count" >= 0 and "fantasy_ranking_runs"."level_three_count" >= 0 and "fantasy_ranking_runs"."level_one_count" + "fantasy_ranking_runs"."level_two_count" + "fantasy_ranking_runs"."level_three_count" <= "fantasy_ranking_runs"."total_players");
