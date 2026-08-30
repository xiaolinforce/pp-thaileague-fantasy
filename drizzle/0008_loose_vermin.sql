ALTER TABLE "fantasy_gameweeks" ADD COLUMN "average_points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "fantasy_gameweeks" ADD COLUMN "highest_points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
WITH "gameweek_summaries" AS (
	SELECT
		"fantasy_team_selections"."fantasy_gameweek_id" AS "gameweek_id",
		FLOOR(AVG("fantasy_team_gameweek_scores"."total_points") + 0.5)::integer AS "average_points",
		MAX("fantasy_team_gameweek_scores"."total_points")::integer AS "highest_points"
	FROM "fantasy_team_gameweek_scores"
	INNER JOIN "fantasy_team_selections"
		ON "fantasy_team_gameweek_scores"."selection_id" = "fantasy_team_selections"."id"
	WHERE EXISTS (
		SELECT 1
		FROM "fantasy_team_selection_players"
		WHERE "fantasy_team_selection_players"."selection_id" = "fantasy_team_selections"."id"
	)
	AND "fantasy_team_selections"."status" = 'locked'
	GROUP BY "fantasy_team_selections"."fantasy_gameweek_id"
)
UPDATE "fantasy_gameweeks"
SET
	"average_points" = "gameweek_summaries"."average_points",
	"highest_points" = "gameweek_summaries"."highest_points"
FROM "gameweek_summaries"
WHERE "fantasy_gameweeks"."id" = "gameweek_summaries"."gameweek_id";
