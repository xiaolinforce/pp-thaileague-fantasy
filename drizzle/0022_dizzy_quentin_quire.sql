CREATE TABLE "deadline_reminder_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fantasy_gameweek_id" uuid NOT NULL,
	"audience" varchar(32) NOT NULL,
	"deadline_at_snapshot" timestamp with time zone NOT NULL,
	"subject_snapshot" text NOT NULL,
	"template_hash" varchar(64) NOT NULL,
	"created_by_auth_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deadline_reminder_campaigns_audience_check" CHECK ("deadline_reminder_campaigns"."audience" in ('previous-unsaved', 'previous-complete', 'ever-complete', 'all-members'))
);
--> statement-breakpoint
CREATE TABLE "deadline_reminder_preferences" (
	"auth_user_id" text PRIMARY KEY NOT NULL,
	"unsubscribed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deadline_reminder_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"fantasy_gameweek_id" uuid NOT NULL,
	"auth_user_id" text NOT NULL,
	"email_hash" varchar(64) NOT NULL,
	"status" varchar(24) DEFAULT 'pending' NOT NULL,
	"provider_message_id" text,
	"error_code" varchar(48),
	"claimed_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deadline_reminder_recipients_status_check" CHECK ("deadline_reminder_recipients"."status" in ('pending', 'sending', 'accepted', 'delivered', 'bounced', 'complained', 'suppressed', 'skipped', 'failed', 'uncertain'))
);
--> statement-breakpoint
CREATE TABLE "deadline_reminder_suppressions" (
	"auth_user_id" text PRIMARY KEY NOT NULL,
	"reason" varchar(24) NOT NULL,
	"provider_message_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deadline_reminder_suppressions_reason_check" CHECK ("deadline_reminder_suppressions"."reason" in ('bounce', 'complaint', 'suppressed', 'manual'))
);
--> statement-breakpoint
CREATE TABLE "deadline_reminder_webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" varchar(40) NOT NULL,
	"provider_message_id" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deadline_reminder_campaigns" ADD CONSTRAINT "deadline_reminder_campaigns_fantasy_gameweek_id_fantasy_gameweeks_id_fk" FOREIGN KEY ("fantasy_gameweek_id") REFERENCES "public"."fantasy_gameweeks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadline_reminder_campaigns" ADD CONSTRAINT "deadline_reminder_campaigns_created_by_auth_user_id_auth_users_id_fk" FOREIGN KEY ("created_by_auth_user_id") REFERENCES "public"."auth_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadline_reminder_preferences" ADD CONSTRAINT "deadline_reminder_preferences_auth_user_id_auth_users_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadline_reminder_recipients" ADD CONSTRAINT "deadline_reminder_recipients_campaign_id_deadline_reminder_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."deadline_reminder_campaigns"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadline_reminder_recipients" ADD CONSTRAINT "deadline_reminder_recipients_fantasy_gameweek_id_fantasy_gameweeks_id_fk" FOREIGN KEY ("fantasy_gameweek_id") REFERENCES "public"."fantasy_gameweeks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadline_reminder_recipients" ADD CONSTRAINT "deadline_reminder_recipients_auth_user_id_auth_users_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadline_reminder_suppressions" ADD CONSTRAINT "deadline_reminder_suppressions_auth_user_id_auth_users_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "deadline_reminder_campaigns_gameweek_audience_unique" ON "deadline_reminder_campaigns" USING btree ("fantasy_gameweek_id","audience");--> statement-breakpoint
CREATE UNIQUE INDEX "deadline_reminder_recipients_gameweek_user_unique" ON "deadline_reminder_recipients" USING btree ("fantasy_gameweek_id","auth_user_id");--> statement-breakpoint
CREATE INDEX "deadline_reminder_recipients_campaign_status_idx" ON "deadline_reminder_recipients" USING btree ("campaign_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "deadline_reminder_recipients_provider_message_unique" ON "deadline_reminder_recipients" USING btree ("provider_message_id");