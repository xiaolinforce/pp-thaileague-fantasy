import assert from "node:assert/strict";
import test from "node:test";
import {
  addSeasonStatTotals,
  calculateFiveFixtureForm,
  EMPTY_SEASON_STAT_TOTALS,
  matchOfficialSeasonPlayer,
} from "./competition-stats.ts";

test("form averages the last five club fixtures and counts a DNP as zero", () => {
  assert.equal(
    calculateFiveFixtureForm([
      { fixtureId: "5", matchweek: 5, points: 10 },
      { fixtureId: "4", matchweek: 4, points: 0 },
      { fixtureId: "3", matchweek: 3, points: 5 },
      { fixtureId: "2", matchweek: 2, points: 0 },
      { fixtureId: "1", matchweek: 1, points: 5 },
      { fixtureId: "old", matchweek: 0, points: 99 },
    ]),
    4,
  );
});

test("official players only match an exact unique name inside the same club", () => {
  const candidates = [
    { playerId: "a", clubExternalId: "10", fullNameEn: "John Smith" },
    { playerId: "b", clubExternalId: "20", fullNameEn: "John Smith" },
  ];
  assert.deepEqual(
    matchOfficialSeasonPlayer(
      { personId: "100", clubExternalId: "10", fullNameEn: "Jöhn Smith" },
      candidates,
      {},
    ),
    { status: "matched", playerId: "a", method: "exact_name" },
  );
  assert.equal(
    matchOfficialSeasonPlayer(
      { personId: "101", clubExternalId: "30", fullNameEn: "John Smith" },
      candidates,
      {},
    ).status,
    "unmatched",
  );
});

test("manual official person overrides use stable local player ids", () => {
  assert.deepEqual(
    matchOfficialSeasonPlayer(
      { personId: "100", clubExternalId: "10", fullNameEn: "Different Name" },
      [{ playerId: "a", clubExternalId: "10", fullNameEn: "John Smith" }],
      { "100": "a" },
    ),
    { status: "matched", playerId: "a", method: "manual" },
  );
});

test("form uses completed fixtures available when fewer than five exist", () => {
  assert.equal(
    calculateFiveFixtureForm([
      { fixtureId: "2", matchweek: 2, points: 0 },
      { fixtureId: "1", matchweek: 1, points: 6 },
    ]),
    3,
  );
  assert.equal(calculateFiveFixtureForm([]), 0);
});

test("season aggregates combine multiple official registration rows", () => {
  assert.deepEqual(
    addSeasonStatTotals(EMPTY_SEASON_STAT_TOTALS, {
      ...EMPTY_SEASON_STAT_TOTALS,
      appearances: 4,
      goals: 2,
      sourceAssists: 1,
    }),
    {
      ...EMPTY_SEASON_STAT_TOTALS,
      appearances: 4,
      goals: 2,
      sourceAssists: 1,
    },
  );
});
