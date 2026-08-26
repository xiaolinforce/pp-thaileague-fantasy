import assert from "node:assert/strict";
import test from "node:test";

import { buildTierQuotaMeter } from "./tier-quota-meter.ts";

test("starts each player level in its own three-circle group", () => {
  assert.deepEqual(buildTierQuotaMeter({ 1: 1, 2: 1, 3: 1 }), [
    1,
    null,
    null,
    2,
    null,
    null,
    3,
    null,
    null,
  ]);
});

test("fills each nominal three-circle group from left to right", () => {
  assert.deepEqual(
    buildTierQuotaMeter({ 1: 3, 2: 3, 3: 3 }),
    [1, 1, 1, 2, 2, 2, 3, 3, 3],
  );
});

test("moves extra level 2 players backward through circles 3 to 1", () => {
  assert.deepEqual(buildTierQuotaMeter({ 1: 1, 2: 5, 3: 0 }), [
    1,
    2,
    2,
    2,
    2,
    2,
    null,
    null,
    null,
  ]);
});

test("moves extra level 3 players backward and skips occupied circles", () => {
  assert.deepEqual(
    buildTierQuotaMeter({ 1: 1, 2: 2, 3: 6 }),
    [1, 3, 3, 2, 2, 3, 3, 3, 3],
  );
});
