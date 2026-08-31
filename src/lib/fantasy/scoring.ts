import {
  isValidStartingFormation,
  type FantasyChip,
  type FantasyPosition,
} from "./rules.ts";

export type PlayerMatchStats = {
  minutes: number;
  goals: number;
  sourceAssists: number;
  fantasyAssists?: number | null;
  goalsConcededWhilePlaying: number;
  saves: number;
  penaltySaves: number;
  penaltyMisses: number;
  yellowCards: number;
  redCards: number;
  ownGoals: number;
};

export type PointsBreakdown = {
  appearance: number;
  goals: number;
  assists: number;
  cleanSheet: number;
  saves: number;
  penaltySaves: number;
  penaltyMisses: number;
  goalsConceded: number;
  yellowCards: number;
  redCards: number;
  ownGoals: number;
};

export type PlayerPoints = {
  total: number;
  breakdown: PointsBreakdown;
};

export const GOAL_POINTS: Record<FantasyPosition, number> = {
  goalkeeper: 10,
  defender: 6,
  midfielder: 5,
  forward: 4,
};

export const CLEAN_SHEET_POINTS: Record<FantasyPosition, number> = {
  goalkeeper: 4,
  defender: 4,
  midfielder: 1,
  forward: 0,
};

export function calculatePlayerPoints(
  position: FantasyPosition,
  stats: PlayerMatchStats,
): PlayerPoints {
  const minutes = Math.max(0, stats.minutes);
  const assists = stats.fantasyAssists ?? stats.sourceAssists;
  const breakdown: PointsBreakdown = {
    appearance: minutes === 0 ? 0 : minutes < 60 ? 1 : 2,
    goals: Math.max(0, stats.goals) * GOAL_POINTS[position],
    assists: Math.max(0, assists) * 3,
    cleanSheet:
      minutes >= 60 && stats.goalsConcededWhilePlaying === 0
        ? CLEAN_SHEET_POINTS[position]
        : 0,
    saves:
      position === "goalkeeper" ? Math.floor(Math.max(0, stats.saves) / 3) : 0,
    penaltySaves: Math.max(0, stats.penaltySaves) * 5,
    penaltyMisses: Math.max(0, stats.penaltyMisses) * -2,
    goalsConceded:
      (position === "goalkeeper" || position === "defender") &&
      stats.goalsConcededWhilePlaying > 0
        ? Math.floor(Math.max(0, stats.goalsConcededWhilePlaying) / 2) * -1
        : 0,
    yellowCards: Math.max(0, stats.yellowCards) * -1,
    redCards: Math.max(0, stats.redCards) * -3,
    ownGoals: Math.max(0, stats.ownGoals) * -2,
  };

  return {
    breakdown,
    total: Object.values(breakdown).reduce((sum, points) => sum + points, 0),
  };
}

export type SelectionPlayer = {
  playerId: string;
  position: FantasyPosition;
  lineupRole: "starter" | "bench";
  benchOrder: number | null;
  captainRole: "none" | "captain" | "vice_captain";
};

export type GameweekPlayerResult = {
  playerId: string;
  minutes: number;
  points: number;
};

export type TeamScore = {
  lineupPoints: number;
  benchPoints: number;
  captainBonus: number;
  transferPoints: number;
  totalPoints: number;
  countedPlayerIds: string[];
  autoSubstitutions: Array<{ out: string; in: string }>;
};

function resultFor(
  results: Map<string, GameweekPlayerResult>,
  playerId: string,
) {
  return results.get(playerId) ?? { playerId, minutes: 0, points: 0 };
}

export function resolveTeamScore({
  selection,
  playerResults,
  activeChip,
  transferPoints,
}: {
  selection: SelectionPlayer[];
  playerResults: GameweekPlayerResult[];
  activeChip: FantasyChip | null;
  transferPoints: number;
}): TeamScore {
  const results = new Map(
    playerResults.map((result) => [result.playerId, result]),
  );
  const starters = selection.filter(
    (player) => player.lineupRole === "starter",
  );
  const bench = selection
    .filter((player) => player.lineupRole === "bench")
    .sort((a, b) => (a.benchOrder ?? 99) - (b.benchOrder ?? 99));
  const autoSubstitutions: Array<{ out: string; in: string }> = [];
  let counted = [...starters];

  if (activeChip !== "bench_boost") {
    const missingStarters = starters.filter(
      (player) => resultFor(results, player.playerId).minutes === 0,
    );
    const usedBench = new Set<string>();

    for (const missing of missingStarters) {
      const candidates = bench.filter((candidate) => {
        if (usedBench.has(candidate.playerId)) return false;
        if (resultFor(results, candidate.playerId).minutes === 0) return false;
        if (missing.position === "goalkeeper")
          return candidate.position === "goalkeeper";
        return candidate.position !== "goalkeeper";
      });

      for (const candidate of candidates) {
        const proposed = counted.map((player) =>
          player.playerId === missing.playerId ? candidate : player,
        );
        if (!isValidStartingFormation(proposed)) continue;
        counted = proposed;
        usedBench.add(candidate.playerId);
        autoSubstitutions.push({
          out: missing.playerId,
          in: candidate.playerId,
        });
        break;
      }
    }
  }

  const lineupPoints = counted.reduce(
    (sum, player) => sum + resultFor(results, player.playerId).points,
    0,
  );
  const benchPoints = bench.reduce(
    (sum, player) => sum + resultFor(results, player.playerId).points,
    0,
  );
  const captain = selection.find((player) => player.captainRole === "captain");
  const viceCaptain = selection.find(
    (player) => player.captainRole === "vice_captain",
  );
  const scoringCaptain =
    captain && resultFor(results, captain.playerId).minutes > 0
      ? captain
      : viceCaptain && resultFor(results, viceCaptain.playerId).minutes > 0
        ? viceCaptain
        : null;
  const multiplier = activeChip === "triple_captain" ? 3 : 2;
  const captainBonus = scoringCaptain
    ? resultFor(results, scoringCaptain.playerId).points * (multiplier - 1)
    : 0;
  const countedPlayerIds =
    activeChip === "bench_boost"
      ? selection.map((player) => player.playerId)
      : counted.map((player) => player.playerId);
  const totalPoints =
    lineupPoints +
    captainBonus +
    (activeChip === "bench_boost" ? benchPoints : 0) -
    Math.max(0, transferPoints);

  return {
    lineupPoints,
    benchPoints,
    captainBonus,
    transferPoints: Math.max(0, transferPoints),
    totalPoints,
    countedPlayerIds,
    autoSubstitutions,
  };
}
