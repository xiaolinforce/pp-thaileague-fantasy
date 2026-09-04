import assert from "node:assert/strict";
import test from "node:test";
import { neonConfig } from "@neondatabase/serverless";

// Exercise the actual Drizzle HTTP driver with a fake transport. No local env
// files are loaded and no requests reach Neon.
process.env.DATABASE_URL = "postgresql://test:test@example.test/test";
const maintenance = import("../../src/lib/auth/maintenance.ts");

test("cleanup submits one atomic HTTP batch with the correct retention boundaries", async (t) => {
  const { cleanupExpiredAuthArtifacts } = await maintenance;
  const previous = neonConfig.fetchFunction;
  t.after(() => {
    neonConfig.fetchFunction = previous;
  });
  const requests: Array<{
    queries: Array<{ query: string; params: unknown[] }>;
  }> = [];
  neonConfig.fetchFunction = async (
    _url: RequestInfo | URL,
    options?: RequestInit,
  ) => {
    requests.push(JSON.parse(String(options?.body)));
    return new Response(
      JSON.stringify({
        results: [2, 1, 3, 0].map((count) => ({
          fields: [{ name: "id", dataTypeID: 25 }],
          rows: Array.from({ length: count }, (_, index) => [`test-${index}`]),
          command: "DELETE",
          rowCount: count,
        })),
      }),
      { status: 200 },
    );
  };
  const now = new Date("2026-09-04T05:00:00.000Z");
  assert.deepEqual(await cleanupExpiredAuthArtifacts(now), {
    deletedSessions: 2,
    deletedVerifications: 1,
    deletedRateLimits: 3,
    deletedEmailDeliveries: 0,
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].queries.length, 4);
  const queries = requests[0].queries;
  assert.deepEqual(
    queries.map(({ query }) => query.match(/delete from "([^"]+)"/)?.[1]),
    [
      "auth_sessions",
      "auth_verifications",
      "auth_rate_limits",
      "auth_email_deliveries",
    ],
  );
  assert.ok(
    queries.every(({ query }) => /where .* < \$1 returning "id"/.test(query)),
  );
  assert.equal(new Date(String(queries[0].params[0])).getTime(), now.getTime());
  assert.equal(new Date(String(queries[1].params[0])).getTime(), now.getTime());
  assert.equal(Number(queries[2].params[0]), now.getTime() - 2 * 86_400_000);
  assert.equal(
    new Date(String(queries[3].params[0])).getTime(),
    now.getTime() - 90 * 86_400_000,
  );
});

test("a rejected batch fails the cleanup instead of reporting success or retrying deletes", async (t) => {
  const { cleanupExpiredAuthArtifacts } = await maintenance;
  const previous = neonConfig.fetchFunction;
  t.after(() => {
    neonConfig.fetchFunction = previous;
  });
  let calls = 0;
  neonConfig.fetchFunction = async () => {
    calls++;
    return new Response(
      JSON.stringify({ message: "batch failed", code: "XX000" }),
      { status: 400 },
    );
  };
  await assert.rejects(cleanupExpiredAuthArtifacts(), /batch failed/);
  assert.equal(calls, 1);
});
