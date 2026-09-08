CREATE TABLE "fantasy_gameweek_player_pool" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fantasy_season_id" uuid NOT NULL,
	"fantasy_gameweek_id" uuid NOT NULL,
	"fantasy_player_id" uuid NOT NULL,
	"club_id_snapshot" uuid NOT NULL,
	"position_snapshot" "player_position" NOT NULL,
	"tier_snapshot" smallint NOT NULL,
	"is_thai_snapshot" boolean NOT NULL,
	"source_name" text NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fantasy_gameweek_pool_tier_check" CHECK ("fantasy_gameweek_player_pool"."tier_snapshot" > 0)
);
--> statement-breakpoint
ALTER TABLE "fantasy_gameweek_player_pool" ADD CONSTRAINT "fantasy_gameweek_player_pool_fantasy_gameweek_id_fantasy_gameweeks_id_fk" FOREIGN KEY ("fantasy_gameweek_id") REFERENCES "public"."fantasy_gameweeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_gameweek_player_pool" ADD CONSTRAINT "fantasy_gameweek_player_pool_fantasy_player_id_fantasy_players_id_fk" FOREIGN KEY ("fantasy_player_id") REFERENCES "public"."fantasy_players"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_gameweek_player_pool" ADD CONSTRAINT "fantasy_gameweek_player_pool_club_id_snapshot_clubs_id_fk" FOREIGN KEY ("club_id_snapshot") REFERENCES "public"."clubs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_gameweek_player_pool" ADD CONSTRAINT "fantasy_gameweek_pool_gameweek_season_fk" FOREIGN KEY ("fantasy_gameweek_id","fantasy_season_id") REFERENCES "public"."fantasy_gameweeks"("id","fantasy_season_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_gameweek_player_pool" ADD CONSTRAINT "fantasy_gameweek_pool_player_season_fk" FOREIGN KEY ("fantasy_player_id","fantasy_season_id") REFERENCES "public"."fantasy_players"("id","fantasy_season_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_gameweek_pool_gameweek_player_unique" ON "fantasy_gameweek_player_pool" USING btree ("fantasy_gameweek_id","fantasy_player_id");--> statement-breakpoint
CREATE INDEX "fantasy_gameweek_pool_gameweek_idx" ON "fantasy_gameweek_player_pool" USING btree ("fantasy_gameweek_id");--> statement-breakpoint
INSERT INTO "fantasy_gameweek_player_pool" (
	"fantasy_season_id",
	"fantasy_gameweek_id",
	"fantasy_player_id",
	"club_id_snapshot",
	"position_snapshot",
	"tier_snapshot",
	"is_thai_snapshot",
	"source_name",
	"captured_at"
)
SELECT
	gw."fantasy_season_id",
	gw."id",
	ranking."fantasy_player_id",
	registration."club_id",
	ranking."position_snapshot",
	ranking."tier_level",
	COALESCE(classification."is_thai_before", player."is_thai"),
	'gw1-ranking-backfill:' || run."version",
	COALESCE(gw."finalized_at", gw."updated_at")
FROM "fantasy_gameweeks" gw
JOIN "fantasy_ranking_runs" run
	ON run."fantasy_season_id" = gw."fantasy_season_id"
	AND run."version" = 'preseason-2026-27-v5-manual-tiers'
JOIN "fantasy_player_rankings" ranking
	ON ranking."ranking_run_id" = run."id"
JOIN "fantasy_players" player
	ON player."id" = ranking."fantasy_player_id"
JOIN "fantasy_seasons" season
	ON season."id" = gw."fantasy_season_id"
JOIN LATERAL (
	SELECT entry."club_id"
	FROM "player_registrations" registration
	JOIN "competition_entries" entry
		ON entry."id" = registration."competition_entry_id"
	WHERE registration."player_id" = player."player_id"
		AND entry."competition_season_id" = season."competition_season_id"
		AND registration."registered_from" <= (gw."deadline_at" AT TIME ZONE 'Asia/Bangkok')::date
		AND (
			registration."registered_until" IS NULL
			OR registration."registered_until" >= (gw."deadline_at" AT TIME ZONE 'Asia/Bangkok')::date
		)
	ORDER BY registration."registered_from" DESC, registration."id"
	LIMIT 1
) registration ON true
LEFT JOIN LATERAL (
	SELECT (audit."before"->>'isThai')::boolean AS "is_thai_before"
	FROM "fantasy_admin_audit_log" audit
	WHERE audit."action" = 'update_player_classification'
		AND audit."entity_type" = 'fantasy_player'
		AND audit."entity_id" = player."id"
		AND audit."created_at" > gw."deadline_at"
		AND audit."before" ? 'isThai'
	ORDER BY audit."created_at", audit."id"
	LIMIT 1
) classification ON true
WHERE gw."number" = 1
	AND gw."status" IN ('provisional', 'final')
ON CONFLICT ("fantasy_gameweek_id", "fantasy_player_id") DO NOTHING;--> statement-breakpoint
INSERT INTO "fantasy_admin_audit_log" (
	"action",
	"entity_type",
	"entity_id",
	"reason",
	"changed_by",
	"after"
)
SELECT
	'backfill_gameweek_player_pool',
	'fantasy_gameweek',
	gw."id",
	'Reconstructed the GW1 eligible player pool from the immutable published ranking and registration history',
	'schema-migration-0017',
	jsonb_build_object(
		'number', gw."number",
		'playerPoolSize', COUNT(pool."id"),
		'source', MIN(pool."source_name")
	)
FROM "fantasy_gameweeks" gw
JOIN "fantasy_gameweek_player_pool" pool
	ON pool."fantasy_gameweek_id" = gw."id"
WHERE gw."number" = 1
	AND pool."source_name" LIKE 'gw1-ranking-backfill:%'
GROUP BY gw."id", gw."number";
