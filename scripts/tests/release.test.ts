import assert from "node:assert/strict";
import test from "node:test";
import {
  applyMigrationBatch,
  assertDeployment,
  migrationFromSource,
  planMigrations,
  releaseHealthPaths,
} from "../release/core.ts";
import type { Deployment, Migration } from "../release/core.ts";

const migrations: Migration[] = [
  {
    tag: "0000_base",
    timestamp: 100,
    hash: "a",
    statements: ["create table baseline(id int)"],
  },
  {
    tag: "0001_expand",
    timestamp: 200,
    hash: "b",
    statements: ["alter table baseline add column label text"],
  },
];
const applied = [{ created_at: "100", hash: "a" }];
const policy = {
  "0001_expand": { sha256: "b", compatibility: "compatible" as const },
};

test("release checks only currently published health and document routes", () => {
  assert.deepEqual(releaseHealthPaths, [
    "/api/health",
    "/api/health/ready",
    "/rules",
    "/privacy",
  ]);
});

test("LF and CRLF checkouts produce the same committed migration hash", () => {
  assert.deepEqual(
    migrationFromSource("0001_test", 200, "select 1;\r\n"),
    migrationFromSource("0001_test", 200, "select 1;\n"),
  );
});

test("an up-to-date database is a no-op without reapplying old migrations", () => {
  assert.deepEqual(
    planMigrations(
      migrations,
      [...applied, { created_at: "200", hash: "b" }],
      {},
    ),
    [],
  );
});
test("only a reviewed pending migration is selected", () => {
  assert.deepEqual(planMigrations(migrations, applied, policy), [
    migrations[1],
  ]);
});
test("empty, future, duplicated and incomplete database journals stop release", () => {
  for (const rows of [
    [],
    [{ created_at: 200, hash: "b" }],
    [...applied, ...applied],
    [...applied, { created_at: 300, hash: "c" }],
  ]) {
    assert.throws(() => planMigrations(migrations, rows, policy));
  }
});
test("modified applied SQL cannot silently pass", () => {
  assert.throws(
    () =>
      planMigrations(
        [{ ...migrations[0], hash: "edited" }, migrations[1]],
        applied,
        policy,
      ),
    /history differs/,
  );
});
test("duplicated or out-of-order source migrations stop release", () => {
  for (const source of [
    [migrations[0], migrations[0]],
    [migrations[1], migrations[0]],
    [migrations[0], { ...migrations[1], timestamp: Number.NaN }],
  ])
    assert.throws(
      () => planMigrations(source, applied, policy),
      /strictly ordered/,
    );
});
test("missing review or SQL edited after review blocks pending migration", () => {
  assert.throws(
    () => planMigrations(migrations, applied, {}),
    /compatibility review/,
  );
  assert.throws(
    () =>
      planMigrations(migrations, applied, {
        "0001_expand": { ...policy["0001_expand"], sha256: "old" },
      }),
    /compatibility review/,
  );
});
test("a coordinated migration never enters the automatic SQL batch", () => {
  assert.throws(
    () =>
      planMigrations(migrations, applied, {
        "0001_expand": { sha256: "b", compatibility: "coordinated" },
      }),
    /write pause/,
  );
});
test("a failed SQL statement stops subsequent migrations and journal writes", async () => {
  const statements: string[] = [];
  await assert.rejects(
    applyMigrationBatch(async (statement) => {
      statements.push(statement);
      throw new Error("injected database failure");
    }, migrations),
    /injected/,
  );
  assert.deepEqual(statements, [migrations[0].statements[0]]);
});
test("an empty migration batch performs no SQL writes", async () => {
  await applyMigrationBatch(async () => {
    assert.fail("Unexpected SQL");
  }, []);
});

const sha = "a".repeat(40);
const candidate: Deployment = {
  id: "dpl_test",
  projectId: "prj_test",
  url: "example.vercel.app",
  target: "production",
  readyState: "READY",
  meta: { githubCommitRef: "main", githubCommitSha: sha },
};
test("a Ready deployment from this main commit and project is accepted", () => {
  assert.equal(
    assertDeployment(candidate, sha, "prj_test"),
    "https://example.vercel.app",
  );
});
test("preview, failed build, stale commit and another project are rejected", () => {
  for (const changed of [
    { target: "preview" },
    { readyState: "ERROR" },
    { projectId: "prj_other" },
    { meta: { githubCommitRef: "main", githubCommitSha: "b".repeat(40) } },
    { meta: { githubCommitRef: "dev", githubCommitSha: sha } },
  ])
    assert.throws(() =>
      assertDeployment({ ...candidate, ...changed }, sha, "prj_test"),
    );
});
test("health credentials cannot be sent to an unexpected candidate host", () => {
  for (const url of [
    "attacker.example",
    "vercel.app.attacker.example",
    "user:password@example.vercel.app",
    "example.vercel.app/path",
    "example.vercel.app?redirect=elsewhere",
  ]) {
    assert.throws(() =>
      assertDeployment({ ...candidate, url }, sha, "prj_test"),
    );
  }
});
