import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function normalizeRecipientEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashRecipientEmail(email: string, secret: string) {
  return createHash("sha256")
    .update(`${secret}:${normalizeRecipientEmail(email)}`)
    .digest("hex");
}

export function createDeadlineUnsubscribeToken(userId: string, secret: string) {
  const encodedUserId = Buffer.from(userId, "utf8").toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(`deadline-unsubscribe:v1:${encodedUserId}`)
    .digest("base64url");
  return `${encodedUserId}.${signature}`;
}

export function verifyDeadlineUnsubscribeToken(
  token: string,
  secret: string,
): string | null {
  const [encodedUserId, suppliedSignature, extra] = token.split(".");
  if (
    extra !== undefined ||
    !encodedUserId ||
    !suppliedSignature ||
    !/^[A-Za-z0-9_-]+$/.test(encodedUserId) ||
    !/^[A-Za-z0-9_-]+$/.test(suppliedSignature)
  ) {
    return null;
  }
  const userId = Buffer.from(encodedUserId, "base64url").toString("utf8");
  if (
    !userId ||
    Buffer.from(userId, "utf8").toString("base64url") !== encodedUserId
  ) {
    return null;
  }
  const expected = createDeadlineUnsubscribeToken(userId, secret).split(".")[1];
  const supplied = Buffer.from(suppliedSignature);
  const actual = Buffer.from(expected);
  return supplied.length === actual.length && timingSafeEqual(supplied, actual)
    ? userId
    : null;
}

export function verifyResendWebhook(
  payload: string,
  headers: {
    id: string | null;
    timestamp: string | null;
    signature: string | null;
  },
  secret: string,
  now = Date.now(),
) {
  const { id, timestamp, signature } = headers;
  if (
    !id ||
    !timestamp ||
    !signature ||
    !/^\d+$/.test(timestamp) ||
    !secret.startsWith("whsec_")
  ) {
    return false;
  }
  const timestampSeconds = Number(timestamp);
  if (
    !Number.isSafeInteger(timestampSeconds) ||
    Math.abs(Math.floor(now / 1000) - timestampSeconds) > 300
  ) {
    return false;
  }
  const key = Buffer.from(secret.slice("whsec_".length), "base64");
  if (key.length < 16) return false;
  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${payload}`)
    .digest();
  return signature.split(" ").some((part) => {
    const [version, value] = part.split(",");
    if (version !== "v1" || !value) return false;
    const received = Buffer.from(value, "base64");
    return (
      received.length === expected.length && timingSafeEqual(received, expected)
    );
  });
}
