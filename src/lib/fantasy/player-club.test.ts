import assert from "node:assert/strict";
import test from "node:test";
import {
  refreshPlayerClubSnapshots,
  resolvePlayerClubs,
} from "./player-club.ts";
import { getCountedTransfers, validateSquad } from "./rules.ts";

test("restore refreshes only clubs and retains unavailable identities and original history", () => {
  const baseline = [
    { fantasyPlayerId: "moved", clubIdSnapshot: "old", captainRole: "captain" },
    { fantasyPlayerId: "retired", clubIdSnapshot: "last", captainRole: "none" },
  ];
  const restored = refreshPlayerClubSnapshots(
    baseline,
    new Map([["moved", "new"]]),
  );
  assert.deepEqual(restored, [
    { ...baseline[0], clubIdSnapshot: "new" },
    baseline[1],
  ]);
  assert.equal(baseline[0].clubIdSnapshot, "old");
  assert.equal(
    getCountedTransfers(
      baseline.map((member) => member.fantasyPlayerId),
      restored.map((member) => member.fantasyPlayerId),
    ),
    0,
  );
});

test("rejects ambiguous eligible clubs rather than choosing an arbitrary registration", () => {
  assert.throws(
    () =>
      resolvePlayerClubs([
        { fantasyPlayerId: "a", clubId: "x" },
        { fantasyPlayerId: "a", clubId: "y" },
      ]),
    /multiple eligible clubs/,
  );
  assert.deepEqual(
    [
      ...resolvePlayerClubs([
        { fantasyPlayerId: "a", clubId: "x" },
        { fantasyPlayerId: "a", clubId: "x" },
      ]),
    ],
    [["a", "x"]],
  );
});

test("club moves still trigger the existing quota and unavailable-player validation", () => {
  const squad = Array.from({ length: 15 }, (_, index) => ({
    id: String(index),
    clubId: index < 4 ? "new-club" : `club-${index}`,
    position: (index < 2
      ? "goalkeeper"
      : index < 7
        ? "defender"
        : index < 12
          ? "midfielder"
          : "forward") as "goalkeeper" | "defender" | "midfielder" | "forward",
    tier: 4,
    isThai: true,
    isAvailable: index !== 14,
  }));
  const violations = validateSquad(squad);
  assert.ok(violations.some((violation) => violation.code === "club_quota"));
  assert.ok(
    violations.some((violation) => violation.code === "unavailable_player"),
  );
});
