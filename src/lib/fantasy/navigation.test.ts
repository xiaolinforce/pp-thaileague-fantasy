import assert from "node:assert/strict";
import test from "node:test";

import { isPointsNavigationDisabled } from "./navigation.ts";

test("disables Points only while Gameweek 1 is open", () => {
  assert.equal(isPointsNavigationDisabled({ number: 1, status: "open" }), true);
  assert.equal(
    isPointsNavigationDisabled({ number: 1, status: "planned" }),
    false,
  );
  assert.equal(
    isPointsNavigationDisabled({ number: 1, status: "provisional" }),
    false,
  );
  assert.equal(
    isPointsNavigationDisabled({ number: 1, status: "final" }),
    false,
  );
  assert.equal(
    isPointsNavigationDisabled({ number: 2, status: "open" }),
    false,
  );
  assert.equal(isPointsNavigationDisabled(null), false);
});
