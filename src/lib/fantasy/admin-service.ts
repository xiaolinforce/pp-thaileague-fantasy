import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  fantasyAdminAuditLog,
  fantasyGameweeks,
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
import { calculatePlayerPoints } from "./scoring";
import { recalculateGameweek } from "./scoring-service";
import {
  settleTransfers,
  THAI_LEAGUE_FANTASY_RULES,
  validateTransferLimit,
  type FantasyPosition,
} from "./rules";
import { createGameweekCarryover } from "./gameweek-carryover";
import { lockFantasySeason, type FantasyTransaction } from "./season-lock";

function formInteger(formData: FormData, key: string) {
  const value = Number(formData.get(key) ?? 0);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${key} must be a non-negative integer.`);
  }
  return value;
}

export async function savePlayerMatchStats(
  formData: FormData,
  changedBy: string,
  db: FantasyTransaction,
) {
  const fixtureId = String(formData.get("fixtureId") ?? "");
  const fantasyPlayerId = String(formData.get("fantasyPlayerId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
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
  const target = await db.query.fantasyPlayers.findFirst({
    where: eq(fantasyPlayers.id, fantasyPlayerId),
  });
  if (!target) throw new Error("Fantasy player was not found.");
  await lockFantasySeason(db, target.fantasySeasonId);
  const [fixture, fantasyPlayer] = await Promise.all([
    db.query.fixtures.findFirst({ where: eq(fixtures.id, fixtureId) }),
    db.query.fantasyPlayers.findFirst({
      where: eq(fantasyPlayers.id, fantasyPlayerId),
    }),
  ]);
  if (!fixture || !fantasyPlayer)
    throw new Error("Fixture or fantasy player was not found.");
  const fantasySeason = await db.query.fantasySeasons.findFirst({
    where: eq(fantasySeasons.competitionSeasonId, fixture.competitionSeasonId),
  });
  if (!fantasySeason || fantasyPlayer.fantasySeasonId !== fantasySeason.id) {
    throw new Error("The selected player does not belong to this season.");
  }
  const validRegistration = await db.query.playerRegistrations.findFirst({
    where: and(
      eq(playerRegistrations.playerId, fantasyPlayer.playerId),
      inArray(playerRegistrations.competitionEntryId, [
        fixture.homeEntryId,
        fixture.awayEntryId,
      ]),
    ),
  });
  if (!validRegistration) {
    throw new Error("The selected player is not registered for this fixture.");
  }
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
      status: existing ? "corrected" : "reviewed",
      sourceName: "PP Fantasy admin review",
      sourcePayload: { entryMethod: "admin", reference: reason },
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
        sourceName: "PP Fantasy admin review",
        sourcePayload: { entryMethod: "admin", reference: reason },
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
  const gameweek = await db.query.fantasyGameweeks.findFirst({
    where: and(
      eq(fantasyGameweeks.fantasySeasonId, fantasySeason.id),
      eq(fantasyGameweeks.number, fixture.matchweek),
    ),
  });
  if (gameweek) await recalculateGameweek(gameweek.id, db);
}

export async function updateFantasyPlayerClassification(
  formData: FormData,
  changedBy: string,
  db: FantasyTransaction,
) {
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
  const target = await db.query.fantasyPlayers.findFirst({
    where: eq(fantasyPlayers.id, fantasyPlayerId),
  });
  if (!target) throw new Error("Fantasy player was not found.");
  await lockFantasySeason(db, target.fantasySeasonId);
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
}

export async function lockFantasyGameweek(
  formData: FormData,
  changedBy: string,
  db: FantasyTransaction,
) {
  const gameweekId = String(formData.get("gameweekId") ?? "");
  const target = await db.query.fantasyGameweeks.findFirst({
    where: eq(fantasyGameweeks.id, gameweekId),
  });
  if (!target) throw new Error("Gameweek was not found.");
  await lockFantasySeason(db, target.fantasySeasonId);
  const gameweekRows = await db
    .select()
    .from(fantasyGameweeks)
    .where(eq(fantasyGameweeks.id, gameweekId))
    .for("update")
    .limit(1);
  const gameweek = gameweekRows[0];
  if (!gameweek) throw new Error("Gameweek was not found.");
  if (gameweek.status !== "open") {
    throw new Error("Only an open Gameweek can be locked.");
  }
  const lastGameweekRows = await db
    .select({ number: fantasyGameweeks.number })
    .from(fantasyGameweeks)
    .where(eq(fantasyGameweeks.fantasySeasonId, gameweek.fantasySeasonId))
    .orderBy(desc(fantasyGameweeks.number))
    .limit(1);
  const nextGameweekRows = await db
    .select()
    .from(fantasyGameweeks)
    .where(
      and(
        eq(fantasyGameweeks.fantasySeasonId, gameweek.fantasySeasonId),
        eq(fantasyGameweeks.number, gameweek.number + 1),
      ),
    )
    .for("update")
    .limit(1);
  const nextGameweek = nextGameweekRows[0];
  if (!nextGameweek && gameweek.number !== lastGameweekRows[0]?.number) {
    throw new Error("The next Gameweek is missing.");
  }
  if (nextGameweek && nextGameweek.status !== "planned") {
    throw new Error("The next Gameweek is not planned.");
  }

  const selections = await db
    .select()
    .from(fantasyTeamSelections)
    .where(
      and(
        eq(fantasyTeamSelections.fantasyGameweekId, gameweek.id),
        eq(fantasyTeamSelections.status, "draft"),
      ),
    )
    .for("update");
  const teams = selections.length
    ? await db
        .select()
        .from(fantasyTeams)
        .where(
          inArray(
            fantasyTeams.id,
            selections.map((selection) => selection.fantasyTeamId),
          ),
        )
        .orderBy(fantasyTeams.id)
        .for("update")
    : [];
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const settled = selections.map((selection) => {
    const team = teamsById.get(selection.fantasyTeamId);
    if (!team) throw new Error("Fantasy team was not found.");
    const activeChip =
      gameweek.number < THAI_LEAGUE_FANTASY_RULES.wildcardStartGameweek &&
      selection.activeChip === "wildcard"
        ? null
        : selection.activeChip;
    const transferInput = {
      freeTransfersBefore: selection.freeTransfersBefore,
      transferCount: selection.netTransferCount,
      wildcard: activeChip === "wildcard",
      openingGameweek: gameweek.number === 1,
    };
    if (validateTransferLimit(transferInput).length)
      throw new Error("A team exceeds the chargeable transfer limit.");
    return {
      selection,
      team,
      activeChip,
      settlement: settleTransfers(transferInput),
    };
  });
  for (let offset = 0; offset < settled.length; offset += 500) {
    const batch = settled.slice(offset, offset + 500);
    await db
      .insert(fantasyTeamSelections)
      .values(
        batch.map(({ selection, activeChip, settlement }) => ({
          ...selection,
          activeChip,
          status: "locked" as const,
          lockedAt: new Date(),
          freeTransfersAfter: settlement.freeTransfersAfter,
          transferPoints: settlement.transferPoints,
          updatedAt: new Date(),
        })),
      )
      .onConflictDoUpdate({
        target: fantasyTeamSelections.id,
        set: {
          status: "locked",
          lockedAt: sql`excluded.locked_at`,
          freeTransfersAfter: sql`excluded.free_transfers_after`,
          transferPoints: sql`excluded.transfer_points`,
          activeChip: sql`excluded.active_chip`,
          updatedAt: new Date(),
        },
      });
    await db
      .insert(fantasyTeams)
      .values(
        batch.map(({ team, settlement }) => ({
          ...team,
          freeTransfers: settlement.freeTransfersAfter,
          updatedAt: new Date(),
        })),
      )
      .onConflictDoUpdate({
        target: fantasyTeams.id,
        set: {
          freeTransfers: sql`excluded.free_transfers`,
          updatedAt: new Date(),
        },
      });
  }
  if (nextGameweek && settled.length) {
    const nextSelections: Array<typeof fantasyTeamSelections.$inferSelect> = [];
    for (let offset = 0; offset < settled.length; offset += 500) {
      const rows = await db
        .insert(fantasyTeamSelections)
        .values(
          settled.slice(offset, offset + 500).map(({ team, settlement }) => ({
            fantasySeasonId: team.fantasySeasonId,
            fantasyTeamId: team.id,
            fantasyGameweekId: nextGameweek.id,
            status: "draft" as const,
            freeTransfersBefore: settlement.freeTransfersAfter,
          })),
        )
        .onConflictDoUpdate({
          target: [
            fantasyTeamSelections.fantasyTeamId,
            fantasyTeamSelections.fantasyGameweekId,
          ],
          set: {
            freeTransfersBefore: sql`excluded.free_transfers_before`,
            updatedAt: new Date(),
          },
        })
        .returning();
      nextSelections.push(...rows);
    }
    const allMembers = await db
      .select()
      .from(fantasyTeamSelectionPlayers)
      .where(
        inArray(
          fantasyTeamSelectionPlayers.selectionId,
          [...selections, ...nextSelections].map((selection) => selection.id),
        ),
      );
    const membersBySelection = Map.groupBy(
      allMembers,
      (member) => member.selectionId,
    );
    const previousByTeam = new Map(
      selections.map((selection) => [selection.fantasyTeamId, selection.id]),
    );
    const copied: Array<typeof fantasyTeamSelectionPlayers.$inferInsert> = [];
    const revisions: Array<typeof fantasyTransferRevisions.$inferInsert> = [];
    for (const next of nextSelections) {
      if (membersBySelection.has(next.id)) continue;
      const members = createGameweekCarryover({
        selectionId: next.id,
        members:
          membersBySelection.get(previousByTeam.get(next.fantasyTeamId)!) ?? [],
      });
      if (!members.length) continue;
      copied.push(
        ...members.map((member) => ({
          ...member,
          fantasySeasonId: gameweek.fantasySeasonId,
        })),
      );
      revisions.push({
        selectionId: next.id,
        revision: 1,
        status: "confirmed",
        squad: members.map((member) => member.fantasyPlayerId),
        lineup: { members },
        netTransferCount: 0,
        transferPoints: 0,
      });
    }
    for (let offset = 0; offset < copied.length; offset += 500)
      await db
        .insert(fantasyTeamSelectionPlayers)
        .values(copied.slice(offset, offset + 500));
    for (let offset = 0; offset < revisions.length; offset += 500)
      await db
        .insert(fantasyTransferRevisions)
        .values(revisions.slice(offset, offset + 500));
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
  await recalculateGameweek(gameweek.id, db);
  await db.insert(fantasyAdminAuditLog).values({
    action: "lock_gameweek",
    entityType: "fantasy_gameweek",
    entityId: gameweek.id,
    changedBy,
    reason: "Admin confirmed Gameweek lock",
    before: { number: gameweek.number, status: gameweek.status },
    after: {
      number: gameweek.number,
      status: "provisional",
      nextGameweek: nextGameweek?.number ?? null,
    },
  });
}

export async function finalizeFantasyGameweek(
  formData: FormData,
  changedBy: string,
  db: FantasyTransaction,
) {
  const gameweekId = String(formData.get("gameweekId") ?? "");
  const target = await db.query.fantasyGameweeks.findFirst({
    where: eq(fantasyGameweeks.id, gameweekId),
  });
  if (!target) throw new Error("Gameweek was not found.");
  await lockFantasySeason(db, target.fantasySeasonId);
  const gameweekRows = await db
    .select()
    .from(fantasyGameweeks)
    .where(eq(fantasyGameweeks.id, gameweekId))
    .for("update")
    .limit(1);
  const gameweek = gameweekRows[0];
  if (!gameweek) throw new Error("Gameweek was not found.");
  if (gameweek.status !== "provisional") {
    throw new Error("Only a provisional Gameweek can be finalized.");
  }
  await db
    .update(fantasyGameweeks)
    .set({
      status: "final",
      scoreComplete: true,
      finalizedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(fantasyGameweeks.id, gameweek.id));
  await recalculateGameweek(gameweek.id, db);
  await db.insert(fantasyAdminAuditLog).values({
    action: "finalize_gameweek",
    entityType: "fantasy_gameweek",
    entityId: gameweek.id,
    changedBy,
    reason: "Admin confirmed final scores",
    before: { number: gameweek.number, status: gameweek.status },
    after: { number: gameweek.number, status: "final" },
  });
}
