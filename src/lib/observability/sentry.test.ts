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

test("classifies known Facebook bridge errors without suppressing failures", () => {
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
  assert.equal(clean.tags?.error_origin, "facebook_browser_bridge");
  assert.equal(clean.level, "error");
  assert.equal(clean.event_id, "event");
  assert.equal(
    prepareBrowserSentryEvent(event, "Chrome/152.0.0").tags?.error_origin,
    undefined,
  );
  assert.equal(
    prepareBrowserSentryEvent<Event>(
      { exception: { values: [{ value: "Hydration failed" }] } },
      "[FBAN/FBIOS;]",
    ).tags?.error_origin,
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
  assert.equal(clean.tags?.error_origin, undefined);
  assert.equal(clean.exception?.values?.length, 2);
});
