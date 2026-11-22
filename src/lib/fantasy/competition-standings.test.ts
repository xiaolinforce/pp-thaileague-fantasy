import assert from "node:assert/strict";
import test from "node:test";
import {
  compareStandings,
  deriveStanding,
  EMPTY_STANDING_COUNTS,
  recentForm,
  standingsFromResults,
  validateStandingsSubmission,
} from "./competition-standings.ts";

const results = [
  { homeEntryId: "a", awayEntryId: "b", homeScore: 2, awayScore: 0 },
  { homeEntryId: "c", awayEntryId: "a", homeScore: 1, awayScore: 1 },
  { homeEntryId: "b", awayEntryId: "c", homeScore: 3, awayScore: 1 },
  { homeEntryId: "a", awayEntryId: "c", homeScore: 0, awayScore: 1 },
];

test("derives played, points with adjustment, and goal difference", () => {
  assert.deepEqual(
    deriveStanding({
      won: 5,
      drawn: 2,
      lost: 1,
      goalsFor: 12,
      goalsAgainst: 7,
      pointsAdjustment: -3,
    }),
    { played: 8, points: 14, goalDifference: 5 },
  );
});

test("builds the table from completed results and ignores unknown clubs", () => {
  const table = standingsFromResults(
    ["a", "b", "c"],
    [
      ...results,
      { homeEntryId: "x", awayEntryId: "a", homeScore: 9, awayScore: 0 },
    ],
  );
  assert.deepEqual(table.get("a"), {
    won: 1,
    drawn: 1,
    lost: 1,
    goalsFor: 3,
    goalsAgainst: 2,
    pointsAdjustment: 0,
  });
  assert.deepEqual(table.get("b"), {
    won: 1,
    drawn: 0,
    lost: 1,
    goalsFor: 3,
    goalsAgainst: 3,
    pointsAdjustment: 0,
  });
});

test("orders by points, then goal difference, then goals scored", () => {
  const base = { ...EMPTY_STANDING_COUNTS, won: 2 };
  const rows = [
    { id: "low-gd", ...base, goalsFor: 4, goalsAgainst: 3 },
    { id: "more-goals", ...base, goalsFor: 6, goalsAgainst: 2 },
    { id: "fewer-goals", ...base, goalsFor: 5, goalsAgainst: 1 },
    { id: "deducted", ...base, won: 3, pointsAdjustment: -4 },
  ];
  assert.deepEqual(
    rows.sort(compareStandings).map((row) => row.id),
    ["more-goals", "fewer-goals", "low-gd", "deducted"],
  );
});

test("form lists the latest results first", () => {
  assert.deepEqual(recentForm("a", results), ["L", "D", "W"]);
  assert.deepEqual(recentForm("c", results, 2), ["W", "L"]);
  assert.deepEqual(recentForm("none", results), []);
});

test("validation requires every active club exactly once with sane values", () => {
  const row = (entryId: string) => ({ entryId, ...EMPTY_STANDING_COUNTS });
  const valid = { throughMatchweek: 3, rows: [row("a"), row("b")] };
  assert.equal(validateStandingsSubmission(valid, ["a", "b"]), null);
  assert.match(
    validateStandingsSubmission({ ...valid, rows: [row("a")] }, ["a", "b"])
      ?.en ?? "",
    /every club/,
  );
  assert.match(
    validateStandingsSubmission({ ...valid, rows: [row("a"), row("a")] }, [
      "a",
      "b",
    ])?.en ?? "",
    /more than once/,
  );
  assert.match(
    validateStandingsSubmission({ ...valid, rows: [row("a"), row("z")] }, [
      "a",
      "b",
    ])?.en ?? "",
    /not part/,
  );
  assert.match(
    validateStandingsSubmission(
      { ...valid, rows: [{ ...row("a"), won: 1.5 }, row("b")] },
      ["a", "b"],
    )?.en ?? "",
    /Won, drawn and lost/,
  );
  assert.match(
    validateStandingsSubmission(
      { ...valid, rows: [{ ...row("a"), pointsAdjustment: -100 }, row("b")] },
      ["a", "b"],
    )?.en ?? "",
    /adjustments/,
  );
  assert.match(
    validateStandingsSubmission({ ...valid, throughMatchweek: 0 }, ["a", "b"])
      ?.en ?? "",
    /matchweek/,
  );
});
