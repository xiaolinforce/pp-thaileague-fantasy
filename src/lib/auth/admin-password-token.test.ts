import assert from "node:assert/strict";
import test from "node:test";

import {
  ADMIN_PASSWORD_SESSION_SECONDS,
  adminPasswordSigningKey,
  issueAdminPasswordToken,
  matchesAdminPassword,
  verifyAdminPasswordToken,
} from "./admin-password-token.ts";

const now = 1_800_000_000_000;
const key = adminPasswordSigningKey(
  "test-key",
  "test-password",
  "admin",
  "production",
);

test("matches password input exactly", () => {
  assert.equal(matchesAdminPassword("test-password", "test-password"), true);
  assert.equal(matchesAdminPassword(" test-password", "test-password"), false);
  assert.equal(matchesAdminPassword("Test-password", "test-password"), false);
  assert.equal(matchesAdminPassword("x".repeat(257), "test-password"), false);
});

test("issues distinct sessions and rejects expired or modified tokens", () => {
  const token = issueAdminPasswordToken(key, now);
  assert.notEqual(token, issueAdminPasswordToken(key, now));
  const session = verifyAdminPasswordToken(token, key, now);
  assert.equal(
    session?.expiresAt.getTime(),
    now + ADMIN_PASSWORD_SESSION_SECONDS * 1000,
  );
  assert.equal(
    verifyAdminPasswordToken(token, key, session?.expiresAt.getTime()),
    null,
  );
  assert.equal(verifyAdminPasswordToken(`${token}.extra`, key, now), null);

  const [id, expires, signature] = token.split(".");
  const alteredSignature = `${signature[0] === "A" ? "B" : "A"}${signature.slice(1)}`;
  assert.equal(
    verifyAdminPasswordToken(`${id}.${expires}.${alteredSignature}`, key, now),
    null,
  );
  assert.equal(
    verifyAdminPasswordToken(
      `${id}.${Number(expires) + 60}.${signature}`,
      key,
      now,
    ),
    null,
  );
});

test("invalidates previous sessions after password, account, secret or environment changes", () => {
  const token = issueAdminPasswordToken(key, now);
  for (const alternateKey of [
    adminPasswordSigningKey(
      "test-key",
      "rotated-password",
      "admin",
      "production",
    ),
    adminPasswordSigningKey(
      "test-key",
      "test-password",
      "other-admin",
      "production",
    ),
    adminPasswordSigningKey(
      "rotated-key",
      "test-password",
      "admin",
      "production",
    ),
    adminPasswordSigningKey("test-key", "test-password", "admin", "preview"),
  ]) {
    assert.equal(verifyAdminPasswordToken(token, alternateKey, now), null);
  }
});
