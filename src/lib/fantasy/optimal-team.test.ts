import assert from "node:assert/strict";
import test from "node:test";

import { findOptimalTeam, type OptimalTeamCandidate } from "./optimal-team.ts";
import type { FantasyPosition } from "./rules.ts";

const positionCounts: Record<FantasyPosition, number> = {
  goalkeeper: 2,
  defender: 5,
  midfielder: 5,
  forward: 3,
};

function legalPool(multiplier = 1): OptimalTeamCandidate[] {
  const candidates: OptimalTeamCandidate[] = [];
  let index = 0;
  for (const [position, count] of Object.entries(positionCounts) as Array<
    [FantasyPosition, number]
  >) {
    for (let copy = 0; copy < count * multiplier; copy += 1) {
      candidates.push({
        id: `${position}-${copy}`,
        clubId: `club-${index % Math.max(5, multiplier * 4)}`,
        position,
        tier:
          multiplier === 1
            ? ([1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4][index] ?? 4)
            : (index % 4) + 1,
        isThai: index % 3 !== 0,
        minutes: 90,
        points: 20 - copy,
      });
      index += 1;
    }
  }
  return candidates;
}

test("finds a legal squad and applies normal captain scoring", () => {
  const result = findOptimalTeam(legalPool());
  assert.ok(result);
  assert.equal(result.members.length, 15);
  assert.equal(
    result.members.filter((member) => member.lineupRole === "starter").length,
    11,
  );
  assert.equal(
    result.members.filter((member) => member.captainRole === "captain").length,
    1,
  );
  assert.equal(
    result.members.filter((member) => member.captainRole === "vice_captain")
      .length,
    1,
  );
  assert.equal(result.score.transferPoints, 0);
  assert.equal(
    result.score.totalPoints,
    result.score.lineupPoints + result.score.captainBonus,
  );
});

test("returns a deterministic result when scores tie", () => {
  const pool = legalPool().map((candidate) => ({ ...candidate, points: 2 }));
  assert.deepEqual(findOptimalTeam(pool), findOptimalTeam([...pool].reverse()));
});

test("uses score-ordered captaincy and the strongest legal bench", () => {
  const starterScores = new Map([
    ["goalkeeper-0", 30],
    ["defender-0", 29],
    ["defender-1", 28],
    ["defender-2", 27],
    ["midfielder-0", 26],
    ["midfielder-1", 25],
    ["midfielder-2", 24],
    ["midfielder-3", 23],
    ["forward-0", 22],
    ["forward-1", 21],
    ["forward-2", 20],
  ]);
  const pool = legalPool().map((candidate) => ({
    ...candidate,
    points: starterScores.get(candidate.id) ?? 0,
  }));
  const clone = (
    sourceId: string,
    replacementId: string,
    points: number,
  ): OptimalTeamCandidate => {
    const source = pool.find((candidate) => candidate.id === sourceId);
    assert.ok(source);
    return {
      ...source,
      id: replacementId,
      clubId: `club-${replacementId}`,
      tier: 4,
      points,
    };
  };

  const result = findOptimalTeam([
    ...pool,
    clone("goalkeeper-1", "bench-goalkeeper", 6),
    clone("defender-3", "bench-defender-1", 8),
    clone("defender-4", "bench-defender-2", 7),
    clone("midfielder-4", "bench-midfielder", 9),
  ]);

  assert.ok(result);
  assert.equal(result.score.autoSubstitutions.length, 0);
  assert.equal(
    result.members.find((member) => member.captainRole === "captain")?.id,
    "goalkeeper-0",
  );
  assert.equal(
    result.members.find((member) => member.captainRole === "vice_captain")?.id,
    "defender-0",
  );

  const countedIds = new Set(result.score.countedPlayerIds);
  assert.deepEqual(
    result.members
      .filter((member) => !countedIds.has(member.id))
      .map((member) => member.points)
      .sort((left, right) => right - left),
    [9, 8, 7, 6],
  );
  assert.deepEqual(
    result.members
      .filter(
        (member) =>
          member.lineupRole === "bench" && member.position !== "goalkeeper",
      )
      .sort((left, right) => (left.benchOrder ?? 99) - (right.benchOrder ?? 99))
      .map((member) => member.points),
    [9, 8, 7],
  );
});

test("does not put the captain badge on a zero-minute starter", () => {
  const scores = new Map([
    ["goalkeeper-0", 30],
    ["defender-0", 29],
    ["defender-1", 28],
    ["midfielder-0", 27],
    ["midfielder-1", 26],
    ["midfielder-2", 25],
    ["midfielder-3", 24],
    ["midfielder-4", 23],
    ["forward-0", 22],
    ["forward-1", 21],
    ["forward-2", 20],
  ]);
  const pool = legalPool().map((candidate) => ({
    ...candidate,
    minutes:
      candidate.position === "defender" &&
      candidate.id !== "defender-0" &&
      candidate.id !== "defender-1"
        ? 0
        : candidate.minutes,
    points: scores.get(candidate.id) ?? 0,
  }));

  const result = findOptimalTeam(pool);

  assert.ok(result);
  assert.equal(
    result.members.find((member) => member.captainRole === "captain")?.id,
    "goalkeeper-0",
  );
  assert.equal(
    result.members.find((member) => member.captainRole === "vice_captain")?.id,
    "defender-0",
  );
});

test("certifies the exact result when the linear upper bound is loose", () => {
  const pool = legalPool().map((candidate) => ({ ...candidate, points: -1 }));
  const result = findOptimalTeam(pool);

  assert.ok(result);
  assert.equal(result.score.lineupPoints, -11);
  assert.equal(result.score.captainBonus, -1);
  assert.equal(result.score.totalPoints, -12);
});

test("handles a production-sized player pool", { timeout: 5_000 }, () => {
  const pool = legalPool(31).slice(0, 462);
  const result = findOptimalTeam(pool);
  assert.ok(result);
  assert.equal(result.members.length, 15);
});

test(
  "handles a production-shaped sparse score distribution",
  { timeout: 5_000 },
  () => {
    const scoreBand = [14, 12, 10, 10, 8, 8, 8, 7, 7, 7, 7, 7, 6, 6, 6];
    const pool = legalPool(31)
      .slice(0, 462)
      .map((candidate, index) => ({
        ...candidate,
        clubId: `club-${index % 16}`,
        tier: (index % 4) + 1,
        isThai: index % 3 !== 0,
        minutes: index < 249 ? 90 : 0,
        points: index < 231 ? (scoreBand[index] ?? 2) : 0,
      }));

    const result = findOptimalTeam(pool);
    assert.ok(result);
    assert.equal(result.members.length, 15);
  },
);
