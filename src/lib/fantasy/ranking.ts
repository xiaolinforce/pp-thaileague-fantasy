import type { FantasyPosition } from "./rules.ts";

export const FANTASY_RANKING_MODEL_VERSION = "preseason-projection-v1";

export type RankingConfidence = "low" | "medium" | "high";

export type HistoricalPlayerStats = {
  sourceName: string;
  sourceUrl: string;
  tournamentId: number;
  tournamentLevel: 1 | 2;
  personId: number;
  fullNameEn: string;
  minutes: number;
  matchCount: number;
  starts: number;
  substituteAppearances: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  goalsAgainst: number;
  penaltyGoals: number;
  penaltyMisses: number;
  ownGoals: number;
  yellowCards: number;
  redCards: number;
};

export type RankingCandidate = {
  fantasyPlayerId: string;
  playerId: string;
  fullNameEn: string;
  position: FantasyPosition;
  clubId: string;
  marketValueEur: number | null;
  historicalStats: HistoricalPlayerStats[];
  matchMethod: "exact_name" | "fuzzy_name" | "manual" | "none";
  matchScore: number | null;
  manualAdjustment?: number;
  attackMultiplier?: number;
  defenseMultiplier?: number;
};

export type RankingConfiguration = {
  levelOneCount: number;
  levelTwoCount: number;
};

export type PlayerRanking = {
  fantasyPlayerId: string;
  playerId: string;
  fullNameEn: string;
  position: FantasyPosition;
  clubId: string;
  overallRank: number;
  positionRank: number;
  tierLevel: 1 | 2 | 3;
  modelProjectedPoints: number;
  manualAdjustment: number;
  projectedPoints: number;
  projectedMinutes: number;
  previousSeasonPoints: number;
  previousSeasonMinutes: number;
  marketValueEur: number | null;
  confidence: RankingConfidence;
  matchMethod: RankingCandidate["matchMethod"];
  matchScore: number | null;
  sourcePlayerIds: Array<{
    sourceName: string;
    tournamentId: number;
    personId: number;
  }>;
  sourceFacts: Record<string, unknown>;
  modelComponents: Record<string, number>;
  reason: string;
};

const POSITION_PRIOR_POINTS_PER_90: Record<FantasyPosition, number> = {
  goalkeeper: 3.2,
  defender: 3.35,
  midfielder: 3.55,
  forward: 3.5,
};

const GOAL_POINTS: Record<FantasyPosition, number> = {
  goalkeeper: 10,
  defender: 6,
  midfielder: 5,
  forward: 4,
};

const CLEAN_SHEET_POINTS: Record<FantasyPosition, number> = {
  goalkeeper: 4,
  defender: 4,
  midfielder: 1,
  forward: 0,
};

const LEAGUE_STRENGTH: Record<1 | 2, number> = { 1: 1, 2: 0.78 };
const MAX_SEASON_MINUTES = 30 * 90;
const RATE_PRIOR_MINUTES = 900;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function normalizeRankingName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function bigrams(value: string) {
  const compact = value.replace(/\s+/g, "");
  const result = new Set<string>();
  for (let index = 0; index < compact.length - 1; index += 1) {
    result.add(compact.slice(index, index + 2));
  }
  return result;
}

export function scoreRankingNameMatch(left: string, right: string) {
  const normalizedLeft = normalizeRankingName(left);
  const normalizedRight = normalizeRankingName(right);
  if (!normalizedLeft || !normalizedRight) return 0;
  if (normalizedLeft === normalizedRight) return 1;

  const leftTokens = new Set(normalizedLeft.split(" "));
  const rightTokens = new Set(normalizedRight.split(" "));
  const intersection = [...leftTokens].filter((token) =>
    rightTokens.has(token),
  ).length;
  const shorterSize = Math.min(leftTokens.size, rightTokens.size);
  const unionSize = new Set([...leftTokens, ...rightTokens]).size;
  const containment = shorterSize > 0 ? intersection / shorterSize : 0;
  const jaccard = unionSize > 0 ? intersection / unionSize : 0;
  if (shorterSize >= 2 && containment === 1) {
    return round(clamp(0.94 - (unionSize - shorterSize) * 0.01, 0, 0.94), 4);
  }

  const leftBigrams = bigrams(normalizedLeft);
  const rightBigrams = bigrams(normalizedRight);
  const sharedBigrams = [...leftBigrams].filter((item) =>
    rightBigrams.has(item),
  ).length;
  const dice =
    leftBigrams.size + rightBigrams.size > 0
      ? (2 * sharedBigrams) / (leftBigrams.size + rightBigrams.size)
      : 0;

  return round(clamp(jaccard * 0.65 + dice * 0.35, 0, 0.93), 4);
}

function estimateAppearancePoints(stats: HistoricalPlayerStats) {
  const sixtyMinuteAppearances = Math.min(
    stats.matchCount,
    Math.round(stats.minutes / 90),
  );
  return stats.matchCount + sixtyMinuteAppearances;
}

export function estimateHistoricalFantasyPoints(
  position: FantasyPosition,
  stats: HistoricalPlayerStats,
) {
  const appearancePoints = estimateAppearancePoints(stats);
  const goalPoints = stats.goals * GOAL_POINTS[position];
  const assistPoints = stats.assists * 3;
  const cleanSheetPoints = stats.cleanSheets * CLEAN_SHEET_POINTS[position];
  const goalsConcededPoints =
    position === "goalkeeper" || position === "defender"
      ? Math.floor(stats.goalsAgainst / 2) * -1
      : 0;
  const disciplinePoints =
    stats.penaltyMisses * -2 +
    stats.ownGoals * -2 +
    stats.yellowCards * -1 +
    stats.redCards * -3;
  return Math.max(
    0,
    appearancePoints +
      goalPoints +
      assistPoints +
      cleanSheetPoints +
      goalsConcededPoints +
      disciplinePoints,
  );
}

function getMarketSignal(marketValueEur: number | null) {
  if (!marketValueEur || marketValueEur <= 0) return 0;
  const logarithm = Math.log10(marketValueEur);
  return clamp((logarithm - 4.7) / 1.6, 0, 1);
}

function getMarketMinutes(marketValueEur: number | null) {
  return 450 + getMarketSignal(marketValueEur) * 1_650;
}

function getConfidence(
  candidate: RankingCandidate,
  previousSeasonMinutes: number,
): RankingConfidence {
  if (
    (candidate.matchMethod === "exact_name" ||
      candidate.matchMethod === "manual") &&
    previousSeasonMinutes >= 1_500
  ) {
    return "high";
  }
  if (
    previousSeasonMinutes >= 450 ||
    (candidate.marketValueEur ?? 0) >= 500_000
  ) {
    return "medium";
  }
  return "low";
}

function projectCandidate(candidate: RankingCandidate) {
  const rawHistoricalPoints = candidate.historicalStats.reduce(
    (total, stats) =>
      total + estimateHistoricalFantasyPoints(candidate.position, stats),
    0,
  );
  const adjustedHistoricalPoints = candidate.historicalStats.reduce(
    (total, stats) =>
      total +
      estimateHistoricalFantasyPoints(candidate.position, stats) *
        LEAGUE_STRENGTH[stats.tournamentLevel],
    0,
  );
  const previousSeasonMinutes = Math.min(
    MAX_SEASON_MINUTES,
    candidate.historicalStats.reduce(
      (total, stats) => total + stats.minutes,
      0,
    ),
  );
  const marketMinutes = getMarketMinutes(candidate.marketValueEur);
  const projectedMinutes = Math.round(
    clamp(
      previousSeasonMinutes > 0
        ? candidate.marketValueEur === null
          ? previousSeasonMinutes
          : previousSeasonMinutes * 0.85 + marketMinutes * 0.15
        : marketMinutes,
      0,
      MAX_SEASON_MINUTES,
    ),
  );
  const priorRate = POSITION_PRIOR_POINTS_PER_90[candidate.position];
  const adjustedRate =
    previousSeasonMinutes > 0
      ? (adjustedHistoricalPoints + priorRate * (RATE_PRIOR_MINUTES / 90)) /
        ((previousSeasonMinutes + RATE_PRIOR_MINUTES) / 90)
      : priorRate;
  const marketSignal = getMarketSignal(candidate.marketValueEur);
  const marketQualityMultiplier =
    candidate.marketValueEur === null ? 1 : 0.91 + marketSignal * 0.18;
  const clubMultiplier = clamp(
    candidate.position === "goalkeeper" || candidate.position === "defender"
      ? (candidate.defenseMultiplier ?? 1)
      : (candidate.attackMultiplier ?? 1),
    0.82,
    1.18,
  );
  const dataAvailabilityMultiplier = previousSeasonMinutes > 0 ? 1 : 0.82;
  const modelProjectedPoints = Math.max(
    0,
    adjustedRate *
      (projectedMinutes / 90) *
      marketQualityMultiplier *
      clubMultiplier *
      dataAvailabilityMultiplier,
  );
  const manualAdjustment = candidate.manualAdjustment ?? 0;
  const projectedPoints = Math.max(0, modelProjectedPoints + manualAdjustment);
  const confidence = getConfidence(candidate, previousSeasonMinutes);

  return {
    ...candidate,
    modelProjectedPoints: round(modelProjectedPoints),
    manualAdjustment: round(manualAdjustment),
    projectedPoints: round(projectedPoints),
    projectedMinutes,
    previousSeasonPoints: round(rawHistoricalPoints),
    previousSeasonMinutes,
    confidence,
    sourcePlayerIds: candidate.historicalStats.map((stats) => ({
      sourceName: stats.sourceName,
      tournamentId: stats.tournamentId,
      personId: stats.personId,
    })),
    sourceFacts: {
      historicalStats: candidate.historicalStats,
      marketValueEur: candidate.marketValueEur,
    },
    modelComponents: {
      adjustedHistoricalPoints: round(adjustedHistoricalPoints),
      adjustedPointsPer90: round(adjustedRate, 4),
      marketSignal: round(marketSignal, 4),
      marketQualityMultiplier: round(marketQualityMultiplier, 4),
      clubMultiplier: round(clubMultiplier, 4),
      dataAvailabilityMultiplier,
    },
    reason:
      candidate.historicalStats.length > 0
        ? `ประเมินจาก ${previousSeasonMinutes} นาทีในฤดูกาล 2025/26, คะแนนคาดการณ์ ${round(projectedPoints)} และความเชื่อมั่น ${confidence}`
        : `ไม่มีสถิติทางการฤดูกาล 2025/26 ที่จับคู่ได้; ใช้ค่าตำแหน่ง มูลค่าตลาด และบริบทสโมสรด้วยความเชื่อมั่น ${confidence}`,
  };
}

function confidenceOrder(confidence: RankingConfidence) {
  if (confidence === "high") return 3;
  if (confidence === "medium") return 2;
  return 1;
}

export function rankFantasyPlayers(
  candidates: RankingCandidate[],
  configuration: RankingConfiguration,
): PlayerRanking[] {
  if (
    configuration.levelOneCount < 0 ||
    configuration.levelTwoCount < 0 ||
    configuration.levelOneCount + configuration.levelTwoCount >
      candidates.length
  ) {
    throw new Error("Ranking tier counts do not fit the candidate pool.");
  }
  const seenPlayers = new Set<string>();
  for (const candidate of candidates) {
    if (seenPlayers.has(candidate.fantasyPlayerId)) {
      throw new Error(
        `Duplicate ranking candidate ${candidate.fantasyPlayerId}.`,
      );
    }
    seenPlayers.add(candidate.fantasyPlayerId);
  }

  const sorted = candidates
    .map(projectCandidate)
    .sort(
      (left, right) =>
        right.projectedPoints - left.projectedPoints ||
        right.projectedMinutes - left.projectedMinutes ||
        confidenceOrder(right.confidence) - confidenceOrder(left.confidence) ||
        left.playerId.localeCompare(right.playerId),
    );
  const positionCounts = new Map<FantasyPosition, number>();

  return sorted.map<PlayerRanking>((player, index) => {
    const overallRank = index + 1;
    const positionRank = (positionCounts.get(player.position) ?? 0) + 1;
    positionCounts.set(player.position, positionRank);
    const tierLevel =
      overallRank <= configuration.levelOneCount
        ? 1
        : overallRank <=
            configuration.levelOneCount + configuration.levelTwoCount
          ? 2
          : 3;
    return {
      fantasyPlayerId: player.fantasyPlayerId,
      playerId: player.playerId,
      fullNameEn: player.fullNameEn,
      position: player.position,
      clubId: player.clubId,
      overallRank,
      positionRank,
      tierLevel,
      modelProjectedPoints: player.modelProjectedPoints,
      manualAdjustment: player.manualAdjustment,
      projectedPoints: player.projectedPoints,
      projectedMinutes: player.projectedMinutes,
      previousSeasonPoints: player.previousSeasonPoints,
      previousSeasonMinutes: player.previousSeasonMinutes,
      marketValueEur: player.marketValueEur,
      confidence: player.confidence,
      matchMethod: player.matchMethod,
      matchScore: player.matchScore,
      sourcePlayerIds: player.sourcePlayerIds,
      sourceFacts: player.sourceFacts,
      modelComponents: player.modelComponents,
      reason: player.reason,
    };
  });
}
