import { loadEnvConfig } from "@next/env";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

loadEnvConfig(process.cwd());

async function checkDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const database = drizzle(databaseUrl);

  const result = await database.execute<{
    branch_id: string | null;
    database_name: string;
  }>(sql`
    select
      current_setting('neon.branch_id', true) as branch_id,
      current_database() as database_name
  `);
  const target = result.rows[0];

  console.log(
    `Database connection successful: database=${target?.database_name ?? "unknown"}, branch=${target?.branch_id ?? "unknown"}.`,
  );

  const legacyColumn = await database.execute<{ present: boolean }>(sql`
    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'fantasy_managers'
        and column_name = 'is_demo'
    ) as present
  `);
  if (legacyColumn.rows[0]?.present) {
    const cleanup = await database.execute<{
      demo_managers: number;
      demo_private_leagues: number;
      non_demo_private_leagues: number;
    }>(sql`
      select
        (select count(*)::int from fantasy_managers where is_demo = true) as demo_managers,
        (
          select count(*)::int from fantasy_leagues
          where type = 'private' and is_demo = true
        ) as demo_private_leagues,
        (
          select count(*)::int from fantasy_leagues
          where type = 'private' and is_demo = false
        ) as non_demo_private_leagues
    `);
    const counts = cleanup.rows[0];
    console.log(
      `Legacy League cleanup preview: demo_managers=${counts?.demo_managers ?? 0}, demo_private_leagues=${counts?.demo_private_leagues ?? 0}, non_demo_private_leagues=${counts?.non_demo_private_leagues ?? 0}.`,
    );
  }
}

checkDatabase().catch(() => {
  console.error("Database connection failed.");
  process.exitCode = 1;
});
