import assert from "node:assert/strict";

const origin = new URL(process.argv[2] || "http://127.0.0.1:3016").origin;
const paths = ["/", "/rules", "/help", "/privacy", "/terms", "/fixtures"];
const titles = [];
for (const path of paths) {
  const response = await fetch(origin + path, {
    signal: AbortSignal.timeout(60000),
    headers: { "User-Agent": "Googlebot" },
  });
  assert.equal(response.status, 200, path);
  assert.doesNotMatch(
    response.headers.get("x-robots-tag") ?? "",
    /\bnoindex\b/i,
    `${path}: noindex header must not override public metadata`,
  );
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
for (const language of ["th", "en"]) {
  const response = await fetch(origin, {
    headers: { Cookie: `thai-fantasy-language=${language}` },
    signal: AbortSignal.timeout(60000),
  });
  assert.equal(response.status, 200, `home ${language}`);
  const html = await response.text();
  assert.match(html, new RegExp(`<html[^>]+lang="${language}"`));
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
  assert.ok(main, `home ${language}: server-rendered content`);
  for (const path of ["/rules", "/fixtures", "/help"]) {
    assert.ok(
      main.includes(`href="${path}"`),
      `home ${language}: link to ${path}`,
    );
  }
  const heading = main.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1];
  assert.ok(heading?.trim(), `home ${language}: server-rendered heading`);
  if (language === "en") {
    assert.doesNotMatch(
      main.replace(/<[^>]*>/g, ""),
      /[\u0E00-\u0E7F]/u,
      "English home content must not wait for hydration to translate",
    );
  } else {
    assert.match(heading, /[\u0E00-\u0E7F]/u, "Thai home heading");
  }
  console.log(`PASS home ${language} is localized before hydration`);
}
const retiredPaths = [
  ["/how-to-play", "/rules"],
  ["/thai-league/2026-27/fixtures", "/fixtures"],
];
for (const [source, destination] of retiredPaths) {
  const response = await fetch(origin + source, { redirect: "manual" });
  assert.equal(response.status, 308, `${source} permanently redirects`);
  assert.equal(
    new URL(response.headers.get("location"), origin).pathname,
    destination,
  );
  console.log(`PASS ${source} redirects to ${destination}`);
}
for (const path of [
  "/team",
  "/points",
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
for (const [source] of retiredPaths) {
  assert.ok(!sitemap.includes(source), `${source} is absent from sitemap`);
}
for (const path of paths)
  assert.ok(
    sitemap.includes(
      `<loc>${new URL(path, "https://fantasy.ppfootball.net").href}</loc>`,
    ),
  );
const robots = await (await fetch(origin + "/robots.txt")).text();
assert.match(robots, /Sitemap: https:\/\/fantasy.ppfootball.net\/sitemap.xml/);
console.log("PASS sitemap and robots");
