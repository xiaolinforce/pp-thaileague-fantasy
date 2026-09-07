import assert from "node:assert/strict";
import test from "node:test";

import {
  authCompleteHref,
  DEFAULT_AUTH_RETURN_TO,
  normalizeAuthReturnTo,
} from "./return-to.ts";

test("keeps supported internal destinations and their invite query", () => {
  assert.equal(
    normalizeAuthReturnTo("/leagues?join=ABCD2345"),
    "/leagues?join=ABCD2345",
  );
  assert.equal(
    normalizeAuthReturnTo("/leagues/league-id?page=2"),
    "/leagues/league-id?page=2",
  );
  assert.equal(normalizeAuthReturnTo(" /profile "), "/profile");
});

test("rejects external, malformed, and unsupported destinations", () => {
  for (const value of [
    undefined,
    "",
    "https://example.com",
    "//example.com",
    "/%2F%2Fexample.com",
    "/%5Cexample.com",
    "/admin/fantasy",
    "/auth/complete",
  ]) {
    assert.equal(normalizeAuthReturnTo(value), DEFAULT_AUTH_RETURN_TO);
  }
});

test("builds a callback URL without changing the internal destination", () => {
  assert.equal(authCompleteHref(DEFAULT_AUTH_RETURN_TO), "/auth/complete");
  assert.equal(
    authCompleteHref("/leagues?join=ABCD2345"),
    "/auth/complete?returnTo=%2Fleagues%3Fjoin%3DABCD2345",
  );
});
