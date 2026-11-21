import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function createFinalApproval(
  revision: string,
  operatorId: string,
  now: Date,
) {
  const code = randomBytes(24).toString("base64url");
  return {
    code,
    record: {
      codeHash: createHash("sha256").update(code).digest("hex"),
      revision,
      operatorId,
      expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
    },
  };
}

export function matchesFinalApproval(
  record: Record<string, unknown> | null | undefined,
  code: string,
  revision: string,
  operatorId: string,
  now: Date,
) {
  if (
    !record ||
    record.revision !== revision ||
    record.operatorId !== operatorId ||
    typeof record.expiresAt !== "string" ||
    !(Date.parse(record.expiresAt) > now.getTime()) ||
    typeof record.codeHash !== "string" ||
    !/^[a-f0-9]{64}$/.test(record.codeHash) ||
    !/^[a-zA-Z0-9_-]{32}$/.test(code)
  )
    return false;
  return timingSafeEqual(
    Buffer.from(record.codeHash, "hex"),
    createHash("sha256").update(code).digest(),
  );
}
