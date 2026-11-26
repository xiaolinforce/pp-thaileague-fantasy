import assert from "node:assert/strict";
import test from "node:test";
import { neonConfig } from "@neondatabase/serverless";
import * as Sentry from "@sentry/nextjs";

process.env.DATABASE_URL = "postgresql://test:test@example.test/test";
process.env.READINESS_SECRET = "heartbeat-test-only";
process.env.CRON_SECRET = "maintenance-test-only";

test("ownership heartbeat checks the due Bangkok round and reports a missed run", async (t) => {
  const { POST } = await import("../../src/app/api/health/ownership/route.ts");
  const originalFetch = neonConfig.fetchFunction;
  const events: Array<{ message?: string; fingerprint?: string[] }> = [];
  Sentry.init({
    dsn: "https://public@example.test/1",
    beforeSend: (event) => {
      events.push(event);
      return null;
    },
  });
  t.after(async () => {
    neonConfig.fetchFunction = originalFetch;
    await Sentry.close(100);
  });

  const now = new Date("2026-11-26T21:17:00Z"); // Friday 04:17 in Bangkok
  t.mock.timers.enable({ apis: ["Date"], now });
  let queries = 0;
  let installed = "2026-11-25 19:00:00+00";
  let lastSuccess: string | null = "2026-11-26 19:51:00+00";
  neonConfig.fetchFunction = async () => {
    queries++;
    return Response.json({
      fields: [
        { name: "monitoring_started_at", dataTypeID: 1184 },
        { name: "last_succeeded_at", dataTypeID: 1184 },
      ],
      rows: [[installed, lastSuccess]],
      rowCount: 1,
      command: "SELECT",
    });
  };
  const check = (token = "heartbeat-test-only") =>
    POST(
      new Request("http://localhost/api/health/ownership", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      }),
    );

  assert.equal((await check("maintenance-test-only")).status, 401);
  t.mock.timers.setTime(new Date("2026-11-26T20:59:59Z").getTime());
  assert.deepEqual(await (await check()).json(), { status: "pending" });
  assert.equal(queries, 0);

  t.mock.timers.setTime(now.getTime());
  assert.deepEqual(await (await check()).json(), { status: "okay" });
  lastSuccess = "2026-11-26 18:59:59+00";
  const missed = await check();
  assert.equal(missed.status, 503);
  assert.equal(missed.headers.get("cache-control"), "no-store");
  assert.deepEqual(await missed.json(), { status: "missed" });
  assert.equal(events[0]?.message, "Fantasy ownership heartbeat missed");
  assert.deepEqual(events[0]?.fingerprint, [
    "fantasy-ownership-heartbeat",
    "2026-11-27",
  ]);

  lastSuccess = null;
  installed = "2026-11-26 20:33:00+00";
  assert.deepEqual(await (await check()).json(), { status: "initializing" });
  t.mock.timers.setTime(new Date("2026-11-27T21:17:00Z").getTime());
  assert.deepEqual(await (await check()).json(), { status: "missed" });

  neonConfig.fetchFunction = async () => {
    throw new Error("test database unavailable");
  };
  assert.deepEqual(await (await check()).json(), { status: "check_failed" });
});
