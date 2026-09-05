import type { Breadcrumb, Event, Log } from "@sentry/nextjs";

const REDACTED = "[Filtered]";
const privateKey =
  /^(?:params|parameters|arguments|query_string|cookies?|headers|authorization|password|secret|token|access_token|refresh_token|otp|email|ip_address|user_id|auth_user_id|invite_code)$/i;

export function scrubSentryText(text: string): string {
  return (
    text
      // Drizzle embeds SQL and bound values directly into Error.message. SDK
      // databaseQueryData options alone do not remove this exception text.
      .replace(
        /Failed query:[\s\S]*/gi,
        "Database query failed (details filtered)",
      )
      .replace(/\bparams:\s*[\s\S]*/gi, `params: ${REDACTED}`)
      .replace(
        /\bKey \([^\n]+?\)=\([^\n]*\)/g,
        `Key (${REDACTED})=(${REDACTED})`,
      )
      .replace(/https?:\/\/[^\s<>"']+/gi, (value) => {
        try {
          const url = new URL(value);
          url.username = "";
          url.password = "";
          url.search = "";
          url.hash = "";
          return url.toString();
        } catch {
          return REDACTED;
        }
      })
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, REDACTED)
  );
}

// Sentry payloads are plain data. Copy them so breadcrumbs and shared scope
// objects used by subsequent events are not mutated by the privacy boundary.
function scrubValue(
  value: unknown,
  seen = new WeakMap<object, unknown>(),
): unknown {
  if (typeof value === "string") return scrubSentryText(value);
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return REDACTED;
  const result: Record<string, unknown> | unknown[] = Array.isArray(value)
    ? []
    : {};
  seen.set(value, result);
  for (const [key, child] of Object.entries(value)) {
    const sanitized =
      typeof child === "string" &&
      /^(?:url|from|to|request_path|filename|abs_path)$/i.test(key)
        ? scrubSentryText(child).split(/[?#]/, 1)[0]
        : scrubValue(child, seen);
    Object.defineProperty(result, key, {
      value: privateKey.test(key) ? REDACTED : sanitized,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
  return result;
}

export function scrubSentryEvent<T extends Event>(event: T): T {
  const clean = scrubValue(event) as T;
  // Never attach a user profile, arbitrary console arguments, or request body.
  delete clean.user;
  if (clean.request) {
    delete clean.request.headers;
    delete clean.request.cookies;
    delete clean.request.data;
    delete clean.request.query_string;
  }
  return clean;
}

export function scrubSentryBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  const clean = scrubValue(breadcrumb) as Breadcrumb;
  if (clean.category === "console" && clean.data) {
    delete clean.data.arguments;
  }
  return clean;
}

export function scrubSentryLog(log: Log): Log {
  return scrubValue(log) as Log;
}

const facebookBridgeMessages = new Set([
  "Error invoking postMessage: Java object is gone",
  "Error invoking postMessage: Java exception was raised during method invocation",
  "Error invoking enableButtonsClickedMetaDataLogging: Java object is gone",
  "undefined is not an object (evaluating 'window.webkit.messageHandlers')",
  "undefined is not an object (evaluating 'window.webkit.messageHandlers[e].postMessage')",
]);

export function prepareBrowserSentryEvent<T extends Event>(
  event: T,
  userAgent: string,
): T {
  const exceptions = event.exception?.values ?? [];
  const isFacebookBridge =
    /\b(?:FBAN|FBAV|FB_IAB)\//.test(userAgent) &&
    exceptions.length > 0 &&
    exceptions.every((exception) =>
      facebookBridgeMessages.has(exception.value ?? ""),
    );
  // Classification, not suppression: missing stack frames do not prove the
  // error is harmless. Keep the event, severity, replay and app frames intact.
  const classified = isFacebookBridge
    ? {
        ...event,
        tags: { ...event.tags, error_origin: "facebook_browser_bridge" },
      }
    : event;
  return scrubSentryEvent(classified);
}
