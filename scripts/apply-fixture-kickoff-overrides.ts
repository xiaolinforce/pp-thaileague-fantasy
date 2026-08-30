import { loadEnvConfig } from "@next/env";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import { fixtures } from "../src/db/schema.ts";
import { fixtureKickoffOverrides } from "./sources/fixture-kickoff-overrides.ts";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");

const db = drizzle(databaseUrl);
const apply = process.argv.includes("--apply");
const expectedBranchId = process.argv
  .find((argument) => argument.startsWith("--branch-id="))
  ?.slice("--branch-id=".length);

async function run() {
  const branchResult = await db.execute<{ branch_id: string | null }>(sql`
    select current_setting('neon.branch_id', true) as branch_id
  `);
  const branchId = branchResult.rows[0]?.branch_id ?? null;
  if (apply && (!expectedBranchId || branchId !== expectedBranchId)) {
    throw new Error(
      `Refusing to apply fixture overrides: expected branch ${expectedBranchId ?? "(missing)"}, connected to ${branchId ?? "unknown"}.`,
    );
  }

  const matchNumbers = fixtureKickoffOverrides.map(
    (override) => override.matchNumber,
  );
  const existing = await db
    .select({
      id: fixtures.id,
      matchNumber: fixtures.matchNumber,
      matchweek: fixtures.matchweek,
      kickoffAt: fixtures.kickoffAt,
      status: fixtures.status,
    })
    .from(fixtures)
    .where(inArray(fixtures.matchNumber, matchNumbers));
  if (existing.length !== fixtureKickoffOverrides.length) {
    throw new Error(
      `Expected ${fixtureKickoffOverrides.length} fixtures, found ${existing.length}.`,
    );
  }

  let changed = 0;
  let preserved = 0;
  for (const override of fixtureKickoffOverrides) {
    const fixture = existing.find(
      (candidate) => candidate.matchNumber === override.matchNumber,
    );
    if (!fixture)
      throw new Error(`Fixture ${override.matchNumber} is missing.`);
    if (fixture.kickoffAt) {
      preserved += 1;
      continue;
    }
    changed += 1;
    if (apply) {
      await db
        .update(fixtures)
        .set({
          kickoffAt: new Date(override.kickoffAt),
          status: "scheduled",
          updatedAt: new Date(),
        })
        .where(and(eq(fixtures.id, fixture.id), isNull(fixtures.kickoffAt)));
    }
  }

  console.log(
    `${apply ? "Applied" : "Previewed"} ${changed} simulated kickoff overrides on branch ${branchId}; preserved ${preserved} existing kickoffs.`,
  );
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
