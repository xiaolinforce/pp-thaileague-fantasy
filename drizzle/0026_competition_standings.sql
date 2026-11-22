CREATE TABLE "competition_standings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competition_season_id" uuid NOT NULL,
	"competition_entry_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"played" smallint DEFAULT 0 NOT NULL,
	"won" smallint DEFAULT 0 NOT NULL,
	"drawn" smallint DEFAULT 0 NOT NULL,
	"lost" smallint DEFAULT 0 NOT NULL,
	"goals_for" smallint DEFAULT 0 NOT NULL,
	"goals_against" smallint DEFAULT 0 NOT NULL,
	"points_adjustment" smallint DEFAULT 0 NOT NULL,
	"points" smallint DEFAULT 0 NOT NULL,
	"through_matchweek" smallint,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "competition_standings_values_check" CHECK ("competition_standings"."position" >= 1 and "competition_standings"."won" >= 0 and "competition_standings"."drawn" >= 0 and "competition_standings"."lost" >= 0 and "competition_standings"."goals_for" >= 0 and "competition_standings"."goals_against" >= 0 and ("competition_standings"."through_matchweek" is null or "competition_standings"."through_matchweek" >= 1)),
	CONSTRAINT "competition_standings_played_check" CHECK ("competition_standings"."played" = "competition_standings"."won" + "competition_standings"."drawn" + "competition_standings"."lost"),
	CONSTRAINT "competition_standings_points_check" CHECK ("competition_standings"."points" = "competition_standings"."won" * 3 + "competition_standings"."drawn" + "competition_standings"."points_adjustment")
);
--> statement-breakpoint
ALTER TABLE "competition_standings" ADD CONSTRAINT "competition_standings_competition_season_id_competition_seasons_id_fk" FOREIGN KEY ("competition_season_id") REFERENCES "public"."competition_seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_standings" ADD CONSTRAINT "competition_standings_competition_entry_id_competition_entries_id_fk" FOREIGN KEY ("competition_entry_id") REFERENCES "public"."competition_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "competition_standings_season_entry_unique" ON "competition_standings" USING btree ("competition_season_id","competition_entry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "competition_standings_season_position_unique" ON "competition_standings" USING btree ("competition_season_id","position");