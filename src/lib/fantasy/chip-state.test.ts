import assert from "node:assert/strict";
import test from "node:test";

import { getChipOptionState } from "./chip-state.ts";

test("disables every exhausted chip", () => {
  for (const chip of ["triple_captain", "bench_boost", "wildcard"] as const) {
    assert.deepEqual(
      getChipOptionState({ chip, gameweekNumber: 8, remaining: 0 }),
      { disabled: true, reason: "exhausted" },
    );
  }
});

test("keeps remaining chips available except the opening wildcard", () => {
  assert.equal(
    getChipOptionState({
      chip: "triple_captain",
      gameweekNumber: 1,
      remaining: 1,
    }).disabled,
    false,
  );
  assert.deepEqual(
    getChipOptionState({ chip: "wildcard", gameweekNumber: 1, remaining: 2 }),
    { disabled: true, reason: "not_started" },
  );
  assert.equal(
    getChipOptionState({ chip: "wildcard", gameweekNumber: 2, remaining: 2 })
      .disabled,
    false,
  );
});
