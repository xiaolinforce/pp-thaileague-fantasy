import assert from "node:assert/strict";
import test from "node:test";

import {
  getDisplayedPlayerPoints,
  getBreakdownLabel,
  summarizeGameweekScores,
} from "./points-presentation.ts";

test("localizes canonical and snake-case score breakdown keys", () => {
  assert.equal(getBreakdownLabel("cleanSheet", "th"), "คลีนชีต");
  assert.equal(getBreakdownLabel("clean_sheet", "th"), "คลีนชีต");
  assert.equal(getBreakdownLabel("penalty_saves", "en"), "Penalty saves");
  assert.equal(getBreakdownLabel("unexpected_source_key", "th"), "คะแนนอื่น");
  assert.equal(
    getBreakdownLabel("unexpected_source_key", "en"),
    "Other points",
  );
});

test("shows the scoring captain's already-multiplied contribution", () => {
  assert.equal(
    getDisplayedPlayerPoints({
      rawPoints: 6,
      counted: true,
      isScoringCaptain: true,
      captainMultiplier: 2,
    }),
    12,
  );
  assert.equal(
    getDisplayedPlayerPoints({
      rawPoints: 6,
      counted: true,
      isScoringCaptain: true,
      captainMultiplier: 3,
    }),
    18,
  );
  assert.equal(
    getDisplayedPlayerPoints({
      rawPoints: 6,
      counted: false,
      isScoringCaptain: true,
      captainMultiplier: 3,
    }),
    6,
  );
});

test("summarizes every non-empty team and includes the current team", () => {
  assert.deepEqual(summarizeGameweekScores([]), {
    averagePoints: 0,
    highestPoints: 0,
  });
  assert.deepEqual(
    summarizeGameweekScores([{ playerCount: 15, totalPoints: 80 }]),
    {
      averagePoints: 80,
      highestPoints: 80,
    },
  );
  assert.deepEqual(
    summarizeGameweekScores([
      { playerCount: 15, totalPoints: 80 },
      { playerCount: 15, totalPoints: 61 },
      { playerCount: 15, totalPoints: 99 },
    ]),
    {
      averagePoints: 80,
      highestPoints: 99,
    },
  );
});

test("excludes teams without players from the persisted summary", () => {
  assert.deepEqual(
    summarizeGameweekScores([
      { playerCount: 0, totalPoints: 0 },
      { playerCount: 15, totalPoints: 12 },
    ]),
    {
      averagePoints: 12,
      highestPoints: 12,
    },
  );
  assert.deepEqual(
    summarizeGameweekScores([{ playerCount: 0, totalPoints: 0 }]),
    { averagePoints: 0, highestPoints: 0 },
  );
});

test("preserves zero and negative scores", () => {
  assert.deepEqual(
    summarizeGameweekScores([{ playerCount: 15, totalPoints: 0 }]),
    { averagePoints: 0, highestPoints: 0 },
  );
  assert.deepEqual(
    summarizeGameweekScores([
      { playerCount: 15, totalPoints: -4 },
      { playerCount: 15, totalPoints: -2 },
    ]),
    { averagePoints: -3, highestPoints: -2 },
  );
});
