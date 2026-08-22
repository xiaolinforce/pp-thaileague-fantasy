import assert from "node:assert/strict";
import test from "node:test";

import {
  fillDraftVacancy,
  getCompleteSelectionMembers,
  removePlayerFromDraft,
  type DraftLineupMember,
} from "./team-draft.ts";

const members: DraftLineupMember[] = [
  {
    slotId: "starter-gk",
    fantasyPlayerId: "gk-1",
    vacancyPosition: null,
    lineupRole: "starter",
    benchOrder: null,
    captainRole: "captain",
  },
  {
    slotId: "bench-gk",
    fantasyPlayerId: "gk-2",
    vacancyPosition: null,
    lineupRole: "bench",
    benchOrder: 0,
    captainRole: "none",
  },
];

test("removing a player preserves the lineup slot as a position-locked vacancy", () => {
  const next = removePlayerFromDraft(members, "gk-1", "goalkeeper");
  assert.deepEqual(next[0], {
    slotId: "starter-gk",
    fantasyPlayerId: null,
    vacancyPosition: "goalkeeper",
    lineupRole: "starter",
    benchOrder: null,
    captainRole: "none",
  });
  assert.deepEqual(next[1], members[1]);
  assert.equal(getCompleteSelectionMembers(next), null);
});

test("filling a vacancy restores a complete server-safe selection", () => {
  const vacancy = removePlayerFromDraft(members, "gk-1", "goalkeeper");
  const complete = fillDraftVacancy(vacancy, "starter-gk", "gk-3");
  assert.deepEqual(getCompleteSelectionMembers(complete), [
    {
      fantasyPlayerId: "gk-3",
      lineupRole: "starter",
      benchOrder: null,
      captainRole: "none",
    },
    {
      fantasyPlayerId: "gk-2",
      lineupRole: "bench",
      benchOrder: 0,
      captainRole: "none",
    },
  ]);
});
