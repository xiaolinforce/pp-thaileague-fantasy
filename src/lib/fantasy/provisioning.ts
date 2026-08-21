import "server-only";

import { and, asc, eq, inArray, lte } from "drizzle-orm";

import { db } from "@/db";
import {
  competitionEntries,
  fantasyGameweeks,
  fantasyLeagueMembers,
  fantasyLeagues,
  fantasyManagers,
  fantasyPlayers,
  fantasyPlayerTiers,
  fantasySeasons,
  fantasyTeamSelectionPlayers,
  fantasyTeamSelections,
  fantasyTeams,
  fantasyTransferRevisions,
  playerRegistrations,
} from "@/db/schema";
import { createGuestNames } from "@/lib/auth/names";
import {
  THAI_LEAGUE_FANTASY_RULES,
  type FantasyPosition,
} from "@/lib/fantasy/rules";

export const FANTASY_SEASON_SLUG = "thai-league-1-2026-27";

type Candidate = {
  fantasyPlayerId: string;
  clubId: string;
  position: FantasyPosition;
  tier: number;
  isThai: boolean;
};

type SelectionMemberValue = typeof fantasyTeamSelectionPlayers.$inferInsert;

async function getSelectionMembers(
  selectionId: string,
): Promise<SelectionMemberValue[]> {
  return db
    .select({
      selectionId: fantasyTeamSelectionPlayers.selectionId,
      fantasyPlayerId: fantasyTeamSelectionPlayers.fantasyPlayerId,
      clubIdSnapshot: fantasyTeamSelectionPlayers.clubIdSnapshot,
      positionSnapshot: fantasyTeamSelectionPlayers.positionSnapshot,
      tierSnapshot: fantasyTeamSelectionPlayers.tierSnapshot,
      isThaiSnapshot: fantasyTeamSelectionPlayers.isThaiSnapshot,
      lineupRole: fantasyTeamSelectionPlayers.lineupRole,
      benchOrder: fantasyTeamSelectionPlayers.benchOrder,
      captainRole: fantasyTeamSelectionPlayers.captainRole,
    })
    .from(fantasyTeamSelectionPlayers)
    .where(eq(fantasyTeamSelectionPlayers.selectionId, selectionId))
    .orderBy(asc(fantasyTeamSelectionPlayers.fantasyPlayerId));
}

async function ensureInitialRevision(
  selectionId: string,
  members: SelectionMemberValue[],
) {
  if (members.length !== THAI_LEAGUE_FANTASY_RULES.squadSize) {
    throw new Error(
      `Initial selection has ${members.length} players instead of ${THAI_LEAGUE_FANTASY_RULES.squadSize}.`,
    );
  }
  await db
    .insert(fantasyTransferRevisions)
    .values({
      selectionId,
      revision: 1,
      status: "confirmed",
      squad: members.map((member) => member.fantasyPlayerId),
      lineup: { members },
      activeChip: null,
      netTransferCount: 0,
      transferPoints: 0,
    })
    .onConflictDoNothing();
}

async function getActiveSeasonAndGameweek() {
  const season = await db.query.fantasySeasons.findFirst({
    where: eq(fantasySeasons.slug, FANTASY_SEASON_SLUG),
  });
  if (!season) throw new Error("Fantasy season was not found.");
  const gameweeks = await db
    .select()
    .from(fantasyGameweeks)
    .where(eq(fantasyGameweeks.fantasySeasonId, season.id))
    .orderBy(asc(fantasyGameweeks.number));
  const gameweek =
    gameweeks.find((item) => item.status === "open") ??
    gameweeks.find((item) => item.status === "planned");
  if (!gameweek) throw new Error("No open Gameweek was found.");
  return { season, gameweek, gameweeks };
}

async function buildInitialSquad(
  season: typeof fantasySeasons.$inferSelect,
  gameweek: typeof fantasyGameweeks.$inferSelect,
) {
  const rows = await db
    .select({
      fantasyPlayer: fantasyPlayers,
      entry: competitionEntries,
    })
    .from(fantasyPlayers)
    .innerJoin(
      playerRegistrations,
      eq(fantasyPlayers.playerId, playerRegistrations.playerId),
    )
    .innerJoin(
      competitionEntries,
      eq(playerRegistrations.competitionEntryId, competitionEntries.id),
    )
    .where(
      and(
        eq(fantasyPlayers.fantasySeasonId, season.id),
        eq(fantasyPlayers.isAvailable, true),
        eq(playerRegistrations.status, "active"),
        eq(competitionEntries.competitionSeasonId, season.competitionSeasonId),
      ),
    );
  const uniqueRows = [
    ...new Map(
      [...rows]
        .sort((a, b) => a.entry.id.localeCompare(b.entry.id))
        .map((row) => [row.fantasyPlayer.id, row]),
    ).values(),
  ];
  const playerIds = uniqueRows.map((row) => row.fantasyPlayer.id);
  if (playerIds.length === 0) {
    throw new Error("No available Fantasy players were found.");
  }
  const tierRows = await db
    .select({ tier: fantasyPlayerTiers, gameweek: fantasyGameweeks })
    .from(fantasyPlayerTiers)
    .innerJoin(
      fantasyGameweeks,
      eq(fantasyPlayerTiers.effectiveGameweekId, fantasyGameweeks.id),
    )
    .where(
      and(
        inArray(fantasyPlayerTiers.fantasyPlayerId, playerIds),
        eq(fantasyGameweeks.fantasySeasonId, season.id),
        lte(fantasyGameweeks.number, gameweek.number),
      ),
    )
    .orderBy(asc(fantasyGameweeks.number));
  const tierByPlayer = new Map<string, number>();
  for (const row of tierRows) {
    tierByPlayer.set(row.tier.fantasyPlayerId, row.tier.level);
  }
  const candidates: Candidate[] = uniqueRows.map((row) => ({
    fantasyPlayerId: row.fantasyPlayer.id,
    clubId: row.entry.clubId,
    position: row.fantasyPlayer.lockedPosition as FantasyPosition,
    tier: tierByPlayer.get(row.fantasyPlayer.id) ?? 3,
    isThai: row.fantasyPlayer.isThai,
  }));
  const required: Record<FantasyPosition, number> = {
    goalkeeper: 2,
    defender: 5,
    midfielder: 5,
    forward: 3,
  };
  const selected: Candidate[] = [];
  const clubCounts = new Map<string, number>();
  for (const position of Object.keys(required) as FantasyPosition[]) {
    const pool = candidates
      .filter((candidate) => candidate.position === position)
      .sort(
        (a, b) =>
          b.tier - a.tier ||
          Number(b.isThai) - Number(a.isThai) ||
          a.fantasyPlayerId.localeCompare(b.fantasyPlayerId),
      );
    for (const candidate of pool) {
      if (
        selected.filter((item) => item.position === position).length >=
        required[position]
      ) {
        break;
      }
      if ((clubCounts.get(candidate.clubId) ?? 0) >= 3) continue;
      const next = [...selected, candidate];
      if (next.filter((item) => !item.isThai).length > 7) continue;
      if (next.filter((item) => item.tier === 1).length > 3) continue;
      if (next.filter((item) => item.tier <= 2).length > 10) continue;
      selected.push(candidate);
      clubCounts.set(
        candidate.clubId,
        (clubCounts.get(candidate.clubId) ?? 0) + 1,
      );
    }
  }
  if (selected.length !== 15) {
    throw new Error(`Could only build a ${selected.length}-player squad.`);
  }
  return selected;
}

async function ensureInitialSelection(
  team: typeof fantasyTeams.$inferSelect,
  season: typeof fantasySeasons.$inferSelect,
  gameweek: typeof fantasyGameweeks.$inferSelect,
) {
  const selectionRows = await db
    .insert(fantasyTeamSelections)
    .values({
      fantasyTeamId: team.id,
      fantasyGameweekId: gameweek.id,
      status: "draft",
      freeTransfersBefore: team.freeTransfers,
    })
    .onConflictDoNothing()
    .returning();
  const selection =
    selectionRows[0] ??
    (await db.query.fantasyTeamSelections.findFirst({
      where: and(
        eq(fantasyTeamSelections.fantasyTeamId, team.id),
        eq(fantasyTeamSelections.fantasyGameweekId, gameweek.id),
      ),
    }));
  if (!selection) throw new Error("Initial selection could not be created.");
  const existingMembers = await getSelectionMembers(selection.id);
  if (existingMembers.length === THAI_LEAGUE_FANTASY_RULES.squadSize) {
    await ensureInitialRevision(selection.id, existingMembers);
    return selection;
  }
  if (existingMembers.length > 0) {
    throw new Error(
      `Initial selection is incomplete with ${existingMembers.length} players.`,
    );
  }

  const selected = await buildInitialSquad(season, gameweek);
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
      starterIds.add(candidate.fantasyPlayerId);
      starterCounts.set(candidate.position, count + 1);
    }
  }
  const bench = selected.filter(
    (candidate) => !starterIds.has(candidate.fantasyPlayerId),
  );
  const benchOrder = new Map<string, number>();
  const goalkeeper = bench.find(
    (candidate) => candidate.position === "goalkeeper",
  );
  if (goalkeeper) benchOrder.set(goalkeeper.fantasyPlayerId, 0);
  bench
    .filter((candidate) => candidate.position !== "goalkeeper")
    .forEach((candidate, index) =>
      benchOrder.set(candidate.fantasyPlayerId, index + 1),
    );
  const captain = selected.find(
    (candidate) =>
      starterIds.has(candidate.fantasyPlayerId) &&
      candidate.position === "midfielder",
  );
  const viceCaptain = selected.find(
    (candidate) =>
      starterIds.has(candidate.fantasyPlayerId) &&
      candidate.position === "forward",
  );
  const members: SelectionMemberValue[] = selected.map((candidate) => ({
    selectionId: selection.id,
    fantasyPlayerId: candidate.fantasyPlayerId,
    clubIdSnapshot: candidate.clubId,
    positionSnapshot: candidate.position,
    tierSnapshot: candidate.tier,
    isThaiSnapshot: candidate.isThai,
    lineupRole: starterIds.has(candidate.fantasyPlayerId) ? "starter" : "bench",
    benchOrder: starterIds.has(candidate.fantasyPlayerId)
      ? null
      : (benchOrder.get(candidate.fantasyPlayerId) ?? null),
    captainRole:
      candidate.fantasyPlayerId === captain?.fantasyPlayerId
        ? "captain"
        : candidate.fantasyPlayerId === viceCaptain?.fantasyPlayerId
          ? "vice_captain"
          : "none",
  }));
  await db
    .insert(fantasyTeamSelectionPlayers)
    .values(members)
    .onConflictDoNothing();

  const persistedMembers = await getSelectionMembers(selection.id);
  const expectedPlayerIds = new Set(
    selected.map((candidate) => candidate.fantasyPlayerId),
  );
  if (
    persistedMembers.length !== THAI_LEAGUE_FANTASY_RULES.squadSize ||
    persistedMembers.some(
      (member) => !expectedPlayerIds.has(member.fantasyPlayerId),
    )
  ) {
    throw new Error("Initial selection could not be completed consistently.");
  }
  await ensureInitialRevision(selection.id, persistedMembers);
  return selection;
}

export async function ensureFantasyProfile(input: {
  authUserId: string;
  isAnonymous: boolean;
}) {
  const existingManager = await db.query.fantasyManagers.findFirst({
    where: eq(fantasyManagers.authUserId, input.authUserId),
  });
  const { season, gameweek, gameweeks } = await getActiveSeasonAndGameweek();
  let manager = existingManager;
  let created = false;
  if (!manager) {
    const names = createGuestNames();
    const inserted = await db
      .insert(fantasyManagers)
      .values({
        authUserId: input.authUserId,
        displayName: names.managerName,
        isDemo: false,
        status: input.isAnonymous ? "guest" : "member",
      })
      .onConflictDoNothing()
      .returning();
    manager =
      inserted[0] ??
      (await db.query.fantasyManagers.findFirst({
        where: eq(fantasyManagers.authUserId, input.authUserId),
      }));
    created = Boolean(inserted[0]);
  }
  if (!manager) throw new Error("Fantasy manager could not be created.");
  if (!input.isAnonymous && manager.status === "guest") {
    const rows = await db
      .update(fantasyManagers)
      .set({ status: "member", updatedAt: new Date() })
      .where(eq(fantasyManagers.id, manager.id))
      .returning();
    manager = rows[0] ?? manager;
  }
  const names = createGuestNames();
  const teamRows = await db
    .insert(fantasyTeams)
    .values({
      fantasySeasonId: season.id,
      managerId: manager.id,
      name: names.teamName,
      freeTransfers: season.weeklyFreeTransfers,
    })
    .onConflictDoNothing()
    .returning();
  const team =
    teamRows[0] ??
    (await db.query.fantasyTeams.findFirst({
      where: and(
        eq(fantasyTeams.fantasySeasonId, season.id),
        eq(fantasyTeams.managerId, manager.id),
      ),
    }));
  if (!team) throw new Error("Fantasy team could not be created.");
  const overallLeagues = await db
    .select({ id: fantasyLeagues.id })
    .from(fantasyLeagues)
    .where(
      and(
        eq(fantasyLeagues.fantasySeasonId, season.id),
        eq(fantasyLeagues.type, "overall"),
      ),
    );
  if (overallLeagues.length > 0) {
    await db
      .insert(fantasyLeagueMembers)
      .values(
        overallLeagues.map((league) => ({
          fantasyLeagueId: league.id,
          fantasyTeamId: team.id,
        })),
      )
      .onConflictDoNothing();
  }
  const selection = await ensureInitialSelection(team, season, gameweek);
  return { manager, team, season, gameweek, gameweeks, selection, created };
}

export async function linkAnonymousFantasyProfile(input: {
  anonymousUserId: string;
  memberUserId: string;
}) {
  const [anonymousManager, memberManager] = await Promise.all([
    db.query.fantasyManagers.findFirst({
      where: eq(fantasyManagers.authUserId, input.anonymousUserId),
    }),
    db.query.fantasyManagers.findFirst({
      where: eq(fantasyManagers.authUserId, input.memberUserId),
    }),
  ]);
  if (!anonymousManager) return;
  if (memberManager) {
    await db
      .update(fantasyManagers)
      .set({
        authUserId: null,
        status: "abandoned",
        updatedAt: new Date(),
      })
      .where(eq(fantasyManagers.id, anonymousManager.id));
    return;
  }
  await db
    .update(fantasyManagers)
    .set({
      authUserId: input.memberUserId,
      status: "member",
      updatedAt: new Date(),
    })
    .where(eq(fantasyManagers.id, anonymousManager.id));
}
