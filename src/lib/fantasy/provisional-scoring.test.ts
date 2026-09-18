import assert from "node:assert/strict";
import test from "node:test";

import { getScoringCaptainId } from "./captaincy.ts";
import {
  resolveTeamScore,
  type GameweekPlayerResult,
  type SelectionPlayer,
} from "./scoring.ts";

const starters: SelectionPlayer[] = [
  {
    playerId: "gk",
    position: "goalkeeper",
    lineupRole: "starter",
    benchOrder: null,
    captainRole: "none",
  },
  ...["d1", "d2", "d3"].map((playerId) => ({
    playerId,
    position: "defender" as const,
    lineupRole: "starter" as const,
    benchOrder: null,
    captainRole: "none" as const,
  })),
  ...["m1", "m2", "m3", "m4"].map((playerId) => ({
    playerId,
    position: "midfielder" as const,
    lineupRole: "starter" as const,
    benchOrder: null,
    captainRole: "none" as const,
  })),
  {
    playerId: "f1",
    position: "forward",
    lineupRole: "starter",
    benchOrder: null,
    captainRole: "captain",
  },
  {
    playerId: "f2",
    position: "forward",
    lineupRole: "starter",
    benchOrder: null,
    captainRole: "vice_captain",
  },
  {
    playerId: "f3",
    position: "forward",
    lineupRole: "starter",
    benchOrder: null,
    captainRole: "none",
  },
];
const bench: SelectionPlayer[] = [
  {
    playerId: "gk2",
    position: "goalkeeper",
    lineupRole: "bench",
    benchOrder: 0,
    captainRole: "none",
  },
  {
    playerId: "d4",
    position: "defender",
    lineupRole: "bench",
    benchOrder: 1,
    captainRole: "none",
  },
  {
    playerId: "m5",
    position: "midfielder",
    lineupRole: "bench",
    benchOrder: 2,
    captainRole: "none",
  },
  {
    playerId: "f4",
    position: "forward",
    lineupRole: "bench",
    benchOrder: 3,
    captainRole: "none",
  },
];
const selection = [...starters, ...bench];

function score(playerResults: GameweekPlayerResult[], scoreComplete: boolean) {
  return resolveTeamScore({
    selection,
    playerResults,
    activeChip: null,
    transferPoints: 0,
    scoreComplete,
  });
}

test("pending captain keeps the vice-captain's provisional points unmultiplied", () => {
  const results = [{ playerId: "f2", minutes: 90, points: 1 }];

  assert.equal(score(results, false).captainBonus, 0);
  assert.equal(score(results, false).totalPoints, 1);
  assert.equal(score(results, true).captainBonus, 1);
  assert.equal(score(results, true).totalPoints, 2);
  assert.equal(
    getScoringCaptainId("f1", "f2", new Map([["f2", results[0]]]), false),
    null,
  );
});

test("recorded zero minutes confirms captain fallback before Gameweek finalization", () => {
  const results = [
    { playerId: "f1", minutes: 0, points: 0 },
    { playerId: "f2", minutes: 90, points: 1 },
  ];

  assert.equal(score(results, false).captainBonus, 1);
  assert.equal(score(results, false).totalPoints, 2);
  assert.equal(
    getScoringCaptainId(
      "f1",
      "f2",
      new Map(results.map((result) => [result.playerId, result])),
      false,
    ),
    "f2",
  );
});

test("Triple Captain does not transfer its multiplier to a vice-captain while the captain is pending", () => {
  const playerResults = [{ playerId: "f2", minutes: 90, points: 4 }];
  const provisional = resolveTeamScore({
    selection,
    playerResults,
    activeChip: "triple_captain",
    transferPoints: 0,
    scoreComplete: false,
  });
  const final = resolveTeamScore({
    selection,
    playerResults,
    activeChip: "triple_captain",
    transferPoints: 0,
    scoreComplete: true,
  });

  assert.equal(provisional.captainBonus, 0);
  assert.equal(final.captainBonus, 8);
});

test("a captain appearance keeps the multiplier even when the vice-captain played first", () => {
  const results = [
    { playerId: "f1", minutes: 1, points: 1 },
    { playerId: "f2", minutes: 90, points: 1 },
  ];

  assert.equal(score(results, false).captainBonus, 1);
  assert.equal(score(results, false).totalPoints, 3);
  assert.equal(
    getScoringCaptainId(
      "f1",
      "f2",
      new Map(results.map((result) => [result.playerId, result])),
      false,
    ),
    "f1",
  );
});

test("automatic substitutions wait for a confirmed zero-minute starter", () => {
  const results = [
    ...starters
      .filter((player) => player.playerId !== "f1")
      .map((player) => ({
        playerId: player.playerId,
        minutes: 90,
        points: player.playerId === "f2" ? 1 : 0,
      })),
    { playerId: "f4", minutes: 90, points: 2 },
  ];

  assert.deepEqual(score(results, false).autoSubstitutions, []);
  assert.deepEqual(score(results, true).autoSubstitutions, [
    { out: "f1", in: "f4" },
  ]);
  assert.deepEqual(
    score([{ playerId: "f1", minutes: 0, points: 0 }, ...results], false)
      .autoSubstitutions,
    [{ out: "f1", in: "f4" }],
  );
});
