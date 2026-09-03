import * as Sentry from "@sentry/nextjs";
import { cleanupExpiredAuthArtifacts } from "@/lib/auth/maintenance";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("Auth maintenance is missing CRON_SECRET.");
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
      "auth-maintenance",
      async () => {
        const result = await cleanupExpiredAuthArtifacts();

        console.info(
          JSON.stringify({ event: "auth_maintenance_completed", ...result }),
        );
        Sentry.logger.info("Auth maintenance completed", {
          event: "auth_maintenance_completed",
          ...result,
        });

        return Response.json({ ok: true, ...result });
      },
      {
        schedule: { type: "crontab", value: "17 2 * * *" },
        timezone: "Asia/Bangkok",
        checkinMargin: 10,
        maxRuntime: 5,
        failureIssueThreshold: 1,
        recoveryThreshold: 1,
        isolateTrace: true,
      },
    );
  } catch (error) {
    Sentry.captureException(error, {
      tags: { job: "auth-maintenance" },
    });
    console.error("Auth maintenance failed.", error);
    await Sentry.flush(2_000);
    return Response.json(
      { code: "maintenance_failed", ok: false },
      { status: 500 },
    );
  }
}
