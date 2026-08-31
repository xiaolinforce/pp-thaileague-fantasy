CREATE TABLE "fantasy_league_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fantasy_season_id" uuid NOT NULL,
	"fantasy_league_id" uuid NOT NULL,
	"actor_team_id" uuid,
	"target_team_id" uuid,
	"action" varchar(80) NOT NULL,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DELETE FROM "fantasy_leagues" WHERE "type" = 'private' AND "is_demo" = true;--> statement-breakpoint
DELETE FROM "fantasy_managers" WHERE "is_demo" = true;--> statement-breakpoint
UPDATE "fantasy_leagues" SET "is_demo" = false WHERE "type" = 'overall';--> statement-breakpoint
DROP INDEX "fantasy_managers_demo_idx";--> statement-breakpoint
ALTER TABLE "fantasy_leagues" ALTER COLUMN "invite_code" SET DATA TYPE varchar(8);--> statement-breakpoint
ALTER TABLE "fantasy_managers" ALTER COLUMN "status" SET DEFAULT 'guest';--> statement-breakpoint
ALTER TABLE "fantasy_leagues" ADD COLUMN "owner_team_id" uuid;--> statement-breakpoint
ALTER TABLE "fantasy_league_audit_log" ADD CONSTRAINT "fantasy_league_audit_log_fantasy_season_id_fantasy_seasons_id_fk" FOREIGN KEY ("fantasy_season_id") REFERENCES "public"."fantasy_seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_league_audit_log" ADD CONSTRAINT "fantasy_league_audit_log_actor_team_id_fantasy_teams_id_fk" FOREIGN KEY ("actor_team_id") REFERENCES "public"."fantasy_teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_league_audit_log" ADD CONSTRAINT "fantasy_league_audit_log_target_team_id_fantasy_teams_id_fk" FOREIGN KEY ("target_team_id") REFERENCES "public"."fantasy_teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fantasy_league_audit_league_created_idx" ON "fantasy_league_audit_log" USING btree ("fantasy_league_id","created_at");--> statement-breakpoint
CREATE INDEX "fantasy_league_audit_actor_created_idx" ON "fantasy_league_audit_log" USING btree ("actor_team_id","created_at");--> statement-breakpoint
ALTER TABLE "fantasy_leagues" ADD CONSTRAINT "fantasy_leagues_owner_team_id_fantasy_teams_id_fk" FOREIGN KEY ("owner_team_id") REFERENCES "public"."fantasy_teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fantasy_leagues_overall_season_unique" ON "fantasy_leagues" USING btree ("fantasy_season_id") WHERE "fantasy_leagues"."type" = 'overall';--> statement-breakpoint
CREATE INDEX "fantasy_leagues_owner_idx" ON "fantasy_leagues" USING btree ("owner_team_id");--> statement-breakpoint
ALTER TABLE "fantasy_leagues" DROP COLUMN "is_demo";--> statement-breakpoint
ALTER TABLE "fantasy_managers" DROP COLUMN "is_demo";--> statement-breakpoint
ALTER TABLE "fantasy_leagues" ADD CONSTRAINT "fantasy_leagues_name_length_check" CHECK (char_length("fantasy_leagues"."name") between 3 and 40);--> statement-breakpoint
ALTER TABLE "fantasy_leagues" ADD CONSTRAINT "fantasy_leagues_type_fields_check" CHECK (("fantasy_leagues"."type" = 'overall' and "fantasy_leagues"."owner_team_id" is null and "fantasy_leagues"."invite_code" is null) or ("fantasy_leagues"."type" = 'private' and "fantasy_leagues"."owner_team_id" is not null and "fantasy_leagues"."invite_code" ~ '^[A-HJ-KM-NP-Z2-9]{8}$'));
