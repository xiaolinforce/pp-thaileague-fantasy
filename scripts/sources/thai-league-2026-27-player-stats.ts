import type { SeasonStatTotals } from "../../src/lib/fantasy/competition-stats.ts";
import { THAI_LEAGUE_SOURCE, TOURNAMENT_ID } from "./thai-league-2026-27.ts";

const OFFICIAL_API_BASE =
  "https://competition.tl.prod.c0d1um.io/thaileague/api/";

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  results: T[];
};

type OfficialPlayerSeasonStats = {
  id: number;
  person: number;
  club: number;
  full_name_en: string | null;
  total_line_up: number | null;
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
  [key: string]: unknown;
};

export type CurrentOfficialPlayerSeasonStats = SeasonStatTotals & {
  sourceName: string;
  sourceUrl: string;
  sourceExternalId: string;
  sourcePersonId: string;
  clubExternalId: string;
  fullNameEn: string;
  sourcePayload: Record<string, unknown>;
};

function nonnegativeInteger(value: number | null | undefined, field: string) {
  const parsed = Number(value ?? 0);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Thai League ${field} must be a non-negative integer.`);
  }
  return parsed;
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

export const currentPlayerStatsSourceUrl = `${OFFICIAL_API_BASE}player-public/all_players_search/?tournament=${TOURNAMENT_ID}`;

export async function fetchCurrentSeasonPlayerStats() {
  let nextUrl: string | null = `${currentPlayerStatsSourceUrl}&page=1`;
  let expectedCount: number | null = null;
  const rows: OfficialPlayerSeasonStats[] = [];
  while (nextUrl) {
    const page: PaginatedResponse<OfficialPlayerSeasonStats> =
      await fetchJson(nextUrl);
    expectedCount ??= page.count;
    if (page.count !== expectedCount) {
      throw new Error("Thai League player count changed during pagination.");
    }
    rows.push(...page.results);
    nextUrl = page.next;
  }
  if (rows.length !== (expectedCount ?? 0)) {
    throw new Error(
      `Thai League returned ${rows.length} of ${expectedCount ?? 0} player rows.`,
    );
  }

  const seen = new Set<string>();
  return rows.map<CurrentOfficialPlayerSeasonStats>((row) => {
    const sourceExternalId = String(row.id);
    if (
      !Number.isInteger(row.id) ||
      !Number.isInteger(row.person) ||
      !Number.isInteger(row.club) ||
      !row.full_name_en?.trim()
    ) {
      throw new Error(
        `Thai League player row ${sourceExternalId} is incomplete.`,
      );
    }
    if (seen.has(sourceExternalId)) {
      throw new Error(`Duplicate Thai League player row ${sourceExternalId}.`);
    }
    seen.add(sourceExternalId);
    return {
      sourceName: THAI_LEAGUE_SOURCE,
      sourceUrl: currentPlayerStatsSourceUrl,
      sourceExternalId,
      sourcePersonId: String(row.person),
      clubExternalId: String(row.club),
      fullNameEn: row.full_name_en.trim(),
      appearances: nonnegativeInteger(row.match_count, "match_count"),
      starts: nonnegativeInteger(row.total_line_up, "total_line_up"),
      minutes: nonnegativeInteger(row.total_time, "total_time"),
      goals: nonnegativeInteger(row.goal_for, "goal_for"),
      sourceAssists: nonnegativeInteger(row.total_assist, "total_assist"),
      cleanSheets: nonnegativeInteger(row.clean_sheet, "clean_sheet"),
      goalsConceded: nonnegativeInteger(row.goal_against, "goal_against"),
      penaltyGoals: nonnegativeInteger(row.penalty_goal, "penalty_goal"),
      penaltyMisses: nonnegativeInteger(
        row.penalty_goal_miss,
        "penalty_goal_miss",
      ),
      yellowCards: nonnegativeInteger(row.yellow_card_acc, "yellow_card_acc"),
      redCards:
        nonnegativeInteger(
          row.red_card_serious_foul_play_acc,
          "red_card_serious_foul_play_acc",
        ) +
        nonnegativeInteger(
          row.red_card_violent_conduct_acc,
          "red_card_violent_conduct_acc",
        ) +
        nonnegativeInteger(row.second_yellow_count, "second_yellow_count"),
      ownGoals: nonnegativeInteger(row.own_goal, "own_goal"),
      sourcePayload: row,
    };
  });
}
