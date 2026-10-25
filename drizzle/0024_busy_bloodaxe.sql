CREATE TABLE "fantasy_tier_change_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fantasy_season_id" uuid NOT NULL,
	"effective_gameweek_id" uuid NOT NULL,
	"changes" jsonb NOT NULL,
	"reason" text NOT NULL,
	"changed_by" text NOT NULL,
	"applied_at" timestamp with time zone,
	"source_audit_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fantasy_tier_events_changes_check" CHECK (jsonb_typeof("fantasy_tier_change_events"."changes") = 'array' and jsonb_array_length("fantasy_tier_change_events"."changes") > 0)
);
--> statement-breakpoint
CREATE TABLE "fantasy_tier_reliefs" (
	"selection_id" uuid PRIMARY KEY NOT NULL,
	"event_id" uuid NOT NULL,
	"allowed_player_ids" uuid[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fantasy_tier_relief_size_check" CHECK (cardinality("fantasy_tier_reliefs"."allowed_player_ids") = 0 or cardinality("fantasy_tier_reliefs"."allowed_player_ids") between 6 and 15)
);
--> statement-breakpoint
ALTER TABLE "fantasy_tier_change_events" ADD CONSTRAINT "fantasy_tier_change_events_fantasy_season_id_fantasy_seasons_id_fk" FOREIGN KEY ("fantasy_season_id") REFERENCES "public"."fantasy_seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_tier_change_events" ADD CONSTRAINT "fantasy_tier_change_events_effective_gameweek_id_fantasy_gameweeks_id_fk" FOREIGN KEY ("effective_gameweek_id") REFERENCES "public"."fantasy_gameweeks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_tier_reliefs" ADD CONSTRAINT "fantasy_tier_reliefs_selection_id_fantasy_team_selections_id_fk" FOREIGN KEY ("selection_id") REFERENCES "public"."fantasy_team_selections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_tier_reliefs" ADD CONSTRAINT "fantasy_tier_reliefs_event_id_fantasy_tier_change_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."fantasy_tier_change_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fantasy_tier_events_gameweek_idx" ON "fantasy_tier_change_events" USING btree ("effective_gameweek_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_tier_events_source_audit_unique" ON "fantasy_tier_change_events" USING btree ("source_audit_id");