import { createHash } from "node:crypto";

import { sql } from "drizzle-orm";

import { transactionDb } from "../../src/db/transaction.ts";
import {
  autoFillSquadDraft,
  type AutoFillCandidate,
} from "../../src/lib/fantasy/auto-fill.ts";
import {
  calculatePlayerPoints,
  resolveTeamScore,
  type GameweekPlayerResult,
} from "../../src/lib/fantasy/scoring.ts";
import {
  createEmptySquadDraft,
  getCompleteSelectionMembers,
} from "../../src/lib/fantasy/team-draft.ts";
import type { FantasyPosition } from "../../src/lib/fantasy/rules.ts";

const PARTICIPANT_COUNT = 200;
const SQUAD_TEMPLATE_COUNT = 8;
const DAY_MS = 24 * 60 * 60 * 1_000;
const QA_TEAM_NAME_PATTERN = "^QA Scenario [0-9]{3}$";

type GameweekScenarioName =
  | "gw1-before"
  | "gw1-live"
  | "gw1-final"
  | "gw2-live"
  | "gw2-final"
  | "gw30-live"
  | "gw30-final";
type LeagueScenarioName = "league-empty" | "league-populated";
type ScenarioName = GameweekScenarioName | LeagueScenarioName;

type GameweekScenario = {
  kind: "gameweek";
  targetGameweek: number;
  phase: "before" | "live" | "final";
  description: string;
};
type LeagueScenario = {
  kind: "league";
  populated: boolean;
  description: string;
};
type ScenarioDefinition = GameweekScenario | LeagueScenario;

const SCENARIOS: Record<ScenarioName, ScenarioDefinition> = {
  "gw1-before": {
    kind: "gameweek",
    targetGameweek: 1,
    phase: "before",
    description: "GW1 is open and its deadline is still in the future",
  },
  "gw1-live": {
    kind: "gameweek",
    targetGameweek: 1,
    phase: "live",
    description: "GW1 deadline passed and one fixture is live",
  },
  "gw1-final": {
    kind: "gameweek",
    targetGameweek: 1,
    phase: "final",
    description: "GW1 is final and GW2 fixtures have not started",
  },
  "gw2-live": {
    kind: "gameweek",
    targetGameweek: 2,
    phase: "live",
    description: "GW1 is final; GW2 deadline passed and one fixture is live",
  },
  "gw2-final": {
    kind: "gameweek",
    targetGameweek: 2,
    phase: "final",
    description: "GW1-GW2 are final and GW3 fixtures have not started",
  },
  "gw30-live": {
    kind: "gameweek",
    targetGameweek: 30,
    phase: "live",
    description: "GW1-GW29 are final and one GW30 fixture is live",
  },
  "gw30-final": {
    kind: "gameweek",
    targetGameweek: 30,
    phase: "final",
    description: "GW1-GW30 are final and fully scored",
  },
  "league-empty": {
    kind: "league",
    populated: false,
    description: "The current tester is a member with no private leagues",
  },
  "league-populated": {
    kind: "league",
    populated: true,
    description: "The current tester owns two and joins two private leagues",
  },
};

type ScenarioTransaction = Parameters<
  Parameters<typeof transactionDb.transaction>[0]
>[0];

type SeasonRow = {
  id: string;
  competition_season_id: string;
  slug: string;
};
type TeamRow = { id: string; manager_id: string; name: string };
type GameweekRow = { id: string; number: number };
type SquadMember = {
  fantasyPlayerId: string;
  clubId: string;
  position: FantasyPosition;
  tier: number;
  isThai: boolean;
  lineupRole: "starter" | "bench";
  benchOrder: number | null;
  captainRole: "none" | "captain" | "vice_captain";
};
type FixtureRow = {
  id: string;
  matchweek: number;
  match_number: number | null;
  home_club_id: string;
  away_club_id: string;
};
type FixtureState = FixtureRow & {
  kickoffAt: Date;
  status: "scheduled" | "live" | "finished";
  homeScore: number | null;
  awayScore: number | null;
};

type CliOptions = {
  scenario: ScenarioName | null;
  branchId: string | null;
  seasonSlug: string | null;
  primaryTeamName: string | null;
  list: boolean;
};

function parseArgs(args: string[]): CliOptions {
  const option = (name: string) =>
    args
      .find((argument) => argument.startsWith(`${name}=`))
      ?.slice(name.length + 1) ?? null;
  const scenarioArgument = args.find((argument) => !argument.startsWith("--"));
  const scenario = scenarioArgument as ScenarioName | undefined;
  if (scenario && !(scenario in SCENARIOS)) {
    throw new Error(
      `Unknown scenario "${scenario}". Run with --list to see valid names.`,
    );
  }
  return {
    scenario: scenario ?? null,
    branchId:
      option("--branch-id") ?? process.env.FANTASY_SCENARIO_BRANCH_ID ?? null,
    seasonSlug:
      option("--season") ?? process.env.FANTASY_SCENARIO_SEASON_SLUG ?? null,
    primaryTeamName:
      option("--primary-team") ??
      process.env.FANTASY_SCENARIO_PRIMARY_TEAM ??
      null,
    list: args.includes("--list"),
  };
}

function listScenarios() {
  console.log("Available Fantasy QA scenarios:");
  for (const [name, definition] of Object.entries(SCENARIOS)) {
    console.log(`  ${name.padEnd(18)} ${definition.description}`);
  }
}

function uuidFor(value: string) {
  const hash = createHash("sha256")
    .update(`pp-fantasy-qa:${value}`)
    .digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

async function loadSeason(tx: ScenarioTransaction, seasonSlug: string | null) {
  const result = seasonSlug
    ? await tx.execute<SeasonRow>(sql`
        select id, competition_season_id, slug
        from fantasy_seasons
        where slug = ${seasonSlug}
        limit 1
      `)
    : await tx.execute<SeasonRow>(sql`
        select id, competition_season_id, slug
        from fantasy_seasons
        order by updated_at desc, created_at desc
      `);
  if (result.rows.length === 0) {
    throw new Error(
      seasonSlug
        ? `Fantasy season "${seasonSlug}" was not found.`
        : "No Fantasy season was found.",
    );
  }
  if (!seasonSlug && result.rows.length > 1) {
    throw new Error(
      "More than one Fantasy season exists. Select one with --season=<slug>.",
    );
  }
  return result.rows[0];
}

async function findPrimaryTeam(
  tx: ScenarioTransaction,
  seasonId: string,
  explicitName: string | null,
) {
  if (explicitName) {
    const result = await tx.execute<TeamRow>(sql`
      select id, manager_id, name
      from fantasy_teams
      where fantasy_season_id = ${seasonId}::uuid
        and lower(name) = lower(${explicitName})
      limit 1
    `);
    if (!result.rows[0]) {
      throw new Error(`Primary team "${explicitName}" was not found.`);
    }
    return result.rows[0];
  }

  const result = await tx.execute<TeamRow>(sql`
    select t.id, t.manager_id, t.name
    from fantasy_teams t
    join fantasy_managers m on m.id = t.manager_id
    left join auth_sessions s on s.user_id = m.auth_user_id
    where t.fantasy_season_id = ${seasonId}::uuid
      and m.auth_user_id is not null
    order by (s.expires_at > now()) desc nulls last,
             s.updated_at desc nulls last,
             t.updated_at desc
    limit 1
  `);
  return result.rows[0] ?? null;
}

function squadSignature(squad: SquadMember[]) {
  return squad
    .map((member) => member.fantasyPlayerId)
    .sort()
    .join(":");
}

async function captureCompleteSquads(
  tx: ScenarioTransaction,
  seasonId: string,
  preferredTeamId: string | null,
): Promise<SquadMember[][]> {
  const result = await tx.execute<{
    selection_id: string;
    fantasy_player_id: string;
    club_id_snapshot: string;
    position_snapshot: FantasyPosition;
    tier_snapshot: number;
    is_thai_snapshot: boolean;
    lineup_role: "starter" | "bench";
    bench_order: number | null;
    captain_role: "none" | "captain" | "vice_captain";
  }>(sql`
    with complete_selections as (
      select s.id, s.fantasy_team_id, s.updated_at
      from fantasy_team_selections s
      join fantasy_teams t on t.id = s.fantasy_team_id
      join fantasy_team_selection_players sp on sp.selection_id = s.id
      where t.fantasy_season_id = ${seasonId}::uuid
      group by s.id, s.fantasy_team_id, s.updated_at
      having count(*) = 15
      order by (s.fantasy_team_id = ${preferredTeamId}::uuid) desc nulls last,
               s.updated_at desc
      limit 64
    )
    select selected.id as selection_id,
           sp.fantasy_player_id,
           sp.club_id_snapshot,
           sp.position_snapshot,
           sp.tier_snapshot,
           sp.is_thai_snapshot,
           sp.lineup_role,
           sp.bench_order,
           sp.captain_role
    from fantasy_team_selection_players sp
    join complete_selections selected on selected.id = sp.selection_id
    order by (selected.fantasy_team_id = ${preferredTeamId}::uuid) desc nulls last,
             selected.updated_at desc,
             selected.id,
             case when sp.lineup_role = 'starter' then 0 else 1 end,
             sp.bench_order nulls first,
             sp.id
  `);
  const membersBySelection = new Map<string, SquadMember[]>();
  for (const row of result.rows) {
    const members = membersBySelection.get(row.selection_id) ?? [];
    members.push({
      fantasyPlayerId: row.fantasy_player_id,
      clubId: row.club_id_snapshot,
      position: row.position_snapshot,
      tier: row.tier_snapshot,
      isThai: row.is_thai_snapshot,
      lineupRole: row.lineup_role,
      benchOrder: row.bench_order,
      captainRole: row.captain_role,
    });
    membersBySelection.set(row.selection_id, members);
  }
  const signatures = new Set<string>();
  const squads: SquadMember[][] = [];
  for (const members of membersBySelection.values()) {
    if (members.length !== 15) continue;
    const signature = squadSignature(members);
    if (signatures.has(signature)) continue;
    signatures.add(signature);
    squads.push(members);
    if (squads.length === SQUAD_TEMPLATE_COUNT) break;
  }
  return squads;
}

async function loadSquadCandidates(tx: ScenarioTransaction, season: SeasonRow) {
  const candidatesResult = await tx.execute<{
    id: string;
    club_id: string;
    position: FantasyPosition;
    tier: number;
    is_thai: boolean;
    projected_points: number;
    overall_rank: number;
  }>(sql`
    with latest_run as (
      select id
      from fantasy_ranking_runs
      where fantasy_season_id = ${season.id}::uuid
        and status = 'published'
      order by published_at desc
      limit 1
    )
    select distinct on (fp.id)
           fp.id,
           ce.club_id,
           fp.locked_position as position,
           coalesce(tier.level, 4)::int as tier,
           fp.is_thai,
           ranking.projected_points,
           ranking.overall_rank
    from latest_run run
    join fantasy_player_rankings ranking on ranking.ranking_run_id = run.id
    join fantasy_players fp on fp.id = ranking.fantasy_player_id
    join player_registrations registration on registration.player_id = fp.player_id
    join competition_entries ce on ce.id = registration.competition_entry_id
    left join lateral (
      select player_tier.level
      from fantasy_player_tiers player_tier
      join fantasy_gameweeks gw on gw.id = player_tier.effective_gameweek_id
      where player_tier.fantasy_player_id = fp.id
        and gw.fantasy_season_id = ${season.id}::uuid
        and gw.number <= 1
      order by gw.number desc
      limit 1
    ) tier on true
    where fp.fantasy_season_id = ${season.id}::uuid
      and fp.is_available = true
      and registration.status = 'active'
      and ce.competition_season_id = ${season.competition_season_id}::uuid
      and fp.locked_position in ('goalkeeper', 'defender', 'midfielder', 'forward')
    order by fp.id, ranking.overall_rank, registration.updated_at desc
  `);
  return candidatesResult.rows.map((row) => ({
    id: row.id,
    clubId: row.club_id,
    position: row.position,
    tier: row.tier,
    isThai: row.is_thai,
    projectedPoints: Number(row.projected_points),
    overallRank: row.overall_rank,
  }));
}

function generateSquad(
  candidates: AutoFillCandidate[],
  seed: number,
): SquadMember[] {
  const filled = autoFillSquadDraft({
    members: createEmptySquadDraft(),
    candidates,
    random: seededRandom(seed),
  });
  const complete = filled ? getCompleteSelectionMembers(filled.members) : null;
  if (!complete) {
    throw new Error(
      "Could not construct a valid 15-player squad from the published ranking.",
    );
  }
  const candidateById = new Map(
    candidates.map((candidate) => [candidate.id, candidate]),
  );
  return complete.map((member) => {
    const candidate = candidateById.get(member.fantasyPlayerId);
    if (!candidate)
      throw new Error("Auto-filled player metadata was not found.");
    return {
      fantasyPlayerId: member.fantasyPlayerId,
      clubId: candidate.clubId,
      position: candidate.position,
      tier: candidate.tier,
      isThai: candidate.isThai,
      lineupRole: member.lineupRole,
      benchOrder: member.benchOrder,
      captainRole: member.captainRole,
    };
  });
}

async function loadSquadTemplates(
  tx: ScenarioTransaction,
  season: SeasonRow,
  preferredTeamId: string | null,
) {
  const captured = await captureCompleteSquads(tx, season.id, preferredTeamId);
  const squads = [...captured];
  const signatures = new Set(squads.map(squadSignature));
  if (squads.length < SQUAD_TEMPLATE_COUNT) {
    const candidates = await loadSquadCandidates(tx, season);
    for (
      let attempt = 0;
      squads.length < SQUAD_TEMPLATE_COUNT && attempt < 48;
      attempt += 1
    ) {
      const squad = generateSquad(candidates, 20_260_901 + attempt * 97);
      const signature = squadSignature(squad);
      if (signatures.has(signature)) continue;
      signatures.add(signature);
      squads.push(squad);
    }
  }
  if (squads.length < SQUAD_TEMPLATE_COUNT) {
    throw new Error(
      `Could not construct ${SQUAD_TEMPLATE_COUNT} distinct valid squad templates.`,
    );
  }
  return { squads, capturedCount: captured.length };
}

async function clearPrivateLeagues(tx: ScenarioTransaction, seasonId: string) {
  await tx.execute(sql`
    delete from fantasy_league_audit_log
    where fantasy_season_id = ${seasonId}::uuid
  `);
  await tx.execute(sql`
    delete from fantasy_leagues
    where fantasy_season_id = ${seasonId}::uuid and type = 'private'
  `);
}

async function ensureParticipants(
  tx: ScenarioTransaction,
  seasonId: string,
  primaryTeam: TeamRow | null,
) {
  await tx.execute(sql`
    delete from fantasy_managers
    where auth_user_id is null
      and status = 'abandoned'
      and id in (
        select manager_id
        from fantasy_teams
        where fantasy_season_id = ${seasonId}::uuid
          and name ~ ${QA_TEAM_NAME_PATTERN}
      )
  `);

  const realTeamsResult = await tx.execute<TeamRow>(sql`
    select id, manager_id, name
    from fantasy_teams
    where fantasy_season_id = ${seasonId}::uuid
    order by created_at, id
  `);
  if (realTeamsResult.rows.length > PARTICIPANT_COUNT) {
    throw new Error(
      `The season already has ${realTeamsResult.rows.length} non-QA teams; refusing to reduce it to ${PARTICIPANT_COUNT}.`,
    );
  }
  const missing = PARTICIPANT_COUNT - realTeamsResult.rows.length;
  const managers = Array.from({ length: missing }, (_, index) => ({
    id: uuidFor(`manager:${seasonId}:${index + 1}`),
  }));
  const teams = managers.map((manager, index) => ({
    id: uuidFor(`team:${seasonId}:${index + 1}`),
    manager_id: manager.id,
    name: `QA Scenario ${String(index + 1).padStart(3, "0")}`,
  }));
  if (managers.length > 0) {
    await tx.execute(sql`
      insert into fantasy_managers (id, status, preferred_language)
      select x.id::uuid, 'abandoned', 'th'
      from jsonb_to_recordset(${JSON.stringify(managers)}::jsonb) as x(id text)
    `);
    await tx.execute(sql`
      insert into fantasy_teams
        (id, fantasy_season_id, manager_id, name, free_transfers, name_changes_used, is_active)
      select x.id::uuid,
             ${seasonId}::uuid,
             x.manager_id::uuid,
             x.name,
             2,
             0,
             true
      from jsonb_to_recordset(${JSON.stringify(teams)}::jsonb)
        as x(id text, manager_id text, name text)
    `);
  }
  await tx.execute(sql`
    update fantasy_teams
    set is_active = true, updated_at = now()
    where fantasy_season_id = ${seasonId}::uuid
  `);

  const overallResult = await tx.execute<{ id: string }>(sql`
    select id
    from fantasy_leagues
    where fantasy_season_id = ${seasonId}::uuid and type = 'overall'
    limit 1
  `);
  let overallLeagueId = overallResult.rows[0]?.id;
  if (!overallLeagueId) {
    overallLeagueId = uuidFor(`overall:${seasonId}`);
    await tx.execute(sql`
      insert into fantasy_leagues (id, fantasy_season_id, name, type)
      values (${overallLeagueId}::uuid, ${seasonId}::uuid, 'Overall', 'overall')
    `);
  }
  await tx.execute(sql`
    delete from fantasy_league_standings
    where fantasy_league_id = ${overallLeagueId}::uuid
  `);
  await tx.execute(sql`
    delete from fantasy_league_members
    where fantasy_league_id = ${overallLeagueId}::uuid
  `);
  await tx.execute(sql`
    insert into fantasy_league_members (fantasy_league_id, fantasy_team_id, joined_at)
    select ${overallLeagueId}::uuid, id, now()
    from fantasy_teams
    where fantasy_season_id = ${seasonId}::uuid
    order by created_at, id
  `);

  const allTeamsResult = await tx.execute<TeamRow>(sql`
    select id, manager_id, name
    from fantasy_teams
    where fantasy_season_id = ${seasonId}::uuid
    order by case when id = ${primaryTeam?.id ?? null}::uuid then 0 else 1 end,
             created_at,
             id
  `);
  return {
    teams: allTeamsResult.rows,
    primaryTeam:
      allTeamsResult.rows.find((team) => team.id === primaryTeam?.id) ??
      allTeamsResult.rows[0],
    overallLeagueId,
  };
}

function gameweekPlan(definition: GameweekScenario, now: Date) {
  const target = definition.targetGameweek;
  const targetDeadline =
    definition.phase === "before"
      ? new Date(now.getTime() + 2 * DAY_MS)
      : definition.phase === "live"
        ? new Date(now.getTime() - 2 * 60 * 60 * 1_000)
        : new Date(now.getTime() - 3 * DAY_MS);
  const finalThrough =
    definition.phase === "before"
      ? 0
      : target - (definition.phase === "live" ? 1 : 0);
  const provisional = definition.phase === "live" ? target : null;
  const open =
    target < 30 ? (definition.phase === "before" ? 1 : target + 1) : null;
  return {
    finalThrough,
    provisional,
    open,
    selectionThrough: open ?? target,
    scoredThrough: definition.phase === "before" ? 0 : target,
    gameweeks: Array.from({ length: 30 }, (_, index) => {
      const number = index + 1;
      const status =
        number <= finalThrough
          ? "final"
          : number === provisional
            ? "provisional"
            : number === open
              ? "open"
              : "planned";
      return {
        number,
        deadline_at: new Date(
          targetDeadline.getTime() + (number - target) * 7 * DAY_MS,
        ).toISOString(),
        status,
        score_complete: status === "final",
        finalized_at:
          status === "final"
            ? new Date(
                Math.min(
                  now.getTime(),
                  targetDeadline.getTime() +
                    (number - target) * 7 * DAY_MS +
                    2 * DAY_MS,
                ),
              ).toISOString()
            : null,
      };
    }),
  };
}

function fixtureStates(
  fixtures: FixtureRow[],
  definition: GameweekScenario,
  deadlines: Map<number, Date>,
  preferredLiveFixtureId: string | null,
) {
  const fixturesByGameweek = new Map<number, FixtureRow[]>();
  for (const fixture of fixtures) {
    const rows = fixturesByGameweek.get(fixture.matchweek) ?? [];
    rows.push(fixture);
    fixturesByGameweek.set(fixture.matchweek, rows);
  }
  const states: FixtureState[] = [];
  let liveFixtureId: string | null = null;
  for (const [gameweek, rows] of fixturesByGameweek) {
    rows.sort(
      (left, right) =>
        (left.match_number ?? 9_999) - (right.match_number ?? 9_999) ||
        left.id.localeCompare(right.id),
    );
    const liveIndex = Math.max(
      0,
      rows.findIndex((row) => row.id === preferredLiveFixtureId),
    );
    for (const [index, fixture] of rows.entries()) {
      const kickoffAt = new Date(
        deadlines.get(gameweek)!.getTime() + (90 + index * 180) * 60 * 1_000,
      );
      const isPastFinal =
        gameweek < definition.targetGameweek ||
        (gameweek === definition.targetGameweek &&
          definition.phase === "final");
      const isLive =
        definition.phase === "live" &&
        gameweek === definition.targetGameweek &&
        index === liveIndex;
      const homeScore = isPastFinal || isLive ? (gameweek + index) % 4 : null;
      const awayScore =
        isPastFinal || isLive ? (gameweek * 2 + index + 1) % 3 : null;
      if (isLive) liveFixtureId = fixture.id;
      states.push({
        ...fixture,
        kickoffAt,
        status: isPastFinal ? "finished" : isLive ? "live" : "scheduled",
        homeScore,
        awayScore,
      });
    }
  }
  return { states, liveFixtureId };
}

function chooseLiveFixtureId(
  fixtures: FixtureRow[],
  targetGameweek: number,
  squads: SquadMember[][],
) {
  const primaryClubIds = new Set(squads[0].map((member) => member.clubId));
  const candidates = fixtures
    .filter((fixture) => fixture.matchweek === targetGameweek)
    .map((fixture) => {
      const ownedBy = squads.filter((squad) =>
        squad.some(
          (member) =>
            member.clubId === fixture.home_club_id ||
            member.clubId === fixture.away_club_id,
        ),
      ).length;
      const startedBy = squads.filter((squad) =>
        squad.some(
          (member) =>
            member.lineupRole === "starter" &&
            (member.clubId === fixture.home_club_id ||
              member.clubId === fixture.away_club_id),
        ),
      ).length;
      return {
        fixture,
        ownedBy,
        startedBy,
        primaryOwns:
          squads[0].some(
            (member) =>
              member.lineupRole === "starter" &&
              (member.clubId === fixture.home_club_id ||
                member.clubId === fixture.away_club_id),
          ) &&
          (primaryClubIds.has(fixture.home_club_id) ||
            primaryClubIds.has(fixture.away_club_id)),
        scoreableMixedOwnership: startedBy > 0 && ownedBy < squads.length,
      };
    })
    .sort(
      (left, right) =>
        Number(right.scoreableMixedOwnership) -
          Number(left.scoreableMixedOwnership) ||
        Number(right.primaryOwns) - Number(left.primaryOwns) ||
        right.startedBy - left.startedBy ||
        Math.min(right.ownedBy, squads.length - right.ownedBy) -
          Math.min(left.ownedBy, squads.length - left.ownedBy) ||
        (left.fixture.match_number ?? 9_999) -
          (right.fixture.match_number ?? 9_999) ||
        left.fixture.id.localeCompare(right.fixture.id),
    );
  return candidates[0]?.fixture.id ?? null;
}

async function applyGameweekScenario(
  tx: ScenarioTransaction,
  season: SeasonRow,
  definition: GameweekScenario,
  requestedPrimaryTeam: TeamRow | null,
  scenarioName: GameweekScenarioName,
) {
  const templates = await loadSquadTemplates(
    tx,
    season,
    requestedPrimaryTeam?.id ?? null,
  );
  const squads = templates.squads;

  await clearPrivateLeagues(tx, season.id);
  await tx.execute(sql`
    delete from fantasy_player_match_stats
    where fixture_id in (
      select id from fixtures
      where competition_season_id = ${season.competition_season_id}::uuid
    )
  `);
  await tx.execute(sql`
    delete from fantasy_team_selections
    where fantasy_gameweek_id in (
      select id from fantasy_gameweeks
      where fantasy_season_id = ${season.id}::uuid
    )
  `);

  const participants = await ensureParticipants(
    tx,
    season.id,
    requestedPrimaryTeam,
  );
  const primaryTeam = participants.primaryTeam;
  if (!primaryTeam)
    throw new Error("No Fantasy team is available for the scenario.");
  const teamSquads = participants.teams.map((team, index) => ({
    team,
    squad: squads[index % squads.length],
  }));

  const now = new Date();
  const plan = gameweekPlan(definition, now);
  await tx.execute(sql`
    update fantasy_gameweeks
    set status = 'planned',
        score_complete = false,
        average_points = 0,
        highest_points = 0,
        finalized_at = null,
        updated_at = now()
    where fantasy_season_id = ${season.id}::uuid
  `);
  await tx.execute(sql`
    update fantasy_gameweeks gw
    set deadline_at = x.deadline_at::timestamptz,
        status = x.status::fantasy_gameweek_status,
        score_complete = x.score_complete,
        finalized_at = x.finalized_at::timestamptz,
        updated_at = now()
    from jsonb_to_recordset(${JSON.stringify(plan.gameweeks)}::jsonb)
      as x(number int, deadline_at text, status text, score_complete boolean, finalized_at text)
    where gw.fantasy_season_id = ${season.id}::uuid
      and gw.number = x.number
  `);

  const gameweeksResult = await tx.execute<GameweekRow>(sql`
    select id, number
    from fantasy_gameweeks
    where fantasy_season_id = ${season.id}::uuid
    order by number
  `);
  if (gameweeksResult.rows.length !== 30) {
    throw new Error(
      `Expected 30 Gameweeks, found ${gameweeksResult.rows.length}.`,
    );
  }
  const deadlineByGameweek = new Map(
    plan.gameweeks.map((gameweek) => [
      gameweek.number,
      new Date(gameweek.deadline_at),
    ]),
  );
  const fixturesResult = await tx.execute<FixtureRow>(sql`
    select f.id,
           f.matchweek,
           f.match_number,
           home.club_id as home_club_id,
           away.club_id as away_club_id
    from fixtures f
    join competition_entries home on home.id = f.home_entry_id
    join competition_entries away on away.id = f.away_entry_id
    where f.competition_season_id = ${season.competition_season_id}::uuid
    order by f.matchweek, f.match_number nulls last, f.id
  `);
  const preferredLiveFixtureId =
    definition.phase === "live"
      ? chooseLiveFixtureId(
          fixturesResult.rows,
          definition.targetGameweek,
          squads,
        )
      : null;
  const fixturePlan = fixtureStates(
    fixturesResult.rows,
    definition,
    deadlineByGameweek,
    preferredLiveFixtureId,
  );
  const fixturePayload = fixturePlan.states.map((fixture) => ({
    id: fixture.id,
    kickoff_at: fixture.kickoffAt.toISOString(),
    status: fixture.status,
    home_score: fixture.homeScore,
    away_score: fixture.awayScore,
  }));
  await tx.execute(sql`
    update fixtures fixture
    set kickoff_at = x.kickoff_at::timestamptz,
        status = x.status::fixture_status,
        home_score = x.home_score,
        away_score = x.away_score,
        home_penalty_score = null,
        away_penalty_score = null,
        updated_at = now()
    from jsonb_to_recordset(${JSON.stringify(fixturePayload)}::jsonb)
      as x(id text, kickoff_at text, status text, home_score int, away_score int)
    where fixture.id = x.id::uuid
  `);

  await tx.execute(sql`
    insert into fantasy_team_selections
      (fantasy_team_id, fantasy_gameweek_id, status, free_transfers_before,
       free_transfers_after, net_transfer_count, transfer_points, confirmed_at, locked_at)
    select team.id,
           gw.id,
           case when gw.number <= ${plan.scoredThrough} then 'locked'::fantasy_selection_status
                else 'draft'::fantasy_selection_status end,
           2,
           case when gw.number <= ${plan.scoredThrough} then 2 else null end,
           0,
           0,
           now(),
           case when gw.number <= ${plan.scoredThrough} then gw.deadline_at else null end
    from fantasy_teams team
    cross join fantasy_gameweeks gw
    where team.fantasy_season_id = ${season.id}::uuid
      and gw.fantasy_season_id = ${season.id}::uuid
      and gw.number <= ${plan.selectionThrough}
  `);

  const teamSquadPayload = teamSquads.flatMap(({ team, squad }) =>
    squad.map((member) => ({
      team_id: team.id,
      fantasy_player_id: member.fantasyPlayerId,
      club_id: member.clubId,
      position: member.position,
      tier: member.tier,
      is_thai: member.isThai,
      lineup_role: member.lineupRole,
      bench_order: member.benchOrder,
      captain_role: member.captainRole,
    })),
  );
  await tx.execute(sql`
    insert into fantasy_team_selection_players
      (selection_id, fantasy_player_id, club_id_snapshot, position_snapshot,
       tier_snapshot, is_thai_snapshot, lineup_role, bench_order, captain_role)
    select selection.id,
           member.fantasy_player_id::uuid,
           member.club_id::uuid,
           member.position::player_position,
           member.tier,
           member.is_thai,
           member.lineup_role::fantasy_lineup_role,
           member.bench_order,
           member.captain_role::fantasy_captain_role
    from fantasy_team_selections selection
    join fantasy_gameweeks gw on gw.id = selection.fantasy_gameweek_id
    join jsonb_to_recordset(${JSON.stringify(teamSquadPayload)}::jsonb)
      as member(team_id text, fantasy_player_id text, club_id text, position text, tier int,
                is_thai boolean, lineup_role text, bench_order int, captain_role text)
      on member.team_id::uuid = selection.fantasy_team_id
    where gw.fantasy_season_id = ${season.id}::uuid
  `);
  const revisionPayload = teamSquads.map(({ team, squad }) => {
    const members = squad.map((member) => ({
      fantasy_player_id: member.fantasyPlayerId,
      club_id: member.clubId,
      position: member.position,
      tier: member.tier,
      is_thai: member.isThai,
      lineup_role: member.lineupRole,
      bench_order: member.benchOrder,
      captain_role: member.captainRole,
    }));
    return {
      team_id: team.id,
      squad: squad.map((member) => member.fantasyPlayerId),
      lineup: { members },
    };
  });
  await tx.execute(sql`
    insert into fantasy_transfer_revisions
      (selection_id, revision, status, squad, lineup, net_transfer_count, transfer_points)
    select selection.id,
           1,
           'confirmed',
           revision.squad,
           revision.lineup,
           0,
           0
    from fantasy_team_selections selection
    join fantasy_gameweeks gw on gw.id = selection.fantasy_gameweek_id
    join jsonb_to_recordset(${JSON.stringify(revisionPayload)}::jsonb)
      as revision(team_id text, squad jsonb, lineup jsonb)
      on revision.team_id::uuid = selection.fantasy_team_id
    where gw.fantasy_season_id = ${season.id}::uuid
  `);

  const fixtureByGameweekAndClub = new Map<string, FixtureState>();
  for (const fixture of fixturePlan.states) {
    fixtureByGameweekAndClub.set(
      `${fixture.matchweek}:${fixture.home_club_id}`,
      fixture,
    );
    fixtureByGameweekAndClub.set(
      `${fixture.matchweek}:${fixture.away_club_id}`,
      fixture,
    );
  }
  const statRows: Array<Record<string, unknown>> = [];
  const pointRows: Array<Record<string, unknown>> = [];
  const teamScoreRows: Array<Record<string, unknown>> = [];
  const playerUniverse = [
    ...new Map(
      squads.flat().map((member) => [member.fantasyPlayerId, member]),
    ).values(),
  ].sort((left, right) =>
    left.fantasyPlayerId.localeCompare(right.fantasyPlayerId),
  );
  for (let gameweek = 1; gameweek <= plan.scoredThrough; gameweek += 1) {
    const results: GameweekPlayerResult[] = [];
    for (const [index, member] of playerUniverse.entries()) {
      const fixture = fixtureByGameweekAndClub.get(
        `${gameweek}:${member.clubId}`,
      );
      if (!fixture || fixture.status === "scheduled") continue;
      const isHome = fixture.home_club_id === member.clubId;
      const goalsConceded = isHome
        ? (fixture.awayScore ?? 0)
        : (fixture.homeScore ?? 0);
      const stats = {
        minutes: fixture.status === "live" ? 30 : 90,
        goals: (gameweek + index) % 13 === 0 ? 1 : 0,
        sourceAssists: (gameweek * 2 + index) % 11 === 0 ? 1 : 0,
        fantasyAssists: null,
        goalsConcededWhilePlaying: goalsConceded,
        saves:
          member.position === "goalkeeper" ? 3 + ((gameweek + index) % 4) : 0,
        penaltySaves: 0,
        penaltyMisses: 0,
        yellowCards: (gameweek + index) % 17 === 0 ? 1 : 0,
        redCards: 0,
        ownGoals: 0,
      };
      const points = calculatePlayerPoints(member.position, stats);
      const statsId = uuidFor(`stats:${gameweek}:${member.fantasyPlayerId}`);
      statRows.push({
        id: statsId,
        fixture_id: fixture.id,
        fantasy_player_id: member.fantasyPlayerId,
        status: fixture.status === "finished" ? "reviewed" : "imported",
        minutes: stats.minutes,
        goals: stats.goals,
        source_assists: stats.sourceAssists,
        fantasy_assists: stats.fantasyAssists,
        goals_conceded: stats.goalsConcededWhilePlaying,
        saves: stats.saves,
        penalty_saves: stats.penaltySaves,
        penalty_misses: stats.penaltyMisses,
        yellow_cards: stats.yellowCards,
        red_cards: stats.redCards,
        own_goals: stats.ownGoals,
        payload: { scenario: scenarioName, deterministic: true },
      });
      pointRows.push({
        stats_id: statsId,
        breakdown: points.breakdown,
        total_points: points.total,
      });
      results.push({
        playerId: member.fantasyPlayerId,
        minutes: stats.minutes,
        points: points.total,
      });
    }
    for (const { team, squad } of teamSquads) {
      const score = resolveTeamScore({
        selection: squad.map((member) => ({
          playerId: member.fantasyPlayerId,
          position: member.position,
          lineupRole: member.lineupRole,
          benchOrder: member.benchOrder,
          captainRole: member.captainRole,
        })),
        playerResults: results,
        activeChip: null,
        transferPoints: 0,
      });
      teamScoreRows.push({
        team_id: team.id,
        gameweek,
        lineup_points: score.lineupPoints,
        bench_points: score.benchPoints,
        captain_bonus: score.captainBonus,
        total_points: score.totalPoints,
        auto_substitutions: score.autoSubstitutions,
      });
    }
  }
  if (statRows.length > 0) {
    await tx.execute(sql`
      insert into fantasy_player_match_stats
        (id, fixture_id, fantasy_player_id, status, source_name, minutes, goals,
         source_assists, fantasy_assists, goals_conceded_while_playing, saves,
         penalty_saves, penalty_misses, yellow_cards, red_cards, own_goals,
         source_payload, reviewed_at)
      select x.id::uuid,
             x.fixture_id::uuid,
             x.fantasy_player_id::uuid,
             x.status::fantasy_stats_status,
             'qa-scenario',
             x.minutes,
             x.goals,
             x.source_assists,
             x.fantasy_assists,
             x.goals_conceded,
             x.saves,
             x.penalty_saves,
             x.penalty_misses,
             x.yellow_cards,
             x.red_cards,
             x.own_goals,
             x.payload,
             case when x.status = 'reviewed' then now() else null end
      from jsonb_to_recordset(${JSON.stringify(statRows)}::jsonb)
        as x(id text, fixture_id text, fantasy_player_id text, status text,
             minutes int, goals int, source_assists int, fantasy_assists int,
             goals_conceded int, saves int, penalty_saves int, penalty_misses int,
             yellow_cards int, red_cards int, own_goals int, payload jsonb)
    `);
    await tx.execute(sql`
      insert into fantasy_player_match_points
        (player_match_stats_id, breakdown, total_points, computed_at)
      select x.stats_id::uuid, x.breakdown, x.total_points, now()
      from jsonb_to_recordset(${JSON.stringify(pointRows)}::jsonb)
        as x(stats_id text, breakdown jsonb, total_points int)
    `);
  }

  if (plan.scoredThrough > 0) {
    await tx.execute(sql`
      insert into fantasy_team_gameweek_scores
        (selection_id, status, lineup_points, bench_points, captain_bonus,
         transfer_points, total_points, auto_substitutions, computed_at)
      select selection.id,
             case when gw.score_complete then 'final'::fantasy_score_status
                  else 'provisional'::fantasy_score_status end,
             team_score.lineup_points,
             team_score.bench_points,
             team_score.captain_bonus,
             0,
             team_score.total_points,
             team_score.auto_substitutions,
             now()
      from fantasy_team_selections selection
      join fantasy_teams team on team.id = selection.fantasy_team_id
      join fantasy_gameweeks gw on gw.id = selection.fantasy_gameweek_id
      join jsonb_to_recordset(${JSON.stringify(teamScoreRows)}::jsonb)
        as team_score(team_id text, gameweek int, lineup_points int, bench_points int,
                      captain_bonus int, total_points int, auto_substitutions jsonb)
        on team_score.gameweek = gw.number
       and team_score.team_id::uuid = team.id
      where gw.fantasy_season_id = ${season.id}::uuid
        and gw.number <= ${plan.scoredThrough}
    `);
    await tx.execute(sql`
      update fantasy_gameweeks gw
      set average_points = summary.average_points,
          highest_points = summary.highest_points,
          updated_at = now()
      from (
        select selection.fantasy_gameweek_id,
               round(avg(score.total_points))::int as average_points,
               max(score.total_points)::int as highest_points
        from fantasy_team_gameweek_scores score
        join fantasy_team_selections selection on selection.id = score.selection_id
        group by selection.fantasy_gameweek_id
      ) summary
      where gw.id = summary.fantasy_gameweek_id
        and gw.fantasy_season_id = ${season.id}::uuid
    `);
    await refreshOverallStandings(tx, season.id, participants.overallLeagueId);
  }

  await insertScenarioAudit(tx, season.id, scenarioName, {
    primaryTeamId: primaryTeam.id,
    primaryTeamName: primaryTeam.name,
    participants: participants.teams.length,
    scoredThrough: plan.scoredThrough,
    squadTemplates: squads.length,
  });
  const verified = await verifyGameweekScenario(
    tx,
    season.id,
    definition,
    plan.selectionThrough,
    plan.scoredThrough,
  );
  return {
    ...verified,
    primaryTeamName: primaryTeam.name,
    squadSource:
      templates.capturedCount === SQUAD_TEMPLATE_COUNT
        ? "existing selections"
        : "existing selections + published ranking",
    squadTemplates: squads.length,
    liveFixtureId: fixturePlan.liveFixtureId,
  };
}

async function refreshOverallStandings(
  tx: ScenarioTransaction,
  seasonId: string,
  overallLeagueId: string,
) {
  await tx.execute(sql`
    delete from fantasy_league_standings
    where fantasy_league_id = ${overallLeagueId}::uuid
  `);
  await tx.execute(sql`
    with latest as (
      select id, score_complete
      from fantasy_gameweeks
      where fantasy_season_id = ${seasonId}::uuid
        and status in ('provisional', 'final')
      order by number desc
      limit 1
    ), totals as (
      select team.id as team_id,
             coalesce(sum(score.total_points), 0)::int as total_points,
             coalesce(sum(case when selection.fantasy_gameweek_id = latest.id
                               then score.total_points else 0 end), 0)::int as gameweek_points,
             coalesce(sum(case when selection.status = 'locked'
                               then selection.net_transfer_count else 0 end), 0)::int as transfer_count,
             latest.id as gameweek_id,
             latest.score_complete
      from latest
      cross join fantasy_teams team
      left join fantasy_team_selections selection on selection.fantasy_team_id = team.id
      left join fantasy_team_gameweek_scores score on score.selection_id = selection.id
      where team.fantasy_season_id = ${seasonId}::uuid
      group by team.id, latest.id, latest.score_complete
    ), ranked as (
      select totals.*,
             row_number() over (
               order by total_points desc, gameweek_points desc, transfer_count asc, team_id
             )::int as rank
      from totals
    )
    insert into fantasy_league_standings
      (fantasy_league_id, fantasy_team_id, through_gameweek_id, status, rank,
       gameweek_points, total_points, transfer_count, computed_at)
    select ${overallLeagueId}::uuid,
           team_id,
           gameweek_id,
           case when score_complete then 'final'::fantasy_score_status
                else 'provisional'::fantasy_score_status end,
           rank,
           gameweek_points,
           total_points,
           transfer_count,
           now()
    from ranked
  `);
}

async function promotePrimaryToMember(
  tx: ScenarioTransaction,
  primaryTeam: TeamRow,
) {
  await tx.execute(sql`
    update fantasy_managers manager
    set status = 'member', updated_at = now()
    where manager.id = ${primaryTeam.manager_id}::uuid
  `);
  await tx.execute(sql`
    update auth_users user_row
    set is_anonymous = false, updated_at = now()
    from fantasy_managers manager
    where manager.id = ${primaryTeam.manager_id}::uuid
      and user_row.id = manager.auth_user_id
  `);
}

async function applyLeagueScenario(
  tx: ScenarioTransaction,
  season: SeasonRow,
  definition: LeagueScenario,
  requestedPrimaryTeam: TeamRow | null,
  scenarioName: LeagueScenarioName,
) {
  await clearPrivateLeagues(tx, season.id);
  const participants = await ensureParticipants(
    tx,
    season.id,
    requestedPrimaryTeam,
  );
  const primaryTeam = participants.primaryTeam;
  if (!primaryTeam)
    throw new Error("No Fantasy team is available for the scenario.");
  await promotePrimaryToMember(tx, primaryTeam);

  let privateMemberships = 0;
  if (definition.populated) {
    const leagueDefinitions = [
      {
        key: "friends",
        name: "เพื่อนดูบอล",
        invite: "QAFR2345",
        ownerIndex: 0,
        members: 16,
      },
      {
        key: "work",
        name: "ออฟฟิศแฟนตาซี",
        invite: "QAWK6789",
        ownerIndex: 0,
        members: 42,
      },
      {
        key: "thai",
        name: "ชุมชนไทยลีก",
        invite: "QATH2345",
        ownerIndex: 1,
        members: 100,
      },
      {
        key: "club",
        name: "แฟนบอลสโมสร",
        invite: "QAFC6789",
        ownerIndex: 2,
        members: 8,
      },
    ];
    const leagueRows = leagueDefinitions.map((league) => ({
      id: uuidFor(`private:${season.id}:${league.key}`),
      name: league.name,
      invite_code: league.invite,
      owner_team_id: participants.teams[league.ownerIndex].id,
    }));
    await tx.execute(sql`
      insert into fantasy_leagues
        (id, fantasy_season_id, name, type, owner_team_id, invite_code)
      select x.id::uuid,
             ${season.id}::uuid,
             x.name,
             'private',
             x.owner_team_id::uuid,
             x.invite_code
      from jsonb_to_recordset(${JSON.stringify(leagueRows)}::jsonb)
        as x(id text, name text, invite_code text, owner_team_id text)
    `);
    const membershipRows = leagueDefinitions.flatMap((league, leagueIndex) => {
      const owner = participants.teams[league.ownerIndex];
      const chosen = [primaryTeam, owner, ...participants.teams].filter(
        (team, index, rows) =>
          rows.findIndex((candidate) => candidate.id === team.id) === index,
      );
      return chosen.slice(0, league.members).map((team) => ({
        league_id: leagueRows[leagueIndex].id,
        team_id: team.id,
      }));
    });
    privateMemberships = membershipRows.length;
    await tx.execute(sql`
      insert into fantasy_league_members (fantasy_league_id, fantasy_team_id, joined_at)
      select x.league_id::uuid, x.team_id::uuid, now()
      from jsonb_to_recordset(${JSON.stringify(membershipRows)}::jsonb)
        as x(league_id text, team_id text)
    `);
    await tx.execute(sql`
      insert into fantasy_league_audit_log
        (fantasy_season_id, fantasy_league_id, actor_team_id, action, details)
      select ${season.id}::uuid,
             x.id::uuid,
             x.owner_team_id::uuid,
             'create_league',
             jsonb_build_object('scenario', ${scenarioName}::text)
      from jsonb_to_recordset(${JSON.stringify(leagueRows)}::jsonb)
        as x(id text, owner_team_id text)
    `);
  }
  await insertScenarioAudit(tx, season.id, scenarioName, {
    primaryTeamId: primaryTeam.id,
    primaryTeamName: primaryTeam.name,
    participants: participants.teams.length,
  });
  const verified = await verifyLeagueScenario(
    tx,
    season.id,
    definition.populated ? 4 : 0,
    privateMemberships,
  );
  return { ...verified, primaryTeamName: primaryTeam.name };
}

async function insertScenarioAudit(
  tx: ScenarioTransaction,
  seasonId: string,
  scenarioName: ScenarioName,
  after: Record<string, unknown>,
) {
  await tx.execute(sql`
    insert into fantasy_admin_audit_log
      (action, entity_type, entity_id, reason, changed_by, after)
    values (
      'apply_qa_scenario',
      'fantasy_season',
      ${seasonId}::uuid,
      ${`Applied QA scenario ${scenarioName}`},
      'qa-scenario-runner',
      ${JSON.stringify({ scenario: scenarioName, ...after })}::jsonb
    )
  `);
}

async function verifyBaseCounts(tx: ScenarioTransaction, seasonId: string) {
  const result = await tx.execute<{
    teams: number;
    overall_members: number;
  }>(sql`
    select
      (select count(*)::int from fantasy_teams
       where fantasy_season_id = ${seasonId}::uuid) as teams,
      (select count(*)::int
       from fantasy_league_members member
       join fantasy_leagues league on league.id = member.fantasy_league_id
       where league.fantasy_season_id = ${seasonId}::uuid
         and league.type = 'overall') as overall_members
  `);
  const counts = result.rows[0];
  if (
    counts.teams !== PARTICIPANT_COUNT ||
    counts.overall_members !== PARTICIPANT_COUNT
  ) {
    throw new Error(
      `Scenario verification failed: teams=${counts.teams}, Overall members=${counts.overall_members}.`,
    );
  }
  return counts;
}

async function verifyGameweekScenario(
  tx: ScenarioTransaction,
  seasonId: string,
  definition: GameweekScenario,
  selectionThrough: number,
  scoredThrough: number,
) {
  const base = await verifyBaseCounts(tx, seasonId);
  const result = await tx.execute<{
    open_gameweeks: number;
    provisional_gameweeks: number;
    final_gameweeks: number;
    selections: number;
    selection_players: number;
    scores: number;
    standings: number;
    live_fixtures: number;
    target_zero_scores: number;
    target_positive_scores: number;
  }>(sql`
    select
      (select count(*)::int from fantasy_gameweeks
       where fantasy_season_id = ${seasonId}::uuid and status = 'open') as open_gameweeks,
      (select count(*)::int from fantasy_gameweeks
       where fantasy_season_id = ${seasonId}::uuid and status = 'provisional') as provisional_gameweeks,
      (select count(*)::int from fantasy_gameweeks
       where fantasy_season_id = ${seasonId}::uuid and status = 'final') as final_gameweeks,
      (select count(*)::int
       from fantasy_team_selections selection
       join fantasy_gameweeks gw on gw.id = selection.fantasy_gameweek_id
       where gw.fantasy_season_id = ${seasonId}::uuid) as selections,
      (select count(*)::int
       from fantasy_team_selection_players member
       join fantasy_team_selections selection on selection.id = member.selection_id
       join fantasy_gameweeks gw on gw.id = selection.fantasy_gameweek_id
       where gw.fantasy_season_id = ${seasonId}::uuid) as selection_players,
      (select count(*)::int
       from fantasy_team_gameweek_scores score
       join fantasy_team_selections selection on selection.id = score.selection_id
       join fantasy_gameweeks gw on gw.id = selection.fantasy_gameweek_id
       where gw.fantasy_season_id = ${seasonId}::uuid) as scores,
      (select count(*)::int
       from fantasy_league_standings standing
       join fantasy_leagues league on league.id = standing.fantasy_league_id
       where league.fantasy_season_id = ${seasonId}::uuid
         and league.type = 'overall') as standings,
      (select count(*)::int from fixtures
       where competition_season_id = (
         select competition_season_id from fantasy_seasons where id = ${seasonId}::uuid
       ) and status = 'live') as live_fixtures,
      (select count(*)::int
       from fantasy_team_gameweek_scores score
       join fantasy_team_selections selection on selection.id = score.selection_id
       join fantasy_gameweeks gw on gw.id = selection.fantasy_gameweek_id
       where gw.fantasy_season_id = ${seasonId}::uuid
         and gw.number = ${definition.targetGameweek}
         and score.total_points = 0) as target_zero_scores,
      (select count(*)::int
       from fantasy_team_gameweek_scores score
       join fantasy_team_selections selection on selection.id = score.selection_id
       join fantasy_gameweeks gw on gw.id = selection.fantasy_gameweek_id
       where gw.fantasy_season_id = ${seasonId}::uuid
         and gw.number = ${definition.targetGameweek}
         and score.total_points > 0) as target_positive_scores
  `);
  const counts = result.rows[0];
  const expectedOpen = definition.targetGameweek < 30 ? 1 : 0;
  const expectedProvisional = definition.phase === "live" ? 1 : 0;
  const expectedFinal =
    definition.phase === "before"
      ? 0
      : definition.targetGameweek - (definition.phase === "live" ? 1 : 0);
  const expectedSelections = PARTICIPANT_COUNT * selectionThrough;
  const expectedScores = PARTICIPANT_COUNT * scoredThrough;
  const expectedStandings = scoredThrough > 0 ? PARTICIPANT_COUNT : 0;
  const expectedLive = definition.phase === "live" ? 1 : 0;
  if (
    counts.open_gameweeks !== expectedOpen ||
    counts.provisional_gameweeks !== expectedProvisional ||
    counts.final_gameweeks !== expectedFinal ||
    counts.selections !== expectedSelections ||
    counts.selection_players !== expectedSelections * 15 ||
    counts.scores !== expectedScores ||
    counts.standings !== expectedStandings ||
    counts.live_fixtures !== expectedLive ||
    (definition.phase === "live" && counts.target_zero_scores === 0) ||
    (definition.phase === "live" && counts.target_positive_scores === 0)
  ) {
    throw new Error(
      `Scenario postcondition failed: ${JSON.stringify(counts)}.`,
    );
  }
  return { ...base, ...counts };
}

async function verifyLeagueScenario(
  tx: ScenarioTransaction,
  seasonId: string,
  expectedPrivateLeagues: number,
  expectedPrivateMemberships: number,
) {
  const base = await verifyBaseCounts(tx, seasonId);
  const result = await tx.execute<{
    private_leagues: number;
    private_memberships: number;
  }>(sql`
    select
      (select count(*)::int from fantasy_leagues
       where fantasy_season_id = ${seasonId}::uuid and type = 'private') as private_leagues,
      (select count(*)::int
       from fantasy_league_members member
       join fantasy_leagues league on league.id = member.fantasy_league_id
       where league.fantasy_season_id = ${seasonId}::uuid
         and league.type = 'private') as private_memberships
  `);
  const counts = result.rows[0];
  if (
    counts.private_leagues !== expectedPrivateLeagues ||
    counts.private_memberships !== expectedPrivateMemberships
  ) {
    throw new Error(
      `League scenario postcondition failed: ${JSON.stringify(counts)}.`,
    );
  }
  return { ...base, ...counts };
}

async function assertBranch(expectedBranchId: string | null) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Fantasy QA scenarios cannot run with NODE_ENV=production.",
    );
  }
  if (!expectedBranchId) {
    throw new Error(
      "Set FANTASY_SCENARIO_BRANCH_ID or pass --branch-id=<Neon branch id>.",
    );
  }
  const result = await transactionDb.execute<{ branch_id: string | null }>(sql`
    select current_setting('neon.branch_id', true) as branch_id
  `);
  const actualBranchId = result.rows[0]?.branch_id ?? null;
  if (actualBranchId !== expectedBranchId) {
    throw new Error(
      `Refusing scenario write: expected Neon branch ${expectedBranchId}, connected to ${actualBranchId ?? "unknown"}.`,
    );
  }
  return actualBranchId;
}

export async function runFantasyScenarioCli(args: string[]) {
  const options = parseArgs(args);
  if (options.list) {
    listScenarios();
    return;
  }
  if (!options.scenario) {
    listScenarios();
    throw new Error("Choose a scenario name.");
  }
  const definition = SCENARIOS[options.scenario];
  const branchId = await assertBranch(options.branchId);
  const startedAt = Date.now();
  const result = await transactionDb.transaction(async (tx) => {
    const season = await loadSeason(tx, options.seasonSlug);
    const primaryTeam = await findPrimaryTeam(
      tx,
      season.id,
      options.primaryTeamName,
    );
    const summary =
      definition.kind === "gameweek"
        ? await applyGameweekScenario(
            tx,
            season,
            definition,
            primaryTeam,
            options.scenario as GameweekScenarioName,
          )
        : await applyLeagueScenario(
            tx,
            season,
            definition,
            primaryTeam,
            options.scenario as LeagueScenarioName,
          );
    return { seasonSlug: season.slug, ...summary };
  });
  console.log(
    JSON.stringify(
      {
        ok: true,
        scenario: options.scenario,
        branchId,
        durationMs: Date.now() - startedAt,
        ...result,
      },
      null,
      2,
    ),
  );
}
