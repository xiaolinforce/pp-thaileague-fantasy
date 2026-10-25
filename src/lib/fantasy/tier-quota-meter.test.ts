import assert from "node:assert/strict";
import test from "node:test";
import { buildTierQuotaMeter } from "./tier-quota-meter.ts";

test("shows five allowance circles including unused Level 1 places", () => {
  assert.deepEqual(buildTierQuotaMeter({ 1: 0 }), [
    null,
    null,
    null,
    null,
    null,
  ]);
  assert.deepEqual(buildTierQuotaMeter({ 1: 3 }), [1, 1, 1, null, null]);
  assert.deepEqual(buildTierQuotaMeter({ 1: 5 }), [1, 1, 1, 1, 1]);
});

test("caps the dots while the accessible count reports overflow", () => {
  assert.deepEqual(buildTierQuotaMeter({ 1: 6 }), [1, 1, 1, 1, 1]);
});
