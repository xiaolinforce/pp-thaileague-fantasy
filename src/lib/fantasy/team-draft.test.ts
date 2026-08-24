import assert from "node:assert/strict";
import test from "node:test";

import {
  createEmptySquadDraft,
  fillDraftVacancy,
  fillFirstMatchingDraftVacancy,
  getCompleteSelectionMembers,
  removePlayerFromDraft,
  type DraftLineupMember,
} from "./team-draft.ts";

test("creates an empty 15-slot opening draft with a valid 4-4-2 shape", () => {
  const draft = createEmptySquadDraft();
  const starters = draft.filter((member) => member.lineupRole === "starter");
  const bench = draft.filter((member) => member.lineupRole === "bench");

  assert.equal(draft.length, 15);
  assert.equal(
    draft.every((member) => member.fantasyPlayerId === null),
    true,
  );
  assert.equal(
    draft.every((member) => member.vacancyPosition !== null),
    true,
  );
  assert.deepEqual(
    Object.fromEntries(
      ["goalkeeper", "defender", "midfielder", "forward"].map((position) => [
        position,
        starters.filter((member) => member.vacancyPosition === position).length,
      ]),
    ),
    { goalkeeper: 1, defender: 4, midfielder: 4, forward: 2 },
  );
  assert.deepEqual(
    bench.map((member) => [member.vacancyPosition, member.benchOrder]),
    [
      ["goalkeeper", 0],
      ["defender", 1],
      ["midfielder", 2],
      ["forward", 3],
    ],
  );
  assert.equal(getCompleteSelectionMembers(draft), null);
});

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

test("fills the first matching vacancy without requiring a selected slot", () => {
  const vacancies: DraftLineupMember[] = [
    {
      slotId: "starter-def",
      fantasyPlayerId: null,
      vacancyPosition: "defender",
      lineupRole: "starter",
      benchOrder: null,
      captainRole: "none",
    },
    {
      slotId: "bench-mid",
      fantasyPlayerId: null,
      vacancyPosition: "midfielder",
      lineupRole: "bench",
      benchOrder: 2,
      captainRole: "none",
    },
    {
      slotId: "bench-def",
      fantasyPlayerId: null,
      vacancyPosition: "defender",
      lineupRole: "bench",
      benchOrder: 1,
      captainRole: "none",
    },
  ];

  const next = fillFirstMatchingDraftVacancy(vacancies, "defender", "def-3");
  assert.equal(next?.[0].fantasyPlayerId, "def-3");
  assert.equal(next?.[1].fantasyPlayerId, null);
  assert.equal(next?.[2].fantasyPlayerId, null);
  assert.equal(
    fillFirstMatchingDraftVacancy(vacancies, "forward", "fwd-1"),
    null,
  );
});
