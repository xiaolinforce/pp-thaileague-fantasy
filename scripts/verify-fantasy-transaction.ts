import { loadEnvConfig } from "@next/env";
import { Pool } from "@neondatabase/serverless";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";

import { fantasyGameweeks } from "../src/db/schema.ts";

loadEnvConfig(process.cwd());
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");

const expectedBranchId = process.argv
  .find((argument) => argument.startsWith("--branch-id="))
  ?.slice("--branch-id=".length);
const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle(pool);

async function run() {
  const branchResult = await db.execute<{ branch_id: string | null }>(sql`
    select current_setting('neon.branch_id', true) as branch_id
  `);
  const branchId = branchResult.rows[0]?.branch_id ?? null;
  if (!expectedBranchId || expectedBranchId !== branchId) {
    throw new Error(
      `Refusing rollback verification: expected ${expectedBranchId ?? "(missing)"}, connected to ${branchId ?? "unknown"}.`,
    );
  }
  const beforeRows = await db
    .select({ id: fantasyGameweeks.id, updatedAt: fantasyGameweeks.updatedAt })
    .from(fantasyGameweeks)
    .where(eq(fantasyGameweeks.status, "planned"))
    .limit(1);
  const before = beforeRows[0];
  if (!before) throw new Error("No planned Gameweek is available for testing.");

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(fantasyGameweeks)
        .set({ updatedAt: new Date(0) })
        .where(eq(fantasyGameweeks.id, before.id));
      throw new Error("intentional-rollback");
    });
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "intentional-rollback") {
      throw error;
    }
  }

  const afterRows = await db
    .select({ updatedAt: fantasyGameweeks.updatedAt })
    .from(fantasyGameweeks)
    .where(eq(fantasyGameweeks.id, before.id))
    .limit(1);
  if (afterRows[0]?.updatedAt.getTime() !== before.updatedAt.getTime()) {
    throw new Error("Transaction rollback did not restore the Gameweek row.");
  }
  console.log(`Transaction rollback verified on branch ${branchId}.`);
}

run()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
