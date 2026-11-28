import "server-only";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { and, eq, notExists, sql } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { cache } from "react";

import { db } from "@/db";
import { authRateLimits, authUsers, authVerifications } from "@/db/schema";
import {
  ADMIN_PASSWORD_MAX_LENGTH,
  ADMIN_PASSWORD_SESSION_SECONDS,
  adminPasswordSigningKey,
  issueAdminPasswordToken,
  matchesAdminPassword,
  verifyAdminPasswordToken,
} from "@/lib/auth/admin-password-token";

export const ADMIN_PASSWORD_LOGIN_PATH = "/admin/fantasy/login";
const MAX_FAILURES = 5;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const secure = process.env.NODE_ENV === "production";
const COOKIE_NAME = secure ? "__Host-pp-admin-password" : "pp-admin-password";
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "strict",
  secure,
  path: "/",
} as const;

function getConfiguration() {
  const password = process.env.FANTASY_ADMIN_PASSWORD;
  const userId = process.env.FANTASY_ADMIN_PASSWORD_USER_ID?.trim();
  const secret = process.env.BETTER_AUTH_SECRET;
  if (
    !password?.trim() ||
    password.length > ADMIN_PASSWORD_MAX_LENGTH ||
    !userId ||
    !secret
  ) {
    return null;
  }

  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "";
  return {
    password,
    userId,
    secret,
    key: adminPasswordSigningKey(secret, password, userId, environment),
  };
}

export function isAdminPasswordEnabled() {
  return getConfiguration() !== null;
}

function findAdminAccount(userId: string, sessionId?: string) {
  return db.query.authUsers.findFirst({
    columns: { id: true, email: true },
    where: and(
      eq(authUsers.id, userId),
      eq(authUsers.role, "admin"),
      eq(authUsers.emailVerified, true),
      eq(authUsers.isAnonymous, false),
      sessionId
        ? notExists(
            db
              .select({ id: authVerifications.id })
              .from(authVerifications)
              .where(eq(authVerifications.id, sessionId)),
          )
        : undefined,
    ),
  });
}

async function getPasswordSession(key: Buffer) {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const session = token ? verifyAdminPasswordToken(token, key) : null;
  return session && { ...session, id: `admin-password-session:${session.id}` };
}

export const getAdminPasswordUser = cache(
  async function getAdminPasswordUser() {
    const configuration = getConfiguration();
    if (!configuration) return null;

    const session = await getPasswordSession(configuration.key);
    if (!session) return null;

    return (await findAdminAccount(configuration.userId, session.id)) ?? null;
  },
);

export async function startAdminPasswordSession(candidate: string) {
  const configuration = getConfiguration();
  if (!configuration) return "unavailable";

  // Vercel supplies this header. Outside Vercel all attempts share a bucket.
  const forwarded =
    process.env.VERCEL === "1"
      ? (await headers()).get("x-vercel-forwarded-for")?.trim()
      : undefined;
  const client = forwarded && isIP(forwarded) ? forwarded : "unknown";
  const now = Date.now();
  const bucket = Math.floor(now / FAILURE_WINDOW_MS);
  const key = `admin-password:${createHmac("sha256", configuration.secret).update(`${bucket}:${client}`).digest("hex")}`;
  const attempts = await db.query.authRateLimits.findFirst({
    columns: { count: true },
    where: eq(authRateLimits.key, key),
  });
  if ((attempts?.count ?? 0) >= MAX_FAILURES) return "limited";

  if (!matchesAdminPassword(candidate, configuration.password)) {
    const [updated] = await db
      .insert(authRateLimits)
      .values({ id: key, key, count: 1, lastRequest: now })
      .onConflictDoUpdate({
        target: authRateLimits.key,
        set: {
          count: sql`least(${authRateLimits.count} + 1, ${MAX_FAILURES})`,
          lastRequest: now,
        },
      })
      .returning({ count: authRateLimits.count });
    return updated.count >= MAX_FAILURES ? "limited" : "invalid";
  }

  if (!(await findAdminAccount(configuration.userId))) return "unavailable";

  (await cookies()).set(
    COOKIE_NAME,
    issueAdminPasswordToken(configuration.key),
    {
      ...COOKIE_OPTIONS,
      maxAge: ADMIN_PASSWORD_SESSION_SECONDS,
    },
  );
  return null;
}

export async function endAdminPasswordSession() {
  const configuration = getConfiguration();
  const session =
    configuration && (await getPasswordSession(configuration.key));
  if (session) {
    await db
      .insert(authVerifications)
      .values({
        id: session.id,
        identifier: session.id,
        value: "revoked",
        expiresAt: session.expiresAt,
      })
      .onConflictDoNothing();
  }

  (await cookies()).set(COOKIE_NAME, "", { ...COOKIE_OPTIONS, maxAge: 0 });
}
