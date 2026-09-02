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

  return db.transaction(async (transaction) => {
    const deletedSessions = await transaction
      .delete(authSessions)
      .where(lt(authSessions.expiresAt, now))
      .returning({ id: authSessions.id });
    const deletedVerifications = await transaction
      .delete(authVerifications)
      .where(lt(authVerifications.expiresAt, now))
      .returning({ id: authVerifications.id });
    const deletedRateLimits = await transaction
      .delete(authRateLimits)
      .where(lt(authRateLimits.lastRequest, rateLimitCutoff))
      .returning({ id: authRateLimits.id });
    const deletedEmailDeliveries = await transaction
      .delete(authEmailDeliveries)
      .where(lt(authEmailDeliveries.createdAt, deliveryCutoff))
      .returning({ id: authEmailDeliveries.id });

    return {
      deletedEmailDeliveries: deletedEmailDeliveries.length,
      deletedRateLimits: deletedRateLimits.length,
      deletedSessions: deletedSessions.length,
      deletedVerifications: deletedVerifications.length,
    };
  });
}
