import "server-only";
import { and, asc, desc, eq, gt, inArray, lt } from "drizzle-orm";
import { transactionDb } from "@/db/transaction";
import {
  competitionEntries,
  fantasyGameweeks,
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
import {
  formatTransferLimitViolation,
  getCountedTransfers,
  isBeforeDeadline,
  isTeamOpeningGameweek,
  settleTransfers,
  THAI_LEAGUE_FANTASY_RULES,
  validateChipUse,
  validateLineup,
  validateTransferLimit,
  type FantasyPosition,
  type FantasyChip,
  type LineupPlayer,
} from "./rules";
import {
  isFantasySelectionInput,
  isFantasySelectionRevisionInput,
  type FantasySelectionInput,
} from "./selection-input";
import { normalizeFantasyRevisionMembers } from "./revision-snapshot";
import { lockFantasySeason, type FantasyTransaction } from "./season-lock";
import { getTransferRevisionState } from "./transfer-revisions";
import { updateFantasyPlayerOwnershipForSelection } from "./ownership-service";

export type FantasySelectionResult =
  | { ok: true; message: string; revision: number }
  | { ok: false; message: string; violations?: string[]; conflict?: boolean };

export type FantasySelectionRevertResult =
  | {
      ok: true;
      message: string;
      revision: number;
      members: FantasySelectionInput["members"];
      activeChip: FantasyChip | null;
    }
  | { ok: false; message: string; conflict?: boolean };

export async function saveFantasySelection(
  owner: { seasonId: string; teamId: string; managerId: string },
  input: unknown,
): Promise<FantasySelectionResult> {
  if (!isFantasySelectionInput(input))
    return {
      ok: false,
      message: "ข้อมูลทีมไม่ถูกต้อง กรุณาเลือกนักเตะที่ไม่ซ้ำกันให้ครบ 15 คน",
    };
  return transactionDb.transaction((db) =>
    saveFantasySelectionInTransaction(owner, input, db),
  );
}

export async function saveFantasySelectionInTransaction(
  owner: { seasonId: string; teamId: string; managerId: string },
  input: unknown,
  db: FantasyTransaction,
): Promise<FantasySelectionResult> {
  if (!isFantasySelectionInput(input))
    return {
      ok: false,
      message: "ข้อมูลทีมไม่ถูกต้อง กรุณาเลือกนักเตะที่ไม่ซ้ำกันให้ครบ 15 คน",
    };
  const season = await lockFantasySeason(db, owner.seasonId, "share");
  const [selection] = await db
    .select()
    .from(fantasyTeamSelections)
    .where(
      and(
        eq(fantasyTeamSelections.id, input.selectionId),
        eq(fantasyTeamSelections.fantasyTeamId, owner.teamId),
      ),
    )
    .for("update");
  if (!selection) return { ok: false, message: "ไม่พบทีมที่ต้องการแก้ไข" };
  const gameweek = await db.query.fantasyGameweeks.findFirst({
    where: and(
      eq(fantasyGameweeks.id, selection.fantasyGameweekId),
      eq(fantasyGameweeks.fantasySeasonId, season.id),
    ),
  });
  if (
    !gameweek ||
    gameweek.status !== "open" ||
    selection.status !== "draft" ||
    !isBeforeDeadline(gameweek.deadlineAt)
  ) {
    return { ok: false, message: "เลย Deadline ของ Gameweek นี้แล้ว" };
  }
  const [team] = await db
    .select({
      id: fantasyTeams.id,
      freeTransfers: fantasyTeams.freeTransfers,
      isActive: fantasyTeams.isActive,
      managerStatus: fantasyManagers.status,
      managerIsBot: fantasyManagers.isBot,
    })
    .from(fantasyTeams)
    .innerJoin(fantasyManagers, eq(fantasyTeams.managerId, fantasyManagers.id))
    .where(
      and(
        eq(fantasyTeams.id, owner.teamId),
        eq(fantasyTeams.managerId, owner.managerId),
        eq(fantasyTeams.fantasySeasonId, season.id),
      ),
    )
    .for("update");
  if (!team) return { ok: false, message: "ไม่พบทีมที่ต้องการแก้ไข" };
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
    db,
  );
  if (snapshots.size !== uniqueIds.length) {
    return {
      ok: false,
      message: "นักเตะบางคนไม่พร้อมให้เลือกแล้ว กรุณาตรวจสอบทีมอีกครั้ง",
    };
  }
  const lineup = input.members.flatMap<LineupPlayer>((member) => {
    const snapshot = snapshots.get(member.fantasyPlayerId);
    if (!snapshot) throw new Error("Validated player snapshot is missing.");
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

  const previousMembers = await getPreviousLockedSelectionMembers(
    team.id,
    gameweek.number,
    db,
  );
  const openingGameweek = isTeamOpeningGameweek([previousMembers.length]);
  let transferBaselineIds = previousMembers.map(
    (member) => member.fantasyPlayerId,
  );
  if (transferBaselineIds.length !== THAI_LEAGUE_FANTASY_RULES.squadSize) {
    const openingRevisionRows = await db
      .select({ squad: fantasyTransferRevisions.squad })
      .from(fantasyTransferRevisions)
      .where(
        and(
          eq(fantasyTransferRevisions.selectionId, selection.id),
          eq(fantasyTransferRevisions.status, "confirmed"),
        ),
      )
      .orderBy(asc(fantasyTransferRevisions.revision))
      .limit(1);
    const openingSquad = openingRevisionRows[0]?.squad;
    if (
      openingSquad &&
      (openingSquad.length !== 15 || new Set(openingSquad).size !== 15)
    ) {
      return {
        ok: false,
        message: "ข้อมูลทีมตั้งต้นไม่ถูกต้อง กรุณาติดต่อผู้ดูแล",
      };
    }
    transferBaselineIds = Array.isArray(openingSquad)
      ? openingSquad.filter(
          (fantasyPlayerId): fantasyPlayerId is string =>
            typeof fantasyPlayerId === "string",
        )
      : [];
  }
  const transferCount = getCountedTransfers(transferBaselineIds, uniqueIds);
  const settlement = settleTransfers({
    freeTransfersBefore: team.freeTransfers,
    transferCount,
    wildcard: input.activeChip === "wildcard",
    openingGameweek,
  });
  const transferViolations = validateTransferLimit({
    freeTransfersBefore: team.freeTransfers,
    transferCount,
    wildcard: input.activeChip === "wildcard",
    openingGameweek,
  });
  if (transferViolations.length > 0) {
    const messages = transferViolations.map(formatTransferLimitViolation);
    return {
      ok: false,
      message: messages[0],
      violations: messages,
    };
  }

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
      gameweekNumber: gameweek.number,
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
  const currentRevision = revisionRows[0]?.revision ?? 0;
  if (currentRevision !== input.expectedRevision) {
    return {
      ok: false,
      conflict: true,
      message:
        "ทีมถูกเปลี่ยนจากหน้าต่างอื่นแล้ว กรุณาโหลดทีมล่าสุดก่อนบันทึกอีกครั้ง",
    };
  }
  const revision = currentRevision + 1;
  const playerValues: Array<typeof fantasyTeamSelectionPlayers.$inferInsert> =
    lineup.map((player) => ({
      selectionId: selection.id,
      fantasySeasonId: season.id,
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
  if (!isBeforeDeadline(gameweek.deadlineAt, savedAt))
    return { ok: false, message: "เลย Deadline ของ Gameweek นี้แล้ว" };
  const previousOwnershipPlayerIds = await getSelectionPlayerIds(
    selection.id,
    db,
  );
  await db
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
    .where(eq(fantasyTeamSelections.id, selection.id));
  await db
    .delete(fantasyTeamSelectionPlayers)
    .where(eq(fantasyTeamSelectionPlayers.selectionId, selection.id));
  await db.insert(fantasyTeamSelectionPlayers).values(playerValues);
  await updateFantasyPlayerOwnershipForSelection({
    gameweekId: gameweek.id,
    previousPlayerIds: previousOwnershipPlayerIds,
    nextPlayerIds: uniqueIds,
    isCountedTeam:
      team.isActive &&
      !team.managerIsBot &&
      (team.managerStatus === "guest" || team.managerStatus === "member"),
    database: db,
  });
  await db.insert(fantasyTransferRevisions).values({
    selectionId: selection.id,
    revision,
    status: "confirmed",
    squad: lineup.map((player) => player.id),
    lineup: { members: playerValues },
    activeChip: input.activeChip,
    netTransferCount: transferCount,
    transferPoints: settlement.transferPoints,
  });
  return {
    ok: true,
    revision,
    message:
      transferCount === 0
        ? "บันทึกการจัดทีมแล้ว"
        : `ยืนยันทีมใหม่แล้ว ${transferCount} Transfer`,
  };
}

export async function revertFantasySelection(
  owner: { seasonId: string; teamId: string; managerId: string },
  input: unknown,
): Promise<FantasySelectionRevertResult> {
  if (!isFantasySelectionRevisionInput(input)) {
    return { ok: false, message: "ข้อมูลทีมที่ต้องการคืนไม่ถูกต้อง" };
  }
  return transactionDb.transaction((db) =>
    revertFantasySelectionInTransaction(owner, input, db),
  );
}

export async function revertFantasySelectionInTransaction(
  owner: { seasonId: string; teamId: string; managerId: string },
  input: unknown,
  db: FantasyTransaction,
): Promise<FantasySelectionRevertResult> {
  if (!isFantasySelectionRevisionInput(input)) {
    return { ok: false, message: "ข้อมูลทีมที่ต้องการคืนไม่ถูกต้อง" };
  }
  const season = await lockFantasySeason(db, owner.seasonId, "share");
  const [selection] = await db
    .select()
    .from(fantasyTeamSelections)
    .where(
      and(
        eq(fantasyTeamSelections.id, input.selectionId),
        eq(fantasyTeamSelections.fantasyTeamId, owner.teamId),
      ),
    )
    .for("update");
  if (!selection) return { ok: false, message: "ไม่พบทีมที่ต้องการแก้ไข" };

  const gameweek = await db.query.fantasyGameweeks.findFirst({
    where: and(
      eq(fantasyGameweeks.id, selection.fantasyGameweekId),
      eq(fantasyGameweeks.fantasySeasonId, season.id),
    ),
  });
  if (
    !gameweek ||
    gameweek.status !== "open" ||
    selection.status !== "draft" ||
    !isBeforeDeadline(gameweek.deadlineAt)
  ) {
    return { ok: false, message: "เลย Deadline ของ Gameweek นี้แล้ว" };
  }

  const [team] = await db
    .select({
      id: fantasyTeams.id,
      freeTransfers: fantasyTeams.freeTransfers,
      isActive: fantasyTeams.isActive,
      managerStatus: fantasyManagers.status,
      managerIsBot: fantasyManagers.isBot,
    })
    .from(fantasyTeams)
    .innerJoin(fantasyManagers, eq(fantasyTeams.managerId, fantasyManagers.id))
    .where(
      and(
        eq(fantasyTeams.id, owner.teamId),
        eq(fantasyTeams.managerId, owner.managerId),
        eq(fantasyTeams.fantasySeasonId, season.id),
      ),
    )
    .for("update");
  if (!team) return { ok: false, message: "ไม่พบทีมที่ต้องการแก้ไข" };

  const [previousMembers, revisions] = await Promise.all([
    getPreviousLockedSelectionMembers(team.id, gameweek.number, db),
    db
      .select()
      .from(fantasyTransferRevisions)
      .where(eq(fantasyTransferRevisions.selectionId, selection.id))
      .orderBy(asc(fantasyTransferRevisions.revision)),
  ]);
  const currentRevision = revisions.at(-1)?.revision ?? 0;
  if (currentRevision !== input.expectedRevision) {
    return {
      ok: false,
      conflict: true,
      message:
        "ทีมถูกเปลี่ยนจากหน้าต่างอื่นแล้ว กรุณาโหลดทีมล่าสุดก่อนลองอีกครั้ง",
    };
  }

  const openingGameweek = isTeamOpeningGameweek([previousMembers.length]);
  const revisionState = getTransferRevisionState(revisions, openingGameweek);
  if (!revisionState.hasPendingChanges) {
    return {
      ok: false,
      conflict: true,
      message:
        "ทีมถูกเปลี่ยนจากหน้าต่างอื่นแล้ว กรุณาโหลดทีมล่าสุดก่อนลองอีกครั้ง",
    };
  }

  const baseline = revisionState.baselineRevision
    ? (revisions.find(
        (revision) => revision.revision === revisionState.baselineRevision,
      ) ?? null)
    : null;
  const restored = openingGameweek
    ? []
    : restoreBaselineMembers(baseline, selection.id, season.id);
  if (restored === null) {
    return {
      ok: false,
      message: baseline
        ? "ข้อมูลทีมตั้งต้นไม่ถูกต้อง กรุณาติดต่อผู้ดูแล"
        : "ไม่พบทีมตั้งต้นสำหรับยกเลิกการเปลี่ยนแปลง",
    };
  }

  const activeChip = openingGameweek ? null : (baseline?.activeChip ?? null);
  const settlement = settleTransfers({
    freeTransfersBefore: team.freeTransfers,
    transferCount: 0,
    wildcard: activeChip === "wildcard",
    openingGameweek,
  });
  const revertedAt = new Date();
  if (!isBeforeDeadline(gameweek.deadlineAt, revertedAt)) {
    return { ok: false, message: "เลย Deadline ของ Gameweek นี้แล้ว" };
  }

  const previousOwnershipPlayerIds = await getSelectionPlayerIds(
    selection.id,
    db,
  );
  await db
    .update(fantasyTeamSelections)
    .set({
      activeChip,
      freeTransfersBefore: team.freeTransfers,
      freeTransfersAfter: settlement.freeTransfersAfter,
      netTransferCount: 0,
      transferPoints: 0,
      confirmedAt: revertedAt,
      updatedAt: revertedAt,
    })
    .where(eq(fantasyTeamSelections.id, selection.id));
  await db
    .delete(fantasyTeamSelectionPlayers)
    .where(eq(fantasyTeamSelectionPlayers.selectionId, selection.id));
  if (restored.length > 0) {
    await db.insert(fantasyTeamSelectionPlayers).values(restored);
  }
  await updateFantasyPlayerOwnershipForSelection({
    gameweekId: gameweek.id,
    previousPlayerIds: previousOwnershipPlayerIds,
    nextPlayerIds: restored.map((member) => member.fantasyPlayerId),
    isCountedTeam:
      team.isActive &&
      !team.managerIsBot &&
      (team.managerStatus === "guest" || team.managerStatus === "member"),
    database: db,
  });

  const confirmedRevisionFilter = openingGameweek
    ? and(
        eq(fantasyTransferRevisions.selectionId, selection.id),
        eq(fantasyTransferRevisions.status, "confirmed"),
      )
    : and(
        eq(fantasyTransferRevisions.selectionId, selection.id),
        eq(fantasyTransferRevisions.status, "confirmed"),
        gt(fantasyTransferRevisions.revision, revisionState.baselineRevision!),
      );
  await db
    .update(fantasyTransferRevisions)
    .set({ status: "cancelled", updatedAt: revertedAt })
    .where(confirmedRevisionFilter);

  const revision = currentRevision + 1;
  await db.insert(fantasyTransferRevisions).values({
    selectionId: selection.id,
    revision,
    status: "cancelled",
    squad: restored.map((member) => member.fantasyPlayerId),
    lineup: { members: restored },
    activeChip,
    netTransferCount: 0,
    transferPoints: 0,
  });

  return {
    ok: true,
    message: openingGameweek
      ? "ล้างทีมและยกเลิกการเปลี่ยนแปลงแล้ว"
      : "คืนทีมต้นเกมวีคและโควต้า Transfer แล้ว",
    revision,
    members: restored.map((member) => ({
      fantasyPlayerId: member.fantasyPlayerId,
      lineupRole: member.lineupRole,
      benchOrder: member.benchOrder,
      captainRole: member.captainRole,
    })),
    activeChip,
  };
}

async function getSelectionPlayerIds(
  selectionId: string,
  db: Pick<FantasyTransaction, "select">,
) {
  const rows = await db
    .select({ fantasyPlayerId: fantasyTeamSelectionPlayers.fantasyPlayerId })
    .from(fantasyTeamSelectionPlayers)
    .where(eq(fantasyTeamSelectionPlayers.selectionId, selectionId));
  return rows.map((row) => row.fantasyPlayerId);
}

function restoreBaselineMembers(
  baseline: typeof fantasyTransferRevisions.$inferSelect | null,
  selectionId: string,
  fantasySeasonId: string,
): Array<
  FantasySelectionInput["members"][number] & {
    selectionId: string;
    fantasySeasonId: string;
    clubIdSnapshot: string;
    positionSnapshot: FantasyPosition;
    tierSnapshot: number;
    isThaiSnapshot: boolean;
  }
> | null {
  const members = normalizeFantasyRevisionMembers(
    (baseline?.lineup as { members?: unknown } | null)?.members,
  );
  if (!members) return null;
  const transport = {
    selectionId,
    expectedRevision: baseline?.revision ?? 0,
    members,
    activeChip: baseline?.activeChip ?? null,
  };
  if (!isFantasySelectionInput(transport)) return null;

  const positions = new Set<FantasyPosition>([
    "goalkeeper",
    "defender",
    "midfielder",
    "forward",
  ]);
  const snapshots = members;
  const restored: Array<
    FantasySelectionInput["members"][number] & {
      selectionId: string;
      fantasySeasonId: string;
      clubIdSnapshot: string;
      positionSnapshot: FantasyPosition;
      tierSnapshot: number;
      isThaiSnapshot: boolean;
    }
  > = [];
  for (const [index, member] of transport.members.entries()) {
    const snapshot = snapshots[index];
    if (
      typeof snapshot.clubIdSnapshot !== "string" ||
      !positions.has(snapshot.positionSnapshot as FantasyPosition) ||
      !Number.isInteger(snapshot.tierSnapshot) ||
      (snapshot.tierSnapshot as number) < 1 ||
      typeof snapshot.isThaiSnapshot !== "boolean"
    ) {
      return null;
    }
    restored.push({
      ...member,
      selectionId,
      fantasySeasonId,
      clubIdSnapshot: snapshot.clubIdSnapshot,
      positionSnapshot: snapshot.positionSnapshot as FantasyPosition,
      tierSnapshot: snapshot.tierSnapshot as number,
      isThaiSnapshot: snapshot.isThaiSnapshot,
    });
  }
  const violations = validateLineup(
    restored.map((member) => ({
      id: member.fantasyPlayerId,
      clubId: member.clubIdSnapshot,
      position: member.positionSnapshot,
      tier: member.tierSnapshot,
      isThai: member.isThaiSnapshot,
      isAvailable: true,
      lineupRole: member.lineupRole,
      benchOrder: member.benchOrder,
      captainRole: member.captainRole,
    })),
  );
  return violations.length === 0 ? restored : null;
}

async function getPreviousLockedSelectionMembers(
  teamId: string,
  gameweekNumber: number,
  db: FantasyTransaction,
) {
  const previousSelectionRows = await db
    .select({ selection: fantasyTeamSelections, gameweek: fantasyGameweeks })
    .from(fantasyTeamSelections)
    .innerJoin(
      fantasyGameweeks,
      eq(fantasyTeamSelections.fantasyGameweekId, fantasyGameweeks.id),
    )
    .where(
      and(
        eq(fantasyTeamSelections.fantasyTeamId, teamId),
        eq(fantasyTeamSelections.status, "locked"),
        lt(fantasyGameweeks.number, gameweekNumber),
      ),
    )
    .orderBy(desc(fantasyGameweeks.number))
    .limit(1);
  const previousSelection = previousSelectionRows[0]?.selection;
  return previousSelection
    ? db
        .select()
        .from(fantasyTeamSelectionPlayers)
        .where(
          eq(fantasyTeamSelectionPlayers.selectionId, previousSelection.id),
        )
    : [];
}

async function getCurrentPlayerSnapshots(
  fantasyPlayerIds: string[],
  season: typeof fantasySeasons.$inferSelect,
  gameweek: typeof fantasyGameweeks.$inferSelect,
  db: FantasyTransaction,
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
