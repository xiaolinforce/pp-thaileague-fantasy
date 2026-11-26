import "server-only";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { cronHeartbeats } from "@/db/schema";

const job = "fantasy-ownership";
const hour = 60 * 60 * 1_000;
// Bangkok uses UTC+07:00 year-round. Vercel Hobby can start anywhere in the
// 02:00 hour, so the watchdog allows until 04:00 for work to finish.
const bangkokOffset = 7 * hour;

export async function recordOwnershipHeartbeat() {
  await db
    .insert(cronHeartbeats)
    .values({ job, lastSucceededAt: sql`now()` })
    .onConflictDoUpdate({
      target: cronHeartbeats.job,
      set: {
        lastSucceededAt: sql`greatest(${cronHeartbeats.lastSucceededAt}, excluded.last_succeeded_at)`,
      },
    });
}

export async function checkOwnershipHeartbeat(now = new Date()) {
  const bangkokDay = new Date(now.getTime() + bangkokOffset);
  const round = bangkokDay.toISOString().slice(0, 10);
  const start = bangkokDay.setUTCHours(2, 0, 0, 0) - bangkokOffset;
  if (now.getTime() < start + 2 * hour)
    return { status: "pending", round } as const;

  const [heartbeat] = await db
    .select({
      monitoringStartedAt: cronHeartbeats.monitoringStartedAt,
      lastSucceededAt: cronHeartbeats.lastSucceededAt,
    })
    .from(cronHeartbeats)
    .where(eq(cronHeartbeats.job, job))
    .limit(1);
  if (!heartbeat) throw new Error("Ownership heartbeat is not initialized");
  if (heartbeat.lastSucceededAt && heartbeat.lastSucceededAt.getTime() >= start)
    return { status: "okay", round } as const;
  if (heartbeat.monitoringStartedAt.getTime() > start)
    return { status: "initializing", round } as const;
  return { status: "missed", round } as const;
}
