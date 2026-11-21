import "server-only";
import { sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { transactionDb } from "@/db/transaction";
import { requireMatchOperator } from "@/lib/auth/context";
import { FANTASY_SEASON_SLUG } from "@/lib/fantasy/provisioning";
import {
  getLatestMatchImport,
  getMatchImportRoster,
} from "@/lib/fantasy/match-import-service";

export type MatchOperationParams = { gw?: string; fixture?: string };
export async function getMatchOperation(params: MatchOperationParams) {
  const session = await requireMatchOperator();
  const weeks = (
    await db.execute<{
      id: string;
      number: number;
      status: string;
      competition: string;
    }>(sql`
    select g.id, g.number, g.status::text, s.competition_season_id competition
    from fantasy_gameweeks g join fantasy_seasons s on s.id=g.fantasy_season_id
    where s.slug=${FANTASY_SEASON_SLUG} order by g.number`)
  ).rows;
  const week = params.gw
    ? weeks.find((w) => String(w.number) === params.gw)
    : (weeks.findLast((w) => w.status === "provisional") ??
      weeks.find((w) => w.status === "open") ??
      weeks.at(-1));
  if (!week) return notFound();
  const fixtures = (
    await db.execute<{
      id: string;
      th: string;
      en: string;
      status: string;
      kickoff: string | null;
      home: number | null;
      away: number | null;
    }>(sql`
    select f.id, h.display_name_th || ' พบ ' || a.display_name_th th,
      h.display_name_en || ' vs ' || a.display_name_en en, f.status::text,
      f.kickoff_at::text kickoff, f.home_score home, f.away_score away
    from fixtures f join competition_entries h on h.id=f.home_entry_id
    join competition_entries a on a.id=f.away_entry_id
    where f.competition_season_id=${week.competition}::uuid and f.matchweek=${week.number}
    order by f.kickoff_at nulls last, f.id`)
  ).rows;
  const fixture = params.fixture
    ? fixtures.find((f) => f.id === params.fixture)
    : fixtures[0];
  if (params.fixture && !fixture) return notFound();
  const editor =
    fixture && week.status === "provisional"
      ? await transactionDb.transaction(async (tx) => ({
          roster: await getMatchImportRoster(tx, fixture.id),
          latest: await getLatestMatchImport(tx, fixture.id),
        }))
      : null;
  return {
    week,
    weeks,
    fixture,
    fixtures,
    editor,
    isOperator: session.user.id === process.env.NENE_AUTH_USER_ID,
  };
}
