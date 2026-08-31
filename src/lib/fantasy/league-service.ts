import "server-only";

import { and, count, eq } from "drizzle-orm";

import { transactionDb } from "@/db/transaction";
import {
  fantasyLeagueAuditLog,
  fantasyLeagueMembers,
  fantasyLeagues,
  fantasyTeams,
} from "@/db/schema";
import {
  createLeagueInviteCode,
  PRIVATE_LEAGUE_MEMBER_LIMIT,
  PRIVATE_LEAGUE_MEMBERSHIP_LIMIT,
  PRIVATE_LEAGUE_OWNER_LIMIT,
} from "@/lib/fantasy/leagues";

export type LeagueServiceErrorCode =
  | "league_not_found"
  | "not_owner"
  | "not_member"
  | "owner_cannot_leave"
  | "already_member"
  | "owner_limit"
  | "membership_limit"
  | "member_limit"
  | "cannot_remove_owner"
  | "invite_collision";

export class LeagueServiceError extends Error {
  constructor(public readonly code: LeagueServiceErrorCode) {
    super(code);
    this.name = "LeagueServiceError";
  }
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if ("code" in error && error.code === "23505") return true;
  return "cause" in error && isUniqueViolation(error.cause);
}

async function lockTeam(
  tx: Parameters<Parameters<typeof transactionDb.transaction>[0]>[0],
  teamId: string,
  seasonId: string,
) {
  const rows = await tx
    .select({ id: fantasyTeams.id })
    .from(fantasyTeams)
    .where(
      and(
        eq(fantasyTeams.id, teamId),
        eq(fantasyTeams.fantasySeasonId, seasonId),
      ),
    )
    .for("update")
    .limit(1);
  if (!rows[0]) throw new LeagueServiceError("league_not_found");
}

async function getPrivateMembershipCount(
  tx: Parameters<Parameters<typeof transactionDb.transaction>[0]>[0],
  teamId: string,
) {
  const rows = await tx
    .select({ value: count() })
    .from(fantasyLeagueMembers)
    .innerJoin(
      fantasyLeagues,
      eq(fantasyLeagueMembers.fantasyLeagueId, fantasyLeagues.id),
    )
    .where(
      and(
        eq(fantasyLeagueMembers.fantasyTeamId, teamId),
        eq(fantasyLeagues.type, "private"),
      ),
    );
  return rows[0]?.value ?? 0;
}

export async function createPrivateLeague(input: {
  seasonId: string;
  teamId: string;
  name: string;
}) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const inviteCode = createLeagueInviteCode();
    try {
      return await transactionDb.transaction(async (tx) => {
        await lockTeam(tx, input.teamId, input.seasonId);
        const [ownedRows, membershipCount] = await Promise.all([
          tx
            .select({ value: count() })
            .from(fantasyLeagues)
            .where(
              and(
                eq(fantasyLeagues.fantasySeasonId, input.seasonId),
                eq(fantasyLeagues.type, "private"),
                eq(fantasyLeagues.ownerTeamId, input.teamId),
              ),
            ),
          getPrivateMembershipCount(tx, input.teamId),
        ]);
        if ((ownedRows[0]?.value ?? 0) >= PRIVATE_LEAGUE_OWNER_LIMIT) {
          throw new LeagueServiceError("owner_limit");
        }
        if (membershipCount >= PRIVATE_LEAGUE_MEMBERSHIP_LIMIT) {
          throw new LeagueServiceError("membership_limit");
        }

        const leagueRows = await tx
          .insert(fantasyLeagues)
          .values({
            fantasySeasonId: input.seasonId,
            name: input.name,
            type: "private",
            ownerTeamId: input.teamId,
            inviteCode,
          })
          .returning();
        const league = leagueRows[0];
        await tx.insert(fantasyLeagueMembers).values({
          fantasyLeagueId: league.id,
          fantasyTeamId: input.teamId,
        });
        await tx.insert(fantasyLeagueAuditLog).values({
          fantasySeasonId: input.seasonId,
          fantasyLeagueId: league.id,
          actorTeamId: input.teamId,
          action: "create_private_league",
          details: { name: input.name },
        });
        return league;
      });
    } catch (error) {
      if (isUniqueViolation(error)) continue;
      throw error;
    }
  }
  throw new LeagueServiceError("invite_collision");
}

export async function joinPrivateLeague(input: {
  seasonId: string;
  teamId: string;
  inviteCode: string;
}) {
  return transactionDb.transaction(async (tx) => {
    await lockTeam(tx, input.teamId, input.seasonId);
    const leagueRows = await tx
      .select()
      .from(fantasyLeagues)
      .where(
        and(
          eq(fantasyLeagues.fantasySeasonId, input.seasonId),
          eq(fantasyLeagues.type, "private"),
          eq(fantasyLeagues.inviteCode, input.inviteCode),
        ),
      )
      .for("update")
      .limit(1);
    const league = leagueRows[0];
    if (!league) throw new LeagueServiceError("league_not_found");

    const existing = await tx
      .select({ id: fantasyLeagueMembers.id })
      .from(fantasyLeagueMembers)
      .where(
        and(
          eq(fantasyLeagueMembers.fantasyLeagueId, league.id),
          eq(fantasyLeagueMembers.fantasyTeamId, input.teamId),
        ),
      )
      .limit(1);
    if (existing[0]) throw new LeagueServiceError("already_member");

    const [membershipCount, memberRows] = await Promise.all([
      getPrivateMembershipCount(tx, input.teamId),
      tx
        .select({ value: count() })
        .from(fantasyLeagueMembers)
        .where(eq(fantasyLeagueMembers.fantasyLeagueId, league.id)),
    ]);
    if (membershipCount >= PRIVATE_LEAGUE_MEMBERSHIP_LIMIT) {
      throw new LeagueServiceError("membership_limit");
    }
    if ((memberRows[0]?.value ?? 0) >= PRIVATE_LEAGUE_MEMBER_LIMIT) {
      throw new LeagueServiceError("member_limit");
    }

    await tx.insert(fantasyLeagueMembers).values({
      fantasyLeagueId: league.id,
      fantasyTeamId: input.teamId,
    });
    await tx.insert(fantasyLeagueAuditLog).values({
      fantasySeasonId: input.seasonId,
      fantasyLeagueId: league.id,
      actorTeamId: input.teamId,
      action: "join_private_league",
    });
    return league;
  });
}

async function lockPrivateLeague(
  tx: Parameters<Parameters<typeof transactionDb.transaction>[0]>[0],
  leagueId: string,
  seasonId: string,
) {
  const rows = await tx
    .select()
    .from(fantasyLeagues)
    .where(
      and(
        eq(fantasyLeagues.id, leagueId),
        eq(fantasyLeagues.fantasySeasonId, seasonId),
        eq(fantasyLeagues.type, "private"),
      ),
    )
    .for("update")
    .limit(1);
  if (!rows[0]) throw new LeagueServiceError("league_not_found");
  return rows[0];
}

export async function leavePrivateLeague(input: {
  seasonId: string;
  leagueId: string;
  teamId: string;
}) {
  return transactionDb.transaction(async (tx) => {
    await lockTeam(tx, input.teamId, input.seasonId);
    const league = await lockPrivateLeague(tx, input.leagueId, input.seasonId);
    if (league.ownerTeamId === input.teamId) {
      throw new LeagueServiceError("owner_cannot_leave");
    }
    const removed = await tx
      .delete(fantasyLeagueMembers)
      .where(
        and(
          eq(fantasyLeagueMembers.fantasyLeagueId, league.id),
          eq(fantasyLeagueMembers.fantasyTeamId, input.teamId),
        ),
      )
      .returning({ id: fantasyLeagueMembers.id });
    if (!removed[0]) throw new LeagueServiceError("not_member");
    await tx.insert(fantasyLeagueAuditLog).values({
      fantasySeasonId: input.seasonId,
      fantasyLeagueId: league.id,
      actorTeamId: input.teamId,
      action: "leave_private_league",
    });
    return league;
  });
}

export async function renamePrivateLeague(input: {
  seasonId: string;
  leagueId: string;
  teamId: string;
  name: string;
}) {
  return transactionDb.transaction(async (tx) => {
    await lockTeam(tx, input.teamId, input.seasonId);
    const league = await lockPrivateLeague(tx, input.leagueId, input.seasonId);
    if (league.ownerTeamId !== input.teamId) {
      throw new LeagueServiceError("not_owner");
    }
    await tx
      .update(fantasyLeagues)
      .set({ name: input.name, updatedAt: new Date() })
      .where(eq(fantasyLeagues.id, league.id));
    await tx.insert(fantasyLeagueAuditLog).values({
      fantasySeasonId: input.seasonId,
      fantasyLeagueId: league.id,
      actorTeamId: input.teamId,
      action: "rename_private_league",
      details: { before: league.name, after: input.name },
    });
    return { ...league, name: input.name };
  });
}

export async function regeneratePrivateLeagueInvite(input: {
  seasonId: string;
  leagueId: string;
  teamId: string;
}) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const inviteCode = createLeagueInviteCode();
    try {
      return await transactionDb.transaction(async (tx) => {
        await lockTeam(tx, input.teamId, input.seasonId);
        const league = await lockPrivateLeague(
          tx,
          input.leagueId,
          input.seasonId,
        );
        if (league.ownerTeamId !== input.teamId) {
          throw new LeagueServiceError("not_owner");
        }
        await tx
          .update(fantasyLeagues)
          .set({ inviteCode, updatedAt: new Date() })
          .where(eq(fantasyLeagues.id, league.id));
        await tx.insert(fantasyLeagueAuditLog).values({
          fantasySeasonId: input.seasonId,
          fantasyLeagueId: league.id,
          actorTeamId: input.teamId,
          action: "regenerate_private_league_invite",
        });
        return { ...league, inviteCode };
      });
    } catch (error) {
      if (isUniqueViolation(error)) continue;
      throw error;
    }
  }
  throw new LeagueServiceError("invite_collision");
}

export async function removePrivateLeagueMember(input: {
  seasonId: string;
  leagueId: string;
  teamId: string;
  targetTeamId: string;
}) {
  return transactionDb.transaction(async (tx) => {
    await lockTeam(tx, input.teamId, input.seasonId);
    const league = await lockPrivateLeague(tx, input.leagueId, input.seasonId);
    if (league.ownerTeamId !== input.teamId) {
      throw new LeagueServiceError("not_owner");
    }
    if (league.ownerTeamId === input.targetTeamId) {
      throw new LeagueServiceError("cannot_remove_owner");
    }
    const removed = await tx
      .delete(fantasyLeagueMembers)
      .where(
        and(
          eq(fantasyLeagueMembers.fantasyLeagueId, league.id),
          eq(fantasyLeagueMembers.fantasyTeamId, input.targetTeamId),
        ),
      )
      .returning({ id: fantasyLeagueMembers.id });
    if (!removed[0]) throw new LeagueServiceError("not_member");
    await tx.insert(fantasyLeagueAuditLog).values({
      fantasySeasonId: input.seasonId,
      fantasyLeagueId: league.id,
      actorTeamId: input.teamId,
      targetTeamId: input.targetTeamId,
      action: "remove_private_league_member",
    });
    return league;
  });
}

export async function deletePrivateLeague(input: {
  seasonId: string;
  leagueId: string;
  teamId: string;
}) {
  return transactionDb.transaction(async (tx) => {
    await lockTeam(tx, input.teamId, input.seasonId);
    const league = await lockPrivateLeague(tx, input.leagueId, input.seasonId);
    if (league.ownerTeamId !== input.teamId) {
      throw new LeagueServiceError("not_owner");
    }
    await tx.insert(fantasyLeagueAuditLog).values({
      fantasySeasonId: input.seasonId,
      fantasyLeagueId: league.id,
      actorTeamId: input.teamId,
      action: "delete_private_league",
      details: { name: league.name },
    });
    await tx.delete(fantasyLeagues).where(eq(fantasyLeagues.id, league.id));
    return league;
  });
}
