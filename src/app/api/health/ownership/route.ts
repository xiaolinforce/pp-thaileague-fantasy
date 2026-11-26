import { timingSafeEqual } from "node:crypto";
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";

function respond(status: number, code: string) {
  return Response.json(
    { status: code },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const secret = process.env.READINESS_SECRET;
  if (!secret) return respond(503, "not_configured");
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return respond(401, "unauthorized");

  try {
    const { checkOwnershipHeartbeat } =
      await import("@/lib/observability/ownership-heartbeat");
    const { status, round } = await checkOwnershipHeartbeat();
    if (status !== "missed") return respond(200, status);

    Sentry.captureMessage("Fantasy ownership heartbeat missed", {
      level: "error",
      tags: { job: "fantasy-ownership", area: "ownership_heartbeat" },
      fingerprint: ["fantasy-ownership-heartbeat", round],
    });
    await Sentry.flush(2_000);
    return respond(503, "missed");
  } catch (error) {
    Sentry.captureException(error, {
      tags: { job: "fantasy-ownership", area: "ownership_heartbeat" },
    });
    await Sentry.flush(2_000);
    return respond(503, "check_failed");
  }
}
