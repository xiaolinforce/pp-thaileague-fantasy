import test from "node:test";
import assert from "node:assert/strict";
import { analyticsPath } from "../../src/lib/analytics.ts";
import { PUBLIC_PATHS, publicMetadata, SITE_URL } from "../../src/lib/seo.ts";

test("analytics never exposes private URL parameters or league identifiers", () => {
  assert.equal(
    analyticsPath("/team?email=private@example.com#secret"),
    "/team",
  );
  assert.equal(
    analyticsPath("/leagues/private-league-id?code=secret"),
    "/leagues/detail",
  );
  for (const path of [
    "/auth/complete?token=secret",
    "/api/auth/callback/google",
    "/email/unsubscribe?token=secret",
    "/admin/fantasy/participants/person",
    "/upgrade",
    "/unreviewed-page",
    "/how-to-play",
  ]) {
    assert.equal(analyticsPath(path), null);
  }
});

test("retired guide is excluded from public indexing and measurement", () => {
  assert.ok(!PUBLIC_PATHS.some((path: string) => path === "/how-to-play"));
  assert.equal(analyticsPath("/how-to-play"), null);
  assert.equal(analyticsPath("/rules"), "/rules");
});

test("public pages have unique titles and canonical URLs in both languages", () => {
  for (const language of ["th", "en"] as const) {
    const titles = PUBLIC_PATHS.map((path) => {
      const metadata = publicMetadata(path, language);
      assert.equal(
        metadata.alternates?.canonical,
        new URL(path, SITE_URL).href,
      );
      assert.ok(metadata.description);
      assert.equal(metadata.openGraph?.url, metadata.alternates?.canonical);
      return metadata.title;
    });
    assert.equal(new Set(titles).size, PUBLIC_PATHS.length);
  }
});
