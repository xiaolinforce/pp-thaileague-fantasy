import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { runFantasyScenarioCli } =
    await import("./scenarios/fantasy-scenarios.ts");
  await runFantasyScenarioCli(process.argv.slice(2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
