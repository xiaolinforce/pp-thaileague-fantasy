import assert from "node:assert/strict";
import test from "node:test";
import { neonConfig } from "@neondatabase/serverless";

process.env.DATABASE_URL = "postgresql://test:test@example.test/test";
process.env.CRON_SECRET = "readiness-test-only";

test("readiness authorizes before querying and hides dependency failures", async (t) => {
  const { GET } = await import("../../src/app/api/health/ready/route.ts");
  const original = neonConfig.fetchFunction;
  t.after(() => {
    neonConfig.fetchFunction = original;
  });
  let queries = 0;
  neonConfig.fetchFunction = async () => {
    queries++;
    return Response.json({
      fields: [{ name: "?column?", dataTypeID: 23 }],
      rows: [[1]],
      rowCount: 1,
      command: "SELECT",
    });
  };
  assert.equal(
    (await GET(new Request("http://localhost/api/health/ready"))).status,
    401,
  );
  assert.equal(queries, 0);
  const request = () =>
    new Request("http://localhost/api/health/ready", {
      headers: { authorization: "Bearer readiness-test-only" },
    });
  const ready = await GET(request());
  assert.equal(ready.status, 200);
  assert.deepEqual(await ready.json(), { ready: true });
  assert.equal(queries, 1);
  process.env.READINESS_SECRET = "dedicated-readiness-only";
  t.after(() => {
    delete process.env.READINESS_SECRET;
  });
  const dedicated = await GET(
    new Request("http://localhost/api/health/ready", {
      headers: { authorization: "Bearer dedicated-readiness-only" },
    }),
  );
  assert.equal(dedicated.status, 200);
  delete process.env.CRON_SECRET;
  assert.equal((await GET(request())).status, 401);
  process.env.CRON_SECRET = "readiness-test-only";
  neonConfig.fetchFunction = async () => {
    throw new Error("sensitive database failure");
  };
  const failed = await GET(request());
  assert.equal(failed.status, 503);
  assert.equal(failed.headers.get("cache-control"), "no-store");
  assert.deepEqual(await failed.json(), { ready: false });
});
