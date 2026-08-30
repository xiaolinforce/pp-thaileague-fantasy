import assert from "node:assert/strict";
import test from "node:test";

import { parsePointsGameweek } from "./points-gameweek.ts";

test("accepts an absent or positive canonical Gameweek query", () => {
  assert.deepEqual(parsePointsGameweek(undefined), {
    canonical: true,
    supplied: false,
  });
  assert.deepEqual(parsePointsGameweek("12"), {
    canonical: true,
    requested: 12,
    supplied: true,
  });
});

test("rejects malformed and non-canonical Gameweek queries", () => {
  for (const value of ["abc", "-1", "0", "1.5", "05"] as const) {
    assert.deepEqual(parsePointsGameweek(value), {
      canonical: false,
      supplied: true,
    });
  }

  assert.deepEqual(parsePointsGameweek(["1", "2"]), {
    canonical: false,
    supplied: true,
  });
  assert.deepEqual(parsePointsGameweek("9007199254740992"), {
    canonical: false,
    supplied: true,
  });
});
