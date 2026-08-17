import { loadEnvConfig } from "@next/env";
import { and, asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import {
  competitionEntries,
  competitionSeasons,
  fantasyGameweeks,
  fantasyLeagueMembers,
  fantasyLeagues,
  fantasyManagers,
  fantasyPlayers,
  fantasyPlayerTiers,
  fantasySeasons,
  fantasyTeams,
  fantasyTeamSelectionPlayers,
  fantasyTeamSelections,
  fantasyTierDefinitions,
  fantasyTransferRevisions,
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

const demoTeams = [
  ["Piyawat K.", "PIYA FC"],
  ["Nattapong S.", "Siam Strikers"],
  ["Kawin P.", "Bangkok Ballers"],
  ["Thanawat C.", "Isan United"],
  ["Akarin T.", "Southern Waves"],
  ["Phurin J.", "Lanna Eleven"],
  ["Methas K.", "Chonburi Sharks"],
] as const;

function stableNumber(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return Math.abs(result >>> 0);
}

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

async function findOrCreateManager(displayName: string) {
  const existing = await db
    .select()
    .from(fantasyManagers)
    .where(
      and(
        eq(fantasyManagers.displayName, displayName),
        eq(fantasyManagers.isDemo, true),
      ),
    )
    .limit(1);
  if (existing[0]) return existing[0];
  const inserted = await db
    .insert(fantasyManagers)
    .values({ displayName, isDemo: true })
    .returning();
  return inserted[0];
}

async function findOrCreateLeague({
  fantasySeasonId,
  name,
  type,
  inviteCode,
  isDemo,
}: {
  fantasySeasonId: string;
  name: string;
  type: "overall" | "private";
  inviteCode?: string;
  isDemo: boolean;
}) {
  const existing = await db
    .select()
    .from(fantasyLeagues)
    .where(
      and(
        eq(fantasyLeagues.fantasySeasonId, fantasySeasonId),
        eq(fantasyLeagues.name, name),
      ),
    )
    .limit(1);
  if (existing[0]) return existing[0];
  const inserted = await db
    .insert(fantasyLeagues)
    .values({ fantasySeasonId, name, type, inviteCode, isDemo })
    .returning();
  return inserted[0];
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
        slotCount: 7,
        nameTh: "ระดับ 2",
        nameEn: "Tier 2",
      },
      {
        fantasySeasonId: fantasySeason.id,
        level: 3,
        slotCount: 5,
        nameTh: "ระดับ 3",
        nameEn: "Tier 3",
      },
    ])
    .onConflictDoNothing();

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
  const activeGameweek =
    gameweekRows.find((gameweek) => gameweek.number === nextGameweek.number) ??
    firstGameweek;

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
  const rankedPlayers = [...fantasyPlayerRows].sort(
    (a, b) => stableNumber(a.playerId) - stableNumber(b.playerId),
  );
  const levelOneEnd = Math.ceil(rankedPlayers.length * 0.15);
  const levelTwoEnd = Math.ceil(rankedPlayers.length * 0.5);
  for (const [index, fantasyPlayer] of rankedPlayers.entries()) {
    const level = index < levelOneEnd ? 1 : index < levelTwoEnd ? 2 : 3;
    await db
      .insert(fantasyPlayerTiers)
      .values({
        fantasyPlayerId: fantasyPlayer.id,
        effectiveGameweekId: firstGameweek.id,
        level,
        sourceName: "initial-seed",
        reason: "Initial test tier",
      })
      .onConflictDoNothing();
  }

  const tiers = await db
    .select()
    .from(fantasyPlayerTiers)
    .where(eq(fantasyPlayerTiers.effectiveGameweekId, firstGameweek.id));
  const tierByPlayer = new Map(
    tiers.map((tier) => [tier.fantasyPlayerId, tier.level]),
  );
  const registrationByPlayer = new Map(
    availableRegistrations.map((row) => [row.player.id, row]),
  );
  const candidates = fantasyPlayerRows.flatMap((fantasyPlayer) => {
    const registration = registrationByPlayer.get(fantasyPlayer.playerId);
    const tier = tierByPlayer.get(fantasyPlayer.id);
    if (!registration || !tier) return [];
    return [
      {
        fantasyPlayer,
        tier,
        clubId: registration.entry.clubId,
        position: fantasyPlayer.lockedPosition as FantasyPosition,
      },
    ];
  });

  const required: Record<FantasyPosition, number> = {
    goalkeeper: 2,
    defender: 5,
    midfielder: 5,
    forward: 3,
  };
  const selected: typeof candidates = [];
  const clubCounts = new Map<string, number>();
  for (const position of Object.keys(required) as FantasyPosition[]) {
    const pool = candidates
      .filter((candidate) => candidate.position === position)
      .sort(
        (a, b) =>
          b.tier - a.tier ||
          Number(b.fantasyPlayer.isThai) - Number(a.fantasyPlayer.isThai),
      );
    for (const candidate of pool) {
      if (
        selected.filter((item) => item.position === position).length >=
        required[position]
      )
        break;
      if ((clubCounts.get(candidate.clubId) ?? 0) >= 3) continue;
      const next = [...selected, candidate];
      if (next.filter((item) => !item.fantasyPlayer.isThai).length > 7)
        continue;
      if (next.filter((item) => item.tier === 1).length > 3) continue;
      if (next.filter((item) => item.tier <= 2).length > 10) continue;
      selected.push(candidate);
      clubCounts.set(
        candidate.clubId,
        (clubCounts.get(candidate.clubId) ?? 0) + 1,
      );
    }
  }
  if (selected.length !== 15)
    throw new Error(`Could only build a ${selected.length}-player demo squad.`);

  const managersAndTeams: Array<{
    managerId: string;
    teamId: string;
    index: number;
  }> = [];
  for (const [index, [managerName, teamName]] of demoTeams.entries()) {
    const manager = await findOrCreateManager(managerName);
    const teamRows = await db
      .insert(fantasyTeams)
      .values({
        fantasySeasonId: fantasySeason.id,
        managerId: manager.id,
        name: teamName,
        freeTransfers: 2,
      })
      .onConflictDoUpdate({
        target: [fantasyTeams.fantasySeasonId, fantasyTeams.managerId],
        set: { name: teamName, isActive: true, updatedAt: new Date() },
      })
      .returning();
    managersAndTeams.push({
      managerId: manager.id,
      teamId: teamRows[0].id,
      index,
    });
  }

  for (const demo of managersAndTeams) {
    const selectionRows = await db
      .insert(fantasyTeamSelections)
      .values({
        fantasyTeamId: demo.teamId,
        fantasyGameweekId: activeGameweek.id,
        status: "draft",
        freeTransfersBefore: 2,
      })
      .onConflictDoUpdate({
        target: [
          fantasyTeamSelections.fantasyTeamId,
          fantasyTeamSelections.fantasyGameweekId,
        ],
        set: { updatedAt: new Date() },
      })
      .returning();
    const selection = selectionRows[0];
    const existingMembers = await db
      .select({ id: fantasyTeamSelectionPlayers.id })
      .from(fantasyTeamSelectionPlayers)
      .where(eq(fantasyTeamSelectionPlayers.selectionId, selection.id));
    if (existingMembers.length > 0) continue;

    const starterLimits: Record<FantasyPosition, number> = {
      goalkeeper: 1,
      defender: 4,
      midfielder: 4,
      forward: 2,
    };
    const starterCounts = new Map<FantasyPosition, number>();
    const starterIds = new Set<string>();
    for (const candidate of selected) {
      const count = starterCounts.get(candidate.position) ?? 0;
      if (count < starterLimits[candidate.position]) {
        starterIds.add(candidate.fantasyPlayer.id);
        starterCounts.set(candidate.position, count + 1);
      }
    }
    const bench = selected.filter(
      (candidate) => !starterIds.has(candidate.fantasyPlayer.id),
    );
    const benchOrderByPlayer = new Map<string, number>();
    const reserveGoalkeeper = bench.find(
      (candidate) => candidate.position === "goalkeeper",
    );
    if (reserveGoalkeeper)
      benchOrderByPlayer.set(reserveGoalkeeper.fantasyPlayer.id, 0);
    bench
      .filter((candidate) => candidate.position !== "goalkeeper")
      .forEach((candidate, index) =>
        benchOrderByPlayer.set(candidate.fantasyPlayer.id, index + 1),
      );
    const captain = selected.find(
      (candidate) =>
        starterIds.has(candidate.fantasyPlayer.id) &&
        candidate.position === "midfielder",
    );
    const viceCaptain = selected.find(
      (candidate) =>
        starterIds.has(candidate.fantasyPlayer.id) &&
        candidate.position === "forward",
    );

    const selectionPlayerValues: Array<
      typeof fantasyTeamSelectionPlayers.$inferInsert
    > = selected.map((candidate) => ({
      selectionId: selection.id,
      fantasyPlayerId: candidate.fantasyPlayer.id,
      clubIdSnapshot: candidate.clubId,
      positionSnapshot: candidate.position,
      tierSnapshot: candidate.tier,
      isThaiSnapshot: candidate.fantasyPlayer.isThai,
      lineupRole: starterIds.has(candidate.fantasyPlayer.id)
        ? "starter"
        : "bench",
      benchOrder: starterIds.has(candidate.fantasyPlayer.id)
        ? null
        : (benchOrderByPlayer.get(candidate.fantasyPlayer.id) ?? null),
      captainRole:
        candidate.fantasyPlayer.id === captain?.fantasyPlayer.id
          ? "captain"
          : candidate.fantasyPlayer.id === viceCaptain?.fantasyPlayer.id
            ? "vice_captain"
            : "none",
    }));
    await db.insert(fantasyTeamSelectionPlayers).values(selectionPlayerValues);
  }

  for (const demo of managersAndTeams) {
    const selectionRows = await db
      .select()
      .from(fantasyTeamSelections)
      .where(
        and(
          eq(fantasyTeamSelections.fantasyTeamId, demo.teamId),
          eq(fantasyTeamSelections.fantasyGameweekId, activeGameweek.id),
        ),
      )
      .limit(1);
    const selection = selectionRows[0];
    if (!selection) continue;
    const existingRevision = await db
      .select({ id: fantasyTransferRevisions.id })
      .from(fantasyTransferRevisions)
      .where(eq(fantasyTransferRevisions.selectionId, selection.id))
      .limit(1);
    if (existingRevision[0]) continue;
    const members = await db
      .select()
      .from(fantasyTeamSelectionPlayers)
      .where(eq(fantasyTeamSelectionPlayers.selectionId, selection.id));
    await db.insert(fantasyTransferRevisions).values({
      selectionId: selection.id,
      revision: 1,
      status: "confirmed",
      squad: members.map((member) => member.fantasyPlayerId),
      lineup: { members },
      activeChip: selection.activeChip,
      netTransferCount: 0,
      transferPoints: 0,
    });
  }

  const overallLeague = await findOrCreateLeague({
    fantasySeasonId: fantasySeason.id,
    name: "Thailand Overall",
    type: "overall",
    isDemo: true,
  });
  const privateLeague = await findOrCreateLeague({
    fantasySeasonId: fantasySeason.id,
    name: "Thai Fantasy Friends",
    type: "private",
    inviteCode: "THAI-26-FAN",
    isDemo: true,
  });
  for (const team of managersAndTeams) {
    await db
      .insert(fantasyLeagueMembers)
      .values([
        { fantasyLeagueId: overallLeague.id, fantasyTeamId: team.teamId },
        { fantasyLeagueId: privateLeague.id, fantasyTeamId: team.teamId },
      ])
      .onConflictDoNothing();
  }

  console.log(
    `Seeded ${fantasyPlayerRows.length} fantasy players, ${gameweekRows.length} Gameweeks, ${managersAndTeams.length} demo teams, and 2 Classic leagues.`,
  );
}

seedFantasyGame().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
