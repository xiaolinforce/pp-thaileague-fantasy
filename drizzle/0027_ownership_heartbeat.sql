CREATE TABLE "cron_heartbeats" (
	"job" text PRIMARY KEY NOT NULL,
	"monitoring_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_succeeded_at" timestamp with time zone
);
--> statement-breakpoint
INSERT INTO "cron_heartbeats" ("job") VALUES ('fantasy-ownership');
