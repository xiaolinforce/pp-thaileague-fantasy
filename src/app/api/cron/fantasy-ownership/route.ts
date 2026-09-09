import * as Sentry from "@sentry/nextjs";
import { revalidateTag } from "next/cache";

import { reconcileOpenFantasyPlayerOwnership } from "@/lib/fantasy/ownership-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("Fantasy ownership maintenance is missing CRON_SECRET.");
    return Response.json(
      { code: "maintenance_not_configured", ok: false },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ code: "unauthorized", ok: false }, { status: 401 });
  }

  try {
    return await Sentry.withMonitor(
      "fantasy-ownership",
      async () => {
        const result = await reconcileOpenFantasyPlayerOwnership();
        revalidateTag("fantasy-ownership", "max");

        console.info(
          JSON.stringify({ event: "fantasy_ownership_refreshed", ...result }),
        );
        Sentry.logger.info("Fantasy ownership refreshed", {
          event: "fantasy_ownership_refreshed",
          ...result,
        });
        return Response.json({ ok: true, ...result });
      },
      {
        schedule: { type: "crontab", value: "43 2 * * *" },
        timezone: "Asia/Bangkok",
        checkinMargin: 60,
        maxRuntime: 5,
        failureIssueThreshold: 1,
        recoveryThreshold: 1,
        isolateTrace: true,
      },
    );
  } catch (error) {
    Sentry.captureException(error, { tags: { job: "fantasy-ownership" } });
    console.error("Fantasy ownership maintenance failed.", error);
    await Sentry.flush(2_000);
    return Response.json(
      { code: "maintenance_failed", ok: false },
      { status: 500 },
    );
  }
}
