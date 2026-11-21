import assert from "node:assert/strict";
import test from "node:test";
import { createFinalApproval, matchesFinalApproval } from "./final-approval.ts";

test("an approval permits only the intended operator, revision, code and time window", () => {
  const start = new Date("2026-11-22T12:00:00Z");
  const { code, record } = createFinalApproval("gw9:v1", "nene", start);
  assert.ok(matchesFinalApproval(record, code, "gw9:v1", "nene", start));
  assert.ok(!JSON.stringify(record).includes(code));
  for (const revision of ["gw10:v1", "gw9:v2"]) {
    assert.ok(!matchesFinalApproval(record, code, revision, "nene", start));
  }
  assert.ok(
    !matchesFinalApproval(record, code, "gw9:v1", "someone-else", start),
  );
  assert.ok(
    !matchesFinalApproval(
      record,
      code,
      "gw9:v1",
      "nene",
      new Date(record.expiresAt),
    ),
  );
  assert.ok(!matchesFinalApproval(record, "", "gw9:v1", "nene", start));
  const replacement = createFinalApproval("gw9:v1", "nene", start);
  assert.ok(
    !matchesFinalApproval(replacement.record, code, "gw9:v1", "nene", start),
  );
});
