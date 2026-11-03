import assert from "node:assert/strict";
import test from "node:test";

import { getInitialFixtureMatchweek } from "../fixture-matchweeks.ts";

const now = Date.parse("2026-11-03T10:00:00Z");

test("opens the Gameweek of the next kickoff ahead of a rescheduled fixture", () => {
  assert.equal(
    getInitialFixtureMatchweek(
      [
        {
          matchweek: 7,
          status: "scheduled",
          kickoffAt: "2026-11-20T10:00:00Z",
        },
        { matchweek: 7, status: "postponed", kickoffAt: null },
        {
          matchweek: 8,
          status: "scheduled",
          kickoffAt: "2026-11-07T10:00:00Z",
        },
      ],
      now,
    ),
    8,
  );
});

test("opens the Gameweek of a live fixture ahead of future kickoffs", () => {
  assert.equal(
    getInitialFixtureMatchweek(
      [
        {
          matchweek: 10,
          status: "scheduled",
          kickoffAt: "2026-11-07T10:00:00Z",
        },
        { matchweek: 7, status: "live", kickoffAt: "2026-11-03T09:00:00Z" },
      ],
      now,
    ),
    7,
  );
});

test("falls back to the latest Gameweek with a finished fixture", () => {
  assert.equal(
    getInitialFixtureMatchweek(
      [
        {
          matchweek: 7,
          status: "scheduled",
          kickoffAt: "2026-11-01T10:00:00Z",
        },
        { matchweek: 9, status: "finished", kickoffAt: "2026-11-02T10:00:00Z" },
        { matchweek: 8, status: "finished", kickoffAt: "2026-11-01T10:00:00Z" },
        {
          matchweek: 10,
          status: "time_tbc",
          kickoffAt: "2026-11-07T10:00:00Z",
        },
        {
          matchweek: 11,
          status: "cancelled",
          kickoffAt: "2026-11-07T10:00:00Z",
        },
      ],
      now,
    ),
    9,
  );
});

test("falls back to the first available Gameweek before any results", () => {
  assert.equal(
    getInitialFixtureMatchweek(
      [
        { matchweek: 2, status: "time_tbc", kickoffAt: null },
        { matchweek: 1, status: "time_tbc", kickoffAt: null },
      ],
      now,
    ),
    1,
  );
  assert.equal(getInitialFixtureMatchweek([], now), null);
});
