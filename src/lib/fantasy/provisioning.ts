import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  fantasyGameweeks,
  fantasyLeagueMembers,
  fantasyLeagues,
  fantasyManagers,
  fantasySeasons,
  fantasyTeamSelectionPlayers,
  fantasyTeamSelections,
  fantasyTeams,
  fantasyTransferRevisions,
} from "@/db/schema";
import { createGuestNames } from "@/lib/auth/names";
import { THAI_LEAGUE_FANTASY_RULES } from "@/lib/fantasy/rules";

export const FANTASY_SEASON_SLUG = "thai-league-1-2026-27";

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

async function ensureInitialSelection(
  team: typeof fantasyTeams.$inferSelect,
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
  const selection = await ensureInitialSelection(team, gameweek);
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
