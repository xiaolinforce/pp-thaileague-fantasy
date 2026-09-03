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
          overallRank: candidates.length + 1,
          projectedPoints: 500 - tier * 50 - index,
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

function createSingleVacancyFixture(
  seed: number,
  predicate: (candidate: AutoFillCandidate) => boolean = (candidate) =>
    candidate.position !== "goalkeeper",
) {
  const candidates = createCandidates();
  const initial = autoFillSquadDraft({
    members: createEmptySquadDraft(),
    candidates,
    random: seededRandom(seed),
  });
  assert.ok(initial);
  const candidatesById = new Map(
    candidates.map((candidate) => [candidate.id, candidate]),
  );
  const removedMember = initial.members.find(
    (member) =>
      member.captainRole === "none" &&
      member.fantasyPlayerId &&
      Boolean(
        candidatesById.get(member.fantasyPlayerId) &&
        predicate(candidatesById.get(member.fantasyPlayerId)!),
      ),
  );
  assert.ok(removedMember?.fantasyPlayerId);
  const removedCandidate = candidatesById.get(removedMember.fantasyPlayerId);
  assert.ok(removedCandidate);
  const members = initial.members.map((member) =>
    member.slotId === removedMember.slotId
      ? {
          ...member,
          fantasyPlayerId: null,
          vacancyPosition: removedCandidate.position,
          captainRole: "none" as const,
        }
      : member,
  );
  const occupiedIds = new Set(
    members.flatMap((member) =>
      member.fantasyPlayerId ? [member.fantasyPlayerId] : [],
    ),
  );
  return {
    candidates: candidates.filter((candidate) => occupiedIds.has(candidate.id)),
    members,
    removedCandidate,
  };
}

test("classifies each club's best-tier goalkeepers and preserves ties", () => {
  const candidates: AutoFillCandidate[] = [
    {
      id: "club-a-first",
      clubId: "club-a",
      position: "goalkeeper",
      tier: 2,
      overallRank: 10,
      projectedPoints: 100,
      isThai: true,
      isLikelyClubStartingGoalkeeper: false,
    },
    {
      id: "club-a-backup",
      clubId: "club-a",
      position: "goalkeeper",
      tier: 3,
      overallRank: 20,
      projectedPoints: 90,
      isThai: true,
      isLikelyClubStartingGoalkeeper: false,
    },
    {
      id: "club-b-tied-one",
      clubId: "club-b",
      position: "goalkeeper",
      tier: 1,
      overallRank: 1,
      projectedPoints: 120,
      isThai: false,
      isLikelyClubStartingGoalkeeper: false,
    },
    {
      id: "club-b-tied-two",
      clubId: "club-b",
      position: "goalkeeper",
      tier: 1,
      overallRank: 2,
      projectedPoints: 119,
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
    projectedPoints:
      candidate.id === preferredGoalkeeperId
        ? 0
        : candidate.projectedPoints + 1_000,
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
  const originalAssignmentsBySlotId = new Map(
    partial.map((member) => [
      member.slotId,
      {
        lineupRole: member.lineupRole,
        benchOrder: member.benchOrder,
      },
    ]),
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
  for (const member of result.members) {
    assert.deepEqual(
      {
        lineupRole: member.lineupRole,
        benchOrder: member.benchOrder,
      },
      originalAssignmentsBySlotId.get(member.slotId),
    );
  }
});

test("randomizes only inside the best projected-points quality band", () => {
  const fixture = createSingleVacancyFixture(61);
  const ranks = [1_040, 1_010, 1_030, 1_020, 1_050, 1_060, 1_070, 1_080];
  const alternatives: AutoFillCandidate[] = ranks.map((overallRank, index) => ({
    id: `quality-option-${index}`,
    clubId: `quality-club-${index}`,
    position: fixture.removedCandidate.position,
    tier: fixture.removedCandidate.tier,
    overallRank,
    projectedPoints: index < 4 ? 1_000 : 900,
    isThai: fixture.removedCandidate.isThai,
    isLikelyClubStartingGoalkeeper: false,
  }));
  const expectedQualityPool = new Set([
    "quality-option-1",
    "quality-option-2",
    "quality-option-3",
  ]);
  const selectedIds = new Set<string>();

  for (let seed = 1; seed <= 12; seed += 1) {
    const result = autoFillSquadDraft({
      members: fixture.members,
      candidates: [...fixture.candidates, ...alternatives],
      random: seededRandom(seed),
    });
    assert.ok(result);
    assert.equal(result.addedPlayerIds.length, 1);
    assert.equal(expectedQualityPool.has(result.addedPlayerIds[0]), true);
    selectedIds.add(result.addedPlayerIds[0]);
  }

  assert.ok(selectedIds.size > 1);
});

test("falls through to the next quality band when the best band is invalid", () => {
  const fixture = createSingleVacancyFixture(67);
  const occupiedIds = fixture.members.flatMap((member) =>
    member.fantasyPlayerId ? [member.fantasyPlayerId] : [],
  );
  const saturatedIds = new Set(occupiedIds.slice(0, 3));
  const occupiedCandidates = fixture.candidates.map((candidate) => ({
    ...candidate,
    clubId: saturatedIds.has(candidate.id)
      ? "saturated-club"
      : candidate.clubId,
  }));
  const alternatives: AutoFillCandidate[] = Array.from(
    { length: 8 },
    (_, index) => ({
      id: `fallback-option-${index}`,
      clubId: index < 3 ? "saturated-club" : `fallback-club-${index}`,
      position: fixture.removedCandidate.position,
      tier: fixture.removedCandidate.tier,
      overallRank: 2_000 + index,
      projectedPoints: 1_000 - index,
      isThai: fixture.removedCandidate.isThai,
      isLikelyClubStartingGoalkeeper: false,
    }),
  );

  const result = autoFillSquadDraft({
    members: fixture.members,
    candidates: [...occupiedCandidates, ...alternatives],
    random: seededRandom(71),
  });

  assert.ok(result);
  assert.equal(result.addedPlayerIds.length, 1);
  assert.equal(
    new Set([
      "fallback-option-0",
      "fallback-option-1",
      "fallback-option-2",
    ]).has(result.addedPlayerIds[0]),
    false,
  );
});

test("maximizes foreign-player use before applying the quality band", () => {
  const fixture = createSingleVacancyFixture(
    73,
    (candidate) => candidate.position !== "goalkeeper" && !candidate.isThai,
  );
  const alternatives: AutoFillCandidate[] = Array.from(
    { length: 8 },
    (_, index) => ({
      id: `foreign-priority-option-${index}`,
      clubId: `foreign-priority-club-${index}`,
      position: fixture.removedCandidate.position,
      tier: fixture.removedCandidate.tier,
      overallRank: 3_000 + index,
      projectedPoints: index === 7 ? 1 : 1_000 - index,
      isThai: index !== 7,
      isLikelyClubStartingGoalkeeper: false,
    }),
  );

  const result = autoFillSquadDraft({
    members: fixture.members,
    candidates: [...fixture.candidates, ...alternatives],
    random: seededRandom(79),
  });

  assert.ok(result);
  assert.deepEqual(result.addedPlayerIds, ["foreign-priority-option-7"]);
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

test("uses quality bands before randomizing tied captaincy candidates", () => {
  const candidates = createCandidates();
  const initial = autoFillSquadDraft({
    members: createEmptySquadDraft(),
    candidates,
    random: seededRandom(83),
  });
  assert.ok(initial);
  const membersByPlayerId = new Map(
    initial.members.flatMap((member) =>
      member.fantasyPlayerId ? [[member.fantasyPlayerId, member]] : [],
    ),
  );
  const selectedCandidates = candidates
    .filter((candidate) => membersByPlayerId.has(candidate.id))
    .map((candidate) => {
      const member = membersByPlayerId.get(candidate.id)!;
      const positionTier =
        candidate.position === "midfielder"
          ? 1
          : candidate.position === "forward"
            ? 2
            : 3;
      return {
        ...candidate,
        tier: positionTier,
        projectedPoints:
          candidate.position === "midfielder" && member.lineupRole === "starter"
            ? 1_000 - member.slotId.charCodeAt(member.slotId.length - 1)
            : 1,
      };
    });
  const bestMidfielderIds = new Set(
    selectedCandidates
      .filter(
        (candidate) =>
          candidate.position === "midfielder" &&
          membersByPlayerId.get(candidate.id)?.lineupRole === "starter",
      )
      .sort(
        (left, right) =>
          right.projectedPoints - left.projectedPoints ||
          left.overallRank - right.overallRank,
      )
      .slice(0, 3)
      .map((candidate) => candidate.id),
  );

  const result = autoFillSquadDraft({
    members: initial.members.map((member) => ({
      ...member,
      captainRole: "none" as const,
    })),
    candidates: selectedCandidates,
    random: seededRandom(89),
  });

  assert.ok(result);
  assert.equal(
    bestMidfielderIds.has(
      result.members.find((member) => member.captainRole === "captain")
        ?.fantasyPlayerId ?? "",
    ),
    true,
  );
  assert.equal(
    bestMidfielderIds.has(
      result.members.find((member) => member.captainRole === "vice_captain")
        ?.fantasyPlayerId ?? "",
    ),
    true,
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
