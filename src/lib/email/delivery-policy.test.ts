import assert from "node:assert/strict";
import test from "node:test";
import { acceptedMessageId, quotaState } from "./delivery-policy.ts";

test("warns at 80%, stops at 90%, and checks both daily and monthly budgets", () => {
  const limits = { dailyLimit: 100, monthlyLimit: 3000 };
  assert.equal(quotaState({ daily: 79, monthly: 2399 }, limits), "available");
  assert.equal(quotaState({ daily: 80, monthly: 1 }, limits), "near_quota");
  assert.equal(quotaState({ daily: 1, monthly: 2400 }, limits), "near_quota");
  assert.equal(quotaState({ daily: 90, monthly: 1 }, limits), "exhausted");
  assert.equal(quotaState({ daily: 1, monthly: 2700 }, limits), "exhausted");
});

test("Mailjet success requires per-message acceptance and a tracking id", () => {
  assert.equal(
    acceptedMessageId("mailjet", {
      Messages: [{ Status: "success", To: [{ MessageID: 123 }] }],
    }),
    "123",
  );
  assert.throws(
    () =>
      acceptedMessageId("mailjet", {
        Messages: [{ Status: "error", Errors: [{ StatusCode: 429 }] }],
      }),
    { status: 429 },
  );
  for (const body of [
    null,
    {},
    { Messages: [] },
    { Messages: [{ Status: "success" }] },
  ]) {
    assert.throws(() => acceptedMessageId("mailjet", body), /unknown/);
  }
  assert.equal(
    acceptedMessageId("resend", { id: "accepted-id" }),
    "accepted-id",
  );
  assert.throws(() => acceptedMessageId("resend", {}), /unknown/);
});
