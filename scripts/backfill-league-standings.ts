import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function backfillLeagueStandings() {
  const [{ transactionDb }, { fantasySeasons }, standingsService] =
    await Promise.all([
      import("../src/db/transaction.ts"),
      import("../src/db/schema.ts"),
      import("../src/lib/fantasy/league-standings-service.ts"),
    ]);
  const seasons = await transactionDb
    .select({ id: fantasySeasons.id, slug: fantasySeasons.slug })
    .from(fantasySeasons);

  for (const season of seasons) {
    const result = await transactionDb.transaction((tx) =>
      standingsService.refreshOverallLeagueStandings(season.id, tx),
    );
    console.log(
      `${season.slug}: ${result.standings} Overall standings through GW ${result.throughGameweekNumber ?? "not scored"}.`,
    );
  }
}

backfillLeagueStandings().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
