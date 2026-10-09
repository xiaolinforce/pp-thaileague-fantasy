import assert from "node:assert/strict";
import test from "node:test";
import type { Event } from "@sentry/nextjs";
import {
  prepareBrowserSentryEvent,
  scrubSentryBreadcrumb,
  scrubSentryEvent,
  scrubSentryLog,
} from "./sentry.ts";

test("redacts Drizzle parameters throughout an event while retaining the cause", () => {
  const message =
    "Failed query: select * from fantasy_managers where auth_user_id = $1\nparams: private-manager-id,1";
  const original: Event = {
    message,
    environment: "development",
    release: "test-release",
    exception: {
      values: [
        { type: "Error", value: message },
        {
          type: "NeonDbError",
          value: 'column "is_bot" does not exist',
          stacktrace: {
            frames: [{ filename: "/src/auth/context.ts", lineno: 12 }],
          },
        },
      ],
    },
    breadcrumbs: [
      { category: "console", message, data: { arguments: [message] } },
    ],
    extra: { failure: { message, params: ["private-manager-id"] } },
  };
  const clean = scrubSentryEvent(original);
  assert.ok(!JSON.stringify(clean).includes("private-manager-id"));
  assert.equal(
    clean.exception?.values?.[1]?.value,
    'column "is_bot" does not exist',
  );
  assert.equal(
    clean.exception?.values?.[1]?.stacktrace?.frames?.[0]?.lineno,
    12,
  );
  assert.equal(clean.release, "test-release");
  assert.equal(original.message, message);
});

test("removes user, request secrets, URL credentials and query values", () => {
  const clean = scrubSentryEvent({
    user: { id: "private-user", email: "member@example.test" },
    request: {
      url: "https://user:password@example.test/team?code=secret#token",
      headers: { authorization: "Bearer secret" },
      data: { token: "secret" },
      query_string: "code=secret",
    },
    breadcrumbs: [
      { data: { from: "/?code=secret", to: "/team?invite=secret" } },
    ],
    extra: { detail: "Key (email)=(member@example.test) already exists." },
  });
  assert.equal(clean.user, undefined);
  assert.equal(clean.request?.url, "https://example.test/team");
  assert.equal(clean.request?.headers, undefined);
  assert.equal(clean.request?.data, undefined);
  assert.ok(!JSON.stringify(clean).includes("secret"));
  assert.ok(!JSON.stringify(clean).includes("member@example.test"));
});

test("scrubs breadcrumbs and structured logs before buffering", () => {
  assert.deepEqual(
    scrubSentryBreadcrumb({
      category: "console",
      message: "Maintenance failed",
      data: { arguments: ["private"] },
    }).data,
    {},
  );
  const log = scrubSentryLog({
    level: "error",
    message: "Failed query: delete from test\nparams: private",
    attributes: { params: ["private"], job: "auth-maintenance" },
  });
  assert.ok(!JSON.stringify(log).includes("private"));
  assert.equal(log.attributes?.job, "auth-maintenance");
});

test("keeps a known Facebook bridge error when its stack is missing", () => {
  const event: Event = {
    level: "error",
    event_id: "event",
    exception: {
      values: [{ value: "Error invoking postMessage: Java object is gone" }],
    },
  };
  const clean = prepareBrowserSentryEvent(
    event,
    "Mozilla/5.0 [FB_IAB/FB4A;FBAV/576.0.0;]",
  );
  assert.equal(clean?.tags?.error_origin, "facebook_browser_bridge");
  assert.equal(clean?.level, "error");
  assert.equal(clean?.event_id, "event");
  assert.equal(
    prepareBrowserSentryEvent(event, "Chrome/152.0.0")?.tags?.error_origin,
    undefined,
  );
  assert.equal(
    prepareBrowserSentryEvent<Event>(
      { exception: { values: [{ value: "Hydration failed" }] } },
      "[FBAN/FBIOS;]",
    )?.tags?.error_origin,
    undefined,
  );
});

test("retains real app failures chained to a bridge error without classifying them", () => {
  const clean = prepareBrowserSentryEvent<Event>(
    {
      exception: {
        values: [
          { value: "Error invoking postMessage: Java object is gone" },
          { value: "Saving the team failed" },
        ],
      },
    },
    "[FB_IAB/FB4A;]",
  );
  assert.ok(clean);
  assert.equal(clean.tags?.error_origin, undefined);
  assert.equal(clean.exception?.values?.length, 2);
});

test("drops a verified iOS bridge-only failure only in Facebook", () => {
  const event: Event = {
    level: "error",
    exception: {
      values: [
        {
          value:
            "undefined is not an object (evaluating 'window.webkit.messageHandlers[e].postMessage')",
          stacktrace: {
            frames: [{ filename: "app:///:1", lineno: 697, in_app: true }],
          },
        },
      ],
    },
  };
  const clean = prepareBrowserSentryEvent(
    event,
    "Mozilla/5.0 [FBAN/FBIOS;FBAV/576.0.0;]",
  );
  assert.equal(clean, null);
  assert.equal(
    prepareBrowserSentryEvent(event, "Mobile Safari/605.1.15")?.tags
      ?.error_origin,
    undefined,
  );
});

test("drops a verified Android bridge-only failure", () => {
  const clean = prepareBrowserSentryEvent<Event>(
    {
      exception: {
        values: [
          {
            value: "Error invoking postMessage: Java object is gone",
            stacktrace: {
              frames: [
                {
                  filename:
                    "app://navigation_performance_logger_android/index.js",
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
    },
    "Mozilla/5.0 [FB_IAB/FB4A;FBAV/576.0.0;]",
  );
  assert.equal(clean, null);
});

test("drops an exact bridge failure when application callers follow its source", () => {
  const clean = prepareBrowserSentryEvent<Event>(
    {
      exception: {
        values: [
          {
            value: "Error invoking postMessage: Java object is gone",
            stacktrace: {
              frames: [
                {
                  filename: "app://navigation_performance_logger_android",
                  in_app: true,
                },
                { filename: "/_next/static/chunks/app.js", in_app: true },
              ],
            },
          },
        ],
      },
    },
    "Mozilla/5.0 [FB_IAB/FB4A;]",
  );
  assert.equal(clean, null);
});

test("keeps an exact bridge message without a verified bridge frame", () => {
  const clean = prepareBrowserSentryEvent<Event>(
    {
      exception: {
        values: [
          {
            value: "Error invoking postMessage: Java object is gone",
            stacktrace: {
              frames: [
                { filename: "/_next/static/chunks/app.js", in_app: true },
              ],
            },
          },
        ],
      },
    },
    "Mozilla/5.0 [FB_IAB/FB4A;]",
  );
  assert.equal(clean?.tags?.error_origin, "facebook_browser_bridge");
  assert.equal(clean?.exception?.values?.[0]?.stacktrace?.frames?.length, 1);
});

function obscuraRuntimeEvent(): Event {
  return {
    environment: "production",
    release: "eb02685548c7174d0d1d998ee647380317fc51da",
    exception: {
      values: [
        {
          type: "TypeError",
          value: "Cannot read properties of undefined (reading 'toLowerCase')",
          mechanism: {
            type: "auto.browser.global_handlers.onunhandledrejection",
            handled: false,
          },
          stacktrace: {
            frames: [
              { filename: "ext:core/01_core.js", lineno: 294, colno: 9 },
              { filename: "<script>", lineno: 1, colno: 100633, in_app: true },
              {
                filename: "<obscura:bootstrap>",
                lineno: 346,
                colno: 75,
                in_app: true,
              },
              { filename: "<script>", lineno: 48, colno: 260184, in_app: true },
            ],
          },
        },
      ],
    },
  };
}

test("drops the observed Obscura runtime rejection despite in-app labels", () => {
  const event = obscuraRuntimeEvent();
  assert.equal(prepareBrowserSentryEvent(event, "Chrome/152.0.0"), null);
  assert.equal(event.exception?.values?.[0]?.stacktrace?.frames?.length, 4);
});

test("keeps the same TypeError from application code or an unidentified frame", () => {
  for (const filename of [
    "/_next/static/chunks/app.js",
    "https://fantasy.ppfootball.net/_next/static/chunks/app.js",
    "/src/components/fantasy/position-badge.tsx",
    "<anonymous>",
    undefined,
  ]) {
    const event = obscuraRuntimeEvent();
    event.exception!.values![0].stacktrace!.frames!.push({ filename });
    assert.ok(prepareBrowserSentryEvent(event, "Chrome/152.0.0"), filename);
  }
});

test("keeps incomplete Obscura stacks even with the exact TypeError", () => {
  for (const filename of ["<obscura:bootstrap>", "ext:core/01_core.js"]) {
    const event = obscuraRuntimeEvent();
    const stack = event.exception!.values![0].stacktrace!;
    stack.frames = stack.frames!.filter((frame) => frame.filename !== filename);
    assert.ok(prepareBrowserSentryEvent(event, "Chrome/152.0.0"));
  }
  const event = obscuraRuntimeEvent();
  delete event.exception!.values![0].stacktrace;
  assert.ok(prepareBrowserSentryEvent(event, "Chrome/152.0.0"));
  assert.ok(prepareBrowserSentryEvent({}, "Chrome/152.0.0"));
});

test("keeps other failures and capture mechanisms in the injected runtime", () => {
  const otherMessage = obscuraRuntimeEvent();
  otherMessage.exception!.values![0].value = "Saving the team failed";
  assert.ok(prepareBrowserSentryEvent(otherMessage, "Chrome/152.0.0"));

  const otherType = obscuraRuntimeEvent();
  otherType.exception!.values![0].type = "Error";
  assert.ok(prepareBrowserSentryEvent(otherType, "Chrome/152.0.0"));

  const manualCapture = obscuraRuntimeEvent();
  manualCapture.exception!.values![0].mechanism!.type = "generic";
  assert.ok(prepareBrowserSentryEvent(manualCapture, "Chrome/152.0.0"));

  const missingMechanism = obscuraRuntimeEvent();
  delete missingMechanism.exception!.values![0].mechanism;
  assert.ok(prepareBrowserSentryEvent(missingMechanism, "Chrome/152.0.0"));
});

test("retains and scrubs application exceptions chained to an Obscura failure", () => {
  const event = obscuraRuntimeEvent();
  event.exception!.values!.push({
    type: "Error",
    value: "Failed query: select * from test\nparams: private-manager-id",
  });
  const clean = prepareBrowserSentryEvent(event, "Chrome/152.0.0");
  assert.ok(clean);
  assert.equal(clean.exception?.values?.length, 2);
  assert.ok(!JSON.stringify(clean).includes("private-manager-id"));
});
