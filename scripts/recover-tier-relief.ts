import assert from "node:assert/strict";
import { loadEnvConfig } from "@next/env";
import { eq, sql } from "drizzle-orm";
import { fantasyTierReliefs } from "../src/db/schema";

loadEnvConfig(process.cwd());

// Reusable, evidence-backed recovery. No source payloads or credentials belong here.
async function run() {
  const option = (name: string) =>
    process.argv
      .find((arg) => arg.startsWith(`--${name}=`))
      ?.slice(name.length + 3);
  const branchId = option("branch-id");
  const auditId = option("audit-id");
  const actor = option("actor");
  const apply = process.argv.includes("--apply");
  assert.ok(
    branchId && auditId && actor,
    "Required: --branch-id=... --audit-id=... --actor=...; default is rollback rehearsal, --apply commits.",
  );
  const { transactionDb } = await import("../src/db/transaction");
  const { adoptAuditedTierChange } =
    await import("../src/lib/fantasy/tier-relief-service");
  const rehearsal = new Error("recovery-rehearsal-rollback");
  try {
    await transactionDb.transaction(async (tx) => {
      const target = (
        await tx.execute<{ branch: string }>(
          sql`select current_setting('neon.branch_id', true) branch`,
        )
      ).rows[0]?.branch;
      assert.equal(
        target,
        branchId,
        "Database branch must match the explicit target",
      );
      const eventId = await adoptAuditedTierChange(tx, auditId, actor);
      const grants = await tx
        .select({ allowed: fantasyTierReliefs.allowedPlayerIds })
        .from(fantasyTierReliefs)
        .where(eq(fantasyTierReliefs.eventId, eventId));
      console.log(
        JSON.stringify({
          branch: target,
          eventId,
          activeReliefs: grants.filter((r) => r.allowed.length > 5).length,
          counts: grants.map((r) => r.allowed.length).sort((a, b) => a - b),
          mode: apply ? "apply" : "rollback-rehearsal",
        }),
      );
      if (!apply) throw rehearsal;
    });
    console.log(
      "Recovery committed. Original tiers, selections, revisions and scores were not rewritten.",
    );
  } catch (error) {
    if (error !== rehearsal) throw error;
    console.log("Rehearsal passed; every recovery write rolled back.");
  } finally {
    await transactionDb.$client.end();
  }
}

run().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Tier-relief recovery failed",
  );
  process.exitCode = 1;
});
