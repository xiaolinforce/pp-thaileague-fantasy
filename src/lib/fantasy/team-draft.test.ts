import assert from "node:assert/strict";
import test from "node:test";

import type { FantasyPosition } from "./rules.ts";

import {
  createEmptySquadDraft,
  fillDraftVacancy,
  fillFirstMatchingDraftVacancy,
  getCompleteSelectionMembers,
  getValidDraftSwapTargetSlotIds,
  removePlayerFromDraft,
  swapDraftLineupMembers,
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

function makeCompleteDraft() {
  const positionsById = new Map<string, FantasyPosition>();
  const members = createEmptySquadDraft().map((member, index) => {
    const fantasyPlayerId = `${member.vacancyPosition}-${index + 1}`;
    positionsById.set(fantasyPlayerId, member.vacancyPosition!);
    return {
      ...member,
      fantasyPlayerId,
      vacancyPosition: null,
      captainRole:
        index === 1
          ? ("captain" as const)
          : index === 2
            ? ("vice_captain" as const)
            : ("none" as const),
    };
  });
  return { members, positionsById };
}

test("swaps a vacancy with a cross-position player while preserving the missing position", () => {
  const { members: complete, positionsById } = makeCompleteDraft();
  const starterDefender = complete.find(
    (member) =>
      member.lineupRole === "starter" &&
      positionsById.get(member.fantasyPlayerId!) === "defender",
  )!;
  const benchMidfielder = complete.find(
    (member) =>
      member.lineupRole === "bench" &&
      positionsById.get(member.fantasyPlayerId!) === "midfielder",
  )!;
  const vacancy = removePlayerFromDraft(
    complete,
    starterDefender.fantasyPlayerId!,
    "defender",
  );

  const targets = getValidDraftSwapTargetSlotIds(
    vacancy,
    starterDefender.slotId,
    positionsById,
  );
  assert.equal(targets.has(benchMidfielder.slotId), true);

  const swapped = swapDraftLineupMembers(
    vacancy,
    starterDefender.slotId,
    benchMidfielder.slotId,
  )!;
  const movedVacancy = swapped.find(
    (member) => member.slotId === starterDefender.slotId,
  )!;
  const movedPlayer = swapped.find(
    (member) => member.fantasyPlayerId === benchMidfielder.fantasyPlayerId,
  )!;
  assert.equal(movedVacancy.vacancyPosition, "defender");
  assert.equal(movedVacancy.lineupRole, "bench");
  assert.equal(movedVacancy.benchOrder, benchMidfielder.benchOrder);
  assert.equal(movedPlayer.lineupRole, "starter");
  assert.equal(movedPlayer.benchOrder, null);
});

test("only exposes swaps that preserve the formation and bench structure", () => {
  const { members: complete, positionsById } = makeCompleteDraft();
  const starterDefender = complete.find(
    (member) =>
      member.lineupRole === "starter" &&
      positionsById.get(member.fantasyPlayerId!) === "defender",
  )!;
  const benchGoalkeeper = complete.find(
    (member) =>
      member.lineupRole === "bench" &&
      positionsById.get(member.fantasyPlayerId!) === "goalkeeper",
  )!;
  const anotherStarter = complete.find(
    (member) =>
      member.lineupRole === "starter" &&
      member.fantasyPlayerId !== starterDefender.fantasyPlayerId,
  )!;
  const vacancy = removePlayerFromDraft(
    complete,
    starterDefender.fantasyPlayerId!,
    "defender",
  );
  const targets = getValidDraftSwapTargetSlotIds(
    vacancy,
    starterDefender.slotId,
    positionsById,
  );

  assert.equal(targets.has(benchGoalkeeper.slotId), false);
  assert.equal(targets.has(anotherStarter.slotId), false);
  assert.equal(
    swapDraftLineupMembers(
      vacancy,
      starterDefender.slotId,
      anotherStarter.slotId,
    ),
    null,
  );
  assert.equal(
    swapDraftLineupMembers(
      vacancy,
      starterDefender.slotId,
      starterDefender.slotId,
    ),
    null,
  );
});

test("passes captaincy through a vacancy that replaces a starter", () => {
  const { members: complete, positionsById } = makeCompleteDraft();
  const benchDefender = complete.find(
    (member) =>
      member.lineupRole === "bench" &&
      positionsById.get(member.fantasyPlayerId!) === "defender",
  )!;
  const captain = complete.find((member) => member.captainRole === "captain")!;
  const vacancy = removePlayerFromDraft(
    complete,
    benchDefender.fantasyPlayerId!,
    "defender",
  );
  const swapped = swapDraftLineupMembers(
    vacancy,
    benchDefender.slotId,
    captain.slotId,
  )!;

  assert.equal(
    swapped.find((member) => member.slotId === benchDefender.slotId)
      ?.captainRole,
    "captain",
  );
  assert.equal(
    swapped.find((member) => member.fantasyPlayerId === captain.fantasyPlayerId)
      ?.captainRole,
    "none",
  );
});

test("lets a player initiate a swap with a vacancy in an incomplete draft", () => {
  const { members: complete, positionsById } = makeCompleteDraft();
  const starterDefender = complete.find(
    (member) =>
      member.lineupRole === "starter" &&
      positionsById.get(member.fantasyPlayerId!) === "defender",
  )!;
  const benchMidfielder = complete.find(
    (member) =>
      member.lineupRole === "bench" &&
      positionsById.get(member.fantasyPlayerId!) === "midfielder",
  )!;
  const incomplete = removePlayerFromDraft(
    complete,
    starterDefender.fantasyPlayerId!,
    "defender",
  );

  const targets = getValidDraftSwapTargetSlotIds(
    incomplete,
    benchMidfielder.slotId,
    positionsById,
  );

  assert.equal(targets.has(starterDefender.slotId), true);
  assert.equal(
    getValidDraftSwapTargetSlotIds(
      incomplete,
      starterDefender.slotId,
      positionsById,
    ).has(benchMidfielder.slotId),
    true,
  );
});

test("keeps player-to-player swaps available when another slot is vacant", () => {
  const { members: complete, positionsById } = makeCompleteDraft();
  const starterDefender = complete.find(
    (member) =>
      member.lineupRole === "starter" &&
      positionsById.get(member.fantasyPlayerId!) === "defender",
  )!;
  const benchDefender = complete.find(
    (member) =>
      member.lineupRole === "bench" &&
      positionsById.get(member.fantasyPlayerId!) === "defender",
  )!;
  const benchMidfielder = complete.find(
    (member) =>
      member.lineupRole === "bench" &&
      positionsById.get(member.fantasyPlayerId!) === "midfielder",
  )!;
  const incomplete = removePlayerFromDraft(
    complete,
    benchMidfielder.fantasyPlayerId!,
    "midfielder",
  );

  assert.equal(
    getValidDraftSwapTargetSlotIds(
      incomplete,
      starterDefender.slotId,
      positionsById,
    ).has(benchDefender.slotId),
    true,
  );
});

test("swaps two vacancies when their resulting positions remain valid", () => {
  const { members: complete, positionsById } = makeCompleteDraft();
  const starterDefender = complete.find(
    (member) =>
      member.lineupRole === "starter" &&
      positionsById.get(member.fantasyPlayerId!) === "defender",
  )!;
  const benchMidfielder = complete.find(
    (member) =>
      member.lineupRole === "bench" &&
      positionsById.get(member.fantasyPlayerId!) === "midfielder",
  )!;
  const incomplete = removePlayerFromDraft(
    removePlayerFromDraft(
      complete,
      starterDefender.fantasyPlayerId!,
      "defender",
    ),
    benchMidfielder.fantasyPlayerId!,
    "midfielder",
  );
  const targets = getValidDraftSwapTargetSlotIds(
    incomplete,
    starterDefender.slotId,
    positionsById,
  );

  assert.equal(targets.has(benchMidfielder.slotId), true);

  const swapped = swapDraftLineupMembers(
    incomplete,
    starterDefender.slotId,
    benchMidfielder.slotId,
  )!;
  assert.equal(
    swapped.find((member) => member.slotId === starterDefender.slotId)
      ?.lineupRole,
    "bench",
  );
  assert.equal(
    swapped.find((member) => member.slotId === benchMidfielder.slotId)
      ?.lineupRole,
    "starter",
  );
});
