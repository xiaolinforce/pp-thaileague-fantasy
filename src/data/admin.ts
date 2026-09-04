import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";
import { connection } from "next/server";
import { cache } from "react";
import { db } from "@/db";
import {
  fantasyAdminAuditLog,
  fantasyGameweeks,
  fantasyPlayerMatchStats,
  fantasyPlayers,
  fantasyPlayerTiers,
  fantasySeasons,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth/context";
import { FANTASY_SEASON_SLUG } from "@/lib/fantasy/provisioning";

export const getAdminContext = cache(async () => {
  await connection();
  await requireAdmin();
  const season = await db.query.fantasySeasons.findFirst({
    where: eq(fantasySeasons.slug, FANTASY_SEASON_SLUG),
  });
  if (!season) throw new Error("Fantasy season was not found.");
  const weeks = await db
    .select()
    .from(fantasyGameweeks)
    .where(eq(fantasyGameweeks.fantasySeasonId, season.id))
    .orderBy(asc(fantasyGameweeks.number));
  const current =
    weeks.find((w) => w.status === "open") ??
    weeks.find((w) => w.status === "planned") ??
    weeks.at(-1);
  return { season, weeks, current };
});

export type AdminParams = Record<string, string | string[] | undefined>;
export function param(params: AdminParams, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}
export function pageNumber(value: string) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? Math.min(n, 100000) : 1;
}

export type AdminTeam = {
  id: string;
  name: string;
  kind: string;
  members: number;
  last_save: string | null;
  recent: boolean;
  points: number | null;
  total_points: number;
  active: boolean;
};

// confirmed_at is written by explicit save/revert actions. Carryover creates a
// revision but does not confirm a selection, so revision timestamps cannot be used.
function participantQuery(seasonId: string, weekId: string | null) {
  return sql`with participants as (
    select t.id, t.name, t.is_active as active,
      case when m.is_bot then 'bot' else m.status::text end as kind,
      (select count(*)::int from fantasy_team_selection_players p where p.selection_id = s.id) as members,
      activity.last_save::text,
      coalesce(activity.last_save >= now() - interval '7 days', false) and not m.is_bot and m.status <> 'abandoned' as recent,
      score.total_points as points,
      coalesce((select sum(gs.total_points)::int from fantasy_team_selections ts join fantasy_team_gameweek_scores gs on gs.selection_id = ts.id where ts.fantasy_team_id = t.id), 0)::int as total_points
    from fantasy_teams t join fantasy_managers m on m.id = t.manager_id
    left join fantasy_team_selections s on s.fantasy_team_id = t.id and s.fantasy_gameweek_id = ${weekId}::uuid
    left join fantasy_team_gameweek_scores score on score.selection_id = s.id
    left join lateral (select max(confirmed_at) as last_save from fantasy_team_selections where fantasy_team_id = t.id) activity on true
    where t.fantasy_season_id = ${seasonId}::uuid
  )`;
}

export async function getAdminParticipants(
  params: AdminParams,
  summaryOnly = false,
) {
  const context = await getAdminContext();
  const week =
    context.weeks.find((w) => String(w.number) === param(params, "gw")) ??
    context.current;
  const cte = participantQuery(context.season.id, week?.id ?? null);
  const kind = param(params, "kind"),
    state = param(params, "state"),
    query = param(params, "q").trim().slice(0, 100);
  const filters = sql`where (${query} = '' or position(lower(${query}) in lower(name)) > 0)
    and (${kind} not in ('member', 'guest', 'bot', 'abandoned') or kind = ${kind})
    and (${state} <> 'recent' or recent)
    and (${state} <> 'complete' or (members = 15 and active))
    and (${state} <> 'incomplete' or members <> 15 or not active)`;
  const totals = await db.execute<{
    total: number;
    member: number;
    guest: number;
    bot: number;
    abandoned: number;
    recent: number;
    complete: number;
    incomplete: number;
  }>(sql`${cte} select count(*)::int total,
    count(*) filter(where kind = 'member')::int member, count(*) filter(where kind = 'guest')::int guest,
    count(*) filter(where kind = 'bot')::int bot, count(*) filter(where kind = 'abandoned')::int abandoned,
    count(*) filter(where recent)::int recent, count(*) filter(where members = 15 and active)::int complete,
    count(*) filter(where members <> 15 or not active)::int incomplete from participants`);
  if (summaryOnly)
    return {
      ...context,
      week,
      totals: totals.rows[0],
      rows: [] as AdminTeam[],
      total: totals.rows[0].total,
      page: 1,
      query,
      kind,
      state,
    };
  const count = await db.execute<{ count: number }>(
    sql`${cte} select count(*)::int count from participants ${filters}`,
  );
  const total = count.rows[0].count;
  const page = Math.min(
    pageNumber(param(params, "page")),
    Math.max(1, Math.ceil(total / 30)),
  );
  const rows = await db.execute<AdminTeam>(
    sql`${cte} select * from participants ${filters} order by name, id limit 30 offset ${(page - 1) * 30}`,
  );
  return {
    ...context,
    week,
    totals: totals.rows[0],
    rows: rows.rows,
    total,
    page,
    query,
    kind,
    state,
  };
}

export async function getAdminTeam(id: string, gw: string) {
  const context = await getAdminContext();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    return null;
  const week =
    context.weeks.find((w) => String(w.number) === gw) ?? context.current;
  const result = await db.execute<AdminTeam>(
    sql`${participantQuery(context.season.id, week?.id ?? null)} select * from participants where id = ${id}::uuid`,
  );
  if (!result.rows[0]) return null;
  const squad = await db.execute<{
    id: string;
    th: string;
    en: string;
    position: string;
    tier: number;
    role: string;
    captain: string;
    bench: number | null;
  }>(sql`
    select fp.id, coalesce(p.full_name_th, p.full_name_en) th, p.full_name_en en,
      sp.position_snapshot position, sp.tier_snapshot tier, sp.lineup_role role, sp.captain_role captain, sp.bench_order bench
    from fantasy_team_selections s join fantasy_team_selection_players sp on sp.selection_id = s.id
    join fantasy_players fp on fp.id = sp.fantasy_player_id join players p on p.id = fp.player_id
    where s.fantasy_team_id = ${id}::uuid and s.fantasy_gameweek_id = ${week?.id ?? null}::uuid
    order by sp.lineup_role desc, sp.bench_order nulls first, p.full_name_en`);
  return { ...context, week, team: result.rows[0], squad: squad.rows };
}

export async function getAdminPlayerState(playerId: string, weekId: string) {
  const context = await getAdminContext();
  const week = context.weeks.find((w) => w.id === weekId);
  if (!week) return null;
  const player = await db.query.fantasyPlayers.findFirst({
    where: and(
      eq(fantasyPlayers.id, playerId),
      eq(fantasyPlayers.fantasySeasonId, context.season.id),
    ),
  });
  if (!player) return null;
  const tiers = await db
    .select({
      level: fantasyPlayerTiers.level,
      number: fantasyGameweeks.number,
    })
    .from(fantasyPlayerTiers)
    .innerJoin(
      fantasyGameweeks,
      eq(fantasyGameweeks.id, fantasyPlayerTiers.effectiveGameweekId),
    )
    .where(eq(fantasyPlayerTiers.fantasyPlayerId, playerId))
    .orderBy(desc(fantasyGameweeks.number));
  return {
    isThai: player.isThai,
    tier: tiers.find((t) => t.number <= week.number)?.level ?? 4,
  };
}

export async function getAdminMatchStats(fixtureId: string, playerId: string) {
  await getAdminContext();
  const row = await db.query.fantasyPlayerMatchStats.findFirst({
    where: and(
      eq(fantasyPlayerMatchStats.fixtureId, fixtureId),
      eq(fantasyPlayerMatchStats.fantasyPlayerId, playerId),
    ),
  });
  if (!row) return null;
  return {
    minutes: row.minutes,
    goals: row.goals,
    sourceAssists: row.sourceAssists,
    fantasyAssists: row.fantasyAssists,
    goalsConcededWhilePlaying: row.goalsConcededWhilePlaying,
    saves: row.saves,
    penaltySaves: row.penaltySaves,
    penaltyMisses: row.penaltyMisses,
    yellowCards: row.yellowCards,
    redCards: row.redCards,
    ownGoals: row.ownGoals,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getAdminMatchOptions(params: AdminParams) {
  const context = await getAdminContext();
  const gw =
    Number(param(params, "gw")) ||
    context.current?.number ||
    context.weeks[0]?.number;
  const fixtures = await db.execute<{
    id: string;
    matchweek: number;
    home_th: string;
    home_en: string;
    away_th: string;
    away_en: string;
    status: string;
  }>(sql`
    select f.id, f.matchweek, home.display_name_th home_th, home.display_name_en home_en,
      away.display_name_th away_th, away.display_name_en away_en, f.status::text
    from fixtures f join competition_entries home on home.id=f.home_entry_id join competition_entries away on away.id=f.away_entry_id
    where f.matchweek=${gw} and f.competition_season_id=${context.season.competitionSeasonId}::uuid order by f.kickoff_at nulls last, f.id`);
  const fixture =
    fixtures.rows.find((f) => f.id === param(params, "fixture")) ??
    fixtures.rows[0];
  const players = fixture
    ? await db.execute<{
        id: string;
        th: string;
        en: string;
        club_th: string;
        club_en: string;
        position: string;
      }>(sql`
    select distinct on (fp.id) fp.id, coalesce(p.full_name_th,p.full_name_en) th, p.full_name_en en, e.display_name_th club_th, e.display_name_en club_en, fp.locked_position::text position
    from fixtures f join player_registrations r on r.competition_entry_id in (f.home_entry_id,f.away_entry_id)
    join fantasy_players fp on fp.player_id=r.player_id and fp.fantasy_season_id=${context.season.id}::uuid
    join players p on p.id=fp.player_id join competition_entries e on e.id=r.competition_entry_id
    where f.id=${fixture.id}::uuid order by fp.id, (r.status = 'active') desc, r.registered_from desc, e.id`)
    : { rows: [] };
  players.rows.sort((a, b) => a.th.localeCompare(b.th, "th"));
  const player =
    players.rows.find((p) => p.id === param(params, "player")) ??
    players.rows[0];
  const stats =
    fixture && player ? await getAdminMatchStats(fixture.id, player.id) : null;
  return {
    ...context,
    gw,
    fixtures: fixtures.rows,
    fixture,
    players: players.rows,
    player,
    stats,
  };
}

export async function getAdminPlayerOptions(params: AdminParams) {
  const context = await getAdminContext();
  const query = param(params, "q").trim().slice(0, 100);
  const club = param(params, "club");
  const position = param(params, "position"),
    level = param(params, "level");
  const week =
    context.weeks.find((w) => w.id === param(params, "week")) ??
    context.current;
  const rows = await db.execute<{
    id: string;
    th: string;
    en: string;
    club_id: string;
    club_th: string;
    club_en: string;
    position: string;
    is_thai: boolean;
  }>(sql`
    select distinct fp.id, coalesce(p.full_name_th,p.full_name_en) th, p.full_name_en en, e.club_id,
      e.display_name_th club_th,e.display_name_en club_en,fp.locked_position::text position,fp.is_thai
    from fantasy_players fp join players p on p.id=fp.player_id join player_registrations r on r.player_id=p.id
    join competition_entries e on e.id=r.competition_entry_id and e.competition_season_id=${context.season.competitionSeasonId}::uuid
    where fp.fantasy_season_id=${context.season.id}::uuid and fp.is_available and r.status='active' and e.is_active and (${query}='' or position(lower(${query}) in lower(coalesce(p.full_name_th,'')||' '||p.full_name_en))>0)
      and (${club}='' or e.club_id::text=${club})
      and (${position}='' or fp.locked_position::text=${position})
      and (${level}='' or coalesce((select tier.level from fantasy_player_tiers tier join fantasy_gameweeks gw on gw.id=tier.effective_gameweek_id where tier.fantasy_player_id=fp.id and gw.number<=${week?.number ?? 1} order by gw.number desc limit 1),4)::text=${level})
    order by coalesce(p.full_name_th,p.full_name_en),fp.id`);
  const clubs = await db.execute<{ id: string; th: string; en: string }>(
    sql`select club_id id,display_name_th th,display_name_en en from competition_entries where competition_season_id=${context.season.competitionSeasonId}::uuid and is_active order by display_name_th`,
  );
  rows.rows = Array.from(new Map(rows.rows.map((p) => [p.id, p])).values());
  const player =
    rows.rows.find((p) => p.id === param(params, "player")) ?? rows.rows[0];
  const state =
    player && week ? await getAdminPlayerState(player.id, week.id) : null;
  return {
    ...context,
    rows: rows.rows,
    clubs: clubs.rows,
    player,
    week,
    state,
    query,
    club,
    position,
    level,
  };
}

export async function getAdminAudit(params: AdminParams) {
  await getAdminContext();
  const action = param(params, "action");
  const where = action ? eq(fantasyAdminAuditLog.action, action) : undefined;
  const [count] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(fantasyAdminAuditLog)
    .where(where);
  const page = Math.min(
    pageNumber(param(params, "page")),
    Math.max(1, Math.ceil(count.count / 30)),
  );
  const rows = await db
    .select()
    .from(fantasyAdminAuditLog)
    .where(where)
    .orderBy(
      desc(fantasyAdminAuditLog.createdAt),
      desc(fantasyAdminAuditLog.id),
    )
    .limit(30)
    .offset((page - 1) * 30);
  // Do not send source payloads, bot provisioning payloads or other unrelated
  // internal properties to the browser. Only known correction fields are shown.
  const allowed = new Set([
    "level",
    "isThai",
    "effectiveGameweekId",
    "minutes",
    "goals",
    "sourceAssists",
    "fantasyAssists",
    "goalsConcededWhilePlaying",
    "saves",
    "penaltySaves",
    "penaltyMisses",
    "yellowCards",
    "redCards",
    "ownGoals",
    "status",
    "number",
    "nextGameweek",
  ]);
  const pick = (value: Record<string, unknown> | null) =>
    Object.fromEntries(
      Object.entries(value ?? {}).filter(([key]) => allowed.has(key)),
    );
  const names = rows.length
    ? await db.execute<{ id: string; th: string; en: string }>(sql`
    select a.id, coalesce(p.full_name_th,p.full_name_en,t.name,'GW '||g.number::text,a.entity_type) th,
      coalesce(p.full_name_en,t.name,'GW '||g.number::text,a.entity_type) en
    from fantasy_admin_audit_log a
    left join fantasy_player_match_stats s on a.entity_type='fantasy_player_match_stats' and s.id=a.entity_id
    left join fantasy_players fp on fp.id=case when a.entity_type='fantasy_player' then a.entity_id else s.fantasy_player_id end
    left join players p on p.id=fp.player_id
    left join fantasy_teams t on a.entity_type='fantasy_team' and t.id=a.entity_id
    left join fantasy_gameweeks g on a.entity_type='fantasy_gameweek' and g.id=a.entity_id
    where a.id in (${sql.join(
      rows.map((r) => sql`${r.id}::uuid`),
      sql`,`,
    )})`)
    : { rows: [] };
  const byId = new Map(names.rows.map((n) => [n.id, n]));
  return {
    rows: rows.map((row) => ({
      ...row,
      name: byId.get(row.id) ?? { th: row.entityType, en: row.entityType },
      before: pick(row.before),
      after: pick(row.after),
    })),
    total: count.count,
    page,
    action,
  };
}
