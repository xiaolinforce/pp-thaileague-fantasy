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

test("handles a production-sized player pool", { timeout: 5_000 }, () => {
  const pool = legalPool(31).slice(0, 462);
  const result = findOptimalTeam(pool);
  assert.ok(result);
  assert.equal(result.members.length, 15);
});
