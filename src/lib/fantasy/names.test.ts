import assert from "node:assert/strict";
import test from "node:test";

import {
  createGuestTeamName,
  normalizeFantasyName,
  validateFantasyName,
} from "../auth/names.ts";

test("normalizes surrounding and repeated spaces", () => {
  assert.equal(
    normalizeFantasyName("  เมืองทอง   ยูไนเต็ด  "),
    "เมืองทอง ยูไนเต็ด",
  );
});

test("accepts the documented Thai and English name characters", () => {
  assert.deepEqual(validateFantasyName("PP_ทีม-2026.FC"), {
    ok: true,
    value: "PP_ทีม-2026.FC",
  });
});

test("rejects short, unsupported, and impersonating names", () => {
  assert.equal(validateFantasyName("ab").ok, false);
  assert.equal(validateFantasyName("ทีม⚽").ok, false);
  assert.equal(
    validateFantasyName("PP Thai League Fantasy Official").ok,
    false,
  );
  assert.equal(validateFantasyName("ทีมเหี้ย").ok, false);
});

test("creates a non-editable guest team-name pattern", () => {
  assert.match(createGuestTeamName(), /^guest-team-[A-Z2-9]{6}$/);
});
