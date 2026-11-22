import assert from "node:assert/strict";
import test from "node:test";
import { buildTierQuotaMeter } from "./tier-quota-meter.ts";

test("shows five allowance circles including unused Level 1 places", () => {
  assert.deepEqual(buildTierQuotaMeter(0), Array(5).fill("empty"));
  assert.deepEqual(buildTierQuotaMeter(3), [
    "filled",
    "filled",
    "filled",
    "empty",
    "empty",
  ]);
  assert.deepEqual(buildTierQuotaMeter(5), Array(5).fill("filled"));
});

test("appends one overflow circle per Level 1 player above the limit", () => {
  assert.deepEqual(buildTierQuotaMeter(8), [
    ...Array(5).fill("filled"),
    "overflow",
    "overflow",
    "overflow",
  ]);
});
