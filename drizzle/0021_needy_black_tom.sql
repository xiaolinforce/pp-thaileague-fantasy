ALTER TABLE "player_registrations" DROP CONSTRAINT "player_registrations_shirt_number_check";--> statement-breakpoint
ALTER TABLE "player_registrations" DROP COLUMN "shirt_number";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "photo_url";