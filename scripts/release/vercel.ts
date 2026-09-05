import { appendFile, readFile, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { assertDeployment, ReleaseError } from "./core.ts";
import type { Deployment } from "./core.ts";

const productionOrigin = "https://fantasy.ppfootball.net";
const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new ReleaseError(`Missing ${name}.`);
  return value;
};

async function vercel(path: string, method = "GET", body?: object) {
  const url = new URL(path, "https://api.vercel.com");
  url.searchParams.set("teamId", required("VERCEL_ORG_ID"));
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${required("VERCEL_TOKEN")}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok)
    throw new ReleaseError(
      `Vercel ${method} failed with HTTP ${response.status}.`,
    );
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

async function assertCurrentMain() {
  if (required("GITHUB_REF") !== "refs/heads/main")
    throw new ReleaseError("Only main can release production.");
  const sha = required("GITHUB_SHA");
  if (!/^[a-f0-9]{40}$/.test(sha))
    throw new ReleaseError("Invalid release commit.");
  if (required("GITHUB_REPOSITORY") !== "xiaolinforce/pp-thaileague-fantasy")
    throw new ReleaseError("Unexpected repository.");
  const response = await fetch(
    "https://api.github.com/repos/xiaolinforce/pp-thaileague-fantasy/git/ref/heads/main",
    {
      headers: {
        Authorization: `Bearer ${required("GITHUB_TOKEN")}`,
        Accept: "application/vnd.github+json",
      },
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!response.ok || (await response.json()).object?.sha !== sha)
    throw new ReleaseError(
      "main has moved or could not be verified. A stale release will not be promoted.",
    );
  return sha;
}

async function assertStagingConfiguration() {
  const project = await vercel(
    `/v9/projects/${encodeURIComponent(required("VERCEL_PROJECT_ID"))}`,
  );
  if (project.autoAssignCustomDomains !== false)
    throw new ReleaseError(
      "Vercel automatic production domain assignment must be disabled.",
    );
}

async function health(origin: string, protectedDeployment: boolean) {
  const baseHeaders: Record<string, string> = protectedDeployment
    ? {
        "x-vercel-protection-bypass": required(
          "VERCEL_AUTOMATION_BYPASS_SECRET",
        ),
      }
    : {};
  for (const path of [
    "/api/health",
    "/api/health/ready",
    "/rules",
    "/en/rules",
    "/privacy",
    "/en/privacy",
  ]) {
    let passed = false;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const response = await fetch(`${origin}${path}`, {
          headers: {
            ...baseHeaders,
            ...(path.endsWith("/ready")
              ? { Authorization: `Bearer ${required("CRON_SECRET")}` }
              : {}),
          },
          redirect: "error",
          signal: AbortSignal.timeout(15_000),
          cache: "no-store",
        });
        if (response.status === 200) {
          if (path === "/api/health") {
            const body = await response.json();
            passed =
              body.ok === true && body.service === "pp-thaileague-fantasy";
          } else if (path.endsWith("/ready")) {
            passed = (await response.json()).ready === true;
          } else {
            const text = await response.text();
            passed =
              text.includes("PP Thai League Fantasy") &&
              response.headers.get("x-content-type-options") === "nosniff";
          }
        }
      } catch {
        /* Retry transient network/cold-start failures without logging credentials. */
      }
      if (passed) break;
      if (attempt < 3) await delay(3000);
    }
    if (!passed)
      throw new ReleaseError(`Health verification failed for ${path}.`);
    console.log(`Passed ${path}`);
  }
}

async function run() {
  const mode = process.argv[2];
  const sha = await assertCurrentMain();
  const projectId = required("VERCEL_PROJECT_ID");
  const statePath = required("RELEASE_STATE_PATH");
  if (mode === "prepare") {
    for (const key of [
      "DATABASE_URL",
      "NEON_PRODUCTION_BRANCH_ID",
      "CRON_SECRET",
      "VERCEL_AUTOMATION_BYPASS_SECRET",
    ])
      required(key);
    await assertStagingConfiguration();
    console.log("Release configuration verified.");
    return;
  }
  if (mode === "candidate") {
    await assertStagingConfiguration();
    const input = new URL(process.argv[3]);
    if (
      input.protocol !== "https:" ||
      !input.hostname.endsWith(".vercel.app") ||
      input.pathname !== "/" ||
      input.search ||
      input.username ||
      input.password
    )
      throw new ReleaseError("Invalid candidate URL.");
    const deployment: Deployment = await vercel(
      `/v13/deployments/${encodeURIComponent(input.hostname)}`,
    );
    const origin = assertDeployment(deployment, sha, projectId);
    await writeFile(
      statePath,
      JSON.stringify({ id: deployment.id, origin, sha }),
    );
    if (process.env.GITHUB_STEP_SUMMARY)
      await appendFile(
        process.env.GITHUB_STEP_SUMMARY,
        `Candidate: ${origin}\n\nCommit: ${sha}\n\n`,
      );
    console.log(`Candidate confirmed: ${deployment.id}`);
    return;
  }
  const state = JSON.parse(await readFile(statePath, "utf8"));
  const deployment: Deployment = await vercel(
    `/v13/deployments/${encodeURIComponent(state.id)}`,
  );
  const origin = assertDeployment(deployment, sha, projectId);
  if (state.sha !== sha || state.origin !== origin)
    throw new ReleaseError("Candidate state differs from this release.");
  if (mode === "check") {
    await assertStagingConfiguration();
    await health(origin, true);
  } else if (mode === "promote") {
    await assertStagingConfiguration();
    try {
      await vercel(
        `/v10/projects/${encodeURIComponent(projectId)}/promote/${encodeURIComponent(state.id)}`,
        "POST",
        {},
      );
    } finally {
      // Promotion can reset this setting. Restore it even after an uncertain response.
      await vercel(`/v9/projects/${encodeURIComponent(projectId)}`, "PATCH", {
        autoAssignCustomDomains: false,
      });
      await assertStagingConfiguration();
    }
    console.log("Promotion requested; checking the production alias next.");
  } else if (mode === "production") {
    let matched = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      const alias = await vercel(
        `/v4/aliases/${new URL(productionOrigin).hostname}`,
      );
      if ((alias.deploymentId ?? alias.deployment?.id) === state.id) {
        matched = true;
        break;
      }
      await delay(2000);
    }
    if (!matched)
      throw new ReleaseError(
        "Production domain does not point to the verified candidate.",
      );
    await health(productionOrigin, false);
    await assertStagingConfiguration();
    if (process.env.GITHUB_STEP_SUMMARY)
      await appendFile(
        process.env.GITHUB_STEP_SUMMARY,
        `Production verified: ${productionOrigin}\n\nDeployment: ${state.id}\n`,
      );
  } else {
    throw new ReleaseError("Unknown Vercel release command.");
  }
}

run().catch((error: unknown) => {
  console.error(
    error instanceof ReleaseError
      ? error.message
      : "Release request failed. Sensitive response details are omitted.",
  );
  process.exitCode = 1;
});
