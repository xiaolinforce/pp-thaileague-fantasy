CREATE TABLE "competition_player_season_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competition_season_id" uuid NOT NULL,
	"competition_entry_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"source_name" text NOT NULL,
	"source_url" text NOT NULL,
	"source_external_id" text NOT NULL,
	"source_person_id" text NOT NULL,
	"match_method" varchar(40) NOT NULL,
	"appearances" smallint DEFAULT 0 NOT NULL,
	"starts" smallint DEFAULT 0 NOT NULL,
	"minutes" integer DEFAULT 0 NOT NULL,
	"goals" smallint DEFAULT 0 NOT NULL,
	"source_assists" smallint DEFAULT 0 NOT NULL,
	"clean_sheets" smallint DEFAULT 0 NOT NULL,
	"goals_conceded" smallint DEFAULT 0 NOT NULL,
	"penalty_goals" smallint DEFAULT 0 NOT NULL,
	"penalty_misses" smallint DEFAULT 0 NOT NULL,
	"yellow_cards" smallint DEFAULT 0 NOT NULL,
	"red_cards" smallint DEFAULT 0 NOT NULL,
	"own_goals" smallint DEFAULT 0 NOT NULL,
	"source_payload" jsonb NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "competition_player_season_stats_nonnegative_check" CHECK ("competition_player_season_stats"."appearances" >= 0 and "competition_player_season_stats"."starts" >= 0 and "competition_player_season_stats"."minutes" >= 0 and "competition_player_season_stats"."goals" >= 0 and "competition_player_season_stats"."source_assists" >= 0 and "competition_player_season_stats"."clean_sheets" >= 0 and "competition_player_season_stats"."goals_conceded" >= 0 and "competition_player_season_stats"."penalty_goals" >= 0 and "competition_player_season_stats"."penalty_misses" >= 0 and "competition_player_season_stats"."yellow_cards" >= 0 and "competition_player_season_stats"."red_cards" >= 0 and "competition_player_season_stats"."own_goals" >= 0)
);
--> statement-breakpoint
ALTER TABLE "competition_player_season_stats" ADD CONSTRAINT "competition_player_season_stats_competition_season_id_competition_seasons_id_fk" FOREIGN KEY ("competition_season_id") REFERENCES "public"."competition_seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_player_season_stats" ADD CONSTRAINT "competition_player_season_stats_competition_entry_id_competition_entries_id_fk" FOREIGN KEY ("competition_entry_id") REFERENCES "public"."competition_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_player_season_stats" ADD CONSTRAINT "competition_player_season_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "competition_player_season_stats_source_unique" ON "competition_player_season_stats" USING btree ("competition_season_id","source_name","source_external_id");--> statement-breakpoint
CREATE INDEX "competition_player_season_stats_player_idx" ON "competition_player_season_stats" USING btree ("competition_season_id","player_id");--> statement-breakpoint
CREATE INDEX "competition_player_season_stats_entry_idx" ON "competition_player_season_stats" USING btree ("competition_season_id","competition_entry_id");--> statement-breakpoint
WITH "simulated_kickoffs" ("match_number", "kickoff_at") AS (
	VALUES
		(49, '2026-10-31T11:00:00.000Z'::timestamptz),
		(50, '2026-10-31T11:30:00.000Z'::timestamptz),
		(51, '2026-10-31T12:00:00.000Z'::timestamptz),
		(52, '2026-10-31T12:30:00.000Z'::timestamptz),
		(53, '2026-11-01T11:00:00.000Z'::timestamptz),
		(54, '2026-11-01T11:00:00.000Z'::timestamptz),
		(55, '2026-11-01T11:30:00.000Z'::timestamptz),
		(56, '2026-11-01T12:00:00.000Z'::timestamptz),
		(73, '2026-11-28T11:00:00.000Z'::timestamptz),
		(74, '2026-11-28T11:30:00.000Z'::timestamptz),
		(75, '2026-11-28T12:00:00.000Z'::timestamptz),
		(76, '2026-11-28T12:30:00.000Z'::timestamptz),
		(77, '2026-11-29T11:00:00.000Z'::timestamptz),
		(78, '2026-11-29T11:00:00.000Z'::timestamptz),
		(79, '2026-11-29T11:30:00.000Z'::timestamptz),
		(80, '2026-11-29T12:00:00.000Z'::timestamptz),
		(129, '2027-02-13T11:00:00.000Z'::timestamptz),
		(130, '2027-02-13T11:30:00.000Z'::timestamptz),
		(131, '2027-02-13T12:00:00.000Z'::timestamptz),
		(132, '2027-02-13T12:30:00.000Z'::timestamptz),
		(133, '2027-02-14T11:00:00.000Z'::timestamptz),
		(134, '2027-02-14T11:00:00.000Z'::timestamptz),
		(135, '2027-02-14T11:30:00.000Z'::timestamptz),
		(136, '2027-02-14T12:00:00.000Z'::timestamptz)
)
UPDATE "fixtures" AS "fixture"
SET "kickoff_at" = NULL, "status" = 'time_tbc', "updated_at" = now()
FROM "simulated_kickoffs", "competition_seasons" AS "season"
WHERE "fixture"."competition_season_id" = "season"."id"
	AND "season"."external_id" = '224'
	AND "fixture"."source_name" = 'Thai League official API'
	AND "fixture"."match_number" = "simulated_kickoffs"."match_number"
	AND "fixture"."kickoff_at" = "simulated_kickoffs"."kickoff_at";
