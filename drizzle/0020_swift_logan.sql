CREATE TABLE "fantasy_player_ownerships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fantasy_season_id" uuid NOT NULL,
	"fantasy_gameweek_id" uuid NOT NULL,
	"fantasy_player_id" uuid NOT NULL,
	"selected_team_count" integer DEFAULT 0 NOT NULL,
	"counted_team_count" integer DEFAULT 0 NOT NULL,
	"selected_percent" double precision DEFAULT 0 NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fantasy_player_ownerships_counts_check" CHECK ("fantasy_player_ownerships"."selected_team_count" >= 0 and "fantasy_player_ownerships"."counted_team_count" >= 0 and "fantasy_player_ownerships"."selected_team_count" <= "fantasy_player_ownerships"."counted_team_count"),
	CONSTRAINT "fantasy_player_ownerships_percent_check" CHECK ("fantasy_player_ownerships"."selected_percent" >= 0 and "fantasy_player_ownerships"."selected_percent" <= 100)
);
--> statement-breakpoint
ALTER TABLE "fantasy_player_ownerships" ADD CONSTRAINT "fantasy_player_ownerships_fantasy_gameweek_id_fantasy_gameweeks_id_fk" FOREIGN KEY ("fantasy_gameweek_id") REFERENCES "public"."fantasy_gameweeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_player_ownerships" ADD CONSTRAINT "fantasy_player_ownerships_fantasy_player_id_fantasy_players_id_fk" FOREIGN KEY ("fantasy_player_id") REFERENCES "public"."fantasy_players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_player_ownerships" ADD CONSTRAINT "fantasy_ownership_gameweek_season_fk" FOREIGN KEY ("fantasy_gameweek_id","fantasy_season_id") REFERENCES "public"."fantasy_gameweeks"("id","fantasy_season_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_player_ownerships" ADD CONSTRAINT "fantasy_ownership_player_season_fk" FOREIGN KEY ("fantasy_player_id","fantasy_season_id") REFERENCES "public"."fantasy_players"("id","fantasy_season_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_player_ownerships_gameweek_player_unique" ON "fantasy_player_ownerships" USING btree ("fantasy_gameweek_id","fantasy_player_id");--> statement-breakpoint
CREATE INDEX "fantasy_player_ownerships_gameweek_percent_idx" ON "fantasy_player_ownerships" USING btree ("fantasy_gameweek_id","selected_percent");--> statement-breakpoint
WITH "counted_selections" AS (
	SELECT "selection"."id", "selection"."fantasy_gameweek_id"
	FROM "fantasy_team_selections" "selection"
	INNER JOIN "fantasy_teams" "team"
		ON "team"."id" = "selection"."fantasy_team_id"
	INNER JOIN "fantasy_managers" "manager"
		ON "manager"."id" = "team"."manager_id"
	INNER JOIN "fantasy_team_selection_players" "member"
		ON "member"."selection_id" = "selection"."id"
	WHERE "team"."is_active" = true
		AND "manager"."is_bot" = false
		AND "manager"."status" IN ('guest', 'member')
	GROUP BY "selection"."id", "selection"."fantasy_gameweek_id"
	HAVING count("member"."id") = 15
),
"counted_totals" AS (
	SELECT "fantasy_gameweek_id", count(*)::integer AS "team_count"
	FROM "counted_selections"
	GROUP BY "fantasy_gameweek_id"
),
"player_counts" AS (
	SELECT "counted"."fantasy_gameweek_id", "member"."fantasy_player_id",
		count(*)::integer AS "selected_count"
	FROM "counted_selections" "counted"
	INNER JOIN "fantasy_team_selection_players" "member"
		ON "member"."selection_id" = "counted"."id"
	GROUP BY "counted"."fantasy_gameweek_id", "member"."fantasy_player_id"
)
INSERT INTO "fantasy_player_ownerships" (
	"fantasy_season_id", "fantasy_gameweek_id", "fantasy_player_id",
	"selected_team_count", "counted_team_count", "selected_percent"
)
SELECT "gameweek"."fantasy_season_id", "gameweek"."id", "player"."id",
	coalesce("player_count"."selected_count", 0),
	coalesce("counted_total"."team_count", 0),
	CASE
		WHEN coalesce("counted_total"."team_count", 0) = 0 THEN 0
		ELSE round(
			coalesce("player_count"."selected_count", 0) * 100.0 /
			"counted_total"."team_count",
			1
		)::double precision
	END
FROM "fantasy_gameweeks" "gameweek"
INNER JOIN "fantasy_players" "player"
	ON "player"."fantasy_season_id" = "gameweek"."fantasy_season_id"
LEFT JOIN "counted_totals" "counted_total"
	ON "counted_total"."fantasy_gameweek_id" = "gameweek"."id"
LEFT JOIN "player_counts" "player_count"
	ON "player_count"."fantasy_gameweek_id" = "gameweek"."id"
	AND "player_count"."fantasy_player_id" = "player"."id";
