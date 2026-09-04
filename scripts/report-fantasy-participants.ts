import { loadEnvConfig } from "@next/env";
import { sql } from "drizzle-orm";

loadEnvConfig(process.cwd());

async function reportFantasyParticipants() {
  const { db } = await import("../src/db/index.ts");
  const result = await db.execute(sql`
    select season.slug,
      count(*)::int as total_teams,
      count(*) filter (where not manager.is_bot)::int as human_teams,
      count(*) filter (where manager.is_bot)::int as bot_teams,
      count(*) filter (where not manager.is_bot and manager.status = 'member')::int as member_teams,
      count(*) filter (where not manager.is_bot and manager.status = 'guest')::int as guest_teams,
      count(*) filter (where not manager.is_bot and manager.status = 'abandoned')::int as preserved_teams
    from fantasy_teams team
    join fantasy_managers manager on manager.id = team.manager_id
    join fantasy_seasons season on season.id = team.fantasy_season_id
    group by season.slug
    order by season.slug
  `);
  console.table(result.rows);
  console.log(
    "Counts represent season teams, not unique people or active users. Human totals include preserved Guest teams.",
  );
}

reportFantasyParticipants().catch(() => {
  console.error("Fantasy participant report failed.");
  process.exitCode = 1;
});
