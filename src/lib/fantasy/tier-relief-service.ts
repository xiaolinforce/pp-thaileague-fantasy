import "server-only";
import { and, asc, desc, eq, gt, inArray, isNull, lte, sql } from "drizzle-orm";
import type { db } from "@/db";
import {
  fantasyAdminAuditLog,
  fantasyGameweeks,
  fantasyPlayers,
  fantasyPlayerTiers,
  fantasyTeamSelections,
  fantasyTeamSelectionPlayers,
  fantasyTierChangeEvents,
  fantasyTierReliefs,
  fantasyTransferRevisions,
} from "@/db/schema";
import { lockFantasySeason, type FantasyTransaction } from "./season-lock";
import { resolvePlayerTier, type TierRulesVersion } from "./rules";
import {
  reliefAfterTierChange,
  remainingTierRelief,
  type TierMember,
} from "./tier-relief";

type Reader = Pick<typeof db, "select"> | Pick<FantasyTransaction, "select">;

export async function getTierRelief(
  database: Reader,
  selectionId: string | null,
) {
  if (!selectionId) return null;
  const [row] = await database
    .select()
    .from(fantasyTierReliefs)
    .where(eq(fantasyTierReliefs.selectionId, selectionId));
  return row ?? null;
}

export async function getEffectiveTierMap(
  database: Reader,
  gameweek: {
    fantasySeasonId: string;
    number: number;
    tierRulesVersion: TierRulesVersion;
  },
) {
  const rows = await database
    .select({
      id: fantasyPlayerTiers.fantasyPlayerId,
      level: fantasyPlayerTiers.level,
    })
    .from(fantasyPlayerTiers)
    .innerJoin(
      fantasyGameweeks,
      eq(fantasyGameweeks.id, fantasyPlayerTiers.effectiveGameweekId),
    )
    .where(
      and(
        eq(fantasyGameweeks.fantasySeasonId, gameweek.fantasySeasonId),
        lte(fantasyGameweeks.number, gameweek.number),
      ),
    )
    .orderBy(desc(fantasyGameweeks.number));
  const result = new Map<string, number>();
  for (const row of rows)
    if (!result.has(row.id))
      result.set(
        row.id,
        resolvePlayerTier(row.level, gameweek.tierRulesVersion),
      );
  return result;
}

export async function writeTierRelief(
  database: FantasyTransaction,
  selectionId: string,
  eventId: string,
  allowedPlayerIds: string[],
  changedBy: string,
  reason: string,
) {
  const before = await getTierRelief(database, selectionId);
  const ids = [...new Set(allowedPlayerIds)].sort();
  if (ids.length > 15 || (ids.length > 0 && ids.length <= 5))
    throw new Error("Invalid relief size");
  if (!before && !ids.length) return;
  if (
    before?.eventId === eventId &&
    JSON.stringify([...before.allowedPlayerIds].sort()) === JSON.stringify(ids)
  )
    return;
  const [after] = await database
    .insert(fantasyTierReliefs)
    .values({ selectionId, eventId, allowedPlayerIds: ids })
    .onConflictDoUpdate({
      target: fantasyTierReliefs.selectionId,
      set: { eventId, allowedPlayerIds: ids, updatedAt: new Date() },
    })
    .returning();
  await database.insert(fantasyAdminAuditLog).values({
    action: "update_tier_relief",
    entityType: "fantasy_selection",
    entityId: selectionId,
    changedBy,
    reason,
    before: before ?? null,
    after,
  });
}

export async function consumeTierRelief(
  database: FantasyTransaction,
  selectionId: string,
  players: TierMember[],
  actor: string,
) {
  const relief = await getTierRelief(database, selectionId);
  if (relief)
    await writeTierRelief(
      database,
      selectionId,
      relief.eventId,
      remainingTierRelief(players, relief.allowedPlayerIds),
      actor,
      "Successful save/restore consumes removed identities; at five or fewer the allowance ends.",
    );
}

// Public server-only entry point for both single-player admin edits and reviewed
// bulk maintenance. Future events are applied at opening, against that roster.
export async function publishTierChange(
  database: FantasyTransaction,
  input: {
    gameweekId: string;
    changes: Array<{ fantasyPlayerId: string; level: number }>;
    reason: string;
    changedBy: string;
  },
) {
  const [target] = await database
    .select()
    .from(fantasyGameweeks)
    .where(eq(fantasyGameweeks.id, input.gameweekId));
  if (!target) throw new Error("Gameweek not found");
  await lockFantasySeason(database, target.fantasySeasonId);
  const [gameweek] = await database
    .select()
    .from(fantasyGameweeks)
    .where(eq(fantasyGameweeks.id, input.gameweekId))
    .for("update");
  if (
    !gameweek ||
    !["open", "planned"].includes(gameweek.status) ||
    gameweek.deadlineAt <= new Date() ||
    gameweek.tierRulesVersion !== "two-tier-v1"
  ) {
    throw new Error(
      "Tier changes require an open or planned two-tier Gameweek before its deadline.",
    );
  }
  if (
    !input.reason.trim() ||
    !input.changedBy.trim() ||
    !input.changes.length ||
    new Set(input.changes.map((c) => c.fantasyPlayerId)).size !==
      input.changes.length ||
    input.changes.some((c) => ![1, 2].includes(c.level))
  )
    throw new Error("Invalid tier-change batch");
  const players = await database
    .select({ id: fantasyPlayers.id })
    .from(fantasyPlayers)
    .where(eq(fantasyPlayers.fantasySeasonId, gameweek.fantasySeasonId));
  const ids = new Set(players.map((p) => p.id));
  if (input.changes.some((c) => !ids.has(c.fantasyPlayerId)))
    throw new Error("Player belongs to another season");
  const [event] = await database
    .insert(fantasyTierChangeEvents)
    .values({
      fantasySeasonId: gameweek.fantasySeasonId,
      effectiveGameweekId: gameweek.id,
      changes: input.changes,
      reason: input.reason.trim(),
      changedBy: input.changedBy,
    })
    .returning();
  await database.insert(fantasyAdminAuditLog).values({
    action: "schedule_tier_change",
    entityType: "fantasy_tier_change_event",
    entityId: event.id,
    changedBy: input.changedBy,
    reason: input.reason,
    after: event,
  });
  if (gameweek.status === "open")
    await applyScheduledTierChanges(database, gameweek.id);
  return event.id;
}

export async function applyScheduledTierChanges(
  database: FantasyTransaction,
  gameweekId: string,
) {
  const [target] = await database
    .select()
    .from(fantasyGameweeks)
    .where(eq(fantasyGameweeks.id, gameweekId));
  if (!target) throw new Error("Gameweek not found");
  await lockFantasySeason(database, target.fantasySeasonId);
  const [gameweek] = await database
    .select()
    .from(fantasyGameweeks)
    .where(eq(fantasyGameweeks.id, gameweekId))
    .for("update");
  if (gameweek.status !== "open" || gameweek.tierRulesVersion !== "two-tier-v1")
    throw new Error("Only open two-tier Gameweeks can activate tier events");
  const events = await database
    .select()
    .from(fantasyTierChangeEvents)
    .where(
      and(
        eq(fantasyTierChangeEvents.effectiveGameweekId, gameweek.id),
        isNull(fantasyTierChangeEvents.appliedAt),
      ),
    )
    .orderBy(
      asc(fantasyTierChangeEvents.createdAt),
      asc(fantasyTierChangeEvents.id),
    )
    .for("update");
  for (const event of events) {
    const beforeTiers = await getEffectiveTierMap(database, gameweek);
    const selections = await database
      .select()
      .from(fantasyTeamSelections)
      .where(
        and(
          eq(fantasyTeamSelections.fantasyGameweekId, gameweek.id),
          eq(fantasyTeamSelections.status, "draft"),
        ),
      )
      .for("update");
    const allMembers = await database
      .select({ member: fantasyTeamSelectionPlayers })
      .from(fantasyTeamSelectionPlayers)
      .innerJoin(
        fantasyTeamSelections,
        eq(fantasyTeamSelections.id, fantasyTeamSelectionPlayers.selectionId),
      )
      .where(
        and(
          eq(fantasyTeamSelections.fantasyGameweekId, gameweek.id),
          eq(fantasyTeamSelections.status, "draft"),
        ),
      );
    const membersBySelection = Map.groupBy(
      allMembers.map((r) => r.member),
      (m) => m.selectionId,
    );
    const changes = new Map(
      event.changes.map((c) => [c.fantasyPlayerId, c.level]),
    );
    const priorRows = await database
      .select()
      .from(fantasyPlayerTiers)
      .where(eq(fantasyPlayerTiers.effectiveGameweekId, gameweek.id));
    for (let offset = 0; offset < event.changes.length; offset += 500) {
      await database
        .insert(fantasyPlayerTiers)
        .values(
          event.changes.slice(offset, offset + 500).map((change) => ({
            ...change,
            effectiveGameweekId: gameweek.id,
            sourceName: "tier-change-event",
            reason: event.reason,
          })),
        )
        .onConflictDoUpdate({
          target: [
            fantasyPlayerTiers.fantasyPlayerId,
            fantasyPlayerTiers.effectiveGameweekId,
          ],
          set: {
            level: sql`excluded.level`,
            sourceName: "tier-change-event",
            reason: event.reason,
            updatedAt: new Date(),
          },
        });
    }
    const reliefRows = selections.length
      ? await database
          .select()
          .from(fantasyTierReliefs)
          .where(
            inArray(
              fantasyTierReliefs.selectionId,
              selections.map((s) => s.id),
            ),
          )
      : [];
    const reliefBySelection = new Map(
      reliefRows.map((r) => [r.selectionId, r]),
    );
    const snapshotChanges: Array<
      typeof fantasyTeamSelectionPlayers.$inferSelect
    > = [];
    const snapshotAudits: Array<typeof fantasyAdminAuditLog.$inferInsert> = [];
    for (const selection of selections) {
      const members = membersBySelection.get(selection.id) ?? [];
      const before = members.map((m) => ({
        id: m.fantasyPlayerId,
        tier: beforeTiers.get(m.fantasyPlayerId) ?? 2,
      }));
      const after = before.map((p) => ({
        ...p,
        tier: changes.get(p.id) ?? p.tier,
      }));
      const relief = reliefBySelection.get(selection.id);
      const allowed = reliefAfterTierChange(
        before,
        after,
        relief?.allowedPlayerIds,
      );
      if (allowed.length || relief?.allowedPlayerIds.length)
        await writeTierRelief(
          database,
          selection.id,
          event.id,
          allowed,
          event.changedBy,
          event.reason,
        );
      const changedMembers = members.filter(
        (m) =>
          (changes.get(m.fantasyPlayerId) ??
            beforeTiers.get(m.fantasyPlayerId) ??
            2) !== m.tierSnapshot,
      );
      snapshotChanges.push(...changedMembers);
      if (changedMembers.length)
        snapshotAudits.push({
          action: "refresh_event_player_tiers",
          entityType: "fantasy_selection",
          entityId: selection.id,
          changedBy: event.changedBy,
          reason: event.reason,
          before: { members: changedMembers },
          after: { eventId: event.id, members: after },
        });
    }
    for (const [level, group] of Map.groupBy(
      snapshotChanges,
      (m) =>
        changes.get(m.fantasyPlayerId) ??
        beforeTiers.get(m.fantasyPlayerId) ??
        2,
    )) {
      await database
        .update(fantasyTeamSelectionPlayers)
        .set({ tierSnapshot: level, updatedAt: new Date() })
        .where(
          inArray(
            fantasyTeamSelectionPlayers.id,
            group.map((m) => m.id),
          ),
        );
    }
    for (let offset = 0; offset < snapshotAudits.length; offset += 500)
      await database
        .insert(fantasyAdminAuditLog)
        .values(snapshotAudits.slice(offset, offset + 500));
    await database
      .update(fantasyTierChangeEvents)
      .set({ appliedAt: new Date(), updatedAt: new Date() })
      .where(eq(fantasyTierChangeEvents.id, event.id));
    await database.insert(fantasyAdminAuditLog).values({
      action: "apply_tier_change",
      entityType: "fantasy_tier_change_event",
      entityId: event.id,
      changedBy: event.changedBy,
      reason: event.reason,
      before: {
        tiers: priorRows.filter((r) => changes.has(r.fantasyPlayerId)),
        effectiveTiers: Object.fromEntries(beforeTiers),
      },
      after: { changes: event.changes, gameweekId: gameweek.id },
    });
  }
}

// Recovery for a reviewed maintenance event applied before this feature existed.
// Audit evidence and the last revision at that timestamp prove membership;
// current squads alone must never be used to manufacture an allowance.
export async function adoptAuditedTierChange(
  database: FantasyTransaction,
  auditId: string,
  changedBy: string,
) {
  const [audit] = await database
    .select()
    .from(fantasyAdminAuditLog)
    .where(eq(fantasyAdminAuditLog.id, auditId));
  if (
    !audit ||
    audit.action !== "review_two_tier_player_levels" ||
    !audit.entityId
  )
    throw new Error("Unsupported source audit");
  const [gameweek] = await database
    .select()
    .from(fantasyGameweeks)
    .where(eq(fantasyGameweeks.id, audit.entityId));
  if (!gameweek) throw new Error("Source Gameweek not found");
  await lockFantasySeason(database, gameweek.fantasySeasonId);
  const [freshGameweek] = await database
    .select()
    .from(fantasyGameweeks)
    .where(eq(fantasyGameweeks.id, gameweek.id))
    .for("update");
  if (
    freshGameweek.status !== "open" ||
    freshGameweek.deadlineAt <= new Date() ||
    freshGameweek.tierRulesVersion !== "two-tier-v1"
  )
    throw new Error("Source Gameweek must still be open");
  const [existing] = await database
    .select()
    .from(fantasyTierChangeEvents)
    .where(eq(fantasyTierChangeEvents.sourceAuditId, auditId));
  if (existing) return existing.id; // Repeating recovery never restores consumed rights.
  const plan = audit.after?.plan;
  const affected = audit.after?.overQuotaTeams;
  if (!Array.isArray(plan) || !plan.length || !Array.isArray(affected))
    throw new Error("Incomplete source evidence");
  const decisions = new Map<string, { level: number; oldLevel: number }>();
  for (const item of plan) {
    if (
      !item ||
      typeof item.id !== "string" ||
      ![1, 2].includes(item.level) ||
      ![1, 2, 3, 4].includes(item.oldLevel) ||
      decisions.has(item.id)
    )
      throw new Error("Invalid source decision");
    decisions.set(item.id, { level: item.level, oldLevel: item.oldLevel });
  }
  const currentTiers = await getEffectiveTierMap(database, gameweek);
  if ([...decisions].some(([id, p]) => currentTiers.get(id) !== p.level))
    throw new Error(
      "Classifications changed since the source event; manual review required",
    );
  const [event] = await database
    .insert(fantasyTierChangeEvents)
    .values({
      fantasySeasonId: gameweek.fantasySeasonId,
      effectiveGameweekId: gameweek.id,
      changes: [...decisions].map(([fantasyPlayerId, p]) => ({
        fantasyPlayerId,
        level: p.level,
      })),
      reason:
        "Adopt previously audited tier review without changing tiers or historical teams",
      changedBy,
      appliedAt: audit.createdAt,
      sourceAuditId: auditId,
    })
    .returning();
  for (const team of affected) {
    if (!team || typeof team.team_id !== "string")
      throw new Error("Invalid affected-team evidence");
    const [selection] = await database
      .select()
      .from(fantasyTeamSelections)
      .where(
        and(
          eq(fantasyTeamSelections.fantasyTeamId, team.team_id),
          eq(fantasyTeamSelections.fantasyGameweekId, gameweek.id),
        ),
      )
      .for("update");
    if (!selection || selection.status !== "draft")
      throw new Error("Affected selection unavailable");
    const [revision] = await database
      .select()
      .from(fantasyTransferRevisions)
      .where(
        and(
          eq(fantasyTransferRevisions.selectionId, selection.id),
          lte(fantasyTransferRevisions.createdAt, audit.createdAt),
        ),
      )
      .orderBy(desc(fantasyTransferRevisions.revision))
      .limit(1);
    if (
      !revision ||
      revision.squad.length !== 15 ||
      new Set(revision.squad).size !== 15 ||
      revision.squad.some((id) => !decisions.has(id))
    )
      throw new Error("Original squad cannot be proven");
    const prior = revision.squad.map((id) => ({
      id,
      tier: resolvePlayerTier(decisions.get(id)!.oldLevel),
    }));
    const after = revision.squad.map((id) => ({
      id,
      tier: decisions.get(id)!.level,
    }));
    let authorized = reliefAfterTierChange(prior, after);
    const laterRevisions = await database
      .select()
      .from(fantasyTransferRevisions)
      .where(
        and(
          eq(fantasyTransferRevisions.selectionId, selection.id),
          gt(fantasyTransferRevisions.createdAt, audit.createdAt),
        ),
      )
      .orderBy(asc(fantasyTransferRevisions.revision));
    for (const saved of laterRevisions) {
      authorized = remainingTierRelief(
        saved.squad.map((id) => ({ id, tier: currentTiers.get(id) ?? 2 })),
        authorized,
      );
    }
    const members = await database
      .select()
      .from(fantasyTeamSelectionPlayers)
      .where(eq(fantasyTeamSelectionPlayers.selectionId, selection.id));
    const current = members.map((m) => ({
      id: m.fantasyPlayerId,
      tier: currentTiers.get(m.fantasyPlayerId) ?? 2,
    }));
    if (members.length !== 15) throw new Error("Affected squad is incomplete");
    await writeTierRelief(
      database,
      selection.id,
      event.id,
      remainingTierRelief(current, authorized),
      changedBy,
      `Verified source audit ${auditId}; preserve only identities still held.`,
    );
  }
  await database.insert(fantasyAdminAuditLog).values({
    action: "adopt_audited_tier_relief",
    entityType: "fantasy_tier_change_event",
    entityId: event.id,
    changedBy,
    reason: event.reason,
    after: { sourceAuditId: auditId, affectedTeams: affected.length },
  });
  return event.id;
}
