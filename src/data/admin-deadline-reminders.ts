import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db";
import {
  deadlineAudienceOptions,
  parseDeadlineAudience,
  redactDeadlineRecipient,
  type DeadlineAudienceId,
} from "@/lib/email/deadline-audience";

import { getAdminContext, param, type AdminParams } from "./admin";

type RawDeadlineRecipient = {
  team_id: string;
  team_name: string;
  email: string;
  previous_members: number;
  previous_confirmed_at: string | null;
  last_confirmed_at: string | null;
};

type DeadlineAudienceSummary = {
  member_teams: number;
  contactable: number;
  selected: number;
  unavailable_email: number;
  outside_audience: number;
};

const audienceCondition = (audience: DeadlineAudienceId) => {
  if (audience === "all-members") return sql`true`;
  if (audience === "ever-complete") return sql`ever_complete`;
  return sql`previous_complete`;
};

const audienceCandidates = (
  seasonId: string,
  previousWeekId: string | null,
  squadSize: number,
) => sql`
  with candidates as (
    select
      t.id team_id,
      t.name team_name,
      u.email,
      u.email_verified
        and not coalesce(u.is_anonymous, false)
        and position('@' in u.email) > 1 contactable,
      coalesce((
        select count(*)::int
        from fantasy_team_selection_players previous_player
        where previous_player.selection_id = previous_selection.id
      ), 0)::int previous_members,
      previous_selection.confirmed_at::text previous_confirmed_at,
      activity.last_confirmed_at::text,
      (
        previous_selection.confirmed_at is not null
        and coalesce((
          select count(*)::int
          from fantasy_team_selection_players previous_player
          where previous_player.selection_id = previous_selection.id
        ), 0) = ${squadSize}
      ) previous_complete,
      exists (
        select 1
        from fantasy_team_selections saved_selection
        where saved_selection.fantasy_team_id = t.id
          and saved_selection.confirmed_at is not null
          and (
            select count(*)::int
            from fantasy_team_selection_players saved_player
            where saved_player.selection_id = saved_selection.id
          ) = ${squadSize}
      ) ever_complete
    from fantasy_teams t
    join fantasy_managers m on m.id = t.manager_id
    join auth_users u on u.id = m.auth_user_id
    left join fantasy_team_selections previous_selection
      on previous_selection.fantasy_team_id = t.id
      and previous_selection.fantasy_gameweek_id = ${previousWeekId}::uuid
    left join lateral (
      select max(saved_selection.confirmed_at) last_confirmed_at
      from fantasy_team_selections saved_selection
      where saved_selection.fantasy_team_id = t.id
    ) activity on true
    where t.fantasy_season_id = ${seasonId}::uuid
      and t.is_active
      and m.status = 'member'
      and not m.is_bot
  )`;

export async function getAdminDeadlineReminderPreview(params: AdminParams) {
  const context = await getAdminContext();
  const requestedGameweek = Number(param(params, "gw"));
  const targetWeek =
    context.weeks.find((week) => week.number === requestedGameweek) ??
    context.current ??
    context.weeks.at(-1);
  const previousWeek = targetWeek
    ? context.weeks.filter((week) => week.number < targetWeek.number).at(-1)
    : undefined;
  const audience = parseDeadlineAudience(param(params, "audience"));
  const condition = audienceCondition(audience);

  if (!targetWeek) {
    return {
      ...context,
      targetWeek: undefined,
      previousWeek: undefined,
      audience,
      audienceOptions: deadlineAudienceOptions,
      summary: {
        member_teams: 0,
        contactable: 0,
        selected: 0,
        unavailable_email: 0,
        outside_audience: 0,
      } satisfies DeadlineAudienceSummary,
      recipients: [],
      generatedAt: new Date().toISOString(),
      isProduction: process.env.VERCEL_ENV === "production",
    };
  }

  const candidates = audienceCandidates(
    context.season.id,
    previousWeek?.id ?? null,
    context.season.squadSize,
  );
  const [summaryResult, recipientResult] = await Promise.all([
    db.execute<DeadlineAudienceSummary>(sql`${candidates}
      select
        count(*)::int member_teams,
        count(*) filter (where contactable)::int contactable,
        count(*) filter (where contactable and ${condition})::int selected,
        count(*) filter (where not contactable)::int unavailable_email,
        count(*) filter (where contactable and not (${condition}))::int outside_audience
      from candidates`),
    db.execute<RawDeadlineRecipient>(sql`${candidates}
      select team_id, team_name, email, previous_members,
        previous_confirmed_at, last_confirmed_at
      from candidates
      where contactable and ${condition}
      order by last_confirmed_at desc nulls last, lower(team_name), team_id
      limit 50`),
  ]);

  return {
    ...context,
    targetWeek,
    previousWeek,
    audience,
    audienceOptions: deadlineAudienceOptions,
    summary:
      summaryResult.rows[0] ??
      ({
        member_teams: 0,
        contactable: 0,
        selected: 0,
        unavailable_email: 0,
        outside_audience: 0,
      } satisfies DeadlineAudienceSummary),
    recipients: recipientResult.rows.map(redactDeadlineRecipient),
    generatedAt: new Date().toISOString(),
    isProduction: process.env.VERCEL_ENV === "production",
  };
}
