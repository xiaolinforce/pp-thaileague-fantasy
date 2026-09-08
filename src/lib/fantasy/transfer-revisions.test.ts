import assert from "node:assert/strict";
import test from "node:test";

import { getTransferRevisionState } from "./transfer-revisions.ts";

test("treats the carried revision as the normal Gameweek baseline", () => {
  assert.deepEqual(
    getTransferRevisionState(
      [
        { revision: 1, status: "confirmed", squad: ["a", "b"] },
        { revision: 2, status: "confirmed", squad: ["a", "c"] },
      ],
      false,
    ),
    {
      baselineRevision: 1,
      baselineSquadIds: ["a", "b"],
      hasPendingChanges: true,
    },
  );
});

test("treats every confirmed opening-Gameweek revision as revertible", () => {
  assert.deepEqual(
    getTransferRevisionState(
      [{ revision: 4, status: "confirmed", squad: ["a", "b"] }],
      true,
    ),
    {
      baselineRevision: null,
      baselineSquadIds: ["a", "b"],
      hasPendingChanges: true,
    },
  );
});

test("ignores cancelled revisions when finding the active baseline", () => {
  assert.deepEqual(
    getTransferRevisionState(
      [
        { revision: 1, status: "cancelled", squad: ["old"] },
        { revision: 2, status: "cancelled", squad: [] },
        { revision: 3, status: "confirmed", squad: ["new"] },
      ],
      true,
    ),
    {
      baselineRevision: null,
      baselineSquadIds: ["new"],
      hasPendingChanges: true,
    },
  );
});

test("reports no pending normal changes after later revisions are cancelled", () => {
  assert.deepEqual(
    getTransferRevisionState(
      [
        { revision: 1, status: "confirmed", squad: ["a", "b"] },
        { revision: 2, status: "cancelled", squad: ["a", "c"] },
        { revision: 3, status: "cancelled", squad: ["a", "b"] },
      ],
      false,
    ),
    {
      baselineRevision: 1,
      baselineSquadIds: ["a", "b"],
      hasPendingChanges: false,
    },
  );
});
