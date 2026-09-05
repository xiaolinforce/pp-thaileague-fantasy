import { timingSafeEqual } from "node:crypto";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const secrets = [
    process.env.READINESS_SECRET,
    process.env.CRON_SECRET,
  ].filter((secret): secret is string => Boolean(secret));
  const respond = (status: number, ready: boolean) =>
    Response.json(
      { ready },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  if (!secrets.length) return respond(503, false);
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const authorized = secrets.some((secret) => {
    const expected = Buffer.from(`Bearer ${secret}`);
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  });
  if (!authorized) return respond(401, false);

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const { db } = await import("@/db");
    await Promise.race([
      db.execute(sql`select 1`),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Readiness timeout")), 5_000);
      }),
    ]);
    return respond(200, true);
  } catch {
    // Operational readiness never exposes SQL, credentials or provider errors.
    return respond(503, false);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
