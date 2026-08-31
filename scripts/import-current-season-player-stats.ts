import { loadEnvConfig } from "@next/env";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema.ts";
import {
  clubs,
  competitionEntries,
  competitionPlayerSeasonStats,
  competitionSeasons,
  playerRegistrations,
  players,
} from "../src/db/schema.ts";
import { matchOfficialSeasonPlayer } from "../src/lib/fantasy/competition-stats.ts";
import { currentPlayerStatOverrides } from "./sources/current-player-stat-overrides.ts";
import { THAI_LEAGUE_SOURCE } from "./sources/thai-league-2026-27.ts";
import {
  fetchCurrentSeasonPlayerStats,
  currentPlayerStatsSourceUrl,
} from "./sources/thai-league-2026-27-player-stats.ts";

loadEnvConfig(process.cwd());
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");

const db = drizzle(databaseUrl, { schema });
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
      `Refusing to import player stats: expected branch ${expectedBranchId ?? "(missing)"}, connected to ${branchId ?? "unknown"}.`,
    );
  }

  const season = await db.query.competitionSeasons.findFirst({
    where: eq(competitionSeasons.externalId, "224"),
  });
  if (!season) throw new Error("Competition season 224 was not found.");

  const [sourceRows, localRows, existingSourceRows] = await Promise.all([
    fetchCurrentSeasonPlayerStats(),
    db
      .select({
        playerId: players.id,
        playerExternalId: players.externalId,
        fullNameEn: players.fullNameEn,
        clubExternalId: clubs.externalId,
        competitionEntryId: competitionEntries.id,
      })
      .from(playerRegistrations)
      .innerJoin(players, eq(playerRegistrations.playerId, players.id))
      .innerJoin(
        competitionEntries,
        eq(playerRegistrations.competitionEntryId, competitionEntries.id),
      )
      .innerJoin(clubs, eq(competitionEntries.clubId, clubs.id))
      .where(
        and(
          eq(competitionEntries.competitionSeasonId, season.id),
          eq(playerRegistrations.status, "active"),
        ),
      ),
    db
      .select({
        sourceExternalId: competitionPlayerSeasonStats.sourceExternalId,
      })
      .from(competitionPlayerSeasonStats)
      .where(
        and(
          eq(competitionPlayerSeasonStats.competitionSeasonId, season.id),
          eq(competitionPlayerSeasonStats.sourceName, THAI_LEAGUE_SOURCE),
        ),
      ),
  ]);

  if (sourceRows.length === 0) {
    console.log(
      `Thai League currently publishes no player statistics for tournament 224. No data was written. Source: ${currentPlayerStatsSourceUrl}`,
    );
    return;
  }

  const localPlayerIdByExternalId = new Map(
    localRows.map((row) => [row.playerExternalId, row.playerId]),
  );
  const manualOverrides = Object.fromEntries(
    Object.entries(currentPlayerStatOverrides).flatMap(
      ([personId, playerExternalId]) => {
        const playerId = localPlayerIdByExternalId.get(playerExternalId);
        return playerId ? [[personId, playerId]] : [];
      },
    ),
  );
  if (
    Object.keys(manualOverrides).length !==
    Object.keys(currentPlayerStatOverrides).length
  ) {
    throw new Error(
      "A current player-stat override references an unknown player.",
    );
  }
  const candidates = localRows.map((row) => ({
    playerId: row.playerId,
    clubExternalId: row.clubExternalId,
    fullNameEn: row.fullNameEn,
  }));
  const entryByClubExternalId = new Map(
    localRows.map((row) => [row.clubExternalId, row.competitionEntryId]),
  );
  const matched = sourceRows.map((source) => ({
    source,
    match: matchOfficialSeasonPlayer(
      {
        personId: source.sourcePersonId,
        clubExternalId: source.clubExternalId,
        fullNameEn: source.fullNameEn,
      },
      candidates,
      manualOverrides,
    ),
  }));
  const unresolved = matched.filter((row) => row.match.status !== "matched");
  const sourceExternalIds = new Set(
    sourceRows.map((row) => row.sourceExternalId),
  );
  const staleSourceRows = existingSourceRows.filter(
    (row) => !sourceExternalIds.has(row.sourceExternalId),
  );
  console.table(
    unresolved.map(({ source, match }) => ({
      sourceRow: source.sourceExternalId,
      person: source.sourcePersonId,
      club: source.clubExternalId,
      player: source.fullNameEn,
      status: match.status,
    })),
  );
  console.log(
    `${apply ? "Import" : "Preview"}: ${matched.length - unresolved.length} matched, ${unresolved.length} unresolved, ${staleSourceRows.length} stale, branch ${branchId ?? "unknown"}.`,
  );
  if (unresolved.length > 0) {
    if (apply)
      throw new Error("Resolve every player identity before importing.");
    return;
  }
  if (!apply) return;

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.delete(competitionPlayerSeasonStats).where(
      and(
        eq(competitionPlayerSeasonStats.competitionSeasonId, season.id),
        eq(competitionPlayerSeasonStats.sourceName, THAI_LEAGUE_SOURCE),
        notInArray(
          competitionPlayerSeasonStats.sourceExternalId,
          sourceRows.map((row) => row.sourceExternalId),
        ),
      ),
    );
    for (const { source, match } of matched) {
      if (match.status !== "matched") continue;
      const competitionEntryId = entryByClubExternalId.get(
        source.clubExternalId,
      );
      if (!competitionEntryId) {
        throw new Error(`Club ${source.clubExternalId} has no active entry.`);
      }
      await tx
        .insert(competitionPlayerSeasonStats)
        .values({
          competitionSeasonId: season.id,
          competitionEntryId,
          playerId: match.playerId,
          sourceName: source.sourceName,
          sourceUrl: source.sourceUrl,
          sourceExternalId: source.sourceExternalId,
          sourcePersonId: source.sourcePersonId,
          matchMethod: match.method,
          appearances: source.appearances,
          starts: source.starts,
          minutes: source.minutes,
          goals: source.goals,
          sourceAssists: source.sourceAssists,
          cleanSheets: source.cleanSheets,
          goalsConceded: source.goalsConceded,
          penaltyGoals: source.penaltyGoals,
          penaltyMisses: source.penaltyMisses,
          yellowCards: source.yellowCards,
          redCards: source.redCards,
          ownGoals: source.ownGoals,
          sourcePayload: source.sourcePayload,
          importedAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [
            competitionPlayerSeasonStats.competitionSeasonId,
            competitionPlayerSeasonStats.sourceName,
            competitionPlayerSeasonStats.sourceExternalId,
          ],
          set: {
            competitionEntryId,
            playerId: match.playerId,
            sourcePersonId: source.sourcePersonId,
            sourceUrl: source.sourceUrl,
            matchMethod: match.method,
            appearances: source.appearances,
            starts: source.starts,
            minutes: source.minutes,
            goals: source.goals,
            sourceAssists: source.sourceAssists,
            cleanSheets: source.cleanSheets,
            goalsConceded: source.goalsConceded,
            penaltyGoals: source.penaltyGoals,
            penaltyMisses: source.penaltyMisses,
            yellowCards: source.yellowCards,
            redCards: source.redCards,
            ownGoals: source.ownGoals,
            sourcePayload: source.sourcePayload,
            importedAt: now,
            updatedAt: now,
          },
        });
    }
  });
  console.log(`Imported ${matched.length} official player-stat rows.`);
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
