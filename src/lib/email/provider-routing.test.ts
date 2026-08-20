import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveEmailProviderOrder,
  shouldTryNextProvider,
} from "./provider-routing.ts";

test("defaults to Resend with Mailjet fallback", () => {
  assert.deepEqual(resolveEmailProviderOrder(undefined), ["resend", "mailjet"]);
  assert.deepEqual(resolveEmailProviderOrder(""), ["resend", "mailjet"]);
});

test("honors an explicit active-provider order and removes duplicates", () => {
  assert.deepEqual(resolveEmailProviderOrder("mailjet,resend,mailjet"), [
    "mailjet",
    "resend",
  ]);
});

test("rejects removed or unknown providers instead of silently using them", () => {
  assert.throws(
    () => resolveEmailProviderOrder("resend,brevo,mailjet"),
    /Unsupported transactional email provider: brevo/,
  );
  assert.throws(
    () => resolveEmailProviderOrder("postmark"),
    /Unsupported transactional email provider: postmark/,
  );
});

test("falls through only when another provider can safely retry", () => {
  for (const status of [402, 403, 429, 500, 503]) {
    assert.equal(shouldTryNextProvider(status), true);
  }
  for (const status of [0, 400, 401, 404]) {
    assert.equal(shouldTryNextProvider(status), false);
  }
});
