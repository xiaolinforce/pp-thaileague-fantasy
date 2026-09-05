import assert from "node:assert/strict";
import test from "node:test";

import { getInitialFixtureMatchweek } from "../fixture-matchweeks.ts";

test("uses the earliest Gameweek with an unfinished fixture", () => {
  assert.equal(
    getInitialFixtureMatchweek([
      { matchweek: 1, status: "finished" },
      { matchweek: 1, status: "scheduled" },
      { matchweek: 2, status: "scheduled" },
    ]),
    1,
  );
});

test("moves to the next Gameweek after every fixture is completed", () => {
  assert.equal(
    getInitialFixtureMatchweek([
      { matchweek: 1, status: "finished" },
      { matchweek: 1, status: "cancelled" },
      { matchweek: 2, status: "time_tbc" },
    ]),
    2,
  );
});

test("returns null when every fixture is completed", () => {
  assert.equal(
    getInitialFixtureMatchweek([
      { matchweek: 1, status: "finished" },
      { matchweek: 2, status: "cancelled" },
    ]),
    null,
  );
});
