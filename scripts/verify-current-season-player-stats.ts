import { loadEnvConfig } from "@next/env";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

loadEnvConfig(process.cwd());
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
const db = drizzle(databaseUrl);

async function run() {
  const result = await db.execute<{
    rows: number;
    players: number;
    unmatched: number;
    last_imported_at: string | null;
  }>(sql`
    select
      count(*)::int as rows,
      count(distinct player_id)::int as players,
      count(*) filter (where match_method not in ('exact_name', 'manual'))::int as unmatched,
      max(imported_at)::text as last_imported_at
    from competition_player_season_stats
  `);
  const summary = result.rows[0];
  if (Number(summary?.unmatched ?? 0) > 0) {
    throw new Error(
      "Competition player statistics contain an invalid match method.",
    );
  }
  console.log("Current-season player-stat verification successful.");
  console.table(result.rows);
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
