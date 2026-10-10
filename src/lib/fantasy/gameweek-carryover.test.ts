import assert from "node:assert/strict";
import test from "node:test";

import {
  createGameweekCarryover,
  type GameweekCarryoverMember,
} from "./gameweek-carryover.ts";

function completeSquad(): GameweekCarryoverMember[] {
  return Array.from({ length: 15 }, (_, index) => ({
    fantasyPlayerId: `player-${index + 1}`,
    clubIdSnapshot: `club-${(index % 5) + 1}`,
    positionSnapshot:
      index < 2
        ? "goalkeeper"
        : index < 7
          ? "defender"
          : index < 12
            ? "midfielder"
            : "forward",
    tierSnapshot: (index % 4) + 1,
    isThaiSnapshot: index % 3 !== 0,
    lineupRole: index < 11 ? "starter" : "bench",
    benchOrder: index < 11 ? null : index - 11,
    captainRole:
      index === 2 ? "captain" : index === 7 ? "vice_captain" : "none",
  }));
}

test("copies a complete locked squad into the next Gameweek selection", () => {
  const source = completeSquad();
  const copied = createGameweekCarryover({
    selectionId: "next-selection",
    members: source,
    currentClubs: new Map(),
  });

  assert.equal(copied.length, 15);
  assert.ok(copied.every((member) => member.selectionId === "next-selection"));
  assert.deepEqual(
    copied,
    source.map((member) => ({ selectionId: "next-selection", ...member })),
  );
});

test("keeps the following Gameweek empty when the locked draft is empty", () => {
  assert.deepEqual(
    createGameweekCarryover({
      selectionId: "next-selection",
      members: [],
      currentClubs: new Map(),
    }),
    [],
  );
});

test("preserves a partial draft instead of making the lock transaction fail", () => {
  const source = completeSquad().slice(0, 7);
  assert.deepEqual(
    createGameweekCarryover({
      selectionId: "next-selection",
      members: source,
      currentClubs: new Map(),
    }),
    source.map((member) => ({ selectionId: "next-selection", ...member })),
  );
});

test("refreshes moved clubs without changing choices, roles or classifications", () => {
  const source = completeSquad();
  const copied = createGameweekCarryover({
    selectionId: "next",
    members: source,
    currentClubs: new Map([[source[2].fantasyPlayerId, "new-club"]]),
  });
  assert.deepEqual(
    copied,
    source.map((member, index) => ({
      selectionId: "next",
      ...member,
      clubIdSnapshot: index === 2 ? "new-club" : member.clubIdSnapshot,
    })),
  );
  assert.equal(source[2].clubIdSnapshot, "club-3");
  assert.equal(copied[2].captainRole, "captain");
  assert.equal(copied.length, source.length);
});
