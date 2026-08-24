import assert from "node:assert/strict";
import test from "node:test";

import { createEmptySquadDraft } from "./team-draft.ts";
import { validateLineup, type LineupPlayer } from "./rules.ts";
import { autoFillSquadDraft, type AutoFillCandidate } from "./auto-fill.ts";

const positions = ["goalkeeper", "defender", "midfielder", "forward"] as const;

function createCandidates() {
  const candidates: AutoFillCandidate[] = [];
  let rank = 1;
  for (const position of positions) {
    for (const tier of [1, 2, 3]) {
      for (let index = 0; index < 12; index += 1) {
        candidates.push({
          id: `${position}-${tier}-${index}`,
          clubId: `club-${index % 8}`,
          position,
          tier,
          isThai: index % 3 !== 0,
          projectedPoints: 240 - rank * 0.4,
          overallRank: rank,
        });
        rank += 1;
      }
    }
  }
  return candidates;
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
  assert.equal(lineup.filter((player) => player.tier === 2).length, 7);
  assert.equal(lineup.filter((player) => player.tier === 3).length, 5);
  assert.equal(
    lineup.filter((player) => player.captainRole === "captain").length,
    1,
  );
  assert.equal(
    lineup.filter((player) => player.captainRole === "vice_captain").length,
    1,
  );
  const rankedStarters = lineup
    .filter((player) => player.lineupRole === "starter")
    .sort(
      (left, right) =>
        right.projectedPoints - left.projectedPoints ||
        left.overallRank - right.overallRank,
    );
  assert.equal(
    lineup.find((player) => player.captainRole === "captain")?.id,
    rankedStarters[0].id,
  );
  assert.equal(
    lineup.find((player) => player.captainRole === "vice_captain")?.id,
    rankedStarters[1].id,
  );
  for (const position of positions) {
    const starterPoints = lineup
      .filter(
        (player) =>
          player.position === position && player.lineupRole === "starter",
      )
      .map((player) => player.projectedPoints);
    const benchPoints = lineup
      .filter(
        (player) =>
          player.position === position && player.lineupRole === "bench",
      )
      .map((player) => player.projectedPoints);
    if (starterPoints.length > 0 && benchPoints.length > 0) {
      assert.ok(Math.min(...starterPoints) >= Math.max(...benchPoints));
    }
  }
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
