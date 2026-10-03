import assert from "node:assert/strict";

const origin = new URL(process.argv[2] || "http://127.0.0.1:3016").origin;
const paths = [
  "/",
  "/how-to-play",
  "/rules",
  "/help",
  "/privacy",
  "/terms",
  "/thai-league/2026-27/fixtures",
];
const titles = [];
for (const path of paths) {
  const response = await fetch(origin + path, {
    signal: AbortSignal.timeout(60000),
    headers: { "User-Agent": "Googlebot" },
  });
  assert.equal(response.status, 200, path);
  const html = await response.text();
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  assert.equal(
    new URL(canonical?.[1]).href,
    new URL(path, "https://fantasy.ppfootball.net").href,
    `${path}: canonical`,
  );
  assert.match(
    html,
    /name="robots" content="index, follow"/,
    `${path}: indexable`,
  );
  assert.doesNotMatch(
    html,
    /http-equiv="refresh"/,
    `${path}: no auth redirect`,
  );
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  assert.ok(title, `${path}: title`);
  titles.push(title);
  console.log(`PASS public ${path}`);
}
assert.equal(new Set(titles).size, paths.length);
for (const path of [
  "/team",
  "/points",
  "/fixtures",
  "/leagues",
  "/admin/fantasy",
  "/auth/complete",
  "/email/unsubscribe",
]) {
  const response = await fetch(origin + path, {
    redirect: "manual",
    signal: AbortSignal.timeout(60000),
  });
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow", path);
  console.log(`PASS private ${path}`);
}
const sitemap = await (await fetch(origin + "/sitemap.xml")).text();
assert.equal((sitemap.match(/<loc>/g) || []).length, paths.length);
for (const path of paths)
  assert.ok(
    sitemap.includes(
      `<loc>${new URL(path, "https://fantasy.ppfootball.net").href}</loc>`,
    ),
  );
const robots = await (await fetch(origin + "/robots.txt")).text();
assert.match(robots, /Sitemap: https:\/\/fantasy.ppfootball.net\/sitemap.xml/);
console.log("PASS sitemap and robots");
