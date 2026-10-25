ALTER TABLE "fantasy_gameweeks" ADD COLUMN "tier_rules_version" varchar(32) DEFAULT 'two-tier-v1' NOT NULL;--> statement-breakpoint
ALTER TABLE "fantasy_gameweeks" ADD CONSTRAINT "fantasy_gameweeks_tier_rules_check" CHECK ("fantasy_gameweeks"."tier_rules_version" in ('four-tier-v1', 'two-tier-v1'));
--> statement-breakpoint
-- Existing closed Gameweeks retain the original four-tier squad rules.
UPDATE "fantasy_gameweeks"
SET "tier_rules_version" = 'four-tier-v1'
WHERE "status" NOT IN ('open', 'planned');
--> statement-breakpoint
INSERT INTO "fantasy_admin_audit_log"
  ("action", "entity_type", "entity_id", "reason", "changed_by", "before", "after")
SELECT 'adopt_two_tier_rules', 'fantasy_gameweek', id,
  'Owner-approved: keep former Level 1; combine Levels 2-4; allow up to five Level 1 players from the currently open Gameweek.',
  'migration:0023_warm_blob',
  '{"tierRulesVersion":"four-tier-v1","tierSlots":[3,3,6,3]}'::jsonb,
  jsonb_build_object('tierRulesVersion', tier_rules_version, 'tierSlots', jsonb_build_array(5,10), 'gameweek', number)
FROM "fantasy_gameweeks" WHERE "tier_rules_version" = 'two-tier-v1';
