import { APIError, createAuthMiddleware } from "better-auth/api";

export const EMAIL_DELIVERY_UNAVAILABLE = "EMAIL_DELIVERY_UNAVAILABLE";

export function emailDeliveryUnavailable() {
  return new APIError("SERVICE_UNAVAILABLE", {
    code: EMAIL_DELIVERY_UNAVAILABLE,
    message:
      "Email delivery is temporarily unavailable. Please try again later.",
  });
}

// Better Auth 1.7 catches delivery failures in runInBackgroundOrAwait. For
// explicit OTP requests, success must mean that a provider accepted the email.
// Return a request-local context override; never mutate the shared AuthContext.
export const awaitEmailDelivery = createAuthMiddleware(async (ctx) => {
  if (ctx.path !== "/email-otp/send-verification-otp") return;
  return {
    context: {
      context: {
        async runInBackgroundOrAwait(promise: Promise<unknown>) {
          try {
            await promise;
          } catch {
            throw emailDeliveryUnavailable();
          }
        },
      },
    },
  };
});
