import { readFile, appendFile } from "node:fs/promises";
import nextEnv from "@next/env";
import { Pool } from "@neondatabase/serverless";
import {
  applyMigrationBatch,
  migrationFromSource,
  planMigrations,
  ReleaseError,
} from "./core.ts";
import type { AppliedMigration, MigrationPolicy } from "./core.ts";

nextEnv.loadEnvConfig(process.cwd());

async function run() {
  const mode = process.argv[2];
  if (!["check", "apply", "verify"].includes(mode))
    throw new ReleaseError("Expected check, apply or verify.");
  const expected = process.env.NEON_PRODUCTION_BRANCH_ID;
  if (!expected || !process.env.DATABASE_URL)
    throw new ReleaseError(
      "Database connection and explicit expected branch are required.",
    );
  if (
    mode === "apply" &&
    (process.env.GITHUB_REF !== "refs/heads/main" ||
      process.env.GITHUB_ACTIONS !== "true")
  ) {
    throw new ReleaseError(
      "Automatic apply is restricted to the main GitHub Actions release job.",
    );
  }
  const journal = JSON.parse(
    await readFile("drizzle/meta/_journal.json", "utf8"),
  );
  const migrations = await Promise.all(
    journal.entries.map(async (entry: { tag: string; when: number }) => {
      if (!/^\d{4}_[a-z0-9_]+$/.test(entry.tag))
        throw new ReleaseError("Invalid migration filename in journal.");
      return migrationFromSource(
        entry.tag,
        entry.when,
        await readFile(`drizzle/${entry.tag}.sql`, "utf8"),
      );
    }),
  );
  const policy: MigrationPolicy = JSON.parse(
    await readFile("scripts/release/migration-policy.json", "utf8"),
  );
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 15_000,
  });
  try {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("set local lock_timeout = '10s'");
      await client.query("set local statement_timeout = '60s'");
      const { rows } = await client.query(
        "select current_setting('neon.branch_id', true) as branch, current_database() as name, clock_timestamp() as restore_at",
      );
      if (rows[0]?.branch !== expected || rows[0]?.name !== "neondb")
        throw new ReleaseError(
          "Database branch or name does not match the configured production target.",
        );
      await client.query(
        "select pg_advisory_xact_lock(hashtext('pp-thaileague-fantasy:release'))",
      );
      await client.query(
        "lock table drizzle.__drizzle_migrations in exclusive mode",
      );
      const applied = await client.query<AppliedMigration>(
        "select hash, created_at from drizzle.__drizzle_migrations order by created_at",
      );
      const pending = planMigrations(migrations, applied.rows, policy);
      console.log(
        `Confirmed branch ${expected}; ${applied.rows.length} applied, ${pending.length} pending migrations.`,
      );
      if (mode === "verify" && pending.length)
        throw new ReleaseError("Database still has pending migrations.");
      if (mode === "apply" && pending.length) {
        const reference = `Pre-migration recovery reference: ${new Date(rows[0].restore_at).toISOString()} (subject to Neon history retention; not a backup).`;
        console.log(reference);
        if (process.env.GITHUB_STEP_SUMMARY)
          await appendFile(process.env.GITHUB_STEP_SUMMARY, `${reference}\n\n`);
        await applyMigrationBatch(
          (statement, parameters) => client.query(statement, parameters),
          pending,
        );
        const after = await client.query<AppliedMigration>(
          "select hash, created_at from drizzle.__drizzle_migrations order by created_at",
        );
        if (planMigrations(migrations, after.rows, policy).length)
          throw new ReleaseError("Migration journal verification failed.");
      }
      await client.query("commit");
      console.log(
        mode === "apply"
          ? "Migration transaction completed."
          : "Migration verification passed.",
      );
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

run().catch((error: unknown) => {
  console.error(
    error instanceof ReleaseError
      ? error.message
      : "Database release failed. No credentials, SQL or row values are logged. Inspect the database separately.",
  );
  process.exitCode = 1;
});
