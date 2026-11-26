import assert from "node:assert/strict";
import test from "node:test";
import { neonConfig } from "@neondatabase/serverless";
import * as Sentry from "@sentry/nextjs";

// Real orchestration and Drizzle, with fake HTTP transports only. No .env is
// loaded, no email is sent, and no production simulation endpoint is added.
Object.assign(process.env, {
  DATABASE_URL: "postgresql://test:test@example.test/test",
  AUTH_EMAIL_ENABLED: "true",
  AUTH_PRODUCTION_READY: "true",
  AUTH_EMAIL_HASH_SECRET: "test-only-email-hash-secret",
  TURNSTILE_SECRET_KEY: "test",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "test",
  AUTH_EMAIL_PROVIDERS: "resend,mailjet",
  EMAIL_FROM: "sender@example.test",
  RESEND_API_KEY: "test",
  RESEND_DAILY_LIMIT: "100",
  RESEND_MONTHLY_LIMIT: "3000",
  MAILJET_API_KEY: "test",
  MAILJET_SECRET_KEY: "test",
  MAILJET_DAILY_LIMIT: "200",
  MAILJET_MONTHLY_LIMIT: "6000",
});

test("delivery fallback, quota exhaustion and ambiguous outcomes", async (t) => {
  const events: Sentry.Event[] = [];
  Sentry.init({
    dsn: "https://public@example.test/1",
    defaultIntegrations: false,
    transport: () => ({
      send: async () => ({}),
      flush: async () => true,
    }),
    beforeSend(event) {
      events.push(event);
      return event;
    },
  });
  const { sendAuthenticationOtp } =
    await import("../../src/lib/email/transactional.ts");
  const originalFetch = globalThis.fetch;
  const originalNeonFetch = neonConfig.fetchFunction;
  t.after(() => {
    globalThis.fetch = originalFetch;
    neonConfig.fetchFunction = originalNeonFetch;
    return Sentry.close();
  });
  let exhausted = false;
  let resendStatus = 429;
  let ambiguous = false;
  const sent: string[] = [];
  const records: unknown[][] = [];
  neonConfig.fetchFunction = async (_url: unknown, options?: RequestInit) => {
    const request = JSON.parse(String(options?.body));
    const counting = request.query.includes("count(*)");
    if (request.query.startsWith("insert")) records.push(request.params);
    return Response.json({
      fields: counting ? [{ name: "count", dataTypeID: 23 }] : [],
      rows: counting ? [[exhausted ? 9999 : 0]] : [],
      rowCount: counting ? 1 : 0,
      command: counting ? "SELECT" : "INSERT",
    });
  };
  globalThis.fetch = async (url) => {
    const provider = String(url).includes("resend") ? "resend" : "mailjet";
    sent.push(provider);
    if (ambiguous) throw new DOMException("timed out", "TimeoutError");
    if (provider === "resend")
      return Response.json({ id: "resend-id" }, { status: resendStatus });
    return Response.json({
      Messages: [{ Status: "success", To: [{ MessageID: 123 }] }],
    });
  };
  const input = {
    email: "recipient@example.test",
    otp: "123456",
    type: "sign-in" as const,
  };
  await sendAuthenticationOtp(input);
  assert.deepEqual(sent, ["resend", "mailjet"]);
  assert.ok(records.some((row) => row.includes("failed")));
  assert.ok(records.some((row) => row.includes("accepted")));
  assert.ok(!JSON.stringify(records).includes(input.email));
  assert.ok(!JSON.stringify(records).includes(input.otp));
  sent.length = 0;
  exhausted = true;
  await assert.rejects(sendAuthenticationOtp(input), /at quota/);
  assert.equal(sent.length, 0);
  exhausted = false;
  ambiguous = true;
  await assert.rejects(sendAuthenticationOtp(input), /unknown/);
  assert.deepEqual(sent, ["resend"]);
  sent.length = 0;
  ambiguous = false;
  resendStatus = 200;
  await sendAuthenticationOtp(input);
  assert.deepEqual(sent, ["resend"]);
  await Sentry.flush();
  for (const expected of [
    "provider_failed",
    "fallback_used",
    "quota_exhausted",
    "unavailable",
  ]) {
    assert.ok(events.some((event) => event.tags?.email_event === expected));
  }
  assert.ok(
    events.every((event) => event.tags?.area === "transactional_email"),
  );
  assert.ok(!JSON.stringify(events).includes(input.email));
  assert.ok(!JSON.stringify(events).includes(input.otp));
});

test("availability reads both providers once and preserves UTC quotas and cooldown", async (t) => {
  const { isAuthenticationEmailAvailable } =
    await import("../../src/lib/email/transactional.ts");
  const originalNeonFetch = neonConfig.fetchFunction;
  const originalProviders = process.env.AUTH_EMAIL_PROVIDERS;
  t.after(() => {
    neonConfig.fetchFunction = originalNeonFetch;
    if (originalProviders === undefined)
      delete process.env.AUTH_EMAIL_PROVIDERS;
    else process.env.AUTH_EMAIL_PROVIDERS = originalProviders;
  });
  t.mock.timers.enable({
    apis: ["Date"],
    now: new Date("2026-12-01T00:00:20Z"),
  });
  const requests: Array<{ query: string; params: string[] }> = [];
  let rows: Array<[string, string, string, string, string]> = [];
  neonConfig.fetchFunction = async (_url: unknown, options?: RequestInit) => {
    requests.push(JSON.parse(String(options?.body)));
    return Response.json({
      fields: [
        { name: "provider", dataTypeID: 25 },
        { name: "status", dataTypeID: 25 },
        { name: "created_at", dataTypeID: 1184 },
        { name: "daily", dataTypeID: 20 },
        { name: "monthly", dataTypeID: 20 },
      ],
      rows,
      rowCount: rows.length,
      command: "SELECT",
    });
  };

  assert.equal(await isAuthenticationEmailAvailable(), true);
  assert.equal(requests.length, 1);
  const [request] = requests;
  assert.match(request.query, /^select distinct on/i);
  assert.ok(
    request.params.includes("resend") && request.params.includes("mailjet"),
  );
  assert.ok(request.params.includes("2026-12-01T00:00:00.000Z"));
  assert.ok(request.params.includes("2026-11-30T23:59:20.000Z"));

  rows = [
    ["resend", "accepted", "2026-12-01 00:00:08+00", "90", "90"],
    ["mailjet", "failed", "2026-11-30 23:59:40+00", "0", "0"],
  ];
  assert.equal(await isAuthenticationEmailAvailable(), false);
  assert.equal(requests.length, 2);

  // A 60-second-old failure is no longer in cooldown.
  t.mock.timers.setTime(Date.parse("2026-12-01T00:00:40Z"));
  assert.equal(await isAuthenticationEmailAvailable(), true);

  // A fresh, successful secondary provider remains usable when the primary
  // reached its monthly limit even if neither reached its daily limit.
  rows = [
    ["resend", "accepted", "2026-12-01 00:00:08+00", "2", "2700"],
    ["mailjet", "accepted", "2026-12-01 00:00:30+00", "1", "1"],
  ];
  assert.equal(await isAuthenticationEmailAvailable(), true);
  process.env.AUTH_EMAIL_PROVIDERS = "resend";
  rows = rows.slice(0, 1);
  assert.equal(await isAuthenticationEmailAvailable(), false);
  assert.ok(!requests.at(-1)?.params.includes("mailjet"));

  neonConfig.fetchFunction = async () => {
    throw new Error("simulated database error");
  };
  assert.equal(await isAuthenticationEmailAvailable(), false);
});
