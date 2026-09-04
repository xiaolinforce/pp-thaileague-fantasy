import assert from "node:assert/strict";
import test from "node:test";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { emailOTP } from "better-auth/plugins";
import { awaitEmailDelivery } from "./email-delivery-hook.ts";

test("actual Better Auth OTP endpoint propagates delivery failure and recovers", async () => {
  let rejectDelivery = true;
  let sends = 0;
  const auth = betterAuth({
    baseURL: "http://localhost:3999",
    secret: "test-only-secret-with-at-least-32-characters",
    database: memoryAdapter({
      user: [],
      session: [],
      account: [],
      verification: [],
    }),
    logger: { disabled: true },
    rateLimit: { enabled: false },
    hooks: { before: awaitEmailDelivery },
    plugins: [
      emailOTP({
        async sendVerificationOTP() {
          sends++;
          if (rejectDelivery) throw new Error("private provider details");
        },
      }),
    ],
  });
  const send = () =>
    auth.handler(
      new Request(
        "http://localhost:3999/api/auth/email-otp/send-verification-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "delivery@example.test",
            type: "sign-in",
          }),
        },
      ),
    );
  const failed = await send();
  assert.equal(failed.status, 503);
  const body = await failed.json();
  assert.equal(body.code, "EMAIL_DELIVERY_UNAVAILABLE");
  assert.ok(!JSON.stringify(body).includes("private provider details"));
  rejectDelivery = false;
  const success = await send();
  assert.equal(success.status, 200);
  assert.deepEqual(await success.json(), { success: true });
  assert.equal(sends, 2);
});
