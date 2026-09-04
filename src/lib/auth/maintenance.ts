import "server-only";

import { lt } from "drizzle-orm";

import { db } from "@/db";
import {
  authEmailDeliveries,
  authRateLimits,
  authSessions,
  authVerifications,
} from "@/db/schema";

const DAY_IN_MS = 24 * 60 * 60 * 1_000;
const RATE_LIMIT_RETENTION_DAYS = 2;
const EMAIL_DELIVERY_RETENTION_DAYS = 90;

export type AuthMaintenanceResult = {
  deletedEmailDeliveries: number;
  deletedRateLimits: number;
  deletedSessions: number;
  deletedVerifications: number;
};

export async function cleanupExpiredAuthArtifacts(
  now = new Date(),
): Promise<AuthMaintenanceResult> {
  const rateLimitCutoff = now.getTime() - RATE_LIMIT_RETENTION_DAYS * DAY_IN_MS;
  const deliveryCutoff = new Date(
    now.getTime() - EMAIL_DELIVERY_RETENTION_DAYS * DAY_IN_MS,
  );

  // These statements are independent. Neon HTTP executes the batch in one
  // transaction; callback transactions are not supported by this driver.
  const [
    deletedSessions,
    deletedVerifications,
    deletedRateLimits,
    deletedEmailDeliveries,
  ] = await db.batch([
    db
      .delete(authSessions)
      .where(lt(authSessions.expiresAt, now))
      .returning({ id: authSessions.id }),
    db
      .delete(authVerifications)
      .where(lt(authVerifications.expiresAt, now))
      .returning({ id: authVerifications.id }),
    db
      .delete(authRateLimits)
      .where(lt(authRateLimits.lastRequest, rateLimitCutoff))
      .returning({ id: authRateLimits.id }),
    db
      .delete(authEmailDeliveries)
      .where(lt(authEmailDeliveries.createdAt, deliveryCutoff))
      .returning({ id: authEmailDeliveries.id }),
  ]);

  return {
    deletedEmailDeliveries: deletedEmailDeliveries.length,
    deletedRateLimits: deletedRateLimits.length,
    deletedSessions: deletedSessions.length,
    deletedVerifications: deletedVerifications.length,
  };
}
