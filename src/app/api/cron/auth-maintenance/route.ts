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
    const result = await cleanupExpiredAuthArtifacts();

    console.info(
      JSON.stringify({ event: "auth_maintenance_completed", ...result }),
    );

    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("Auth maintenance failed.", error);
    return Response.json(
      { code: "maintenance_failed", ok: false },
      { status: 500 },
    );
  }
}
