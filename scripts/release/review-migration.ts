import { readFile, writeFile } from "node:fs/promises";
import { migrationFromSource, ReleaseError } from "./core.ts";
import type { MigrationPolicy } from "./core.ts";

const allowed = new Set(["compatible", "app-first", "coordinated"]);

async function run() {
  const compatibility = process.argv[2];
  const requestedTag = process.argv[3];
  if (!compatibility || !allowed.has(compatibility))
    throw new ReleaseError(
      "Usage: npm run db:review -- <compatible|app-first|coordinated> [migration-tag]",
    );

  const journal: { entries: Array<{ tag: string; when: number }> } = JSON.parse(
    await readFile("drizzle/meta/_journal.json", "utf8"),
  );
  const entry = requestedTag
    ? journal.entries.find(({ tag }) => tag === requestedTag)
    : journal.entries.at(-1);
  if (!entry)
    throw new ReleaseError(
      requestedTag
        ? `Migration ${requestedTag} was not found in the journal.`
        : "The migration journal is empty.",
    );

  const migration = migrationFromSource(
    entry.tag,
    entry.when,
    await readFile(`drizzle/${entry.tag}.sql`, "utf8"),
  );
  const policyPath = "scripts/release/migration-policy.json";
  const policy: MigrationPolicy = JSON.parse(
    await readFile(policyPath, "utf8"),
  );
  policy[entry.tag] = {
    sha256: migration.hash,
    compatibility: compatibility as MigrationPolicy[string]["compatibility"],
  };
  await writeFile(policyPath, `${JSON.stringify(policy, null, 2)}\n`);
  console.log(
    `Reviewed ${entry.tag}: ${compatibility} (${migration.hash}). Run npm run test:release before committing.`,
  );
}

run().catch((error: unknown) => {
  console.error(
    error instanceof ReleaseError ? error.message : "Review failed.",
  );
  process.exitCode = 1;
});
