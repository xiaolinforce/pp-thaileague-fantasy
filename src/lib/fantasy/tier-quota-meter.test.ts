import assert from "node:assert/strict";
import test from "node:test";

import { buildTierQuotaMeter } from "./tier-quota-meter.ts";

test("shows actual player counts in tier order", () => {
  assert.deepEqual(buildTierQuotaMeter({ 1: 1, 2: 1, 3: 1 }), [
    1,
    2,
    3,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ]);
});

test("fills all twelve circles from left to right", () => {
  assert.deepEqual(
    buildTierQuotaMeter({ 1: 3, 2: 3, 3: 6 }),
    [1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 3],
  );
});

test("shows players beyond an individual tier quota", () => {
  assert.deepEqual(buildTierQuotaMeter({ 1: 4, 2: 4, 3: 0 }), [
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    null,
    null,
    null,
    null,
  ]);
});

test("limits the meter to twelve circles and prioritizes higher tiers", () => {
  assert.deepEqual(
    buildTierQuotaMeter({ 1: 4, 2: 4, 3: 6 }),
    [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3],
  );
});

test("uses all twelve circles for the highest tier before lower tiers", () => {
  assert.deepEqual(
    buildTierQuotaMeter({ 1: 13, 2: 2, 3: 2 }),
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  );
});
