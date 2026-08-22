import assert from "node:assert/strict";
import test from "node:test";

import {
  estimateHistoricalFantasyPoints,
  normalizeRankingName,
  rankFantasyPlayers,
  scoreRankingNameMatch,
  type HistoricalPlayerStats,
  type RankingCandidate,
} from "./ranking.ts";

function historical(overrides: Partial<HistoricalPlayerStats> = {}) {
  return {
    sourceName: "Thai League official API",
    sourceUrl: "https://example.com/player",
    tournamentId: 207,
    tournamentLevel: 1 as const,
    personId: 1,
    fullNameEn: "Player One",
    minutes: 1_800,
    matchCount: 24,
    starts: 20,
    substituteAppearances: 4,
    goals: 5,
    assists: 3,
    cleanSheets: 4,
    goalsAgainst: 20,
    penaltyGoals: 0,
    penaltyMisses: 0,
    ownGoals: 0,
    yellowCards: 2,
    redCards: 0,
    ...overrides,
  } satisfies HistoricalPlayerStats;
}

function candidate(
  fantasyPlayerId: string,
  historicalStats: HistoricalPlayerStats[],
  marketValueEur: number | null = null,
): RankingCandidate {
  return {
    fantasyPlayerId,
    playerId: `player-${fantasyPlayerId}`,
    fullNameEn: `Player ${fantasyPlayerId}`,
    position: "forward",
    clubId: "club-1",
    marketValueEur,
    historicalStats,
    matchMethod: historicalStats.length > 0 ? "exact_name" : "none",
    matchScore: historicalStats.length > 0 ? 1 : null,
  };
}

test("normalizes accents and punctuation for source matching", () => {
  assert.equal(normalizeRankingName("  João-Paulo  "), "joao paulo");
  assert.equal(
    scoreRankingNameMatch(
      "Guilherme Bissoli Campos",
      "Guilherme Bissoli Campos",
    ),
    1,
  );
  assert.ok(
    scoreRankingNameMatch("Guilherme Bissoli", "Guilherme Bissoli Campos") >=
      0.9,
  );
});

test("estimates historical points with the implemented position weights", () => {
  const points = estimateHistoricalFantasyPoints(
    "midfielder",
    historical({
      minutes: 900,
      matchCount: 10,
      goals: 2,
      assists: 1,
      cleanSheets: 3,
      yellowCards: 1,
      goalsAgainst: 20,
    }),
  );
  assert.equal(points, 35);
});

test("creates contiguous deterministic ranks and exact tier counts", () => {
  const rankings = rankFantasyPlayers(
    [
      candidate("a", [historical({ goals: 12 })]),
      candidate("b", [historical({ goals: 8 })]),
      candidate("c", [historical({ goals: 4 })]),
      candidate("d", [], 1_000_000),
      candidate("e", []),
    ],
    { levelOneCount: 1, levelTwoCount: 2 },
  );
  assert.deepEqual(
    rankings.map((ranking) => ranking.overallRank),
    [1, 2, 3, 4, 5],
  );
  assert.equal(rankings.filter((ranking) => ranking.tierLevel === 1).length, 1);
  assert.equal(rankings.filter((ranking) => ranking.tierLevel === 2).length, 2);
  assert.equal(rankings.filter((ranking) => ranking.tierLevel === 3).length, 2);
  assert.equal(rankings[0].fantasyPlayerId, "a");
});

test("rejects duplicate players and invalid tier boundaries", () => {
  const duplicate = candidate("a", []);
  assert.throws(
    () =>
      rankFantasyPlayers([duplicate, duplicate], {
        levelOneCount: 1,
        levelTwoCount: 0,
      }),
    /Duplicate ranking candidate/,
  );
  assert.throws(
    () =>
      rankFantasyPlayers([duplicate], {
        levelOneCount: 1,
        levelTwoCount: 1,
      }),
    /do not fit/,
  );
});
