import "server-only";
import { and, asc, desc, eq, inArray, lt } from "drizzle-orm";
import { transactionDb } from "@/db/transaction";
import {
  competitionEntries,
  fantasyGameweeks,
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
  settleTransfers,
  THAI_LEAGUE_FANTASY_RULES,
  validateChipUse,
  validateLineup,
  validateTransferLimit,
  type FantasyPosition,
  type LineupPlayer,
} from "./rules";
import { isFantasySelectionInput } from "./selection-input";
import { lockFantasySeason, type FantasyTransaction } from "./season-lock";

export type FantasySelectionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; violations?: string[]; conflict?: boolean };

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
    .select()
    .from(fantasyTeams)
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
  let transferBaselineIds = previousMembers.map(
    (member) => member.fantasyPlayerId,
  );
  if (transferBaselineIds.length !== THAI_LEAGUE_FANTASY_RULES.squadSize) {
    const openingRevisionRows = await db
      .select({ squad: fantasyTransferRevisions.squad })
      .from(fantasyTransferRevisions)
      .where(eq(fantasyTransferRevisions.selectionId, selection.id))
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
    openingGameweek: gameweek.number === 1,
  });
  const transferViolations = validateTransferLimit({
    freeTransfersBefore: team.freeTransfers,
    transferCount,
    wildcard: input.activeChip === "wildcard",
    openingGameweek: gameweek.number === 1,
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
    message:
      transferCount === 0
        ? "บันทึกการจัดทีมแล้ว"
        : `ยืนยันทีมใหม่แล้ว ${transferCount} Transfer`,
  };
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
