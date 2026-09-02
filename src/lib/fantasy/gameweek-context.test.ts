import assert from "node:assert/strict";
import test from "node:test";

import { resolveFantasyGameweekContext } from "./gameweek-context.ts";

test("prefers the open Gameweek over planned successors", () => {
  const result = resolveFantasyGameweekContext([
    { number: 3, status: "planned" },
    { number: 1, status: "final" },
    { number: 2, status: "open" },
  ]);

  assert.equal(result?.gameweek.number, 2);
  assert.equal(result?.canProvisionSelection, true);
  assert.equal(result?.seasonFinished, false);
});

test("uses the first planned Gameweek before play begins", () => {
  const result = resolveFantasyGameweekContext([
    { number: 2, status: "planned" },
    { number: 1, status: "planned" },
  ]);

  assert.equal(result?.gameweek.number, 1);
  assert.equal(result?.canProvisionSelection, true);
  assert.equal(result?.seasonFinished, false);
});

test("keeps the final provisional Gameweek readable without provisioning", () => {
  const result = resolveFantasyGameweekContext([
    { number: 29, status: "final" },
    { number: 30, status: "provisional" },
  ]);

  assert.equal(result?.gameweek.number, 30);
  assert.equal(result?.canProvisionSelection, false);
  assert.equal(result?.seasonFinished, false);
});

test("keeps a completed season readable at its latest final Gameweek", () => {
  const result = resolveFantasyGameweekContext([
    { number: 30, status: "final" },
    { number: 1, status: "final" },
  ]);

  assert.equal(result?.gameweek.number, 30);
  assert.equal(result?.canProvisionSelection, false);
  assert.equal(result?.seasonFinished, true);
});

test("returns null when the season has no Gameweeks", () => {
  assert.equal(resolveFantasyGameweekContext([]), null);
});
