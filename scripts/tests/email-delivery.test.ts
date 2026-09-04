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
  MAILJET_API_KEY: "test",
  MAILJET_SECRET_KEY: "test",
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
  const { sendAuthenticationOtp, isAuthenticationEmailAvailable } =
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
  assert.equal(await isAuthenticationEmailAvailable(), false);
  await assert.rejects(sendAuthenticationOtp(input), /at quota/);
  assert.equal(sent.length, 0);
  exhausted = false;
  ambiguous = true;
  await assert.rejects(sendAuthenticationOtp(input), /unknown/);
  assert.deepEqual(sent, ["resend"]);
  sent.length = 0;
  ambiguous = false;
  resendStatus = 200;
  assert.equal(await isAuthenticationEmailAvailable(), true);
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
