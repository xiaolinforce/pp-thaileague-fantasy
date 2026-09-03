import assert from "node:assert/strict";
import test from "node:test";

import { createEmptySquadDraft } from "./team-draft.ts";
import { validateLineup, type LineupPlayer } from "./rules.ts";
import {
  autoFillSquadDraft,
  classifyLikelyClubStartingGoalkeepers,
  type AutoFillCandidate,
} from "./auto-fill.ts";

const positions = ["goalkeeper", "defender", "midfielder", "forward"] as const;

function createCandidates() {
  const candidates: AutoFillCandidate[] = [];
  for (const position of positions) {
    for (const tier of [1, 2, 3, 4]) {
      for (let index = 0; index < 12; index += 1) {
        candidates.push({
          id: `${position}-${tier}-${index}`,
          clubId: `club-${index % 8}`,
          position,
          tier,
          isThai: index % 3 !== 0,
          isLikelyClubStartingGoalkeeper: false,
        });
      }
    }
  }
  return classifyLikelyClubStartingGoalkeepers(candidates);
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1_664_525 + 1_013_904_223) >>> 0;
    return value / 4_294_967_296;
  };
}

function toLineup(
  members: NonNullable<ReturnType<typeof autoFillSquadDraft>>["members"],
  candidates: AutoFillCandidate[],
) {
  const byId = new Map(
    candidates.map((candidate) => [candidate.id, candidate]),
  );
  return members.map((member) => {
    const candidate = byId.get(member.fantasyPlayerId!);
    assert.ok(candidate);
    return {
      ...candidate,
      lineupRole: member.lineupRole,
      benchOrder: member.benchOrder,
      captainRole: member.captainRole,
      isAvailable: true,
    } satisfies LineupPlayer;
  });
}

test("classifies each club's best-tier goalkeepers and preserves ties", () => {
  const candidates: AutoFillCandidate[] = [
    {
      id: "club-a-first",
      clubId: "club-a",
      position: "goalkeeper",
      tier: 2,
      isThai: true,
      isLikelyClubStartingGoalkeeper: false,
    },
    {
      id: "club-a-backup",
      clubId: "club-a",
      position: "goalkeeper",
      tier: 3,
      isThai: true,
      isLikelyClubStartingGoalkeeper: false,
    },
    {
      id: "club-b-tied-one",
      clubId: "club-b",
      position: "goalkeeper",
      tier: 1,
      isThai: false,
      isLikelyClubStartingGoalkeeper: false,
    },
    {
      id: "club-b-tied-two",
      clubId: "club-b",
      position: "goalkeeper",
      tier: 1,
      isThai: true,
      isLikelyClubStartingGoalkeeper: false,
    },
  ];

  const classified = classifyLikelyClubStartingGoalkeepers(candidates);
  assert.deepEqual(
    classified.map((candidate) => [
      candidate.id,
      candidate.isLikelyClubStartingGoalkeeper,
    ]),
    [
      ["club-a-first", true],
      ["club-a-backup", false],
      ["club-b-tied-one", true],
      ["club-b-tied-two", true],
    ],
  );
});

test("fills an empty squad with exact tier targets and valid captaincy", () => {
  const candidates = createCandidates();
  const result = autoFillSquadDraft({
    members: createEmptySquadDraft(),
    candidates,
    random: seededRandom(7),
  });

  assert.ok(result);
  assert.equal(result.addedPlayerIds.length, 15);
  const lineup = toLineup(result.members, candidates);
  assert.deepEqual(validateLineup(lineup), []);
  assert.equal(lineup.filter((player) => player.tier === 1).length, 3);
  assert.equal(lineup.filter((player) => player.tier === 2).length, 3);
  assert.equal(lineup.filter((player) => player.tier === 3).length, 3);
  assert.equal(lineup.filter((player) => player.tier === 4).length, 6);
  assert.equal(
    lineup.filter((player) => player.captainRole === "captain").length,
    1,
  );
  assert.equal(
    lineup.filter((player) => player.captainRole === "vice_captain").length,
    1,
  );
  const starterTiers = lineup
    .filter((player) => player.lineupRole === "starter")
    .map((player) => player.tier)
    .sort((left, right) => left - right);
  assert.equal(
    lineup.find((player) => player.captainRole === "captain")?.tier,
    starterTiers[0],
  );
  assert.equal(
    lineup.find((player) => player.captainRole === "vice_captain")?.tier,
    starterTiers[1],
  );
  assert.equal(lineup.filter((player) => !player.isThai).length, 7);
  const goalkeepers = lineup.filter(
    (player) => player.position === "goalkeeper",
  );
  assert.equal(goalkeepers.length, 2);
  assert.equal(
    goalkeepers.every(
      (goalkeeper) => goalkeeper.isLikelyClubStartingGoalkeeper,
    ),
    true,
  );
  for (const position of positions) {
    const starterTiersForPosition = lineup
      .filter(
        (player) =>
          player.position === position && player.lineupRole === "starter",
      )
      .map((player) => player.tier);
    const benchTiersForPosition = lineup
      .filter(
        (player) =>
          player.position === position && player.lineupRole === "bench",
      )
      .map((player) => player.tier);
    if (
      starterTiersForPosition.length > 0 &&
      benchTiersForPosition.length > 0
    ) {
      assert.ok(
        Math.max(...starterTiersForPosition) <=
          Math.min(...benchTiersForPosition),
      );
    }
  }
});

test("prefers a likely club starting goalkeeper before maximizing foreigners", () => {
  const preferredGoalkeeperId = "goalkeeper-4-1";
  const candidates = createCandidates().map((candidate) => ({
    ...candidate,
    isLikelyClubStartingGoalkeeper: candidate.id === preferredGoalkeeperId,
  }));
  const result = autoFillSquadDraft({
    members: createEmptySquadDraft(),
    candidates,
    random: seededRandom(13),
  });

  assert.ok(result);
  const preferredGoalkeeper = result.members.find(
    (member) => member.fantasyPlayerId === preferredGoalkeeperId,
  );
  assert.ok(preferredGoalkeeper);
  assert.equal(preferredGoalkeeper.lineupRole, "starter");
  const lineup = toLineup(result.members, candidates);
  assert.equal(lineup.filter((player) => !player.isThai).length, 7);
  assert.equal(lineup.filter((player) => player.tier === 1).length, 3);
  assert.equal(lineup.filter((player) => player.tier === 2).length, 3);
  assert.equal(lineup.filter((player) => player.tier === 3).length, 3);
});

test("preserves selected players and existing captaincy while filling vacancies", () => {
  const candidates = createCandidates();
  const initial = autoFillSquadDraft({
    members: createEmptySquadDraft(),
    candidates,
    random: seededRandom(3),
  });
  assert.ok(initial);
  const captain = initial.members.find(
    (member) => member.captainRole === "captain",
  );
  const viceCaptain = initial.members.find(
    (member) => member.captainRole === "vice_captain",
  );
  assert.ok(captain?.fantasyPlayerId);
  assert.ok(viceCaptain?.fantasyPlayerId);
  const removedIds = new Set(
    initial.members
      .filter((member) => member.captainRole === "none")
      .slice(0, 4)
      .map((member) => member.fantasyPlayerId!),
  );
  const partial = initial.members.map((member) => {
    if (!member.fantasyPlayerId || !removedIds.has(member.fantasyPlayerId)) {
      return member;
    }
    const candidate = candidates.find(
      (item) => item.id === member.fantasyPlayerId,
    )!;
    return {
      ...member,
      fantasyPlayerId: null,
      vacancyPosition: candidate.position,
      captainRole: "none" as const,
    };
  });
  const preservedIds = new Set(
    partial.flatMap((member) =>
      member.fantasyPlayerId ? [member.fantasyPlayerId] : [],
    ),
  );

  const result = autoFillSquadDraft({
    members: partial,
    candidates,
    random: seededRandom(11),
  });
  assert.ok(result);
  assert.equal(result.addedPlayerIds.length, 4);
  assert.equal(
    [...preservedIds].every((id) =>
      result.members.some((member) => member.fantasyPlayerId === id),
    ),
    true,
  );
  assert.equal(
    result.members.find((member) => member.captainRole === "captain")
      ?.fantasyPlayerId,
    captain.fantasyPlayerId,
  );
  assert.equal(
    result.members.find((member) => member.captainRole === "vice_captain")
      ?.fantasyPlayerId,
    viceCaptain.fantasyPlayerId,
  );
});

test("assigns missing captaincy by tier before position priority", () => {
  const candidates = createCandidates();
  const initial = autoFillSquadDraft({
    members: createEmptySquadDraft(),
    candidates,
    random: seededRandom(31),
  });
  assert.ok(initial);

  const starterIds = new Set(
    initial.members.flatMap((member) =>
      member.lineupRole === "starter" && member.fantasyPlayerId
        ? [member.fantasyPlayerId]
        : [],
    ),
  );
  const bestDefenderId = candidates.find(
    (candidate) =>
      starterIds.has(candidate.id) && candidate.position === "defender",
  )?.id;
  const bestGoalkeeperId = candidates.find(
    (candidate) =>
      starterIds.has(candidate.id) && candidate.position === "goalkeeper",
  )?.id;
  assert.ok(bestDefenderId);
  assert.ok(bestGoalkeeperId);
  const priorityCandidates = candidates.map((candidate) => ({
    ...candidate,
    tier:
      candidate.id === bestDefenderId || candidate.id === bestGoalkeeperId
        ? 1
        : 2,
  }));
  const result = autoFillSquadDraft({
    members: initial.members.map((member) => ({
      ...member,
      captainRole: "none" as const,
    })),
    candidates: priorityCandidates,
    random: seededRandom(37),
  });

  assert.ok(result);
  const lineup = toLineup(result.members, priorityCandidates);
  assert.equal(
    lineup.find((player) => player.captainRole === "captain")?.position,
    "defender",
  );
  assert.equal(
    lineup.find((player) => player.captainRole === "vice_captain")?.position,
    "goalkeeper",
  );
});

test("uses forwards then midfielders when the best-tier starters tie", () => {
  const candidates = createCandidates();
  const initial = autoFillSquadDraft({
    members: createEmptySquadDraft(),
    candidates,
    random: seededRandom(41),
  });
  assert.ok(initial);

  const byId = new Map(
    candidates.map((candidate) => [candidate.id, candidate]),
  );
  const bestForwardId = initial.members.find(
    (member) =>
      member.lineupRole === "starter" &&
      member.fantasyPlayerId &&
      byId.get(member.fantasyPlayerId)?.position === "forward",
  )?.fantasyPlayerId;
  const bestMidfielderId = initial.members.find(
    (member) =>
      member.lineupRole === "starter" &&
      member.fantasyPlayerId &&
      byId.get(member.fantasyPlayerId)?.position === "midfielder",
  )?.fantasyPlayerId;
  assert.ok(bestForwardId);
  assert.ok(bestMidfielderId);
  const tiedCandidates = candidates.map((candidate) => ({
    ...candidate,
    tier:
      candidate.id === bestForwardId || candidate.id === bestMidfielderId
        ? 1
        : 2,
  }));
  const result = autoFillSquadDraft({
    members: initial.members.map((member) => ({
      ...member,
      captainRole: "none" as const,
    })),
    candidates: tiedCandidates,
    random: seededRandom(43),
  });

  assert.ok(result);
  const lineup = toLineup(result.members, tiedCandidates);
  assert.equal(
    lineup.find((player) => player.captainRole === "captain")?.position,
    "forward",
  );
  assert.equal(
    lineup.find((player) => player.captainRole === "vice_captain")?.position,
    "midfielder",
  );
});

test("preserves an existing captain and fills only the missing vice-captain", () => {
  const candidates = createCandidates();
  const initial = autoFillSquadDraft({
    members: createEmptySquadDraft(),
    candidates,
    random: seededRandom(47),
  });
  assert.ok(initial);

  const byId = new Map(
    candidates.map((candidate) => [candidate.id, candidate]),
  );
  const preservedCaptain = initial.members.find(
    (member) =>
      member.lineupRole === "starter" &&
      member.fantasyPlayerId &&
      byId.get(member.fantasyPlayerId)?.position === "defender",
  );
  assert.ok(preservedCaptain?.fantasyPlayerId);
  const priorityCandidates = candidates.map((candidate) => ({
    ...candidate,
    tier:
      candidate.position === "forward" || candidate.position === "midfielder"
        ? 1
        : 2,
  }));
  const result = autoFillSquadDraft({
    members: initial.members.map((member) => ({
      ...member,
      captainRole:
        member.fantasyPlayerId === preservedCaptain.fantasyPlayerId
          ? ("captain" as const)
          : ("none" as const),
    })),
    candidates: priorityCandidates,
    random: seededRandom(53),
  });

  assert.ok(result);
  const lineup = toLineup(result.members, priorityCandidates);
  assert.equal(
    lineup.find((player) => player.captainRole === "captain")?.id,
    preservedCaptain.fantasyPlayerId,
  );
  assert.equal(
    lineup.find((player) => player.captainRole === "captain")?.lineupRole,
    "starter",
  );
  assert.equal(
    lineup.find((player) => player.captainRole === "vice_captain")?.position,
    "forward",
  );
});

test("rebuilds the strongest valid starting eleven from the complete squad", () => {
  const candidates: AutoFillCandidate[] = [
    ["gk-1", "goalkeeper", 1, true],
    ["gk-2", "goalkeeper", 4, true],
    ["def-1", "defender", 1, false],
    ["def-2", "defender", 2, false],
    ["def-3", "defender", 3, false],
    ["def-4", "defender", 4, false],
    ["def-5", "defender", 4, false],
    ["mid-1", "midfielder", 1, false],
    ["mid-2", "midfielder", 2, false],
    ["mid-3", "midfielder", 2, false],
    ["mid-4", "midfielder", 3, false],
    ["mid-5", "midfielder", 3, false],
    ["fwd-1", "forward", 4, false],
    ["fwd-2", "forward", 4, false],
    ["fwd-3", "forward", 4, false],
  ].map(([id, position, tier, isLikelyClubStartingGoalkeeper], index) => ({
    id: id as string,
    clubId: `club-${index}`,
    position: position as AutoFillCandidate["position"],
    tier: tier as number,
    isThai: true,
    isLikelyClubStartingGoalkeeper: isLikelyClubStartingGoalkeeper as boolean,
  }));
  const idsByPosition = new Map(
    positions.map((position) => [
      position,
      candidates
        .filter((candidate) => candidate.position === position)
        .map((candidate) => candidate.id),
    ]),
  );
  const members = createEmptySquadDraft().map((member) => {
    const position = member.vacancyPosition!;
    const fantasyPlayerId = idsByPosition.get(position)?.shift();
    assert.ok(fantasyPlayerId);
    return {
      ...member,
      fantasyPlayerId,
      vacancyPosition: null,
    };
  });
  assert.equal(
    members.find((member) => member.fantasyPlayerId === "mid-5")?.lineupRole,
    "bench",
  );

  const result = autoFillSquadDraft({
    members,
    candidates,
    random: seededRandom(59),
  });

  assert.ok(result);
  const lineup = toLineup(result.members, candidates);
  assert.deepEqual(validateLineup(lineup), []);
  assert.equal(
    lineup.filter((player) => player.tier <= 3 && player.lineupRole === "bench")
      .length,
    0,
  );
  assert.equal(
    lineup.find((player) => player.id === "mid-5")?.lineupRole,
    "starter",
  );
  assert.deepEqual(
    lineup
      .filter(
        (player) =>
          player.lineupRole === "bench" && player.position !== "goalkeeper",
      )
      .sort((left, right) => left.benchOrder! - right.benchOrder!)
      .map((player) => player.tier),
    [4, 4, 4],
  );
});

test("the same seed is repeatable while different seeds provide variety", () => {
  const candidates = createCandidates();
  const first = autoFillSquadDraft({
    members: createEmptySquadDraft(),
    candidates,
    random: seededRandom(19),
  });
  const repeated = autoFillSquadDraft({
    members: createEmptySquadDraft(),
    candidates,
    random: seededRandom(19),
  });
  const different = autoFillSquadDraft({
    members: createEmptySquadDraft(),
    candidates,
    random: seededRandom(23),
  });

  assert.ok(first && repeated && different);
  assert.deepEqual(first.addedPlayerIds, repeated.addedPlayerIds);
  assert.notDeepEqual(first.addedPlayerIds, different.addedPlayerIds);
});

test("candidate input order does not act as an implicit ranking", () => {
  const candidates = createCandidates();
  const ordered = autoFillSquadDraft({
    members: createEmptySquadDraft(),
    candidates,
    random: seededRandom(29),
  });
  const reversed = autoFillSquadDraft({
    members: createEmptySquadDraft(),
    candidates: [...candidates].reverse(),
    random: seededRandom(29),
  });

  assert.ok(ordered && reversed);
  assert.deepEqual(ordered, reversed);
});

test("returns null when no valid club allocation can fill the squad", () => {
  const candidates = createCandidates().map((candidate) => ({
    ...candidate,
    clubId: "only-club",
  }));
  const result = autoFillSquadDraft({
    members: createEmptySquadDraft(),
    candidates,
    random: seededRandom(5),
  });

  assert.equal(result, null);
});
