import assert from "node:assert/strict";
import test from "node:test";
import {
  isTierOneAllowed,
  reliefAfterTierChange,
  remainingTierRelief,
} from "./tier-relief.ts";
import {
  validateSquad,
  THAI_LEAGUE_FANTASY_RULES,
  LEGACY_FANTASY_RULES,
} from "./rules.ts";

const squad = (count: number) =>
  Array.from({ length: 15 }, (_, i) => ({
    id: `p${i}`,
    tier: i < count ? 1 : 2,
  }));
const ids = (count: number) =>
  squad(count)
    .filter((p) => p.tier === 1)
    .map((p) => p.id);

test("five is normal; six requires explicit identities, not just a higher limit", () => {
  assert.ok(isTierOneAllowed(squad(5)));
  assert.equal(isTierOneAllowed(squad(6)), false);
  assert.ok(isTierOneAllowed(squad(8), ids(8)));
  const substituted = squad(7).map((p, i) =>
    i === 0 ? { ...p, id: "new" } : p,
  );
  assert.equal(isTierOneAllowed(substituted, ids(8)), false);
  assert.throws(() => remainingTierRelief(substituted, ids(8)));
});

test("saving progressively shrinks rights; unsaved undo and final five work", () => {
  const seven = squad(8).map((p, i) =>
    i === 0 ? { id: "replacement", tier: 2 } : p,
  );
  const remaining = remainingTierRelief(seven, ids(8));
  assert.equal(remaining.length, 7);
  assert.equal(isTierOneAllowed(squad(8), remaining), false);
  assert.ok(isTierOneAllowed(squad(8), ids(8))); // unsaved undo
  const five = squad(5).map((p, i) => (i === 0 ? { ...p, id: "new" } : p));
  assert.ok(isTierOneAllowed(five, remaining));
  assert.deepEqual(remainingTierRelief(five, remaining), []);
  assert.equal(isTierOneAllowed(squad(6), []), false);
});

test("multiple classification events add only current identities and can reopen ended rights", () => {
  const first = reliefAfterTierChange(squad(5), squad(7));
  assert.deepEqual(first, ids(7));
  const second = reliefAfterTierChange(squad(7), squad(8), first);
  assert.deepEqual(second, ids(8));
  assert.deepEqual(reliefAfterTierChange(squad(8), squad(5), second), []);
  assert.deepEqual(reliefAfterTierChange(squad(5), squad(6)), ids(6));
  const current = squad(7).map((p, i) =>
    i === 0 ? { id: "new-level-two", tier: 2 } : p,
  );
  const shrunk = remainingTierRelief(current, first);
  const promoted = current.map((p) =>
    p.id === "new-level-two" ? { ...p, tier: 1 } : p,
  );
  const updated = reliefAfterTierChange(current, promoted, shrunk);
  assert.ok(updated.includes("new-level-two"));
  assert.equal(updated.includes("p0"), false);
});

test("events do not legitimize unrelated excess, incomplete squads or a different roster", () => {
  assert.deepEqual(reliefAfterTierChange(squad(7), squad(8)), []);
  assert.deepEqual(
    reliefAfterTierChange(squad(5).slice(1), squad(7).slice(1)),
    [],
  );
  assert.deepEqual(
    reliefAfterTierChange(
      squad(5),
      squad(7).map((p, i) => (i === 0 ? { ...p, id: "new" } : p)),
    ),
    [],
  );
});

test("relief waives only the new Level 1 quota; all other rules and legacy tiers stay strict", () => {
  const positions = [
    "goalkeeper",
    "goalkeeper",
    ...Array(5).fill("defender"),
    ...Array(5).fill("midfielder"),
    ...Array(3).fill("forward"),
  ] as const;
  const players = squad(8).map((p, i) => ({
    ...p,
    position: positions[i],
    clubId: `c${Math.floor(i / 3)}`,
    isThai: true,
  }));
  assert.deepEqual(
    validateSquad(players, THAI_LEAGUE_FANTASY_RULES, ids(8)),
    [],
  );
  assert.ok(validateSquad(players).some((v) => v.code === "tier_quota"));
  assert.ok(
    validateSquad(players, LEGACY_FANTASY_RULES, ids(8)).some(
      (v) => v.code === "tier_quota",
    ),
  );
  const invalid = players.map((p) => ({ ...p, clubId: "same", isThai: false }));
  const violations = validateSquad(invalid, THAI_LEAGUE_FANTASY_RULES, ids(8));
  assert.ok(violations.some((v) => v.code === "club_quota"));
  assert.ok(violations.some((v) => v.code === "foreign_quota"));
});
