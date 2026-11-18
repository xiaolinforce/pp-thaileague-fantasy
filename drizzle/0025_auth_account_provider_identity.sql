ALTER TABLE "auth_accounts" ALTER COLUMN "issuer" DROP NOT NULL;--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "auth_accounts"
    GROUP BY "provider_id", "account_id"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Better Auth upgrade blocked: duplicate provider/account identities exist in auth_accounts.'
      USING ERRCODE = '23505',
            HINT = 'Resolve duplicate (provider_id, account_id) pairs before retrying this migration.';
  END IF;
END;
$$;
--> statement-breakpoint
CREATE UNIQUE INDEX "auth_accounts_provider_account_unique" ON "auth_accounts" USING btree ("provider_id","account_id");