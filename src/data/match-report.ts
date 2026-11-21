import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { requireAdmin } from "@/lib/auth/context";
import { FANTASY_SEASON_SLUG } from "@/lib/fantasy/provisioning";

type FixtureReport = {
  id: string;
  homeTh: string;
  homeEn: string;
  awayTh: string;
  awayEn: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  events: string[] | null;
  uncertainties: string[] | null;
  sources: string[] | null;
};

export async function getMatchReport(number: number) {
  await requireAdmin();
  const result = await db.execute<FixtureReport>(sql`
    select f.id, home.display_name_th as "homeTh", home.display_name_en as "homeEn",
      away.display_name_th as "awayTh", away.display_name_en as "awayEn",
      f.home_score as "homeScore", f.away_score as "awayScore", f.status,
      audit.after->'events' as events, audit.after->'uncertainties' as uncertainties,
      audit.after->'sources' as sources
    from fantasy_seasons s
    join fixtures f on f.competition_season_id = s.competition_season_id
    join competition_entries home on home.id = f.home_entry_id
    join competition_entries away on away.id = f.away_entry_id
    left join lateral (
      select a.after from fantasy_admin_audit_log a
      where a.entity_type = 'fixture' and a.entity_id = f.id and a.action = 'import_match_batch'
        and a.after->>'format' = 'match-import-v1'
      order by a.created_at desc, a.id desc limit 1
    ) audit on true
    where s.slug = ${FANTASY_SEASON_SLUG} and f.matchweek = ${number}
    order by f.kickoff_at nulls last, f.match_number, f.id`);
  return result.rows;
}
