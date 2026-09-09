import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateOwnershipPercent,
  getAutoFillOwnershipScore,
  getSelectionOwnershipChange,
  MINIMUM_AUTO_FILL_OWNERSHIP_TEAMS,
} from "./ownership.ts";

test("calculates ownership percentages to one decimal place", () => {
  assert.equal(calculateOwnershipPercent(100, 200), 50);
  assert.equal(calculateOwnershipPercent(1, 3), 33.3);
  assert.equal(calculateOwnershipPercent(0, 0), 0);
});

test("tracks player and counted-team changes between complete squads", () => {
  assert.deepEqual(
    getSelectionOwnershipChange(["kept", "removed"], ["kept", "added"], 2),
    {
      addedPlayerIds: ["added"],
      removedPlayerIds: ["removed"],
      countedTeamDelta: 0,
    },
  );
  assert.deepEqual(getSelectionOwnershipChange([], ["one", "two"], 2), {
    addedPlayerIds: ["one", "two"],
    removedPlayerIds: [],
    countedTeamDelta: 1,
  });
  assert.deepEqual(getSelectionOwnershipChange(["one"], ["one", "two"], 2), {
    addedPlayerIds: ["one", "two"],
    removedPlayerIds: [],
    countedTeamDelta: 1,
  });
  assert.deepEqual(getSelectionOwnershipChange(["one", "two"], [], 2), {
    addedPlayerIds: [],
    removedPlayerIds: ["one", "two"],
    countedTeamDelta: -1,
  });
});

test("uses ownership in auto-fill only after the minimum sample size", () => {
  assert.equal(
    getAutoFillOwnershipScore({
      selectedPercent: 80,
      countedTeamCount: MINIMUM_AUTO_FILL_OWNERSHIP_TEAMS - 1,
    }),
    0,
  );
  assert.equal(
    getAutoFillOwnershipScore({
      selectedPercent: 80,
      countedTeamCount: MINIMUM_AUTO_FILL_OWNERSHIP_TEAMS,
    }),
    80,
  );
});
