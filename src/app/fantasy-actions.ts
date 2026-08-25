"use server";

import { and, asc, desc, eq, gt, inArray, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  competitionEntries,
  fantasyAdminAuditLog,
  fantasyGameweeks,
  fantasyManagers,
  fantasyPlayers,
  fantasyPlayerMatchPoints,
  fantasyPlayerMatchStats,
  fantasyPlayerTiers,
  fantasySeasons,
  fantasyTeamSelectionPlayers,
  fantasyTeamSelections,
  fantasyTeams,
  fantasyTransferRevisions,
  fantasyStatOverrides,
  fixtures,
  playerRegistrations,
} from "@/db/schema";
import {
  getNetTransfers,
  isBeforeDeadline,
  settleTransfers,
  THAI_LEAGUE_FANTASY_RULES,
  validateChipUse,
  validateLineup,
  type CaptainRole,
  type FantasyChip,
  type FantasyPosition,
  type LineupPlayer,
} from "@/lib/fantasy/rules";
import { calculatePlayerPoints } from "@/lib/fantasy/scoring";
import { recalculateGameweek } from "@/lib/fantasy/scoring-service";
import { requireAdmin, requireFantasyProfile } from "@/lib/auth/context";
import { validateFantasyName } from "@/lib/auth/names";
import { getFantasyAutoFillCandidates } from "@/data/fantasy-auto-fill";
import { autoFillSquadDraft } from "@/lib/fantasy/auto-fill";
import type { DraftLineupMember } from "@/lib/fantasy/team-draft";

export type FantasySelectionInput = {
  members: Array<{
    fantasyPlayerId: string;
    lineupRole: "starter" | "bench";
    benchOrder: number | null;
    captainRole: CaptainRole;
  }>;
  activeChip: FantasyChip | null;
};

export type FantasyActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; violations?: string[] };

export type FantasyAutoFillResult =
  | {
      ok: true;
      members: DraftLineupMember[];
      addedCount: number;
    }
  | { ok: false; message: string };

const autoFillPositions = new Set<FantasyPosition>([
  "goalkeeper",
  "defender",
  "midfielder",
  "forward",
]);
const autoFillLineupRoles = new Set(["starter", "bench"]);
const autoFillCaptainRoles = new Set(["none", "captain", "vice_captain"]);

function isValidAutoFillMembers(
  members: DraftLineupMember[],
): members is DraftLineupMember[] {
  if (
    !Array.isArray(members) ||
    members.length !== THAI_LEAGUE_FANTASY_RULES.squadSize
  ) {
    return false;
  }
  const slotIds = new Set<string>();
  const playerIds = new Set<string>();
  for (const member of members) {
    if (
      !member ||
      typeof member !== "object" ||
      typeof member.slotId !== "string" ||
      member.slotId.length === 0 ||
      member.slotId.length > 120 ||
      slotIds.has(member.slotId) ||
      !autoFillLineupRoles.has(member.lineupRole) ||
      !autoFillCaptainRoles.has(member.captainRole) ||
      (member.benchOrder !== null &&
        (!Number.isInteger(member.benchOrder) ||
          member.benchOrder < 0 ||
          member.benchOrder > 3)) ||
      (member.vacancyPosition !== null &&
        !autoFillPositions.has(member.vacancyPosition))
    ) {
      return false;
    }
    slotIds.add(member.slotId);
    if (member.fantasyPlayerId !== null) {
      if (
        typeof member.fantasyPlayerId !== "string" ||
        member.fantasyPlayerId.length === 0 ||
        member.fantasyPlayerId.length > 80 ||
        playerIds.has(member.fantasyPlayerId)
      ) {
        return false;
      }
      playerIds.add(member.fantasyPlayerId);
    } else if (member.vacancyPosition === null) {
      return false;
    }
    if (
      (member.fantasyPlayerId !== null && member.vacancyPosition !== null) ||
      (member.lineupRole === "starter" && member.benchOrder !== null) ||
      (member.lineupRole === "bench" && member.benchOrder === null)
    ) {
      return false;
    }
  }
  return true;
}

export async function suggestFantasyAutoFillAction(input: {
  members: DraftLineupMember[];
}): Promise<FantasyAutoFillResult> {
  const { season, gameweek } = await requireFantasyProfile();
  if (!isBeforeDeadline(gameweek.deadlineAt)) {
    return {
      ok: false,
      message: "ปิดรับการจัดทีมสำหรับ Gameweek นี้แล้ว",
    };
  }
  if (!input || !isValidAutoFillMembers(input.members)) {
    return { ok: false, message: "ข้อมูลช่องนักเตะไม่ถูกต้อง" };
  }
  if (input.members.every((member) => member.fantasyPlayerId !== null)) {
    return { ok: false, message: "ไม่มีช่องนักเตะว่างให้เติม" };
  }

  const ranking = await getFantasyAutoFillCandidates(season, gameweek);
  if (!ranking) {
    return {
      ok: false,
      message: "ยังไม่มีอันดับนักเตะสำหรับเติมทีมอัตโนมัติ",
    };
  }
  const suggestion = autoFillSquadDraft({
    members: input.members,
    candidates: ranking,
  });
  if (!suggestion) {
    return {
      ok: false,
      message: "ไม่สามารถหาทีมที่ผ่านทุกโควต้าได้",
    };
  }
  return {
    ok: true,
    members: suggestion.members,
    addedCount: suggestion.addedPlayerIds.length,
  };
}

export async function updateFantasyNamesAction(input: {
  managerName: string;
  teamName: string;
}): Promise<FantasyActionResult> {
  const profile = await requireFantasyProfile();
  if (profile.isAnonymous) {
    return {
      ok: false,
      message: "ผู้เล่น Guest ไม่สามารถเปลี่ยนชื่อได้ กรุณาสมัครสมาชิกก่อน",
    };
  }
  const managerName = validateFantasyName(input.managerName);
  const teamName = validateFantasyName(input.teamName);
  if (!managerName.ok || !teamName.ok) {
    return {
      ok: false,
      message:
        (!managerName.ok ? managerName.message : teamName.message) ??
        "ชื่อไม่ถูกต้อง",
    };
  }
  const now = new Date();
  const managerChanged = managerName.value !== profile.manager.displayName;
  const teamChanged = teamName.value !== profile.team.name;
  if (
    managerChanged &&
    profile.manager.nameChangeAvailableAt &&
    profile.manager.nameChangeAvailableAt > now
  ) {
    return {
      ok: false,
      message: `เปลี่ยนชื่อผู้จัดการได้อีกครั้งวันที่ ${profile.manager.nameChangeAvailableAt.toLocaleDateString("th-TH")}`,
    };
  }
  if (teamChanged && profile.team.nameChangesUsed >= 3) {
    return { ok: false, message: "ใช้สิทธิ์เปลี่ยนชื่อทีมครบ 3 ครั้งแล้ว" };
  }
  if (managerChanged) {
    const nextChange = new Date(now);
    nextChange.setUTCDate(nextChange.getUTCDate() + 30);
    await db
      .update(fantasyManagers)
      .set({
        displayName: managerName.value,
        nameChangeAvailableAt: nextChange,
        updatedAt: now,
      })
      .where(eq(fantasyManagers.id, profile.manager.id));
  }
  if (teamChanged) {
    await db
      .update(fantasyTeams)
      .set({
        name: teamName.value,
        nameChangesUsed: profile.team.nameChangesUsed + 1,
        updatedAt: now,
      })
      .where(eq(fantasyTeams.id, profile.team.id));
  }
  revalidateFantasyPages();
  revalidatePath("/profile");
  return { ok: true, message: "บันทึกชื่อเรียบร้อยแล้ว" };
}

async function getCurrentPlayerSnapshots(
  fantasyPlayerIds: string[],
  season: typeof fantasySeasons.$inferSelect,
  gameweek: typeof fantasyGameweeks.$inferSelect,
) {
  const playerRows = await db
    .select({
      fantasyPlayer: fantasyPlayers,
      registration: playerRegistrations,
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
        inArray(fantasyPlayers.id, fantasyPlayerIds),
        eq(fantasyPlayers.fantasySeasonId, season.id),
        eq(fantasyPlayers.isAvailable, true),
        eq(playerRegistrations.status, "active"),
        eq(competitionEntries.competitionSeasonId, season.competitionSeasonId),
      ),
    );
  const tiers = await db
    .select({ tier: fantasyPlayerTiers, gameweek: fantasyGameweeks })
    .from(fantasyPlayerTiers)
    .innerJoin(
      fantasyGameweeks,
      eq(fantasyPlayerTiers.effectiveGameweekId, fantasyGameweeks.id),
    )
    .where(
      and(
        inArray(fantasyPlayerTiers.fantasyPlayerId, fantasyPlayerIds),
        eq(fantasyGameweeks.fantasySeasonId, season.id),
      ),
    )
    .orderBy(asc(fantasyGameweeks.number));
  const tierByPlayer = new Map<string, number>();
  for (const row of tiers) {
    if (row.gameweek.number <= gameweek.number) {
      tierByPlayer.set(row.tier.fantasyPlayerId, row.tier.level);
    }
  }
  return new Map(
    playerRows.map((row) => [
      row.fantasyPlayer.id,
      {
        fantasyPlayerId: row.fantasyPlayer.id,
        clubId: row.entry.clubId,
        position: row.fantasyPlayer.lockedPosition as FantasyPosition,
        tier: tierByPlayer.get(row.fantasyPlayer.id) ?? 4,
        isThai: row.fantasyPlayer.isThai,
      },
    ]),
  );
}

function revalidateFantasyPages() {
  for (const path of ["/dashboard", "/team", "/points", "/leagues"]) {
    revalidatePath(path);
  }
}

export async function saveFantasySelectionAction(
  input: FantasySelectionInput,
): Promise<FantasyActionResult> {
  const { season, gameweek, team, selection } = await requireFantasyProfile();
  if (!isBeforeDeadline(gameweek.deadlineAt)) {
    return { ok: false, message: "เลย Deadline ของ Gameweek นี้แล้ว" };
  }
  const uniqueIds = [
    ...new Set(input.members.map((member) => member.fantasyPlayerId)),
  ];
  if (uniqueIds.length !== input.members.length) {
    return { ok: false, message: "พบรายชื่อนักเตะซ้ำในทีม" };
  }
  const snapshots = await getCurrentPlayerSnapshots(
    uniqueIds,
    season,
    gameweek,
  );
  const lineup = input.members.flatMap<LineupPlayer>((member) => {
    const snapshot = snapshots.get(member.fantasyPlayerId);
    if (!snapshot) return [];
    return [
      {
        id: snapshot.fantasyPlayerId,
        clubId: snapshot.clubId,
        position: snapshot.position,
        tier: snapshot.tier,
        isThai: snapshot.isThai,
        isAvailable: true,
        lineupRole: member.lineupRole,
        benchOrder: member.benchOrder,
        captainRole: member.captainRole,
      },
    ];
  });
  const violations = validateLineup(lineup);
  if (violations.length > 0) {
    return {
      ok: false,
      message: "ทีมยังไม่ผ่านกติกา",
      violations: violations.map((violation) => violation.message),
    };
  }

  const previousSelectionRows = await db
    .select({ selection: fantasyTeamSelections, gameweek: fantasyGameweeks })
    .from(fantasyTeamSelections)
    .innerJoin(
      fantasyGameweeks,
      eq(fantasyTeamSelections.fantasyGameweekId, fantasyGameweeks.id),
    )
    .where(
      and(
        eq(fantasyTeamSelections.fantasyTeamId, team.id),
        eq(fantasyTeamSelections.status, "locked"),
        lt(fantasyGameweeks.number, gameweek.number),
      ),
    )
    .orderBy(desc(fantasyGameweeks.number))
    .limit(1);
  const previousSelection = previousSelectionRows[0]?.selection;
  const previousMembers = previousSelection
    ? await db
        .select()
        .from(fantasyTeamSelectionPlayers)
        .where(
          eq(fantasyTeamSelectionPlayers.selectionId, previousSelection.id),
        )
    : [];
  const transferCount = previousSelection
    ? getNetTransfers(
        previousMembers.map((member) => member.fantasyPlayerId),
        uniqueIds,
      ).count
    : 0;
  const settlement = settleTransfers({
    freeTransfersBefore: team.freeTransfers,
    transferCount,
    wildcard: input.activeChip === "wildcard",
  });

  if (input.activeChip) {
    const previousUses = (
      await db
        .select()
        .from(fantasyTeamSelections)
        .where(
          and(
            eq(fantasyTeamSelections.fantasyTeamId, team.id),
            eq(fantasyTeamSelections.status, "locked"),
            eq(fantasyTeamSelections.activeChip, input.activeChip),
          ),
        )
    ).length;
    const chipViolations = validateChipUse({
      chip: input.activeChip,
      // A draft chip is only a pending choice. Saving again before the
      // deadline replaces it, so only locked usage counts against the limit.
      activeChip: null,
      previousUses,
    });
    if (chipViolations.length > 0) {
      return {
        ok: false,
        message: chipViolations[0].message,
        violations: chipViolations.map((violation) => violation.message),
      };
    }
  }

  const revisionRows = await db
    .select()
    .from(fantasyTransferRevisions)
    .where(eq(fantasyTransferRevisions.selectionId, selection.id))
    .orderBy(desc(fantasyTransferRevisions.revision))
    .limit(1);
  const revision = (revisionRows[0]?.revision ?? 0) + 1;
  const playerValues: Array<typeof fantasyTeamSelectionPlayers.$inferInsert> =
    lineup.map((player) => ({
      selectionId: selection.id,
      fantasyPlayerId: player.id,
      clubIdSnapshot: player.clubId,
      positionSnapshot: player.position,
      tierSnapshot: player.tier,
      isThaiSnapshot: player.isThai,
      lineupRole: player.lineupRole,
      benchOrder: player.benchOrder,
      captainRole: player.captainRole,
    }));

  const savedAt = new Date();
  await db.batch([
    db
      .update(fantasyTeamSelections)
      .set({
        activeChip: input.activeChip,
        freeTransfersBefore: team.freeTransfers,
        freeTransfersAfter: settlement.freeTransfersAfter,
        netTransferCount: transferCount,
        transferPoints: settlement.transferPoints,
        confirmedAt: savedAt,
        updatedAt: savedAt,
      })
      .where(eq(fantasyTeamSelections.id, selection.id)),
    db
      .delete(fantasyTeamSelectionPlayers)
      .where(eq(fantasyTeamSelectionPlayers.selectionId, selection.id)),
    db.insert(fantasyTeamSelectionPlayers).values(playerValues),
    db.insert(fantasyTransferRevisions).values({
      selectionId: selection.id,
      revision,
      status: "confirmed",
      squad: uniqueIds,
      lineup: { members: playerValues },
      activeChip: input.activeChip,
      netTransferCount: transferCount,
      transferPoints: settlement.transferPoints,
    }),
  ]);
  revalidateFantasyPages();
  return {
    ok: true,
    message:
      transferCount === 0
        ? "บันทึกการจัดทีมแล้ว"
        : `ยืนยันทีมใหม่แล้ว ${transferCount} Transfer`,
  };
}

export async function cancelFantasyChangesAction(): Promise<FantasyActionResult> {
  const { season, gameweek, selection } = await requireFantasyProfile();
  if (!isBeforeDeadline(gameweek.deadlineAt)) {
    return { ok: false, message: "เลย Deadline ของ Gameweek นี้แล้ว" };
  }
  const baselineRows = await db
    .select()
    .from(fantasyTransferRevisions)
    .where(eq(fantasyTransferRevisions.selectionId, selection.id))
    .orderBy(asc(fantasyTransferRevisions.revision))
    .limit(1);
  const baseline = baselineRows[0];
  const baselineMembers = (baseline?.lineup as { members?: unknown[] } | null)
    ?.members;
  if (!baseline || !Array.isArray(baselineMembers)) {
    return { ok: false, message: "ไม่พบทีมตั้งต้นสำหรับยกเลิกการเปลี่ยนแปลง" };
  }
  const allowedRoles = new Set(["starter", "bench"]);
  const allowedCaptainRoles = new Set(["none", "captain", "vice_captain"]);
  const baselineLineup: Array<{
    fantasyPlayerId: string;
    lineupRole: "starter" | "bench";
    benchOrder: number | null;
    captainRole: CaptainRole;
  }> = [];
  for (const value of baselineMembers) {
    if (!value || typeof value !== "object") continue;
    const member = value as Record<string, unknown>;
    if (
      typeof member.fantasyPlayerId !== "string" ||
      typeof member.lineupRole !== "string" ||
      !allowedRoles.has(member.lineupRole) ||
      typeof member.captainRole !== "string" ||
      !allowedCaptainRoles.has(member.captainRole)
    ) {
      continue;
    }
    baselineLineup.push({
      fantasyPlayerId: member.fantasyPlayerId,
      lineupRole: member.lineupRole as "starter" | "bench",
      benchOrder:
        typeof member.benchOrder === "number" ? member.benchOrder : null,
      captainRole: member.captainRole as CaptainRole,
    });
  }
  if (baselineLineup.length !== THAI_LEAGUE_FANTASY_RULES.squadSize) {
    return { ok: false, message: "ข้อมูลทีมตั้งต้นไม่ครบ 15 คน" };
  }

  const snapshots = await getCurrentPlayerSnapshots(
    baselineLineup.map((member) => member.fantasyPlayerId),
    season,
    gameweek,
  );
  const restored = baselineLineup.flatMap<
    typeof fantasyTeamSelectionPlayers.$inferInsert
  >((member) => {
    const snapshot = snapshots.get(member.fantasyPlayerId);
    if (!snapshot) return [];
    return [
      {
        selectionId: selection.id,
        fantasyPlayerId: member.fantasyPlayerId,
        clubIdSnapshot: snapshot.clubId,
        positionSnapshot: snapshot.position,
        tierSnapshot: snapshot.tier,
        isThaiSnapshot: snapshot.isThai,
        lineupRole: member.lineupRole,
        benchOrder: member.benchOrder,
        captainRole: member.captainRole,
      },
    ];
  });
  if (restored.length !== THAI_LEAGUE_FANTASY_RULES.squadSize) {
    return {
      ok: false,
      message: "นักเตะในทีมตั้งต้นบางคนไม่พร้อมให้เลือกแล้ว",
    };
  }
  const violations = validateLineup(
    restored.map((member) => ({
      id: member.fantasyPlayerId,
      clubId: member.clubIdSnapshot,
      position: member.positionSnapshot as FantasyPosition,
      tier: member.tierSnapshot,
      isThai: member.isThaiSnapshot,
      lineupRole: member.lineupRole,
      benchOrder: member.benchOrder ?? null,
      captainRole: member.captainRole ?? "none",
    })),
  );
  if (violations.length > 0) {
    return {
      ok: false,
      message: "ทีมตั้งต้นไม่ผ่านกติกาปัจจุบัน",
      violations: violations.map((violation) => violation.message),
    };
  }

  await db
    .update(fantasyTeamSelections)
    .set({
      activeChip: baseline.activeChip,
      netTransferCount: 0,
      transferPoints: 0,
      confirmedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(fantasyTeamSelections.id, selection.id));
  await db
    .delete(fantasyTeamSelectionPlayers)
    .where(eq(fantasyTeamSelectionPlayers.selectionId, selection.id));
  await db.insert(fantasyTeamSelectionPlayers).values(restored);
  await db
    .update(fantasyTransferRevisions)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(
      and(
        eq(fantasyTransferRevisions.selectionId, selection.id),
        gt(fantasyTransferRevisions.revision, baseline.revision),
      ),
    );
  revalidateFantasyPages();
  return { ok: true, message: "ยกเลิกการเปลี่ยนแปลงและคืนโควต้าแล้ว" };
}

function formInteger(formData: FormData, key: string) {
  const value = Number(formData.get(key) ?? 0);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${key} must be a non-negative integer.`);
  }
  return value;
}

export async function savePlayerMatchStatsAction(formData: FormData) {
  const admin = await requireAdmin();
  const changedBy = `${admin.user.email} (${admin.user.id})`;
  const fixtureId = String(formData.get("fixtureId") ?? "");
  const fantasyPlayerId = String(formData.get("fantasyPlayerId") ?? "");
  const reason = String(
    formData.get("reason") ?? "แก้ไขข้อมูลสำหรับการทดสอบ",
  ).trim();
  if (!fixtureId || !fantasyPlayerId || !reason) {
    throw new Error("Fixture, player and correction reason are required.");
  }
  const fantasyAssistValue = String(
    formData.get("fantasyAssists") ?? "",
  ).trim();
  const values = {
    minutes: formInteger(formData, "minutes"),
    goals: formInteger(formData, "goals"),
    sourceAssists: formInteger(formData, "sourceAssists"),
    fantasyAssists:
      fantasyAssistValue === ""
        ? null
        : formInteger(formData, "fantasyAssists"),
    goalsConcededWhilePlaying: formInteger(
      formData,
      "goalsConcededWhilePlaying",
    ),
    saves: formInteger(formData, "saves"),
    penaltySaves: formInteger(formData, "penaltySaves"),
    penaltyMisses: formInteger(formData, "penaltyMisses"),
    yellowCards: formInteger(formData, "yellowCards"),
    redCards: formInteger(formData, "redCards"),
    ownGoals: formInteger(formData, "ownGoals"),
  };
  const [fixture, fantasyPlayer] = await Promise.all([
    db.query.fixtures.findFirst({ where: eq(fixtures.id, fixtureId) }),
    db.query.fantasyPlayers.findFirst({
      where: eq(fantasyPlayers.id, fantasyPlayerId),
    }),
  ]);
  if (!fixture || !fantasyPlayer)
    throw new Error("Fixture or fantasy player was not found.");
  const existing = await db.query.fantasyPlayerMatchStats.findFirst({
    where: and(
      eq(fantasyPlayerMatchStats.fixtureId, fixtureId),
      eq(fantasyPlayerMatchStats.fantasyPlayerId, fantasyPlayerId),
    ),
  });
  const statRows = await db
    .insert(fantasyPlayerMatchStats)
    .values({
      fixtureId,
      fantasyPlayerId,
      status: existing ? "corrected" : "imported",
      sourceName: "thai-league-admin",
      ...values,
      reviewedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        fantasyPlayerMatchStats.fixtureId,
        fantasyPlayerMatchStats.fantasyPlayerId,
      ],
      set: {
        status: "corrected",
        ...values,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning();
  const stat = statRows[0];
  if (existing) {
    for (const [fieldName, nextValue] of Object.entries(values)) {
      const previousValue = existing[fieldName as keyof typeof existing];
      if (previousValue === nextValue) continue;
      await db.insert(fantasyStatOverrides).values({
        playerMatchStatsId: stat.id,
        fieldName,
        previousValue,
        nextValue,
        reason,
        changedBy,
      });
    }
  }
  const points = calculatePlayerPoints(
    fantasyPlayer.lockedPosition as FantasyPosition,
    values,
  );
  await db
    .insert(fantasyPlayerMatchPoints)
    .values({
      playerMatchStatsId: stat.id,
      breakdown: points.breakdown,
      totalPoints: points.total,
    })
    .onConflictDoUpdate({
      target: fantasyPlayerMatchPoints.playerMatchStatsId,
      set: {
        breakdown: points.breakdown,
        totalPoints: points.total,
        computedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  await db.insert(fantasyAdminAuditLog).values({
    action: existing ? "correct_match_stats" : "import_match_stats",
    entityType: "fantasy_player_match_stats",
    entityId: stat.id,
    reason,
    changedBy,
    before: existing ?? null,
    after: values,
  });
  const fantasySeason = await db.query.fantasySeasons.findFirst({
    where: eq(fantasySeasons.competitionSeasonId, fixture.competitionSeasonId),
  });
  if (fantasySeason) {
    const gameweek = await db.query.fantasyGameweeks.findFirst({
      where: and(
        eq(fantasyGameweeks.fantasySeasonId, fantasySeason.id),
        eq(fantasyGameweeks.number, fixture.matchweek),
      ),
    });
    if (gameweek) await recalculateGameweek(gameweek.id);
  }
  revalidateFantasyPages();
}

export async function updateFantasyPlayerClassificationAction(
  formData: FormData,
) {
  const admin = await requireAdmin();
  const changedBy = `${admin.user.email} (${admin.user.id})`;
  const fantasyPlayerId = String(formData.get("fantasyPlayerId") ?? "");
  const effectiveGameweekId = String(formData.get("effectiveGameweekId") ?? "");
  const level = formInteger(formData, "level");
  const isThai = String(formData.get("isThai") ?? "false") === "true";
  const reason = String(formData.get("reason") ?? "").trim();
  const isKnownTier = THAI_LEAGUE_FANTASY_RULES.tierSlots.some(
    (tier) => tier.level === level,
  );
  if (!fantasyPlayerId || !effectiveGameweekId || !reason || !isKnownTier) {
    throw new Error("Player, Gameweek, tier and reason are required.");
  }
  const [player, gameweek] = await Promise.all([
    db.query.fantasyPlayers.findFirst({
      where: eq(fantasyPlayers.id, fantasyPlayerId),
    }),
    db.query.fantasyGameweeks.findFirst({
      where: eq(fantasyGameweeks.id, effectiveGameweekId),
    }),
  ]);
  if (
    !player ||
    !gameweek ||
    player.fantasySeasonId !== gameweek.fantasySeasonId
  ) {
    throw new Error("Player and Gameweek do not belong to the same season.");
  }
  const previousTier = await db.query.fantasyPlayerTiers.findFirst({
    where: and(
      eq(fantasyPlayerTiers.fantasyPlayerId, fantasyPlayerId),
      eq(fantasyPlayerTiers.effectiveGameweekId, effectiveGameweekId),
    ),
  });
  await db
    .insert(fantasyPlayerTiers)
    .values({
      fantasyPlayerId,
      effectiveGameweekId,
      level,
      sourceName: "fantasy-admin",
      reason,
    })
    .onConflictDoUpdate({
      target: [
        fantasyPlayerTiers.fantasyPlayerId,
        fantasyPlayerTiers.effectiveGameweekId,
      ],
      set: {
        level,
        sourceName: "fantasy-admin",
        reason,
        updatedAt: new Date(),
      },
    });
  await db
    .update(fantasyPlayers)
    .set({ isThai, nationalitySource: "fantasy-admin", updatedAt: new Date() })
    .where(eq(fantasyPlayers.id, fantasyPlayerId));

  const openSelections = await db
    .select({ id: fantasyTeamSelections.id })
    .from(fantasyTeamSelections)
    .innerJoin(
      fantasyGameweeks,
      eq(fantasyTeamSelections.fantasyGameweekId, fantasyGameweeks.id),
    )
    .where(
      and(
        eq(fantasyTeamSelections.status, "draft"),
        eq(fantasyGameweeks.fantasySeasonId, player.fantasySeasonId),
        eq(fantasyGameweeks.number, gameweek.number),
      ),
    );
  if (openSelections.length > 0) {
    await db
      .update(fantasyTeamSelectionPlayers)
      .set({
        tierSnapshot: level,
        isThaiSnapshot: isThai,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(fantasyTeamSelectionPlayers.fantasyPlayerId, fantasyPlayerId),
          inArray(
            fantasyTeamSelectionPlayers.selectionId,
            openSelections.map((selection) => selection.id),
          ),
        ),
      );
  }
  await db.insert(fantasyAdminAuditLog).values({
    action: "update_player_classification",
    entityType: "fantasy_player",
    entityId: fantasyPlayerId,
    reason,
    changedBy,
    before: { level: previousTier?.level ?? null, isThai: player.isThai },
    after: { level, isThai, effectiveGameweekId },
  });
  revalidateFantasyPages();
}

export async function lockFantasyGameweekAction(formData: FormData) {
  await requireAdmin();
  const gameweekId = String(formData.get("gameweekId") ?? "");
  const gameweek = await db.query.fantasyGameweeks.findFirst({
    where: eq(fantasyGameweeks.id, gameweekId),
  });
  if (!gameweek) throw new Error("Gameweek was not found.");
  const selections = await db
    .select()
    .from(fantasyTeamSelections)
    .where(
      and(
        eq(fantasyTeamSelections.fantasyGameweekId, gameweek.id),
        eq(fantasyTeamSelections.status, "draft"),
      ),
    );
  const nextGameweek = await db.query.fantasyGameweeks.findFirst({
    where: and(
      eq(fantasyGameweeks.fantasySeasonId, gameweek.fantasySeasonId),
      eq(fantasyGameweeks.number, gameweek.number + 1),
    ),
  });
  for (const selection of selections) {
    const team = await db.query.fantasyTeams.findFirst({
      where: eq(fantasyTeams.id, selection.fantasyTeamId),
    });
    if (!team) continue;
    const settlement = settleTransfers({
      freeTransfersBefore: selection.freeTransfersBefore,
      transferCount: selection.netTransferCount,
      wildcard: selection.activeChip === "wildcard",
    });
    await db
      .update(fantasyTeamSelections)
      .set({
        status: "locked",
        lockedAt: new Date(),
        freeTransfersAfter: settlement.freeTransfersAfter,
        transferPoints: settlement.transferPoints,
        updatedAt: new Date(),
      })
      .where(eq(fantasyTeamSelections.id, selection.id));
    await db
      .update(fantasyTeams)
      .set({
        freeTransfers: settlement.freeTransfersAfter,
        updatedAt: new Date(),
      })
      .where(eq(fantasyTeams.id, team.id));

    if (nextGameweek) {
      const nextSelectionRows = await db
        .insert(fantasyTeamSelections)
        .values({
          fantasyTeamId: team.id,
          fantasyGameweekId: nextGameweek.id,
          status: "draft",
          freeTransfersBefore: settlement.freeTransfersAfter,
        })
        .onConflictDoUpdate({
          target: [
            fantasyTeamSelections.fantasyTeamId,
            fantasyTeamSelections.fantasyGameweekId,
          ],
          set: {
            freeTransfersBefore: settlement.freeTransfersAfter,
            updatedAt: new Date(),
          },
        })
        .returning();
      const nextSelection = nextSelectionRows[0];
      const existingNextMembers = await db
        .select()
        .from(fantasyTeamSelectionPlayers)
        .where(eq(fantasyTeamSelectionPlayers.selectionId, nextSelection.id));
      if (existingNextMembers.length === 0) {
        const currentMembers = await db
          .select()
          .from(fantasyTeamSelectionPlayers)
          .where(eq(fantasyTeamSelectionPlayers.selectionId, selection.id));
        const copied = currentMembers.map((member) => ({
          selectionId: nextSelection.id,
          fantasyPlayerId: member.fantasyPlayerId,
          clubIdSnapshot: member.clubIdSnapshot,
          positionSnapshot: member.positionSnapshot,
          tierSnapshot: member.tierSnapshot,
          isThaiSnapshot: member.isThaiSnapshot,
          lineupRole: member.lineupRole,
          benchOrder: member.benchOrder,
          captainRole: member.captainRole,
        }));
        if (copied.length > 0) {
          await db.batch([
            db.insert(fantasyTeamSelectionPlayers).values(copied),
            db.insert(fantasyTransferRevisions).values({
              selectionId: nextSelection.id,
              revision: 1,
              status: "confirmed",
              squad: copied.map((member) => member.fantasyPlayerId),
              lineup: { members: copied },
              netTransferCount: 0,
              transferPoints: 0,
            }),
          ]);
        }
      }
    }
  }
  await db
    .update(fantasyGameweeks)
    .set({ status: "provisional", updatedAt: new Date() })
    .where(eq(fantasyGameweeks.id, gameweek.id));
  if (nextGameweek) {
    await db
      .update(fantasyGameweeks)
      .set({ status: "open", updatedAt: new Date() })
      .where(eq(fantasyGameweeks.id, nextGameweek.id));
  }
  await recalculateGameweek(gameweek.id);
  revalidateFantasyPages();
}

export async function finalizeFantasyGameweekAction(formData: FormData) {
  await requireAdmin();
  const gameweekId = String(formData.get("gameweekId") ?? "");
  await db
    .update(fantasyGameweeks)
    .set({
      status: "final",
      scoreComplete: true,
      finalizedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(fantasyGameweeks.id, gameweekId));
  await recalculateGameweek(gameweekId);
  revalidateFantasyPages();
}
