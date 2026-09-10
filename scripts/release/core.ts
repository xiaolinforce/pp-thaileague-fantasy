import { createHash } from "node:crypto";

export class ReleaseError extends Error {}

export const releaseHealthPaths = [
  "/api/health",
  "/api/health/ready",
  "/rules",
  "/privacy",
] as const;

export type Migration = {
  tag: string;
  timestamp: number;
  hash: string;
  statements: string[];
};

export type AppliedMigration = { created_at: string | number; hash: string };

export function migrationFromSource(
  tag: string,
  timestamp: number,
  source: string,
): Migration {
  // Match committed LF bytes even in an older Windows checkout.
  const canonical = source.replace(/\r\n/g, "\n");
  return {
    tag,
    timestamp,
    hash: createHash("sha256").update(canonical).digest("hex"),
    statements: canonical.split("--> statement-breakpoint"),
  };
}
export type MigrationPolicy = Record<
  string,
  {
    sha256: string;
    compatibility: "compatible" | "app-first" | "coordinated";
  }
>;

export type MigrationOrder = "database-first" | "application-first";

export type MigrationPlan = {
  pending: Migration[];
  order: MigrationOrder;
};

export type ReleaseState = {
  id?: string;
  origin?: string;
  sha?: string;
  productionVerifiedSha?: string;
  productionVerifiedDeploymentId?: string;
};

export function assertApplicationFirstReady(
  state: ReleaseState,
  sha: string | undefined,
) {
  if (
    !sha ||
    state.sha !== sha ||
    state.productionVerifiedSha !== sha ||
    state.productionVerifiedDeploymentId !== state.id
  ) {
    throw new ReleaseError(
      "Application-first migration cannot run before the exact candidate is verified in production.",
    );
  }
}

export function planMigrations(
  migrations: Migration[],
  applied: AppliedMigration[],
  policy: MigrationPolicy,
): MigrationPlan {
  const tags = new Set<string>();
  for (const [index, migration] of migrations.entries()) {
    if (
      tags.has(migration.tag) ||
      !Number.isSafeInteger(migration.timestamp) ||
      migration.timestamp <= (migrations[index - 1]?.timestamp ?? 0)
    ) {
      throw new ReleaseError(
        "Source migration journal is not strictly ordered.",
      );
    }
    tags.add(migration.tag);
  }
  if (!applied.length) {
    throw new ReleaseError(
      "Release requires an initialized database; bootstrap separately.",
    );
  }
  const ordered = [...applied].sort(
    (a, b) => Number(a.created_at) - Number(b.created_at),
  );
  for (const [index, row] of ordered.entries()) {
    const migration = migrations[index];
    if (
      !migration ||
      migration.timestamp !== Number(row.created_at) ||
      migration.hash !== row.hash
    ) {
      throw new ReleaseError(
        "Database migration history differs from this commit. Stop and inspect; never rewrite applied history.",
      );
    }
  }
  const pending = migrations.slice(ordered.length);
  let order: MigrationOrder | undefined;
  for (const migration of pending) {
    const review = policy[migration.tag];
    if (!review || review.sha256 !== migration.hash) {
      throw new ReleaseError(
        `Migration ${migration.tag} needs a matching SHA-256 compatibility review in scripts/release/migration-policy.json.`,
      );
    }
    if (review.compatibility === "coordinated") {
      throw new ReleaseError(
        `Migration ${migration.tag} needs a coordinated release with a write pause; automatic release stopped before SQL changes.`,
      );
    }
    const migrationOrder =
      review.compatibility === "app-first"
        ? "application-first"
        : "database-first";
    if (order && order !== migrationOrder) {
      throw new ReleaseError(
        "Pending database-first and application-first migrations cannot share one automatic release. Split them into separate releases.",
      );
    }
    order = migrationOrder;
  }
  return { pending, order: order ?? "database-first" };
}

export type Query = (
  statement: string,
  parameters?: unknown[],
) => Promise<{ rows: Record<string, unknown>[] }>;

export async function applyMigrationBatch(query: Query, pending: Migration[]) {
  for (const migration of pending) {
    for (const statement of migration.statements) {
      if (statement.trim()) await query(statement);
    }
    await query(
      "insert into drizzle.__drizzle_migrations(hash, created_at) values ($1, $2)",
      [migration.hash, migration.timestamp],
    );
  }
}

export type Deployment = {
  id?: string;
  uid?: string;
  url: string;
  target?: string | null;
  readyState?: string;
  state?: string;
  projectId?: string;
  project?: { id: string };
  meta?: Record<string, string>;
};

export function assertDeployment(
  deployment: Deployment,
  sha: string,
  projectId: string,
) {
  if (
    deployment.target !== "production" ||
    deployment.meta?.githubCommitRef !== "main" ||
    deployment.meta?.githubCommitSha !== sha ||
    (deployment.projectId ?? deployment.project?.id) !== projectId ||
    (deployment.readyState ?? deployment.state) !== "READY"
  ) {
    throw new ReleaseError(
      "Candidate is not a Ready production deployment of this exact main commit and project.",
    );
  }
  const url = new URL(`https://${deployment.url}`);
  if (
    !url.hostname.endsWith(".vercel.app") ||
    url.pathname !== "/" ||
    url.search ||
    url.username ||
    url.password
  ) {
    throw new ReleaseError("Unexpected deployment hostname.");
  }
  return url.origin;
}
