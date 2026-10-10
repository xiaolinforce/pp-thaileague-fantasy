import { loadEnvConfig } from "@next/env";
import { sql } from "drizzle-orm";

loadEnvConfig(process.cwd());

async function auditPlayerClubs() {
  const expectedBranch = process.argv[2];
  if (!expectedBranch?.startsWith("br-"))
    throw new Error(
      "Pass the intended Neon branch ID: npm run db:audit:player-clubs -- br-...",
    );
  const { db } = await import("../src/db/index.ts");
  const target = await db.execute(
    sql`select current_setting('neon.branch_id', true) as branch_id`,
  );
  if (target.rows[0]?.branch_id !== expectedBranch)
    throw new Error(
      "The database branch does not match the requested audit target.",
    );
  const result = await db.execute(sql`
    with season as (select * from fantasy_seasons where slug = 'thai-league-1-2026-27'),
    eligible as (
      select fp.id, e.club_id
      from fantasy_players fp join season fs on fs.id = fp.fantasy_season_id
      join players p on p.id = fp.player_id
      join player_registrations r on r.player_id = p.id
      join competition_entries e on e.id = r.competition_entry_id and e.competition_season_id = fs.competition_season_id
      where fp.is_available and p.is_active and e.is_active and r.status = 'active'
        and r.registered_from <= (now() at time zone 'Asia/Bangkok')::date
        and (r.registered_until is null or r.registered_until >= (now() at time zone 'Asia/Bangkok')::date)
    ), current_clubs as (select id, min(club_id::text)::uuid club_id from eligible group by id having count(distinct club_id) = 1),
    compared as (
      select g.number gameweek, g.status, p.full_name_en player, sp.club_id_snapshot saved_club,
        exists (select 1 from fantasy_gameweek_player_pool other_pool where other_pool.fantasy_gameweek_id = g.id) has_pool,
        case when g.status = 'open' and s.status = 'draft' then current_clubs.club_id else pool.club_id_snapshot end expected_club
      from fantasy_team_selection_players sp join fantasy_team_selections s on s.id = sp.selection_id
      join fantasy_gameweeks g on g.id = s.fantasy_gameweek_id join season fs on fs.id = g.fantasy_season_id
      join fantasy_players fp on fp.id = sp.fantasy_player_id join players p on p.id = fp.player_id
      left join current_clubs on current_clubs.id = fp.id
      left join fantasy_gameweek_player_pool pool on pool.fantasy_gameweek_id = g.id and pool.fantasy_player_id = fp.id
    )
    select 'ambiguous_active_clubs' kind, null::smallint gameweek, null::text status, p.full_name_en player, count(distinct e.club_id)::int rows
      from eligible e join fantasy_players fp on fp.id = e.id join players p on p.id = fp.player_id group by e.id, p.full_name_en having count(distinct e.club_id) > 1
    union all
    select case when expected_club is null and status <> 'open' and not has_pool then 'missing_deadline_pool' when expected_club is null then 'no_eligible_reference' when status = 'open' then 'draft_club_mismatch' else 'historical_snapshot_difference' end kind,
      gameweek, status::text, player, count(*)::int rows from compared
      where expected_club is null or saved_club <> expected_club
      group by kind, gameweek, status, player order by kind, gameweek, player
  `);
  console.log(`Read-only club audit: ${expectedBranch}`);
  console.table(result.rows);
  console.log(
    "Historical differences use the deadline pool for display; missing references can represent retained unavailable players. Verify source evidence before correcting a pool.",
  );
  if (
    result.rows.some(
      (row) =>
        row.kind === "ambiguous_active_clubs" ||
        row.kind === "draft_club_mismatch" ||
        row.kind === "missing_deadline_pool",
    )
  )
    process.exitCode = 1;
}

auditPlayerClubs().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Player club audit failed.",
  );
  process.exitCode = 1;
});
