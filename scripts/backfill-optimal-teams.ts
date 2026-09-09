import { loadEnvConfig } from "@next/env";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";

loadEnvConfig(process.cwd());

async function backfillOptimalTeams() {
  const [
    { db },
    { fantasyGameweeks, fantasyGameweekOptimalTeams },
    optimalTeamService,
  ] = await Promise.all([
    import("../src/db/index.ts"),
    import("../src/db/schema.ts"),
    import("../src/lib/fantasy/optimal-team-service.ts"),
  ]);
  const expectedBranch = process.env.NEON_PRODUCTION_BRANCH_ID;
  if (expectedBranch) {
    const target = await db.execute<{ branch: string | null }>(sql`
      select current_setting('neon.branch_id', true) as branch
    `);
    if (target.rows[0]?.branch !== expectedBranch) {
      throw new Error("Database branch does not match the Production target.");
    }
  }
  const gameweeks = await db
    .select({
      id: fantasyGameweeks.id,
      number: fantasyGameweeks.number,
      status: fantasyGameweeks.status,
    })
    .from(fantasyGameweeks)
    .leftJoin(
      fantasyGameweekOptimalTeams,
      eq(fantasyGameweekOptimalTeams.fantasyGameweekId, fantasyGameweeks.id),
    )
    .where(
      and(
        inArray(fantasyGameweeks.status, ["provisional", "final"]),
        isNull(fantasyGameweekOptimalTeams.id),
      ),
    )
    .orderBy(asc(fantasyGameweeks.number));

  if (gameweeks.length === 0) {
    console.log("Every scored Gameweek already has a persisted optimal team.");
    return;
  }

  for (const gameweek of gameweeks) {
    console.log(
      `GW ${gameweek.number} (${gameweek.status}): computing persisted optimal team...`,
    );
    const result = await optimalTeamService.recalculateGameweekOptimalTeam(
      gameweek.id,
    );
    const detail =
      result.state === "ready"
        ? `, ${result.totalPoints} points from ${result.players} players`
        : "";
    console.log(
      `GW ${gameweek.number} (${gameweek.status}): ${result.state}${detail}.`,
    );
  }
}

backfillOptimalTeams().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
