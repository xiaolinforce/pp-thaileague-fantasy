import assert from "node:assert/strict";
import test from "node:test";
import {
  isFantasySelectionInput,
  type FantasySelectionInput,
} from "./selection-input.ts";

function input(): FantasySelectionInput {
  return {
    selectionId: "00000000-0000-0000-0000-000000000001",
    expectedRevision: 0,
    activeChip: null,
    members: Array.from({ length: 15 }, (_, index) => ({
      fantasyPlayerId: `00000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`,
      lineupRole: index < 11 ? "starter" : "bench",
      benchOrder: index < 11 ? null : index - 11,
      captainRole:
        index === 0 ? "captain" : index === 1 ? "vice_captain" : "none",
    })),
  };
}

test("accepts the complete transport contract", () =>
  assert.equal(isFantasySelectionInput(input()), true));
test("rejects malformed transport values and a sixteenth unknown player before filtering", () => {
  for (const value of [
    null,
    {},
    { ...input(), activeChip: "unknown" },
    { ...input(), expectedRevision: -1 },
    { ...input(), selectionId: "old-gameweek" },
    { ...input(), members: input().members.slice(1) },
    {
      ...input(),
      members: [
        ...input().members,
        {
          ...input().members[0],
          fantasyPlayerId: "00000000-0000-0000-0000-000000999999",
        },
      ],
    },
  ])
    assert.equal(isFantasySelectionInput(value), false);
});
test("rejects duplicates, invalid roles, null/duplicate bench order and bench captaincy", () => {
  const variants = [
    {
      index: 1,
      patch: { fantasyPlayerId: input().members[0].fantasyPlayerId },
    },
    { index: 1, patch: { fantasyPlayerId: "malformed" } },
    { index: 1, patch: { lineupRole: "manager" } },
    { index: 1, patch: { captainRole: "both" } },
    { index: 1, patch: { benchOrder: 0 } },
    { index: 11, patch: { benchOrder: null } },
    { index: 11, patch: { benchOrder: 1 } },
    { index: 11, patch: { benchOrder: 0.5 } },
    { index: 11, patch: { captainRole: "captain" } },
  ];
  for (const { index, patch } of variants) {
    const value = input();
    Object.assign(value.members[index], patch);
    assert.equal(isFantasySelectionInput(value), false, JSON.stringify(patch));
  }
});
