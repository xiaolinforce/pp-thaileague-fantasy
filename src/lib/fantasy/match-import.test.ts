import test from "node:test";
import assert from "node:assert/strict";
import { prepareMatchImport, type MatchRosterPlayer } from "./match-import.ts";
const roster: MatchRosterPlayer[] = ["home", "away"].flatMap((side) =>
  Array.from({ length: 12 }, (_, index) => ({
    fantasyPlayerId: `${side}-${index}`,
    name: `${side}-${index}`,
    nameEn: `${side}-${index}`,
    nameTh: null,
    position: index === 0 ? "goalkeeper" : "midfielder",
    side: side as "home" | "away",
  })),
);
function report() {
  return {
    fixtureId: "fixture",
    homeScore: 1,
    awayScore: 0,
    sources: ["https://example.org/report"],
    events: ["14' own goal away-4"],
    uncertainties: [],
    players: roster.map((p, i) => ({
      fantasyPlayerId: p.fantasyPlayerId,
      minutes: i % 12 === 11 ? 0 : 90,
      goalsConcededWhilePlaying: p.side === "away" && i % 12 !== 11 ? 1 : 0,
      ownGoals: p.fantasyPlayerId === "away-4" ? 1 : 0,
      yellowCards: i === 11 ? 1 : 0,
      saves: p.position === "goalkeeper" ? 4 : undefined,
      sourceAssists: i === 1 ? 1 : 0,
      fantasyAssists: i === 1 ? 0 : null,
    })),
  };
}
function prepare(payload: ReturnType<typeof report>) {
  return prepareMatchImport("fixture", JSON.stringify(payload), roster);
}
test("batch preview uses explicit assist decision, actual saves, own goals and unused substitute cards", () => {
  const { rows } = prepare(report());
  const points = (id: string) =>
    rows.find((r) => r.fantasyPlayerId === id)?.points;
  assert.equal(points("home-1")?.breakdown.assists, 0);
  assert.equal(points("home-0")?.total, 7);
  assert.equal(points("home-11")?.total, -1);
  assert.equal(points("away-4")?.breakdown.ownGoals, -2);
});
test("batch validation rejects mismatched totals, duplicate and missing players, and missing GK saves", () => {
  const mismatched = report();
  mismatched.awayScore = 1;
  assert.throws(() => prepare(mismatched), /goals/);
  const duplicate = report();
  duplicate.players[0] = duplicate.players[1];
  assert.throws(() => prepare(duplicate), /duplicate/);
  const missing = report();
  missing.players.pop();
  assert.throws(() => prepare(missing), /full match roster/);
  const keeper = report();
  keeper.players[0].saves = undefined;
  assert.throws(() => prepare(keeper), /saves/);
});
test("batch validation rejects missing minutes, invented on-pitch DNP stats and misspelled fields", () => {
  const payload = report();
  assert.throws(
    () =>
      prepareMatchImport(
        "fixture",
        JSON.stringify({
          ...payload,
          players: payload.players.map((p, i) =>
            i === 11 ? { ...p, minutes: null } : p,
          ),
        }),
        roster,
      ),
    /minutes/,
  );
  payload.players[11].ownGoals = 1;
  assert.throws(() => prepare(payload), /zero-minute/);
  assert.throws(
    () =>
      prepareMatchImport(
        "fixture",
        JSON.stringify({ ...payload, goal: 3 }),
        roster,
      ),
    /Unknown field/,
  );
});

test("report order is stable across retries and a deadline-only registration covers DNP", () => {
  const payload = report();
  const snapshot = roster.map((p) => ({
    ...p,
    registered: p.fantasyPlayerId !== "away-11",
  }));
  assert.deepEqual(
    prepareMatchImport("fixture", JSON.stringify(payload), snapshot).payload,
    prepareMatchImport(
      "fixture",
      JSON.stringify({ ...payload, players: [...payload.players].reverse() }),
      snapshot,
    ).payload,
  );
  payload.players[23].minutes = 1;
  assert.throws(
    () => prepareMatchImport("fixture", JSON.stringify(payload), snapshot),
    /registration/,
  );
});
