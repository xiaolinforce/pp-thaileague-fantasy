import "server-only";
import * as Sentry from "@sentry/nextjs";

type EmailEvent =
  | "near_quota"
  | "quota_exhausted"
  | "provider_failed"
  | "fallback_used"
  | "unavailable"
  | "recovered"
  | "delivery_log_failed";

// Only bounded operational fields: no address, OTP, provider payload or exception.
// Sentry's email alert rule owns notification throttling across server instances.
export function reportEmailEvent(
  event: EmailEvent,
  provider: string = "all",
  details: {
    daily?: number;
    monthly?: number;
    dailyLimit?: number;
    monthlyLimit?: number;
    status?: number;
  } = {},
) {
  Sentry.captureMessage(`Transactional email: ${event}`, {
    level:
      event === "recovered"
        ? "info"
        : event === "unavailable"
          ? "error"
          : "warning",
    fingerprint: ["transactional-email", event, provider],
    tags: {
      area: "transactional_email",
      email_event: event,
      email_provider: provider,
    },
    extra: details,
  });
}
