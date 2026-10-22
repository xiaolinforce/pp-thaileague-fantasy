import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "../../src/proxy";

test("rejects unsupported native multipart forms on Home without reading the body", async () => {
  const form = new FormData();
  form.set("$ACTION_ID_missing", "");
  const request = new NextRequest("https://example.test/?returnTo=/team", {
    method: "POST",
    body: form,
  });
  const response = proxy(request);
  assert.equal(response.status, 400);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(request.bodyUsed, false);
  assert.equal(await response.text(), "Unsupported form submission.");
});

test("preserves JS Server Actions, other routes and normal page navigation", () => {
  for (const [path, method, headers] of [
    ["/", "GET", {}],
    ["/", "HEAD", {}],
    [
      "/",
      "POST",
      {
        "next-action": "action-id",
        "content-type": "multipart/form-data; boundary=test",
      },
    ],
    [
      "/",
      "POST",
      {
        "next-action": "action-id",
        "content-type": "text/plain;charset=UTF-8",
      },
    ],
    [
      "/api/auth/sign-in/email-otp",
      "POST",
      { "content-type": "application/json" },
    ],
    ["/team", "POST", { "content-type": "multipart/form-data; boundary=test" }],
    [
      "/admin/fantasy/gameweeks",
      "POST",
      { "content-type": "multipart/form-data; boundary=test" },
    ],
  ] as const) {
    const response = proxy(
      new NextRequest(`https://example.test${path}`, { method, headers }),
    );
    assert.equal(
      response.headers.get("x-middleware-next"),
      "1",
      `${method} ${path}`,
    );
  }
});
