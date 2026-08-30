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

test("labels the highest comparison as another manager and handles no comparison", () => {
  assert.deepEqual(summarizeGameweekScores([], "mine"), {
    averagePoints: 0,
    highestOtherManagerPoints: null,
  });
  assert.deepEqual(
    summarizeGameweekScores([{ selectionId: "mine", totalPoints: 80 }], "mine"),
    {
      averagePoints: 80,
      highestOtherManagerPoints: null,
    },
  );
  assert.deepEqual(
    summarizeGameweekScores(
      [
        { selectionId: "mine", totalPoints: 80 },
        { selectionId: "other-1", totalPoints: 61 },
        { selectionId: "other-2", totalPoints: 99 },
      ],
      "mine",
    ),
    {
      averagePoints: 80,
      highestOtherManagerPoints: 99,
    },
  );
  assert.deepEqual(
    summarizeGameweekScores(
      [
        { selectionId: "mine", totalPoints: -4 },
        { selectionId: "other", totalPoints: -2 },
      ],
      "mine",
    ),
    {
      averagePoints: -3,
      highestOtherManagerPoints: -2,
    },
  );
});
