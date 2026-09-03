import { createHash } from "node:crypto";

import { sql } from "drizzle-orm";

import { transactionDb } from "../../src/db/transaction.ts";
import {
  autoFillSquadDraft,
  classifyLikelyClubStartingGoalkeepers,
  type AutoFillCandidate,
} from "../../src/lib/fantasy/auto-fill.ts";
import {
  calculatePlayerPoints,
  resolveTeamScore,
  type GameweekPlayerResult,
} from "../../src/lib/fantasy/scoring.ts";
import { refreshOverallLeagueStandings as refreshPersistedOverallStandings } from "../../src/lib/fantasy/league-standings-service.ts";
import {
  createEmptySquadDraft,
  getCompleteSelectionMembers,
} from "../../src/lib/fantasy/team-draft.ts";
import {
  settleTransfers,
  type FantasyChip,
  type FantasyPosition,
} from "../../src/lib/fantasy/rules.ts";

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
type PreservedSelection = {
  id: string;
  gameweek: number;
  activeChip: FantasyChip | null;
  freeTransfersBefore: number;
  freeTransfersAfter: number | null;
  netTransferCount: number;
  transferPoints: number;
  confirmedAt: string | null;
  lockedAt: string | null;
  createdAt: string;
  updatedAt: string;
  members: SquadMember[];
  revisions: PreservedRevision[];
};
type PreservedRevision = {
  revision: number;
  status: "confirmed" | "cancelled";
  squad: string[];
  lineup: Record<string, unknown>;
  activeChip: FantasyChip | null;
  netTransferCount: number;
  transferPoints: number;
  createdAt: string;
  updatedAt: string;
};
type SelectionScenarioState = {
  squad: SquadMember[];
  activeChip: FantasyChip | null;
  transferPoints: number;
};

type CliOptions = {
  scenario: ScenarioName | null;
  branchId: string | null;
  seasonSlug: string | null;
  primaryTeamName: string | null;
  advance: boolean;
  refresh: boolean;
  primaryChip: FantasyChip | null | undefined;
  list: boolean;
};

function parseArgs(args: string[]): CliOptions {
  const option = (name: string) =>
    args
      .find((argument) => argument.startsWith(`${name}=`))
      ?.slice(name.length + 1) ?? null;
  const scenarioArgument = args.find((argument) => !argument.startsWith("--"));
  const scenario = scenarioArgument as ScenarioName | undefined;
  const primaryChipArgument = option("--primary-chip");
  if (scenario && !(scenario in SCENARIOS)) {
    throw new Error(
      `Unknown scenario "${scenario}". Run with --list to see valid names.`,
    );
  }
  if (
    primaryChipArgument !== null &&
    !["none", "triple_captain", "bench_boost", "wildcard"].includes(
      primaryChipArgument,
    )
  ) {
    throw new Error(
      `Unknown primary chip "${primaryChipArgument}". Use none, triple_captain, bench_boost, or wildcard.`,
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
    advance: args.includes("--advance"),
    refresh: args.includes("--refresh"),
    primaryChip:
      primaryChipArgument === null
        ? undefined
        : primaryChipArgument === "none"
          ? null
          : (primaryChipArgument as FantasyChip),
    list: args.includes("--list"),
  };
}

function listScenarios() {
  console.log("Available Fantasy QA scenarios:");
  for (const [name, definition] of Object.entries(SCENARIOS)) {
    console.log(`  ${name.padEnd(18)} ${definition.description}`);
  }
  console.log(
    "\nUse --advance without a scenario name to preserve the primary team and move to the next lifecycle state.",
  );
  console.log(
    "Use --refresh to preserve the primary team and regenerate the current lifecycle state.",
  );
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

async function inferAdvanceDefinition(
  tx: ScenarioTransaction,
  seasonId: string,
): Promise<GameweekScenario> {
  const result = await tx.execute<{
    number: number;
    status: "open" | "provisional";
  }>(sql`
    select number, status
    from fantasy_gameweeks
    where fantasy_season_id = ${seasonId}::uuid
      and status in ('open', 'provisional')
    order by case when status = 'provisional' then 0 else 1 end, number
  `);
  const current = result.rows[0];
  if (!current) {
    throw new Error(
      "Cannot advance: the season has no open or provisional Gameweek.",
    );
  }
  const phase = current.status === "provisional" ? "final" : "live";
  return {
    kind: "gameweek",
    targetGameweek: current.number,
    phase,
    description:
      phase === "live"
        ? `Preserve the current GW${current.number} draft and move past its deadline`
        : `Preserve GW${current.number} and finalize its score`,
  };
}

async function inferRefreshDefinition(
  tx: ScenarioTransaction,
  seasonId: string,
): Promise<GameweekScenario> {
  const result = await tx.execute<{
    number: number;
    status: "open" | "provisional" | "final";
  }>(sql`
    select number, status
    from fantasy_gameweeks
    where fantasy_season_id = ${seasonId}::uuid
      and status in ('open', 'provisional', 'final')
    order by case when status = 'provisional' then 0
                  when status = 'final' then 1
                  else 2 end,
             number desc
  `);
  const provisional = result.rows.find((row) => row.status === "provisional");
  if (provisional) {
    return {
      kind: "gameweek",
      targetGameweek: provisional.number,
      phase: "live",
      description: `Regenerate the current live GW${provisional.number} state`,
    };
  }
  const latestFinal = result.rows.find((row) => row.status === "final");
  if (latestFinal) {
    return {
      kind: "gameweek",
      targetGameweek: latestFinal.number,
      phase: "final",
      description: `Regenerate the current final GW${latestFinal.number} state`,
    };
  }
  const open = result.rows.find((row) => row.status === "open");
  if (open?.number === 1) {
    return {
      kind: "gameweek",
      targetGameweek: 1,
      phase: "before",
      description: "Regenerate the current pre-GW1 state",
    };
  }
  throw new Error("Cannot refresh: the current Gameweek lifecycle is unknown.");
}

async function capturePrimaryProgression(
  tx: ScenarioTransaction,
  seasonId: string,
  teamId: string,
) {
  const selectionResult = await tx.execute<{
    id: string;
    gameweek: number;
    active_chip: FantasyChip | null;
    free_transfers_before: number;
    free_transfers_after: number | null;
    net_transfer_count: number;
    transfer_points: number;
    confirmed_at: string | null;
    locked_at: string | null;
    created_at: string;
    updated_at: string;
  }>(sql`
    select selection.id,
           gw.number as gameweek,
           selection.active_chip,
           selection.free_transfers_before,
           selection.free_transfers_after,
           selection.net_transfer_count,
           selection.transfer_points,
           selection.confirmed_at::text,
           selection.locked_at::text,
           selection.created_at::text,
           selection.updated_at::text
    from fantasy_team_selections selection
    join fantasy_gameweeks gw on gw.id = selection.fantasy_gameweek_id
    where selection.fantasy_team_id = ${teamId}::uuid
      and gw.fantasy_season_id = ${seasonId}::uuid
    order by gw.number
  `);
  const memberResult = await tx.execute<{
    gameweek: number;
    fantasy_player_id: string;
    club_id_snapshot: string;
    position_snapshot: FantasyPosition;
    tier_snapshot: number;
    is_thai_snapshot: boolean;
    lineup_role: "starter" | "bench";
    bench_order: number | null;
    captain_role: "none" | "captain" | "vice_captain";
  }>(sql`
    select gw.number as gameweek,
           member.fantasy_player_id,
           member.club_id_snapshot,
           member.position_snapshot,
           member.tier_snapshot,
           member.is_thai_snapshot,
           member.lineup_role,
           member.bench_order,
           member.captain_role
    from fantasy_team_selection_players member
    join fantasy_team_selections selection on selection.id = member.selection_id
    join fantasy_gameweeks gw on gw.id = selection.fantasy_gameweek_id
    where selection.fantasy_team_id = ${teamId}::uuid
      and gw.fantasy_season_id = ${seasonId}::uuid
    order by gw.number,
             case when member.lineup_role = 'starter' then 0 else 1 end,
             member.bench_order nulls first,
             member.id
  `);
  const revisionResult = await tx.execute<{
    gameweek: number;
    revision: number;
    status: "confirmed" | "cancelled";
    squad: string[];
    lineup: Record<string, unknown>;
    active_chip: FantasyChip | null;
    net_transfer_count: number;
    transfer_points: number;
    created_at: string;
    updated_at: string;
  }>(sql`
    select gw.number as gameweek,
           revision.revision,
           revision.status,
           revision.squad,
           revision.lineup,
           revision.active_chip,
           revision.net_transfer_count,
           revision.transfer_points,
           revision.created_at::text,
           revision.updated_at::text
    from fantasy_transfer_revisions revision
    join fantasy_team_selections selection on selection.id = revision.selection_id
    join fantasy_gameweeks gw on gw.id = selection.fantasy_gameweek_id
    where selection.fantasy_team_id = ${teamId}::uuid
      and gw.fantasy_season_id = ${seasonId}::uuid
    order by gw.number, revision.revision
  `);
  const membersByGameweek = new Map<number, SquadMember[]>();
  for (const row of memberResult.rows) {
    const members = membersByGameweek.get(row.gameweek) ?? [];
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
    membersByGameweek.set(row.gameweek, members);
  }
  const revisionsByGameweek = new Map<number, PreservedRevision[]>();
  for (const row of revisionResult.rows) {
    const revisions = revisionsByGameweek.get(row.gameweek) ?? [];
    revisions.push({
      revision: row.revision,
      status: row.status,
      squad: row.squad,
      lineup: row.lineup,
      activeChip: row.active_chip,
      netTransferCount: row.net_transfer_count,
      transferPoints: row.transfer_points,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
    revisionsByGameweek.set(row.gameweek, revisions);
  }
  return selectionResult.rows.map<PreservedSelection>((row) => ({
    id: row.id,
    gameweek: row.gameweek,
    activeChip: row.active_chip,
    freeTransfersBefore: row.free_transfers_before,
    freeTransfersAfter: row.free_transfers_after,
    netTransferCount: row.net_transfer_count,
    transferPoints: row.transfer_points,
    confirmedAt: row.confirmed_at,
    lockedAt: row.locked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    members: membersByGameweek.get(row.gameweek) ?? [],
    revisions: revisionsByGameweek.get(row.gameweek) ?? [],
  }));
}

function normalizedSquad(squad: SquadMember[]) {
  return [...squad]
    .sort((left, right) =>
      left.fantasyPlayerId.localeCompare(right.fantasyPlayerId),
    )
    .map((member) => ({
      fantasyPlayerId: member.fantasyPlayerId,
      clubId: member.clubId,
      position: member.position,
      tier: member.tier,
      isThai: member.isThai,
      lineupRole: member.lineupRole,
      benchOrder: member.benchOrder,
      captainRole: member.captainRole,
    }));
}

async function verifyPrimaryProgression(
  tx: ScenarioTransaction,
  seasonId: string,
  teamId: string,
  expected: Map<number, PreservedSelection & { status: "draft" | "locked" }>,
) {
  const actual = await capturePrimaryProgression(tx, seasonId, teamId);
  if (actual.length !== expected.size) {
    throw new Error(
      `Advance verification failed: expected ${expected.size} primary selections, found ${actual.length}.`,
    );
  }
  for (const selection of actual) {
    const expectedSelection = expected.get(selection.gameweek);
    if (!expectedSelection) {
      throw new Error(
        `Advance verification failed: unexpected primary GW${selection.gameweek} selection.`,
      );
    }
    const expectedRevisionCount =
      expectedSelection.revisions.length > 0
        ? expectedSelection.revisions.length
        : expectedSelection.members.length > 0
          ? 1
          : 0;
    if (
      selection.activeChip !== expectedSelection.activeChip ||
      selection.freeTransfersBefore !== expectedSelection.freeTransfersBefore ||
      selection.freeTransfersAfter !== expectedSelection.freeTransfersAfter ||
      selection.netTransferCount !== expectedSelection.netTransferCount ||
      selection.transferPoints !== expectedSelection.transferPoints ||
      selection.revisions.length !== expectedRevisionCount ||
      JSON.stringify(normalizedSquad(selection.members)) !==
        JSON.stringify(normalizedSquad(expectedSelection.members))
    ) {
      throw new Error(
        `Advance verification failed for primary GW${selection.gameweek}.`,
      );
    }
  }
  return actual.length;
}

function squadSignature(squad: SquadMember[]) {
  return squad
    .map((member) => member.fantasyPlayerId)
    .sort()
    .join(":");
}

function personalizeSquad(squad: SquadMember[], teamIndex: number) {
  if (teamIndex === 0) return squad.map((member) => ({ ...member }));
  const personalized: SquadMember[] = squad.map((member) => ({
    ...member,
    captainRole: "none",
  }));
  const bench = personalized
    .filter((member) => member.lineupRole === "bench")
    .sort((left, right) => (left.benchOrder ?? 99) - (right.benchOrder ?? 99));
  const incoming = bench[teamIndex % bench.length];
  const matchingStarters = personalized.filter(
    (member) =>
      member.lineupRole === "starter" && member.position === incoming.position,
  );
  const outgoing = matchingStarters[teamIndex % matchingStarters.length];
  const outgoingBenchOrder = incoming.benchOrder;
  incoming.lineupRole = "starter";
  incoming.benchOrder = null;
  outgoing.lineupRole = "bench";
  outgoing.benchOrder = outgoingBenchOrder;

  const starters = personalized.filter(
    (member) => member.lineupRole === "starter",
  );
  const captainIndex = teamIndex % starters.length;
  const viceCaptainIndex =
    (captainIndex + 1 + (teamIndex % 5)) % starters.length;
  starters[captainIndex].captainRole = "captain";
  starters[viceCaptainIndex].captainRole = "vice_captain";
  return personalized;
}

function rotateValues<T>(values: T[], offset: number) {
  if (values.length === 0) return values;
  const normalized = ((offset % values.length) + values.length) % values.length;
  return [...values.slice(normalized), ...values.slice(0, normalized)];
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
    overall_rank: number;
    projected_points: number;
    is_thai: boolean;
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
           ranking.overall_rank,
           ranking.projected_points,
           fp.is_thai
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
    order by fp.id, registration.updated_at desc
  `);
  const candidates = candidatesResult.rows.map((row) => ({
    id: row.id,
    clubId: row.club_id,
    position: row.position,
    tier: row.tier,
    overallRank: row.overall_rank,
    projectedPoints: row.projected_points,
    isThai: row.is_thai,
    isLikelyClubStartingGoalkeeper: false,
  }));
  return classifyLikelyClubStartingGoalkeepers(candidates);
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

type LeagueOverlaySnapshot = {
  managers: number;
  teams: number;
  selections: number;
  selection_players: number;
  transfer_revisions: number;
  scores: number;
  score_points: number;
  overall_members: number;
  overall_standings: number;
  overall_points: number;
  gameweeks_checksum: string;
};

async function captureLeagueOverlaySnapshot(
  tx: ScenarioTransaction,
  seasonId: string,
) {
  const result = await tx.execute<LeagueOverlaySnapshot>(sql`
    select
      (select count(*)::int
       from fantasy_managers manager
       where exists (
         select 1 from fantasy_teams team
         where team.manager_id = manager.id
           and team.fantasy_season_id = ${seasonId}::uuid
       )) as managers,
      (select count(*)::int from fantasy_teams
       where fantasy_season_id = ${seasonId}::uuid) as teams,
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
       from fantasy_transfer_revisions revision
       join fantasy_team_selections selection on selection.id = revision.selection_id
       join fantasy_gameweeks gw on gw.id = selection.fantasy_gameweek_id
       where gw.fantasy_season_id = ${seasonId}::uuid) as transfer_revisions,
      (select count(*)::int
       from fantasy_team_gameweek_scores score
       join fantasy_team_selections selection on selection.id = score.selection_id
       join fantasy_gameweeks gw on gw.id = selection.fantasy_gameweek_id
       where gw.fantasy_season_id = ${seasonId}::uuid) as scores,
      (select coalesce(sum(score.total_points), 0)::int
       from fantasy_team_gameweek_scores score
       join fantasy_team_selections selection on selection.id = score.selection_id
       join fantasy_gameweeks gw on gw.id = selection.fantasy_gameweek_id
       where gw.fantasy_season_id = ${seasonId}::uuid) as score_points,
      (select count(*)::int
       from fantasy_league_members member
       join fantasy_leagues league on league.id = member.fantasy_league_id
       where league.fantasy_season_id = ${seasonId}::uuid
         and league.type = 'overall') as overall_members,
      (select count(*)::int
       from fantasy_league_standings standing
       join fantasy_leagues league on league.id = standing.fantasy_league_id
       where league.fantasy_season_id = ${seasonId}::uuid
         and league.type = 'overall') as overall_standings,
      (select coalesce(sum(standing.total_points), 0)::int
       from fantasy_league_standings standing
       join fantasy_leagues league on league.id = standing.fantasy_league_id
       where league.fantasy_season_id = ${seasonId}::uuid
         and league.type = 'overall') as overall_points,
      (select md5(coalesce(string_agg(
         concat_ws(':', gw.number, gw.status, gw.score_complete,
           gw.average_points, gw.highest_points),
         '|' order by gw.number
       ), ''))
       from fantasy_gameweeks gw
       where gw.fantasy_season_id = ${seasonId}::uuid) as gameweeks_checksum
  `);
  const snapshot = result.rows[0];
  if (!snapshot) throw new Error("Could not capture League overlay state.");
  return snapshot;
}

async function loadLeagueParticipants(
  tx: ScenarioTransaction,
  seasonId: string,
  primaryTeam: TeamRow | null,
) {
  if (!primaryTeam) {
    throw new Error(
      "A signed-in tester team is required for Private League scenarios.",
    );
  }
  const allTeamsResult = await tx.execute<TeamRow>(sql`
    select id, manager_id, name
    from fantasy_teams
    where fantasy_season_id = ${seasonId}::uuid
    order by created_at, id
  `);
  if (allTeamsResult.rows.length !== PARTICIPANT_COUNT) {
    throw new Error(
      `League overlays require ${PARTICIPANT_COUNT} existing teams; apply a Gameweek scenario first. Found ${allTeamsResult.rows.length}.`,
    );
  }
  if (!allTeamsResult.rows.some((team) => team.id === primaryTeam.id)) {
    throw new Error("The signed-in tester team is not part of this season.");
  }
  const ownerCandidateResult = await tx.execute<TeamRow>(sql`
    select team.id, team.manager_id, team.name
    from fantasy_teams team
    join fantasy_managers manager on manager.id = team.manager_id
    where team.fantasy_season_id = ${seasonId}::uuid
      and team.id <> ${primaryTeam.id}::uuid
      and (manager.auth_user_id is null
        or manager.auth_user_id like 'qa-scenario-owner-%')
    order by team.created_at, team.id
    limit 2
  `);
  if (ownerCandidateResult.rows.length < 2) {
    throw new Error(
      "League overlays require two unowned QA teams for Private League owners.",
    );
  }
  const preferredIds = new Set([
    primaryTeam.id,
    ...ownerCandidateResult.rows.map((team) => team.id),
  ]);
  return {
    primaryTeam,
    teams: [
      primaryTeam,
      ...ownerCandidateResult.rows,
      ...allTeamsResult.rows.filter((team) => !preferredIds.has(team.id)),
    ],
  };
}

async function ensureParticipants(
  tx: ScenarioTransaction,
  seasonId: string,
  primaryTeam: TeamRow | null,
) {
  await tx.execute(sql`
    delete from fantasy_managers
    where (auth_user_id is null or auth_user_id like 'qa-scenario-owner-%')
      and id in (
        select manager_id
        from fantasy_teams
        where fantasy_season_id = ${seasonId}::uuid
          and name ~ ${QA_TEAM_NAME_PATTERN}
      )
  `);
  await tx.execute(sql`
    delete from auth_users
    where id like 'qa-scenario-owner-%'
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
      const isPastFinal =
        gameweek < definition.targetGameweek ||
        (gameweek === definition.targetGameweek &&
          definition.phase === "final");
      const isLive =
        definition.phase === "live" &&
        gameweek === definition.targetGameweek &&
        index === liveIndex;
      const futureFixtureIndex = index < liveIndex ? index : index - 1;
      const kickoffOffsetMinutes = isLive
        ? 90
        : definition.phase === "live" && gameweek === definition.targetGameweek
          ? 270 + futureFixtureIndex * 180
          : 90 + index * 180;
      const kickoffAt = new Date(
        deadlines.get(gameweek)!.getTime() + kickoffOffsetMinutes * 60 * 1_000,
      );
      const homeScore = isPastFinal
        ? (gameweek + index) % 4
        : isLive
          ? (gameweek + index) % 2
          : null;
      const awayScore = isPastFinal
        ? (gameweek * 2 + index + 1) % 3
        : isLive
          ? (gameweek + index + 1) % 2
          : null;
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
  preferPrimaryCaptain: boolean,
) {
  const primaryClubIds = new Set(squads[0].map((member) => member.clubId));
  const primaryCaptainClubIds = new Set(
    squads[0]
      .filter((member) => member.captainRole === "captain")
      .map((member) => member.clubId),
  );
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
        primaryCaptainPlays:
          preferPrimaryCaptain &&
          (primaryCaptainClubIds.has(fixture.home_club_id) ||
            primaryCaptainClubIds.has(fixture.away_club_id)),
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
        Number(right.primaryCaptainPlays) - Number(left.primaryCaptainPlays) ||
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
  scenarioName: string,
  mode: "reset" | "advance" | "refresh",
  primaryChipOverride: FantasyChip | null | undefined,
) {
  const preservePrimary = mode !== "reset";
  const templates = await loadSquadTemplates(
    tx,
    season,
    requestedPrimaryTeam?.id ?? null,
  );
  const squads = templates.squads;
  if (preservePrimary && !requestedPrimaryTeam) {
    throw new Error(
      "Cannot preserve progression: a signed-in primary tester team was not found.",
    );
  }
  const preservedSelections =
    preservePrimary && requestedPrimaryTeam
      ? await capturePrimaryProgression(tx, season.id, requestedPrimaryTeam.id)
      : [];
  if (preservePrimary && preservedSelections.length === 0) {
    throw new Error(
      "Cannot preserve progression: the primary tester team has no Gameweek selection.",
    );
  }

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
    squad: personalizeSquad(squads[index % squads.length], index),
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
  const preservedByGameweek = new Map(
    preservedSelections.map((selection) => [selection.gameweek, selection]),
  );
  const primaryAdvanceStates = new Map<
    number,
    PreservedSelection & { status: "draft" | "locked" }
  >();
  if (preservePrimary) {
    let latest: PreservedSelection | null = null;
    for (let gameweek = 1; gameweek <= plan.selectionThrough; gameweek += 1) {
      const exact = preservedByGameweek.get(gameweek) ?? null;
      if (exact) latest = exact;
      const status = gameweek <= plan.scoredThrough ? "locked" : "draft";
      const requestedChip =
        gameweek === definition.targetGameweek &&
        primaryChipOverride !== undefined
          ? primaryChipOverride
          : (exact?.activeChip ?? null);
      const activeChip =
        gameweek < 2 && requestedChip === "wildcard" ? null : requestedChip;
      const freeTransfersBefore =
        exact?.freeTransfersBefore ??
        latest?.freeTransfersAfter ??
        latest?.freeTransfersBefore ??
        (gameweek === 1 ? 2 : 4);
      const settlement = settleTransfers({
        freeTransfersBefore,
        transferCount: exact?.netTransferCount ?? 0,
        wildcard: activeChip === "wildcard",
      });
      const carried = !exact;
      const revisions = carried
        ? []
        : exact.revisions.map((revision) => ({ ...revision }));
      if (
        gameweek === definition.targetGameweek &&
        primaryChipOverride !== undefined &&
        revisions.length > 0
      ) {
        const latestRevision = revisions[revisions.length - 1];
        revisions[revisions.length - 1] = {
          ...latestRevision,
          activeChip,
          transferPoints:
            status === "locked"
              ? settlement.transferPoints
              : latestRevision.transferPoints,
        };
      }
      const state: PreservedSelection & { status: "draft" | "locked" } = {
        id: exact?.id ?? uuidFor(`${mode}:${primaryTeam.id}:${gameweek}`),
        gameweek,
        status,
        activeChip,
        freeTransfersBefore,
        freeTransfersAfter:
          status === "locked"
            ? settlement.freeTransfersAfter
            : (exact?.freeTransfersAfter ?? null),
        netTransferCount: exact?.netTransferCount ?? 0,
        transferPoints:
          status === "locked"
            ? settlement.transferPoints
            : (exact?.transferPoints ?? 0),
        confirmedAt: carried ? null : exact.confirmedAt,
        lockedAt:
          status === "locked"
            ? (exact?.lockedAt ??
              deadlineByGameweek.get(gameweek)!.toISOString())
            : null,
        createdAt: exact?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        members: (latest?.members ?? []).map((member) => ({ ...member })),
        revisions,
      };
      primaryAdvanceStates.set(gameweek, state);
      latest = state;
    }
  }
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
          primaryChipOverride === "triple_captain",
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
           case when gw.number = 1 then 2 else 4 end,
           case when gw.number <= ${plan.scoredThrough} then 4 else null end,
           0,
           0,
           least(now(), gw.deadline_at - interval '2 days'),
           case when gw.number <= ${plan.scoredThrough} then gw.deadline_at else null end
    from fantasy_teams team
    cross join fantasy_gameweeks gw
    where team.fantasy_season_id = ${season.id}::uuid
      and gw.fantasy_season_id = ${season.id}::uuid
      and gw.number <= ${plan.selectionThrough}
  `);
  await tx.execute(sql`
    update fantasy_teams
    set free_transfers = case when ${plan.scoredThrough} > 0 then 4 else 2 end,
        updated_at = now()
    where fantasy_season_id = ${season.id}::uuid
  `);
  if (preservePrimary) {
    const selectionPayload = [...primaryAdvanceStates.values()].map(
      (selection) => ({
        gameweek: selection.gameweek,
        status: selection.status,
        active_chip: selection.activeChip,
        free_transfers_before: selection.freeTransfersBefore,
        free_transfers_after: selection.freeTransfersAfter,
        net_transfer_count: selection.netTransferCount,
        transfer_points: selection.transferPoints,
        confirmed_at: selection.confirmedAt,
        locked_at: selection.lockedAt,
        created_at: selection.createdAt,
        updated_at: selection.updatedAt,
      }),
    );
    await tx.execute(sql`
      update fantasy_team_selections selection
      set status = x.status::fantasy_selection_status,
          active_chip = x.active_chip::fantasy_chip,
          free_transfers_before = x.free_transfers_before,
          free_transfers_after = x.free_transfers_after,
          net_transfer_count = x.net_transfer_count,
          transfer_points = x.transfer_points,
          confirmed_at = x.confirmed_at::timestamptz,
          locked_at = x.locked_at::timestamptz,
          created_at = x.created_at::timestamptz,
          updated_at = x.updated_at::timestamptz
      from fantasy_gameweeks gw,
           jsonb_to_recordset(${JSON.stringify(selectionPayload)}::jsonb)
             as x(gameweek int, status text, active_chip text,
                  free_transfers_before int, free_transfers_after int,
                  net_transfer_count int, transfer_points int,
                  confirmed_at text, locked_at text, created_at text, updated_at text)
      where selection.fantasy_team_id = ${primaryTeam.id}::uuid
        and selection.fantasy_gameweek_id = gw.id
        and gw.fantasy_season_id = ${season.id}::uuid
        and gw.number = x.gameweek
    `);
    const latestState = primaryAdvanceStates.get(plan.selectionThrough)!;
    const primaryFreeTransfers =
      latestState.status === "draft"
        ? latestState.freeTransfersBefore
        : (latestState.freeTransfersAfter ?? latestState.freeTransfersBefore);
    await tx.execute(sql`
      update fantasy_teams
      set free_transfers = ${primaryFreeTransfers}, updated_at = now()
      where id = ${primaryTeam.id}::uuid
    `);
  }

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
  if (preservePrimary) {
    await tx.execute(sql`
      delete from fantasy_team_selection_players member
      using fantasy_team_selections selection, fantasy_gameweeks gw
      where member.selection_id = selection.id
        and selection.fantasy_gameweek_id = gw.id
        and selection.fantasy_team_id = ${primaryTeam.id}::uuid
        and gw.fantasy_season_id = ${season.id}::uuid
    `);
    const primaryMemberPayload = [...primaryAdvanceStates.values()].flatMap(
      (selection) =>
        selection.members.map((member) => ({
          gameweek: selection.gameweek,
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
    if (primaryMemberPayload.length > 0) {
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
        join jsonb_to_recordset(${JSON.stringify(primaryMemberPayload)}::jsonb)
          as member(gameweek int, fantasy_player_id text, club_id text, position text,
                    tier int, is_thai boolean, lineup_role text, bench_order int,
                    captain_role text)
          on member.gameweek = gw.number
        where selection.fantasy_team_id = ${primaryTeam.id}::uuid
          and gw.fantasy_season_id = ${season.id}::uuid
      `);
    }
  }
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
  if (preservePrimary) {
    await tx.execute(sql`
      delete from fantasy_transfer_revisions revision
      using fantasy_team_selections selection, fantasy_gameweeks gw
      where revision.selection_id = selection.id
        and selection.fantasy_gameweek_id = gw.id
        and selection.fantasy_team_id = ${primaryTeam.id}::uuid
        and gw.fantasy_season_id = ${season.id}::uuid
    `);
    const primaryRevisionPayload = [...primaryAdvanceStates.values()].flatMap(
      (selection) => {
        const revisions =
          selection.revisions.length > 0
            ? selection.revisions
            : selection.members.length > 0
              ? [
                  {
                    revision: 1,
                    status: "confirmed" as const,
                    squad: selection.members.map(
                      (member) => member.fantasyPlayerId,
                    ),
                    lineup: { members: selection.members },
                    activeChip: selection.activeChip,
                    netTransferCount: 0,
                    transferPoints: selection.transferPoints,
                    createdAt: selection.createdAt,
                    updatedAt: selection.updatedAt,
                  },
                ]
              : [];
        return revisions.map((revision) => ({
          gameweek: selection.gameweek,
          revision: revision.revision,
          status: revision.status,
          squad: revision.squad,
          lineup: revision.lineup,
          active_chip: revision.activeChip,
          net_transfer_count: revision.netTransferCount,
          transfer_points: revision.transferPoints,
          created_at: revision.createdAt,
          updated_at: revision.updatedAt,
        }));
      },
    );
    if (primaryRevisionPayload.length > 0) {
      await tx.execute(sql`
        insert into fantasy_transfer_revisions
          (selection_id, revision, status, squad, lineup, active_chip,
           net_transfer_count, transfer_points, created_at, updated_at)
        select selection.id,
               revision.revision,
               revision.status::fantasy_revision_status,
               revision.squad,
               revision.lineup,
               revision.active_chip::fantasy_chip,
               revision.net_transfer_count,
               revision.transfer_points,
               revision.created_at::timestamptz,
               revision.updated_at::timestamptz
        from fantasy_team_selections selection
        join fantasy_gameweeks gw on gw.id = selection.fantasy_gameweek_id
        join jsonb_to_recordset(${JSON.stringify(primaryRevisionPayload)}::jsonb)
          as revision(gameweek int, revision int, status text, squad jsonb,
                      lineup jsonb, active_chip text, net_transfer_count int,
                      transfer_points int, created_at text, updated_at text)
          on revision.gameweek = gw.number
        where selection.fantasy_team_id = ${primaryTeam.id}::uuid
          and gw.fantasy_season_id = ${season.id}::uuid
      `);
    }
  }

  const statRows: Array<Record<string, unknown>> = [];
  const pointRows: Array<Record<string, unknown>> = [];
  const teamScoreRows: Array<Record<string, unknown>> = [];
  let primaryTargetScore: {
    gameweek: number;
    activeChip: FantasyChip | null;
    totalPoints: number;
    captainBonus: number;
    captainPlayerId: string | null;
    captainName: string | null;
    captainBasePoints: number;
  } | null = null;
  const primaryScoringStates = new Map<number, SelectionScenarioState>(
    [...primaryAdvanceStates].map(([gameweek, selection]) => [
      gameweek,
      {
        squad: selection.members,
        activeChip: selection.activeChip,
        transferPoints: selection.transferPoints,
      },
    ]),
  );
  const playerUniverse = [
    ...new Map(
      [
        ...squads.flat(),
        ...[...primaryAdvanceStates.values()].flatMap(
          (selection) => selection.members,
        ),
      ].map((member) => [member.fantasyPlayerId, member]),
    ).values(),
  ].sort((left, right) =>
    left.fantasyPlayerId.localeCompare(right.fantasyPlayerId),
  );
  const playersByClub = new Map<string, SquadMember[]>();
  for (const player of playerUniverse) {
    const clubPlayers = playersByClub.get(player.clubId) ?? [];
    clubPlayers.push(player);
    playersByClub.set(player.clubId, clubPlayers);
  }
  const fixturesByGameweek = new Map<number, FixtureState[]>();
  for (const fixture of fixturePlan.states) {
    const gameweekFixtures = fixturesByGameweek.get(fixture.matchweek) ?? [];
    gameweekFixtures.push(fixture);
    fixturesByGameweek.set(fixture.matchweek, gameweekFixtures);
  }
  for (let gameweek = 1; gameweek <= plan.scoredThrough; gameweek += 1) {
    const results: GameweekPlayerResult[] = [];
    const activeFixtures = (fixturesByGameweek.get(gameweek) ?? []).filter(
      (fixture) => fixture.status !== "scheduled",
    );
    for (const fixture of activeFixtures) {
      const sides = [
        {
          clubId: fixture.home_club_id,
          goalsFor: fixture.homeScore ?? 0,
          goalsAgainst: fixture.awayScore ?? 0,
        },
        {
          clubId: fixture.away_club_id,
          goalsFor: fixture.awayScore ?? 0,
          goalsAgainst: fixture.homeScore ?? 0,
        },
      ];
      for (const [sideIndex, side] of sides.entries()) {
        const clubPlayers = playersByClub.get(side.clubId) ?? [];
        const goalkeepers = rotateValues(
          clubPlayers
            .filter((player) => player.position === "goalkeeper")
            .sort((left, right) =>
              left.fantasyPlayerId.localeCompare(right.fantasyPlayerId),
            ),
          gameweek + sideIndex,
        );
        const outfield = rotateValues(
          clubPlayers
            .filter((player) => player.position !== "goalkeeper")
            .sort((left, right) =>
              left.fantasyPlayerId.localeCompare(right.fantasyPlayerId),
            ),
          gameweek * 3 + sideIndex + (fixture.match_number ?? 0),
        );
        const starters = [
          ...goalkeepers.slice(0, 1),
          ...outfield.slice(0, goalkeepers.length > 0 ? 10 : 11),
        ];
        const starterIds = new Set(
          starters.map((player) => player.fantasyPlayerId),
        );
        const substitutes = [...outfield, ...goalkeepers]
          .filter((player) => !starterIds.has(player.fantasyPlayerId))
          .slice(0, fixture.status === "finished" ? 5 : 0);
        const participants = [...starters, ...substitutes];
        if (participants.length === 0) continue;

        const scorerPool = [
          ...participants.filter((player) => player.position === "forward"),
          ...participants.filter((player) => player.position === "midfielder"),
          ...participants.filter((player) => player.position === "defender"),
          ...participants.filter((player) => player.position === "goalkeeper"),
        ];
        const goalsByPlayer = new Map<string, number>();
        const assistsByPlayer = new Map<string, number>();
        const scorers: SquadMember[] = [];
        for (let goalIndex = 0; goalIndex < side.goalsFor; goalIndex += 1) {
          const scorer =
            scorerPool[(goalIndex + gameweek + sideIndex) % scorerPool.length];
          scorers.push(scorer);
          goalsByPlayer.set(
            scorer.fantasyPlayerId,
            (goalsByPlayer.get(scorer.fantasyPlayerId) ?? 0) + 1,
          );
        }
        for (const [goalIndex, scorer] of scorers.entries()) {
          if ((goalIndex + gameweek + sideIndex) % 4 === 0) continue;
          const assister = scorerPool.find(
            (candidate, candidateIndex) =>
              candidate.fantasyPlayerId !== scorer.fantasyPlayerId &&
              candidateIndex >= goalIndex % Math.max(1, scorerPool.length - 1),
          );
          if (!assister) continue;
          assistsByPlayer.set(
            assister.fantasyPlayerId,
            (assistsByPlayer.get(assister.fantasyPlayerId) ?? 0) + 1,
          );
        }

        for (const [participantIndex, member] of participants.entries()) {
          const isStarter = participantIndex < starters.length;
          const minutes =
            fixture.status === "live"
              ? 30
              : isStarter
                ? 90
                : 20 + ((gameweek + participantIndex * 7) % 26);
          const stats = {
            minutes,
            goals: goalsByPlayer.get(member.fantasyPlayerId) ?? 0,
            sourceAssists: assistsByPlayer.get(member.fantasyPlayerId) ?? 0,
            fantasyAssists: null,
            goalsConcededWhilePlaying: isStarter
              ? side.goalsAgainst
              : Math.min(
                  side.goalsAgainst,
                  (gameweek + participantIndex) % (side.goalsAgainst + 1),
                ),
            saves:
              member.position === "goalkeeper"
                ? 2 + ((gameweek + sideIndex + (fixture.match_number ?? 0)) % 6)
                : 0,
            penaltySaves: 0,
            penaltyMisses: 0,
            yellowCards:
              participantIndex ===
              (gameweek + sideIndex + (fixture.match_number ?? 0)) %
                participants.length
                ? 1
                : 0,
            redCards:
              (gameweek + sideIndex + (fixture.match_number ?? 0)) % 23 === 0 &&
              participantIndex === participants.length - 1
                ? 1
                : 0,
            ownGoals: 0,
          };
          const points = calculatePlayerPoints(member.position, stats);
          const statsId = uuidFor(
            `stats:${gameweek}:${member.fantasyPlayerId}`,
          );
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
            payload: {
              scenario: scenarioName,
              deterministic: true,
              fixtureStatus: fixture.status,
              clubId: side.clubId,
            },
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
      }
    }
    for (const { team, squad } of teamSquads) {
      const scoringState =
        preservePrimary && team.id === primaryTeam.id
          ? primaryScoringStates.get(gameweek)
          : { squad, activeChip: null, transferPoints: 0 };
      if (!scoringState) {
        throw new Error(
          `Cannot score GW${gameweek}: the primary tester selection is missing.`,
        );
      }
      const score = resolveTeamScore({
        selection: scoringState.squad.map((member) => ({
          playerId: member.fantasyPlayerId,
          position: member.position,
          lineupRole: member.lineupRole,
          benchOrder: member.benchOrder,
          captainRole: member.captainRole,
        })),
        playerResults: results,
        activeChip: scoringState.activeChip,
        transferPoints: scoringState.transferPoints,
      });
      teamScoreRows.push({
        team_id: team.id,
        gameweek,
        lineup_points: score.lineupPoints,
        bench_points: score.benchPoints,
        captain_bonus: score.captainBonus,
        transfer_points: score.transferPoints,
        total_points: score.totalPoints,
        auto_substitutions: score.autoSubstitutions,
      });
      if (
        preservePrimary &&
        team.id === primaryTeam.id &&
        gameweek === definition.targetGameweek
      ) {
        const captain = scoringState.squad.find(
          (member) => member.captainRole === "captain",
        );
        const captainResult = captain
          ? results.find(
              (result) => result.playerId === captain.fantasyPlayerId,
            )
          : null;
        primaryTargetScore = {
          gameweek,
          activeChip: scoringState.activeChip,
          totalPoints: score.totalPoints,
          captainBonus: score.captainBonus,
          captainPlayerId: captain?.fantasyPlayerId ?? null,
          captainName: null,
          captainBasePoints: captainResult?.points ?? 0,
        };
      }
    }
  }
  if (primaryTargetScore?.captainPlayerId) {
    const captainResult = await tx.execute<{ name: string }>(sql`
      select coalesce(player.short_name_th, player.short_name_en,
                      player.full_name_th, player.full_name_en) as name
      from fantasy_players fantasy_player
      join players player on player.id = fantasy_player.player_id
      where fantasy_player.id = ${primaryTargetScore.captainPlayerId}::uuid
      limit 1
    `);
    primaryTargetScore.captainName = captainResult.rows[0]?.name ?? null;
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
             team_score.transfer_points,
             team_score.total_points,
             team_score.auto_substitutions,
             now()
      from fantasy_team_selections selection
      join fantasy_teams team on team.id = selection.fantasy_team_id
      join fantasy_gameweeks gw on gw.id = selection.fantasy_gameweek_id
      join jsonb_to_recordset(${JSON.stringify(teamScoreRows)}::jsonb)
        as team_score(team_id text, gameweek int, lineup_points int, bench_points int,
                      captain_bonus int, transfer_points int, total_points int,
                      auto_substitutions jsonb)
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
               coalesce(round(avg(score.total_points)), 0)::int as average_points,
               coalesce(max(score.total_points), 0)::int as highest_points
        from fantasy_team_gameweek_scores score
        join fantasy_team_selections selection on selection.id = score.selection_id
        where exists (
          select 1
          from fantasy_team_selection_players member
          where member.selection_id = selection.id
        )
        group by selection.fantasy_gameweek_id
      ) summary
      where gw.id = summary.fantasy_gameweek_id
        and gw.fantasy_season_id = ${season.id}::uuid
    `);
    await refreshOverallStandings(tx, season.id);
  }

  await insertScenarioAudit(tx, season.id, scenarioName, {
    primaryTeamId: primaryTeam.id,
    primaryTeamName: primaryTeam.name,
    participants: participants.teams.length,
    scoredThrough: plan.scoredThrough,
    squadTemplates: squads.length,
    mode,
  });
  const preservedPrimaryGameweeks = preservePrimary
    ? await verifyPrimaryProgression(
        tx,
        season.id,
        primaryTeam.id,
        primaryAdvanceStates,
      )
    : 0;
  const expectedSelectionPlayers = preservePrimary
    ? (PARTICIPANT_COUNT - 1) * plan.selectionThrough * 15 +
      [...primaryAdvanceStates.values()].reduce(
        (count, selection) => count + selection.members.length,
        0,
      )
    : PARTICIPANT_COUNT * plan.selectionThrough * 15;
  const verified = await verifyGameweekScenario(
    tx,
    season.id,
    definition,
    plan.selectionThrough,
    plan.scoredThrough,
    expectedSelectionPlayers,
    preservePrimary ? primaryTeam.id : null,
    primaryChipOverride !== "triple_captain",
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
    mode,
    preservedPrimaryGameweeks,
    primaryTargetScore,
  };
}

async function refreshOverallStandings(
  tx: ScenarioTransaction,
  seasonId: string,
) {
  await refreshPersistedOverallStandings(seasonId, tx);
}

async function promotePrimaryToMember(
  tx: ScenarioTransaction,
  primaryTeam: TeamRow,
) {
  const identityResult = await tx.execute<{ auth_user_id: string }>(sql`
    select manager.auth_user_id
    from fantasy_managers manager
    join auth_users user_row on user_row.id = manager.auth_user_id
    where manager.id = ${primaryTeam.manager_id}::uuid
    limit 1
  `);
  if (!identityResult.rows[0]) {
    throw new Error(
      "A signed-in tester team is required for Private League scenarios.",
    );
  }
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

async function provisionQaLeagueOwners(
  tx: ScenarioTransaction,
  ownerTeams: TeamRow[],
) {
  const owners = ownerTeams.map((team, index) => ({
    team_id: team.id,
    manager_id: team.manager_id,
    user_id: `qa-scenario-owner-${index + 1}`,
    name: `QA League Owner ${index + 1}`,
    email: `qa-league-owner-${index + 1}@example.invalid`,
  }));
  await tx.execute(sql`
    update fantasy_managers manager
    set auth_user_id = null,
        status = 'abandoned',
        updated_at = now()
    from jsonb_to_recordset(${JSON.stringify(owners)}::jsonb)
      as owner(manager_id text, user_id text)
    where manager.auth_user_id = owner.user_id
      and manager.id <> owner.manager_id::uuid
  `);
  await tx.execute(sql`
    insert into auth_users
      (id, name, email, email_verified, is_anonymous, role)
    select owner.user_id,
           owner.name,
           owner.email,
           true,
           false,
           'member'
    from jsonb_to_recordset(${JSON.stringify(owners)}::jsonb)
      as owner(user_id text, name text, email text)
    on conflict (id) do update
    set name = excluded.name,
        email = excluded.email,
        email_verified = excluded.email_verified,
        is_anonymous = excluded.is_anonymous,
        role = excluded.role,
        updated_at = now()
  `);
  await tx.execute(sql`
    update fantasy_managers manager
    set auth_user_id = owner.user_id,
        status = 'member',
        updated_at = now()
    from jsonb_to_recordset(${JSON.stringify(owners)}::jsonb)
      as owner(manager_id text, user_id text)
    where manager.id = owner.manager_id::uuid
  `);
  return owners;
}

async function applyLeagueScenario(
  tx: ScenarioTransaction,
  season: SeasonRow,
  definition: LeagueScenario,
  requestedPrimaryTeam: TeamRow | null,
  scenarioName: LeagueScenarioName,
) {
  const preservedState = await captureLeagueOverlaySnapshot(tx, season.id);
  await clearPrivateLeagues(tx, season.id);
  const participants = await loadLeagueParticipants(
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
    await provisionQaLeagueOwners(tx, [
      participants.teams[1],
      participants.teams[2],
    ]);
    const scenarioNow = new Date();
    const leagueDefinitions = [
      {
        key: "friends",
        name: "เพื่อนดูบอล",
        invite: "QAFR2345",
        ownerIndex: 0,
        members: 16,
        ageDays: 21,
      },
      {
        key: "work",
        name: "ออฟฟิศแฟนตาซี",
        invite: "QAWK6789",
        ownerIndex: 0,
        members: 42,
        ageDays: 14,
      },
      {
        key: "thai",
        name: "ชุมชนไทยลีก",
        invite: "QATH2345",
        ownerIndex: 1,
        members: 100,
        ageDays: 10,
      },
      {
        key: "club",
        name: "แฟนบอลสโมสร",
        invite: "QAFC6789",
        ownerIndex: 2,
        members: 8,
        ageDays: 5,
      },
    ];
    const leagueRows = leagueDefinitions.map((league) => ({
      id: uuidFor(`private:${season.id}:${league.key}`),
      name: league.name,
      invite_code: league.invite,
      owner_team_id: participants.teams[league.ownerIndex].id,
      created_at: new Date(
        scenarioNow.getTime() - league.ageDays * DAY_MS,
      ).toISOString(),
    }));
    await tx.execute(sql`
      insert into fantasy_leagues
        (id, fantasy_season_id, name, type, owner_team_id, invite_code,
         created_at, updated_at)
      select x.id::uuid,
             ${season.id}::uuid,
             x.name,
             'private',
             x.owner_team_id::uuid,
             x.invite_code,
             x.created_at::timestamptz,
             x.created_at::timestamptz
      from jsonb_to_recordset(${JSON.stringify(leagueRows)}::jsonb)
        as x(id text, name text, invite_code text, owner_team_id text, created_at text)
    `);
    const membershipRows = leagueDefinitions.flatMap((league, leagueIndex) => {
      const owner = participants.teams[league.ownerIndex];
      const chosen = [owner, primaryTeam, ...participants.teams].filter(
        (team, index, rows) =>
          rows.findIndex((candidate) => candidate.id === team.id) === index,
      );
      const leagueCreatedAt = new Date(leagueRows[leagueIndex].created_at);
      return chosen.slice(0, league.members).map((team, memberIndex) => ({
        league_id: leagueRows[leagueIndex].id,
        team_id: team.id,
        joined_at: new Date(
          leagueCreatedAt.getTime() + memberIndex * 30 * 60 * 1_000,
        ).toISOString(),
      }));
    });
    privateMemberships = membershipRows.length;
    await tx.execute(sql`
      insert into fantasy_league_members (fantasy_league_id, fantasy_team_id, joined_at)
      select x.league_id::uuid, x.team_id::uuid, x.joined_at::timestamptz
      from jsonb_to_recordset(${JSON.stringify(membershipRows)}::jsonb)
        as x(league_id text, team_id text, joined_at text)
    `);
    await tx.execute(sql`
      insert into fantasy_league_audit_log
        (fantasy_season_id, fantasy_league_id, actor_team_id, action, details)
      select ${season.id}::uuid,
             x.id::uuid,
             x.owner_team_id::uuid,
             'create_private_league',
             jsonb_build_object('scenario', ${scenarioName}::text, 'name', x.name)
      from jsonb_to_recordset(${JSON.stringify(leagueRows)}::jsonb)
        as x(id text, owner_team_id text, name text)
    `);
    await tx.execute(sql`
      insert into fantasy_league_audit_log
        (fantasy_season_id, fantasy_league_id, actor_team_id, action, details)
      select ${season.id}::uuid,
             x.id::uuid,
             ${primaryTeam.id}::uuid,
             'join_private_league',
             jsonb_build_object('scenario', ${scenarioName}::text)
      from jsonb_to_recordset(${JSON.stringify(leagueRows.slice(2))}::jsonb)
        as x(id text)
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
    primaryTeam.id,
    definition.populated ? 2 : 0,
  );
  const currentState = await captureLeagueOverlaySnapshot(tx, season.id);
  if (JSON.stringify(currentState) !== JSON.stringify(preservedState)) {
    throw new Error(
      `League overlay changed protected Gameweek/scoring state: before=${JSON.stringify(preservedState)}, after=${JSON.stringify(currentState)}.`,
    );
  }
  return { ...verified, primaryTeamName: primaryTeam.name };
}

async function insertScenarioAudit(
  tx: ScenarioTransaction,
  seasonId: string,
  scenarioName: string,
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
  expectedSelectionPlayers: number,
  transferExceptionTeamId: string | null,
  requireZeroLiveScore: boolean,
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
    target_distinct_scores: number;
    target_average_points: number;
    target_highest_points: number;
    invalid_fixture_timing: number;
    invalid_fixture_scores: number;
    deadline_mismatches: number;
    invalid_selection_lifecycle: number;
    invalid_transfer_balance: number;
    invalid_team_transfer_balance: number;
    invalid_score_status: number;
    invalid_gameweek_summary: number;
    impossible_player_totals: number;
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
         and score.total_points > 0) as target_positive_scores,
      (select count(distinct score.total_points)::int
       from fantasy_team_gameweek_scores score
       join fantasy_team_selections selection on selection.id = score.selection_id
       join fantasy_gameweeks gw on gw.id = selection.fantasy_gameweek_id
       where gw.fantasy_season_id = ${seasonId}::uuid
         and gw.number = ${definition.targetGameweek}) as target_distinct_scores,
      (select average_points from fantasy_gameweeks
       where fantasy_season_id = ${seasonId}::uuid
         and number = ${definition.targetGameweek}) as target_average_points,
      (select highest_points from fantasy_gameweeks
       where fantasy_season_id = ${seasonId}::uuid
         and number = ${definition.targetGameweek}) as target_highest_points,
      (select count(*)::int from fixtures
       where competition_season_id = (
         select competition_season_id from fantasy_seasons where id = ${seasonId}::uuid
       ) and (
         (status = 'live' and (kickoff_at > now() or kickoff_at < now() - interval '3 hours'))
         or (status = 'finished' and kickoff_at >= now())
         or (status in ('scheduled', 'time_tbc') and kickoff_at <= now())
       )) as invalid_fixture_timing,
      (select count(*)::int from fixtures
       where competition_season_id = (
         select competition_season_id from fantasy_seasons where id = ${seasonId}::uuid
       ) and (
         (status in ('live', 'finished') and (home_score is null or away_score is null))
         or (status in ('scheduled', 'time_tbc') and (home_score is not null or away_score is not null))
       )) as invalid_fixture_scores,
      (select count(*)::int
       from fantasy_gameweeks gw
       where gw.fantasy_season_id = ${seasonId}::uuid
         and abs(extract(epoch from (
           gw.deadline_at - (
             select min(fixture.kickoff_at) - interval '90 minutes'
             from fixtures fixture
             where fixture.competition_season_id = (
               select competition_season_id from fantasy_seasons where id = ${seasonId}::uuid
             ) and fixture.matchweek = gw.number
           )
         ))) > 1) as deadline_mismatches,
      (select count(*)::int
       from fantasy_team_selections selection
       join fantasy_gameweeks gw on gw.id = selection.fantasy_gameweek_id
       where gw.fantasy_season_id = ${seasonId}::uuid
         and ((gw.status in ('provisional', 'final') and selection.status <> 'locked')
           or (gw.status = 'open' and selection.status <> 'draft'))) as invalid_selection_lifecycle,
      (select count(*)::int
       from fantasy_team_selections selection
       join fantasy_gameweeks gw on gw.id = selection.fantasy_gameweek_id
       where gw.fantasy_season_id = ${seasonId}::uuid
         and (${transferExceptionTeamId}::uuid is null
           or selection.fantasy_team_id <> ${transferExceptionTeamId}::uuid)
         and (selection.free_transfers_before <> case when gw.number = 1 then 2 else 4 end
           or (selection.status = 'locked' and selection.free_transfers_after <> 4)
           or (selection.status = 'draft' and selection.free_transfers_after is not null))) as invalid_transfer_balance,
      (select count(*)::int
       from fantasy_teams team
       where team.fantasy_season_id = ${seasonId}::uuid
         and (${transferExceptionTeamId}::uuid is null
           or team.id <> ${transferExceptionTeamId}::uuid)
         and team.free_transfers <> case when ${scoredThrough} > 0 then 4 else 2 end) as invalid_team_transfer_balance,
      (select count(*)::int
       from fantasy_team_gameweek_scores score
       join fantasy_team_selections selection on selection.id = score.selection_id
       join fantasy_gameweeks gw on gw.id = selection.fantasy_gameweek_id
       where gw.fantasy_season_id = ${seasonId}::uuid
         and score.status <> case when gw.score_complete
           then 'final'::fantasy_score_status else 'provisional'::fantasy_score_status end) as invalid_score_status,
      (select count(*)::int
       from fantasy_gameweeks gw
       join lateral (
         select coalesce(round(avg(score.total_points)), 0)::int as average_points,
                coalesce(max(score.total_points), 0)::int as highest_points
         from fantasy_team_gameweek_scores score
         join fantasy_team_selections selection on selection.id = score.selection_id
         where selection.fantasy_gameweek_id = gw.id
           and exists (
             select 1
             from fantasy_team_selection_players member
             where member.selection_id = selection.id
           )
       ) summary on true
       where gw.fantasy_season_id = ${seasonId}::uuid
         and gw.status in ('provisional', 'final')
         and (gw.average_points <> summary.average_points
           or gw.highest_points <> summary.highest_points)) as invalid_gameweek_summary,
      (select count(*)::int
       from (
         select stats.fixture_id,
                stats.source_payload ->> 'clubId' as club_id,
                sum(stats.goals)::int as goals,
                sum(stats.source_assists)::int as assists,
                case
                  when stats.source_payload ->> 'clubId' = home.club_id::text then fixture.home_score
                  when stats.source_payload ->> 'clubId' = away.club_id::text then fixture.away_score
                  else null
                end as fixture_goals
         from fantasy_player_match_stats stats
         join fixtures fixture on fixture.id = stats.fixture_id
         join competition_entries home on home.id = fixture.home_entry_id
         join competition_entries away on away.id = fixture.away_entry_id
         where fixture.competition_season_id = (
           select competition_season_id from fantasy_seasons where id = ${seasonId}::uuid
         ) and stats.source_name = 'qa-scenario'
         group by stats.fixture_id, stats.source_payload ->> 'clubId',
                  home.club_id, away.club_id, fixture.home_score, fixture.away_score
       ) generated
       where generated.goals > generated.fixture_goals
          or generated.assists > generated.goals) as impossible_player_totals
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
    counts.selection_players !== expectedSelectionPlayers ||
    counts.scores !== expectedScores ||
    counts.standings !== expectedStandings ||
    counts.live_fixtures !== expectedLive ||
    counts.invalid_fixture_timing !== 0 ||
    counts.invalid_fixture_scores !== 0 ||
    counts.deadline_mismatches !== 0 ||
    counts.invalid_selection_lifecycle !== 0 ||
    counts.invalid_transfer_balance !== 0 ||
    counts.invalid_team_transfer_balance !== 0 ||
    counts.invalid_score_status !== 0 ||
    counts.invalid_gameweek_summary !== 0 ||
    counts.impossible_player_totals !== 0 ||
    (definition.phase === "live" &&
      requireZeroLiveScore &&
      counts.target_zero_scores === 0) ||
    (definition.phase === "live" && counts.target_positive_scores === 0) ||
    (scoredThrough > 0 && counts.target_distinct_scores < 2)
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
  primaryTeamId: string,
  expectedPrimaryOwned: number,
) {
  const base = await verifyBaseCounts(tx, seasonId);
  const result = await tx.execute<{
    private_leagues: number;
    private_memberships: number;
    primary_memberships: number;
    primary_owned: number;
    invalid_owners: number;
    owner_membership_missing: number;
  }>(sql`
    select
      (select count(*)::int from fantasy_leagues
       where fantasy_season_id = ${seasonId}::uuid and type = 'private') as private_leagues,
      (select count(*)::int
       from fantasy_league_members member
       join fantasy_leagues league on league.id = member.fantasy_league_id
       where league.fantasy_season_id = ${seasonId}::uuid
         and league.type = 'private') as private_memberships,
      (select count(*)::int
       from fantasy_league_members member
       join fantasy_leagues league on league.id = member.fantasy_league_id
       where league.fantasy_season_id = ${seasonId}::uuid
         and league.type = 'private'
         and member.fantasy_team_id = ${primaryTeamId}::uuid) as primary_memberships,
      (select count(*)::int from fantasy_leagues
       where fantasy_season_id = ${seasonId}::uuid
         and type = 'private'
         and owner_team_id = ${primaryTeamId}::uuid) as primary_owned,
      (select count(*)::int
       from fantasy_leagues league
       join fantasy_teams team on team.id = league.owner_team_id
       join fantasy_managers manager on manager.id = team.manager_id
       left join auth_users user_row on user_row.id = manager.auth_user_id
       where league.fantasy_season_id = ${seasonId}::uuid
         and league.type = 'private'
         and (manager.status <> 'member' or manager.auth_user_id is null
              or user_row.id is null or user_row.is_anonymous is distinct from false)) as invalid_owners,
      (select count(*)::int
       from fantasy_leagues league
       where league.fantasy_season_id = ${seasonId}::uuid
         and league.type = 'private'
         and not exists (
           select 1 from fantasy_league_members member
           where member.fantasy_league_id = league.id
             and member.fantasy_team_id = league.owner_team_id
         )) as owner_membership_missing
  `);
  const counts = result.rows[0];
  if (
    counts.private_leagues !== expectedPrivateLeagues ||
    counts.private_memberships !== expectedPrivateMemberships ||
    counts.primary_memberships !== expectedPrivateLeagues ||
    counts.primary_owned !== expectedPrimaryOwned ||
    counts.invalid_owners !== 0 ||
    counts.owner_membership_missing !== 0
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
  const workflowCount =
    Number(Boolean(options.scenario)) +
    Number(options.advance) +
    Number(options.refresh);
  if (workflowCount > 1) {
    throw new Error(
      "Use exactly one of --advance, --refresh, or a named reset scenario.",
    );
  }
  if (workflowCount === 0) {
    listScenarios();
    throw new Error("Choose a scenario name, --advance, or --refresh.");
  }
  if (
    options.primaryChip !== undefined &&
    !options.advance &&
    !options.refresh
  ) {
    throw new Error("--primary-chip requires --advance or --refresh.");
  }
  const branchId = await assertBranch(options.branchId);
  const startedAt = Date.now();
  const result = await transactionDb.transaction(async (tx) => {
    const season = await loadSeason(tx, options.seasonSlug);
    const primaryTeam = await findPrimaryTeam(
      tx,
      season.id,
      options.primaryTeamName,
    );
    const definition = options.advance
      ? await inferAdvanceDefinition(tx, season.id)
      : options.refresh
        ? await inferRefreshDefinition(tx, season.id)
        : SCENARIOS[options.scenario!];
    const mode = options.advance
      ? "advance"
      : options.refresh
        ? "refresh"
        : "reset";
    const scenarioName =
      mode !== "reset" && definition.kind === "gameweek"
        ? `${mode}-gw${definition.targetGameweek}-${definition.phase}`
        : options.scenario!;
    const summary =
      definition.kind === "gameweek"
        ? await applyGameweekScenario(
            tx,
            season,
            definition,
            primaryTeam,
            scenarioName,
            mode,
            options.primaryChip,
          )
        : await applyLeagueScenario(
            tx,
            season,
            definition,
            primaryTeam,
            scenarioName as LeagueScenarioName,
          );
    return { scenarioName, seasonSlug: season.slug, ...summary };
  });
  const { scenarioName, ...summary } = result;
  console.log(
    JSON.stringify(
      {
        ok: true,
        scenario: scenarioName,
        branchId,
        durationMs: Date.now() - startedAt,
        ...summary,
      },
      null,
      2,
    ),
  );
}
