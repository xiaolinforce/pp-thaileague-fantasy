import { loadEnvConfig } from "@next/env";
import { and, asc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import {
  competitionEntries,
  competitionSeasons,
  fantasyGameweeks,
  fantasyLeagueMembers,
  fantasyLeagues,
  fantasyPlayers,
  fantasyPlayerTiers,
  fantasySeasons,
  fantasyTeams,
  fantasyTierDefinitions,
  fixtures,
  playerRegistrations,
  players,
} from "../src/db/schema";
import { getDeadline, type FantasyPosition } from "../src/lib/fantasy/rules.ts";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");

const db = drizzle(databaseUrl);
const COMPETITION_SEASON_EXTERNAL_ID = "224";

function isThaiRegistration(nationality: string | null) {
  if (!nationality) return false;
  const normalized = nationality.trim().toLocaleLowerCase();
  return (
    normalized.includes("thai") ||
    normalized.includes("thailand") ||
    normalized.includes("ไทย")
  );
}

function toFantasyPosition(position: string): FantasyPosition | null {
  if (position === "goalkeeper") return "goalkeeper";
  if (position === "defender") return "defender";
  if (position === "midfielder") return "midfielder";
  if (position === "forward") return "forward";
  return null;
}

async function seedFantasyGame() {
  const competitionSeason = await db
    .select()
    .from(competitionSeasons)
    .where(eq(competitionSeasons.externalId, COMPETITION_SEASON_EXTERNAL_ID))
    .limit(1);
  if (!competitionSeason[0])
    throw new Error("Thai League 1 2026/27 was not found.");

  const fantasySeasonRows = await db
    .insert(fantasySeasons)
    .values({
      competitionSeasonId: competitionSeason[0].id,
      slug: "thai-league-1-2026-27",
      nameTh: "ไทยลีกแฟนตาซี 2026/27",
      nameEn: "Thai League Fantasy 2026/27",
    })
    .onConflictDoUpdate({
      target: fantasySeasons.competitionSeasonId,
      set: {
        nameTh: "ไทยลีกแฟนตาซี 2026/27",
        nameEn: "Thai League Fantasy 2026/27",
        squadSize: 15,
        sameClubLimit: 3,
        foreignPlayerLimit: 7,
        weeklyFreeTransfers: 2,
        maximumFreeTransfers: 4,
        transferPointCost: 4,
        deadlineOffsetMinutes: 90,
        chipUsesPerSeason: 2,
        updatedAt: new Date(),
      },
    })
    .returning();
  const fantasySeason = fantasySeasonRows[0];

  await db
    .insert(fantasyTierDefinitions)
    .values([
      {
        fantasySeasonId: fantasySeason.id,
        level: 1,
        slotCount: 3,
        nameTh: "ระดับ 1",
        nameEn: "Tier 1",
      },
      {
        fantasySeasonId: fantasySeason.id,
        level: 2,
        slotCount: 3,
        nameTh: "ระดับ 2",
        nameEn: "Tier 2",
      },
      {
        fantasySeasonId: fantasySeason.id,
        level: 3,
        slotCount: 3,
        nameTh: "ระดับ 3",
        nameEn: "Tier 3",
      },
      {
        fantasySeasonId: fantasySeason.id,
        level: 4,
        slotCount: 6,
        nameTh: "ระดับ 4",
        nameEn: "Tier 4",
      },
    ])
    .onConflictDoUpdate({
      target: [
        fantasyTierDefinitions.fantasySeasonId,
        fantasyTierDefinitions.level,
      ],
      set: {
        slotCount: sql`excluded.slot_count`,
        nameTh: sql`excluded.name_th`,
        nameEn: sql`excluded.name_en`,
        updatedAt: new Date(),
      },
    });

  const fixtureRows = await db
    .select()
    .from(fixtures)
    .where(eq(fixtures.competitionSeasonId, competitionSeason[0].id))
    .orderBy(asc(fixtures.matchweek), asc(fixtures.kickoffAt));
  const firstKickoffByGameweek = new Map<number, Date>();
  for (const fixture of fixtureRows) {
    if (!fixture.kickoffAt || firstKickoffByGameweek.has(fixture.matchweek))
      continue;
    firstKickoffByGameweek.set(fixture.matchweek, fixture.kickoffAt);
  }
  if (firstKickoffByGameweek.size === 0)
    throw new Error("No confirmed fixture kickoff was found.");

  const now = new Date();
  const gameweekSeeds = [...firstKickoffByGameweek.entries()].map(
    ([number, kickoff]) => ({
      number,
      deadlineAt: getDeadline(kickoff, fantasySeason.deadlineOffsetMinutes),
    }),
  );
  const nextGameweek =
    gameweekSeeds.find((gameweek) => gameweek.deadlineAt > now) ??
    gameweekSeeds.at(-1)!;

  for (const gameweek of gameweekSeeds) {
    const status =
      gameweek.number === nextGameweek.number
        ? "open"
        : gameweek.deadlineAt < now
          ? "provisional"
          : "planned";
    await db
      .insert(fantasyGameweeks)
      .values({ fantasySeasonId: fantasySeason.id, ...gameweek, status })
      .onConflictDoUpdate({
        target: [fantasyGameweeks.fantasySeasonId, fantasyGameweeks.number],
        set: { deadlineAt: gameweek.deadlineAt, status, updatedAt: new Date() },
      });
  }

  const gameweekRows = await db
    .select()
    .from(fantasyGameweeks)
    .where(eq(fantasyGameweeks.fantasySeasonId, fantasySeason.id))
    .orderBy(asc(fantasyGameweeks.number));
  const firstGameweek = gameweekRows[0];
  const registrationRows = await db
    .select({
      registration: playerRegistrations,
      player: players,
      entry: competitionEntries,
    })
    .from(playerRegistrations)
    .innerJoin(players, eq(playerRegistrations.playerId, players.id))
    .innerJoin(
      competitionEntries,
      eq(playerRegistrations.competitionEntryId, competitionEntries.id),
    )
    .where(
      and(
        eq(competitionEntries.competitionSeasonId, competitionSeason[0].id),
        eq(playerRegistrations.status, "active"),
        eq(players.isActive, true),
      ),
    );

  const availableRegistrations = registrationRows.flatMap((row) => {
    const position = toFantasyPosition(row.registration.registeredPosition);
    return position ? [{ ...row, position }] : [];
  });

  for (const row of availableRegistrations) {
    await db
      .insert(fantasyPlayers)
      .values({
        fantasySeasonId: fantasySeason.id,
        playerId: row.player.id,
        lockedPosition: row.position,
        isThai: isThaiRegistration(row.player.nationality),
        isAvailable: true,
        nationalitySource: row.player.sourceName,
      })
      .onConflictDoUpdate({
        target: [fantasyPlayers.fantasySeasonId, fantasyPlayers.playerId],
        set: { isAvailable: true, updatedAt: new Date() },
      });
  }

  const fantasyPlayerRows = await db
    .select()
    .from(fantasyPlayers)
    .where(eq(fantasyPlayers.fantasySeasonId, fantasySeason.id));
  for (const fantasyPlayer of fantasyPlayerRows) {
    await db
      .insert(fantasyPlayerTiers)
      .values({
        fantasyPlayerId: fantasyPlayer.id,
        effectiveGameweekId: firstGameweek.id,
        level: 4,
        sourceName: "initial-seed",
        reason: "Fallback Tier 4 until a reviewed ranking is published",
      })
      .onConflictDoUpdate({
        target: [
          fantasyPlayerTiers.fantasyPlayerId,
          fantasyPlayerTiers.effectiveGameweekId,
        ],
        set: {
          level: 4,
          sourceName: "initial-seed",
          reason: "Fallback Tier 4 until a reviewed ranking is published",
          updatedAt: new Date(),
        },
        setWhere: eq(fantasyPlayerTiers.sourceName, "initial-seed"),
      });
  }

  const existingOverall = await db
    .select()
    .from(fantasyLeagues)
    .where(
      and(
        eq(fantasyLeagues.fantasySeasonId, fantasySeason.id),
        eq(fantasyLeagues.type, "overall"),
      ),
    )
    .limit(1);
  const overallLeague =
    existingOverall[0] ??
    (
      await db
        .insert(fantasyLeagues)
        .values({
          fantasySeasonId: fantasySeason.id,
          name: "Thailand Overall",
          type: "overall",
        })
        .returning()
    )[0];
  const seasonTeams = await db
    .select({ id: fantasyTeams.id })
    .from(fantasyTeams)
    .where(eq(fantasyTeams.fantasySeasonId, fantasySeason.id));
  if (seasonTeams.length > 0) {
    await db
      .insert(fantasyLeagueMembers)
      .values(
        seasonTeams.map((team) => ({
          fantasyLeagueId: overallLeague.id,
          fantasyTeamId: team.id,
        })),
      )
      .onConflictDoNothing();
  }

  console.log(
    `Seeded ${fantasyPlayerRows.length} fantasy players, ${gameweekRows.length} Gameweeks, and the Overall Classic league.`,
  );
}

seedFantasyGame().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
