import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import {
  createDeadlineUnsubscribeToken,
  hashRecipientEmail,
  verifyDeadlineUnsubscribeToken,
  verifyResendWebhook,
} from "./deadline-security.ts";

test("unsubscribe token identifies a user without exposing an email", () => {
  const secret = "test-secret-that-is-not-used-in-production";
  const userId = "member-123";
  const token = createDeadlineUnsubscribeToken(userId, secret);
  assert.equal(verifyDeadlineUnsubscribeToken(token, secret), userId);
  assert.equal(verifyDeadlineUnsubscribeToken(`${token}x`, secret), null);
  assert.equal(verifyDeadlineUnsubscribeToken(token, "other-secret"), null);
  assert.equal(verifyDeadlineUnsubscribeToken(`${token}.extra`, secret), null);
});

test("recipient hash normalizes case without retaining the address", () => {
  const a = hashRecipientEmail(" Person@Example.com ", "salt");
  const b = hashRecipientEmail("person@example.com", "salt");
  assert.equal(a, b);
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.doesNotMatch(a, /example/);
});

test("Resend webhook verification rejects tampering and stale replay", () => {
  const secret = `whsec_${Buffer.alloc(32, 7).toString("base64")}`;
  const now = 1_789_660_000_000;
  const timestamp = String(Math.floor(now / 1000));
  const id = "msg_test_123";
  const payload = '{"type":"email.bounced"}';
  const value = createHmac("sha256", Buffer.alloc(32, 7))
    .update(`${id}.${timestamp}.${payload}`)
    .digest("base64");
  const headers = { id, timestamp, signature: `v1,${value}` };
  assert.equal(verifyResendWebhook(payload, headers, secret, now), true);
  assert.equal(verifyResendWebhook(`${payload} `, headers, secret, now), false);
  assert.equal(
    verifyResendWebhook(payload, headers, secret, now + 301_000),
    false,
  );
  assert.equal(
    verifyResendWebhook(
      payload,
      { ...headers, signature: "v1,invalid" },
      secret,
      now,
    ),
    false,
  );
});
