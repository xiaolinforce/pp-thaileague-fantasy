CREATE TABLE "club_visual_identities" (
	"club_id" uuid PRIMARY KEY NOT NULL,
	"top_left_color" varchar(7) NOT NULL,
	"top_right_color" varchar(7) NOT NULL,
	"bottom_left_color" varchar(7) NOT NULL,
	"bottom_right_color" varchar(7) NOT NULL,
	"source_name" text NOT NULL,
	"source_url" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "club_visual_identities_top_left_hex_check" CHECK ("club_visual_identities"."top_left_color" ~ '^#[0-9A-Fa-f]{6}$'),
	CONSTRAINT "club_visual_identities_top_right_hex_check" CHECK ("club_visual_identities"."top_right_color" ~ '^#[0-9A-Fa-f]{6}$'),
	CONSTRAINT "club_visual_identities_bottom_left_hex_check" CHECK ("club_visual_identities"."bottom_left_color" ~ '^#[0-9A-Fa-f]{6}$'),
	CONSTRAINT "club_visual_identities_bottom_right_hex_check" CHECK ("club_visual_identities"."bottom_right_color" ~ '^#[0-9A-Fa-f]{6}$')
);
--> statement-breakpoint
ALTER TABLE "club_visual_identities" ADD CONSTRAINT "club_visual_identities_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;