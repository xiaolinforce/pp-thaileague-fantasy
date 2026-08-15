import { loadEnvConfig } from "@next/env";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const db = drizzle(databaseUrl);

type CountRow = {
  table_name: string;
  row_count: number;
};

type SquadRow = {
  club: string;
  player_count: number;
};

type FixtureSummaryRow = {
  fixture_count: number;
  matchweek_count: number;
  first_kickoff: string;
  last_kickoff: string;
  fixtures_without_venue: number;
};

async function verifyCompetitionData() {
  const counts = await db.execute<CountRow>(sql`
    select 'competitions' as table_name, count(*)::int as row_count from competitions
    union all select 'seasons', count(*)::int from seasons
    union all select 'competition_seasons', count(*)::int from competition_seasons
    union all select 'clubs', count(*)::int from clubs
    union all select 'club_visual_identities', count(*)::int from club_visual_identities
    union all select 'venues', count(*)::int from venues
    union all select 'competition_entries', count(*)::int from competition_entries
    union all select 'players', count(*)::int from players
    union all select 'player_registrations', count(*)::int from player_registrations where status = 'active'
    union all select 'fixtures', count(*)::int from fixtures
  `);
  const countByTable = new Map(
    counts.rows.map((row) => [row.table_name, Number(row.row_count)]),
  );
  const expectedCounts: Record<string, number> = {
    competition_seasons: 1,
    competitions: 1,
    clubs: 16,
    club_visual_identities: 16,
    competition_entries: 16,
    fixtures: 240,
    seasons: 1,
    venues: 15,
  };

  for (const [tableName, expected] of Object.entries(expectedCounts)) {
    const actual = countByTable.get(tableName);
    if (actual !== expected) {
      throw new Error(
        `${tableName}: expected ${expected}, received ${actual}.`,
      );
    }
  }

  const activePlayers = countByTable.get("player_registrations") ?? 0;
  if (activePlayers < 200 || countByTable.get("players") !== activePlayers) {
    throw new Error(
      `Expected at least 200 active unique players, received ${activePlayers}.`,
    );
  }

  const squads = await db.execute<SquadRow>(sql`
    select
      ce.display_name_en as club,
      count(pr.id)::int as player_count
    from competition_entries ce
    left join player_registrations pr
      on pr.competition_entry_id = ce.id
      and pr.status = 'active'
    group by ce.id, ce.display_name_en
    order by ce.display_name_en
  `);

  if (
    squads.rows.length !== 16 ||
    squads.rows.some((row) => Number(row.player_count) === 0)
  ) {
    throw new Error("One or more competition entries has an empty squad.");
  }

  const matchweekErrors = await db.execute<{
    matchweek: number;
    fixture_count: number;
  }>(sql`
    select matchweek, count(*)::int as fixture_count
    from fixtures
    group by matchweek
    having count(*) <> 8
  `);

  if (matchweekErrors.rows.length > 0) {
    throw new Error("One or more matchweeks does not contain 8 fixtures.");
  }

  const appearanceErrors = await db.execute<{
    entry_id: string;
    appearance_count: number;
  }>(sql`
    with appearances as (
      select home_entry_id as entry_id from fixtures
      union all
      select away_entry_id as entry_id from fixtures
    )
    select entry_id, count(*)::int as appearance_count
    from appearances
    group by entry_id
    having count(*) <> 30
  `);

  if (appearanceErrors.rows.length > 0) {
    throw new Error("One or more clubs does not have exactly 30 fixtures.");
  }

  const fixtureSummary = await db.execute<FixtureSummaryRow>(sql`
    select
      count(*)::int as fixture_count,
      count(distinct matchweek)::int as matchweek_count,
      min(kickoff_at)::text as first_kickoff,
      max(kickoff_at)::text as last_kickoff,
      count(*) filter (where venue_id is null)::int as fixtures_without_venue
    from fixtures
  `);

  console.log("Competition database verification successful.");
  console.table(counts.rows);
  console.table(squads.rows);
  console.table(fixtureSummary.rows);
}

verifyCompetitionData().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
