import type { HistoricalPlayerStats } from "../../src/lib/fantasy/ranking.ts";

const OFFICIAL_API_BASE =
  "https://competition.tl.prod.c0d1um.io/thaileague/api/";

export const PREVIOUS_SEASON_ID = 32;
export const PREVIOUS_SEASON_YEAR = "2025/2026";
export const PREVIOUS_SEASON_TOURNAMENTS = [
  { id: 207, level: 1 as const, name: "Thai League 1 2025/26" },
  { id: 208, level: 2 as const, name: "Thai League 2 2025/26" },
] as const;

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type OfficialPlayerStats = {
  id: number;
  person: number;
  full_name_en: string | null;
  position_name_en: string | null;
  total_line_up: number | null;
  total_substitute_in: number | null;
  total_assist: number | null;
  total_time: number | null;
  match_count: number | null;
  clean_sheet: number | null;
  goal_for: number | null;
  penalty_goal: number | null;
  penalty_goal_miss: number | null;
  own_goal: number | null;
  yellow_card_acc: number | null;
  red_card_serious_foul_play_acc: number | null;
  red_card_violent_conduct_acc: number | null;
  second_yellow_count: number | null;
  goal_against: number | null;
};

type OfficialTournamentTeam = {
  id: number;
  club: number;
  name_en: string;
};

type OfficialFixture = {
  id: number;
  match_status: number;
  is_cancel: boolean;
  home_team: number;
  away_team: number;
  home_goal_count: number;
  away_goal_count: number;
};

export type PreviousSeasonClubContext = {
  clubExternalId: number;
  tournamentId: number;
  tournamentLevel: 1 | 2;
  matches: number;
  goalsFor: number;
  goalsAgainst: number;
  attackMultiplier: number;
  defenseMultiplier: number;
};

function nonnegative(value: number | null | undefined) {
  return Math.max(0, Number(value ?? 0));
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  return (await response.json()) as T;
}

async function fetchTournamentStats(
  tournament: (typeof PREVIOUS_SEASON_TOURNAMENTS)[number],
) {
  let nextUrl: string | null =
    `${OFFICIAL_API_BASE}player-public/all_players_search/?page=1&tournament=${tournament.id}`;
  const rows: OfficialPlayerStats[] = [];
  let expectedCount: number | null = null;

  while (nextUrl) {
    const page: PaginatedResponse<OfficialPlayerStats> =
      await fetchJson(nextUrl);
    expectedCount ??= page.count;
    if (page.count !== expectedCount) {
      throw new Error(
        `Thai League tournament ${tournament.id} changed count during pagination.`,
      );
    }
    rows.push(...page.results);
    nextUrl = page.next;
  }

  if (rows.length !== expectedCount || rows.length === 0) {
    throw new Error(
      `Thai League tournament ${tournament.id}: expected ${expectedCount ?? 0} player rows, received ${rows.length}.`,
    );
  }

  return rows.map<HistoricalPlayerStats>((row) => ({
    sourceName: "Thai League official API",
    sourceUrl: `${OFFICIAL_API_BASE}player-public/all_players_search/?tournament=${tournament.id}`,
    tournamentId: tournament.id,
    tournamentLevel: tournament.level,
    personId: row.person,
    fullNameEn: row.full_name_en?.trim() || `Thai League person ${row.person}`,
    minutes: nonnegative(row.total_time),
    matchCount: nonnegative(row.match_count),
    starts: nonnegative(row.total_line_up),
    substituteAppearances: nonnegative(row.total_substitute_in),
    goals: nonnegative(row.goal_for),
    assists: nonnegative(row.total_assist),
    cleanSheets: nonnegative(row.clean_sheet),
    goalsAgainst: nonnegative(row.goal_against),
    penaltyGoals: nonnegative(row.penalty_goal),
    penaltyMisses: nonnegative(row.penalty_goal_miss),
    ownGoals: nonnegative(row.own_goal),
    yellowCards: nonnegative(row.yellow_card_acc),
    redCards:
      nonnegative(row.red_card_serious_foul_play_acc) +
      nonnegative(row.red_card_violent_conduct_acc) +
      nonnegative(row.second_yellow_count),
  }));
}

async function fetchAllFixtures(tournamentId: number) {
  let nextUrl: string | null =
    `${OFFICIAL_API_BASE}match-day-match-public/?tournament=${tournamentId}&only_valid_match=true&page=1`;
  const rows: OfficialFixture[] = [];
  while (nextUrl) {
    const page: PaginatedResponse<OfficialFixture> = await fetchJson(nextUrl);
    rows.push(...page.results);
    nextUrl = page.next;
  }
  return rows.filter(
    (fixture) => fixture.match_status >= 2 && !fixture.is_cancel,
  );
}

async function fetchTournamentClubContexts(
  tournament: (typeof PREVIOUS_SEASON_TOURNAMENTS)[number],
) {
  const [teams, fixtures] = await Promise.all([
    fetchJson<OfficialTournamentTeam[]>(
      `${OFFICIAL_API_BASE}tournament-team-public/?tournament=${tournament.id}`,
    ),
    fetchAllFixtures(tournament.id),
  ]);
  const totals = new Map<
    number,
    { matches: number; goalsFor: number; goalsAgainst: number }
  >(
    teams.map((team) => [
      team.id,
      { matches: 0, goalsFor: 0, goalsAgainst: 0 },
    ]),
  );
  for (const fixture of fixtures) {
    const home = totals.get(fixture.home_team);
    const away = totals.get(fixture.away_team);
    if (!home || !away) continue;
    home.matches += 1;
    home.goalsFor += fixture.home_goal_count;
    home.goalsAgainst += fixture.away_goal_count;
    away.matches += 1;
    away.goalsFor += fixture.away_goal_count;
    away.goalsAgainst += fixture.home_goal_count;
  }
  const totalMatches = [...totals.values()].reduce(
    (sum, item) => sum + item.matches,
    0,
  );
  const totalGoals = [...totals.values()].reduce(
    (sum, item) => sum + item.goalsFor,
    0,
  );
  const leagueGoalsPerTeamMatch =
    totalMatches > 0 ? totalGoals / totalMatches : 1;
  const leagueLevelAdjustment = tournament.level === 1 ? 1 : 0.93;

  return teams.flatMap<PreviousSeasonClubContext>((team) => {
    const item = totals.get(team.id);
    if (!item || item.matches === 0) return [];
    const goalsForPerMatch = item.goalsFor / item.matches;
    const goalsAgainstPerMatch = item.goalsAgainst / item.matches;
    const attackRatio = goalsForPerMatch / leagueGoalsPerTeamMatch;
    const defenseRatio =
      goalsAgainstPerMatch > 0
        ? leagueGoalsPerTeamMatch / goalsAgainstPerMatch
        : 1.2;
    return [
      {
        clubExternalId: team.club,
        tournamentId: tournament.id,
        tournamentLevel: tournament.level,
        matches: item.matches,
        goalsFor: item.goalsFor,
        goalsAgainst: item.goalsAgainst,
        attackMultiplier: Math.min(
          1.18,
          Math.max(0.82, (1 + (attackRatio - 1) * 0.2) * leagueLevelAdjustment),
        ),
        defenseMultiplier: Math.min(
          1.18,
          Math.max(
            0.82,
            (1 + (defenseRatio - 1) * 0.2) * leagueLevelAdjustment,
          ),
        ),
      },
    ];
  });
}

export async function fetchPreviousSeasonPlayerStats() {
  const groups = await Promise.all(
    PREVIOUS_SEASON_TOURNAMENTS.map(fetchTournamentStats),
  );
  const rows = groups.flat();
  const uniqueSourceRows = new Set(
    rows.map((row) => `${row.tournamentId}:${row.personId}`),
  );
  if (uniqueSourceRows.size !== rows.length) {
    throw new Error(
      "Previous-season player statistics contain duplicate rows.",
    );
  }
  return rows;
}

export async function fetchPreviousSeasonClubContexts() {
  const groups = await Promise.all(
    PREVIOUS_SEASON_TOURNAMENTS.map(fetchTournamentClubContexts),
  );
  return groups.flat();
}

export const previousSeasonSourceUrls = PREVIOUS_SEASON_TOURNAMENTS.map(
  (tournament) =>
    `${OFFICIAL_API_BASE}player-public/all_players_search/?tournament=${tournament.id}`,
);
