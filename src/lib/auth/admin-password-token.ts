import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

export const ADMIN_PASSWORD_SESSION_SECONDS = 30 * 60;
export const ADMIN_PASSWORD_MAX_LENGTH = 256;

export function matchesAdminPassword(candidate: string, password: string) {
  if (candidate.length > ADMIN_PASSWORD_MAX_LENGTH) return false;

  const supplied = createHash("sha256").update(candidate).digest();
  const expected = createHash("sha256").update(password).digest();
  return timingSafeEqual(supplied, expected);
}

export function adminPasswordSigningKey(
  secret: string,
  password: string,
  userId: string,
  environment: string,
) {
  return createHmac("sha256", secret)
    .update(
      JSON.stringify([
        "admin-password-session-v1",
        password,
        userId,
        environment,
      ]),
    )
    .digest();
}

function sign(value: string, key: Buffer) {
  return createHmac("sha256", key).update(value).digest("base64url");
}

export function issueAdminPasswordToken(key: Buffer, now = Date.now()) {
  const expiresAt = Math.floor(now / 1000) + ADMIN_PASSWORD_SESSION_SECONDS;
  const payload = `${randomUUID()}.${expiresAt}`;
  return `${payload}.${sign(payload, key)}`;
}

export function verifyAdminPasswordToken(
  token: string,
  key: Buffer,
  now = Date.now(),
) {
  const [id, expiration, signature, extra] = token.split(".");
  if (
    extra !== undefined ||
    !/^[a-f0-9-]{36}$/.test(id ?? "") ||
    !/^\d{1,12}$/.test(expiration ?? "") ||
    !/^[A-Za-z0-9_-]{43}$/.test(signature ?? "")
  ) {
    return null;
  }

  const expiresAt = Number(expiration) * 1000;
  if (expiresAt <= now) return null;

  const expected = sign(`${id}.${expiration}`, key);
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected)))
    return null;

  return { id, expiresAt: new Date(expiresAt) };
}
