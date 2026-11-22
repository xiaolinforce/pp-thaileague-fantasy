import type {
  CompetitionPosition,
  LocalizedText,
} from "@/lib/competition-types";

export type MatchSide = "home" | "away";

export type MatchDetailPlayer = {
  fantasyPlayerId: string;
  name: LocalizedText;
  side: MatchSide;
  position: CompetitionPosition | null;
  minutes: number;
  goals: number;
  assists: number;
  ownGoals: number;
  yellowCards: number;
  redCards: number;
  penaltyMisses: number;
  penaltySaves: number;
  points: number | null;
};

export type FixtureMatchDetails = {
  fixtureId: string;
  homeScore: number;
  awayScore: number;
  homePenaltyScore: number | null;
  awayPenaltyScore: number | null;
  attendance: number | null;
  players: MatchDetailPlayer[];
};

export type MatchEventEntry = {
  fantasyPlayerId: string;
  name: LocalizedText;
  count: number;
};

export type MatchGoalEntry = MatchEventEntry & {
  ownGoal: boolean;
  /** Assisters proven to belong to this scorer's goals. */
  assists: MatchEventEntry[];
};

export type MatchCardEntry = {
  fantasyPlayerId: string;
  name: LocalizedText;
  yellowCards: number;
  redCards: number;
};

export type MatchSummary = {
  hasPlayerStats: boolean;
  goals: Record<MatchSide, MatchGoalEntry[]>;
  goalsComplete: boolean;
  /** Assists that the recorded totals cannot attach to one scorer. */
  unattributedAssists: Record<MatchSide, MatchEventEntry[]>;
  cards: Record<MatchSide, MatchCardEntry[]>;
  topPerformers: MatchDetailPlayer[];
};

export const MATCH_TOP_PERFORMER_LIMIT = 5;

const opponent = (side: MatchSide): MatchSide =>
  side === "home" ? "away" : "home";

const byName = (a: { name: LocalizedText }, b: { name: LocalizedText }) =>
  a.name.en.localeCompare(b.name.en);

const byCountThenName = (a: MatchEventEntry, b: MatchEventEntry) =>
  b.count - a.count || byName(a, b);

/**
 * Stats store per-player totals, not goal-by-goal events, so an assist is
 * attached to a scorer only when the totals allow exactly one outcome: a
 * player cannot assist their own goal and each goal has at most one assist.
 * Returns assister counts per scorer, or null when the outcome is ambiguous.
 */
export function attributeAssists(
  scorers: readonly { fantasyPlayerId: string; count: number }[],
  assisters: readonly { fantasyPlayerId: string; count: number }[],
): Map<string, Map<string, number>> | null {
  const assists = assisters.flatMap((entry) =>
    Array.from({ length: entry.count }, () => entry.fantasyPlayerId),
  );
  const capacity = scorers.map((scorer) => scorer.count);
  const assigned = scorers.map(() => [] as string[]);
  const outcomes = new Set<string>();
  let firstOutcome: string[][] | null = null;

  const visit = (index: number) => {
    if (outcomes.size > 1) return;
    if (index === assists.length) {
      const key = JSON.stringify(assigned.map((list) => [...list].sort()));
      if (!outcomes.has(key)) {
        outcomes.add(key);
        firstOutcome ??= assigned.map((list) => [...list]);
      }
      return;
    }
    scorers.forEach((scorer, scorerIndex) => {
      if (
        capacity[scorerIndex] === 0 ||
        scorer.fantasyPlayerId === assists[index]
      ) {
        return;
      }
      capacity[scorerIndex] -= 1;
      assigned[scorerIndex].push(assists[index]);
      visit(index + 1);
      assigned[scorerIndex].pop();
      capacity[scorerIndex] += 1;
    });
  };
  visit(0);

  const outcome = firstOutcome as string[][] | null;
  if (outcomes.size !== 1 || !outcome) return null;
  return new Map(
    scorers.map((scorer, scorerIndex) => {
      const counts = new Map<string, number>();
      for (const id of outcome[scorerIndex]) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      return [scorer.fantasyPlayerId, counts];
    }),
  );
}

/**
 * Groups a finished match's recorded player events by the side they count
 * for. Own goals are credited to the opposing side's goal list, matching the
 * scoreline. Source data carries no event minutes, so lists are ordered by
 * contribution rather than presented as a timeline.
 */
export function summarizeMatchDetails(
  details: FixtureMatchDetails,
): MatchSummary {
  const goals: MatchSummary["goals"] = { home: [], away: [] };
  const assists: Record<MatchSide, MatchEventEntry[]> = { home: [], away: [] };
  const unattributedAssists: MatchSummary["unattributedAssists"] = {
    home: [],
    away: [],
  };
  const cards: MatchSummary["cards"] = { home: [], away: [] };

  for (const player of details.players) {
    const base = { fantasyPlayerId: player.fantasyPlayerId, name: player.name };
    if (player.goals > 0) {
      goals[player.side].push({
        ...base,
        count: player.goals,
        ownGoal: false,
        assists: [],
      });
    }
    if (player.ownGoals > 0) {
      goals[opponent(player.side)].push({
        ...base,
        count: player.ownGoals,
        ownGoal: true,
        assists: [],
      });
    }
    if (player.assists > 0) {
      assists[player.side].push({ ...base, count: player.assists });
    }
    if (player.yellowCards > 0 || player.redCards > 0) {
      cards[player.side].push({
        ...base,
        yellowCards: player.yellowCards,
        redCards: player.redCards,
      });
    }
  }

  for (const side of ["home", "away"] as const) {
    goals[side].sort(
      (a, b) => Number(a.ownGoal) - Number(b.ownGoal) || byCountThenName(a, b),
    );
    assists[side].sort(byCountThenName);
    const scorers = goals[side].filter((entry) => !entry.ownGoal);
    const attribution = attributeAssists(scorers, assists[side]);
    if (!attribution) {
      unattributedAssists[side] = assists[side];
    } else {
      const assisterById = new Map(
        assists[side].map((entry) => [entry.fantasyPlayerId, entry]),
      );
      for (const scorer of scorers) {
        scorer.assists = [
          ...(attribution.get(scorer.fantasyPlayerId) ?? new Map()),
        ]
          .map(([id, count]) => ({ ...assisterById.get(id)!, count }))
          .sort(byCountThenName);
      }
    }
    cards[side].sort(
      (a, b) =>
        b.redCards - a.redCards ||
        b.yellowCards - a.yellowCards ||
        byName(a, b),
    );
  }

  const recordedGoals = (side: MatchSide) =>
    goals[side].reduce((total, entry) => total + entry.count, 0);

  const topPerformers = details.players
    .filter((player) => player.points !== null && player.minutes > 0)
    .sort(
      (a, b) =>
        (b.points ?? 0) - (a.points ?? 0) ||
        b.goals - a.goals ||
        b.assists - a.assists ||
        byName(a, b),
    )
    .slice(0, MATCH_TOP_PERFORMER_LIMIT);

  return {
    hasPlayerStats: details.players.length > 0,
    goals,
    goalsComplete:
      recordedGoals("home") === details.homeScore &&
      recordedGoals("away") === details.awayScore,
    unattributedAssists,
    cards,
    topPerformers,
  };
}
