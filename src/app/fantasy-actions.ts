"use server";

import { and, eq } from "drizzle-orm";
import { refresh, revalidatePath, revalidateTag } from "next/cache";

import { db } from "@/db";
import { transactionDb } from "@/db/transaction";
import { fantasyManagers, fantasyTeams } from "@/db/schema";
import {
  isBeforeDeadline,
  THAI_LEAGUE_FANTASY_RULES,
  type FantasyPosition,
} from "@/lib/fantasy/rules";
import { requireAdmin, requireFantasyProfile } from "@/lib/auth/context";
import { validateFantasyName } from "@/lib/auth/names";
import { parseInterfaceLanguage } from "@/lib/auth/preferences";
import { getFantasyAutoFillCandidates } from "@/data/fantasy-auto-fill";
import { autoFillSquadDraft } from "@/lib/fantasy/auto-fill";
import {
  savePlayerMatchStats,
  updateFantasyPlayerClassification,
  lockFantasyGameweek,
  finalizeFantasyGameweek,
} from "@/lib/fantasy/admin-service";
import { saveFantasySelection } from "@/lib/fantasy/selection-service";
import type { FantasySelectionInput } from "@/lib/fantasy/selection-input";
import type { DraftLineupMember } from "@/lib/fantasy/team-draft";

export type FantasyActionResult =
  | { ok: true; message: string }
  | {
      ok: false;
      message: string;
      violations?: string[];
    };

export type FantasyTeamNameActionResult =
  | {
      ok: true;
      message: string;
      teamName: string;
      teamNameChangesRemaining: number;
    }
  | {
      ok: false;
      message: string;
    };

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
  if (gameweek.status !== "open" || !isBeforeDeadline(gameweek.deadlineAt)) {
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

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if ("code" in error && error.code === "23505") return true;
  return "cause" in error && isUniqueViolation(error.cause);
}

export async function updateFantasyTeamNameAction(input: {
  teamName: string;
}): Promise<FantasyTeamNameActionResult> {
  const profile = await requireFantasyProfile();
  if (profile.isAnonymous) {
    return {
      ok: false,
      message: "ผู้เล่น Guest ไม่สามารถเปลี่ยนชื่อทีมได้ กรุณาสมัครสมาชิกก่อน",
    };
  }
  const teamName = validateFantasyName(String(input?.teamName ?? ""));
  if (!teamName.ok) {
    return {
      ok: false,
      message: teamName.message ?? "ชื่อไม่ถูกต้อง",
    };
  }
  let result: FantasyTeamNameActionResult;
  try {
    result = await transactionDb.transaction(async (tx) => {
      const teamRows = await tx
        .select()
        .from(fantasyTeams)
        .where(
          and(
            eq(fantasyTeams.id, profile.team.id),
            eq(fantasyTeams.managerId, profile.manager.id),
          ),
        )
        .for("update")
        .limit(1);
      const currentTeam = teamRows[0];
      if (!currentTeam) {
        return {
          ok: false,
          message: "ไม่พบทีมที่ต้องการแก้ไข",
        } as const;
      }

      if (teamName.value === currentTeam.name) {
        return {
          ok: true,
          message: "ไม่มีข้อมูลที่เปลี่ยนแปลง",
          teamName: currentTeam.name,
          teamNameChangesRemaining: Math.max(
            0,
            3 - currentTeam.nameChangesUsed,
          ),
        } as const;
      }
      if (currentTeam.nameChangesUsed >= 3) {
        return {
          ok: false,
          message: "ใช้สิทธิ์เปลี่ยนชื่อทีมครบ 3 ครั้งแล้ว",
        } as const;
      }

      const now = new Date();
      await tx
        .update(fantasyTeams)
        .set({
          name: teamName.value,
          nameChangesUsed: currentTeam.nameChangesUsed + 1,
          updatedAt: now,
        })
        .where(eq(fantasyTeams.id, currentTeam.id));
      return {
        ok: true,
        message: "บันทึกชื่อทีมเรียบร้อยแล้ว",
        teamName: teamName.value,
        teamNameChangesRemaining: Math.max(
          0,
          3 - (currentTeam.nameChangesUsed + 1),
        ),
      } as const;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: "ชื่อทีมนี้ถูกใช้แล้วในฤดูกาลนี้",
      };
    }
    throw error;
  }

  if (!result.ok) return result;
  refreshFantasyMutation("name");
  return result;
}

export async function updateInterfaceLanguageAction(input: {
  language: unknown;
}): Promise<FantasyActionResult> {
  const profile = await requireFantasyProfile();
  if (profile.isAnonymous) {
    return {
      ok: false,
      message: "Guest บันทึกภาษาไว้ในอุปกรณ์เครื่องนี้เท่านั้น",
    };
  }
  const language = parseInterfaceLanguage(input.language);
  if (!language) {
    return { ok: false, message: "ภาษาที่เลือกไม่ถูกต้อง" };
  }

  await db
    .update(fantasyManagers)
    .set({ preferredLanguage: language, updatedAt: new Date() })
    .where(eq(fantasyManagers.id, profile.manager.id));
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true, message: "บันทึกภาษาสำหรับบัญชีนี้แล้ว" };
}

function refreshFantasyMutation(
  kind: "squad" | "name" | "stats" | "classification" | "lifecycle",
) {
  if (kind === "squad" || kind === "lifecycle")
    revalidateTag("fantasy-ownership", "max");
  if (kind === "stats" || kind === "classification" || kind === "lifecycle")
    revalidateTag("competition-dataset", "max");
  if (kind === "lifecycle") revalidateTag("fixtures-dataset", "max");
  // Refresh dynamic account data without expiring shared roster/fixture caches.
  refresh();
}

export async function saveFantasySelectionAction(input: FantasySelectionInput) {
  const { season, team, manager } = await requireFantasyProfile();
  const result = await saveFantasySelection(
    { seasonId: season.id, teamId: team.id, managerId: manager.id },
    input,
  );
  if (result.ok) refreshFantasyMutation("squad");
  return result;
}

export async function savePlayerMatchStatsAction(formData: FormData) {
  const admin = await requireAdmin();
  await transactionDb.transaction((tx) =>
    savePlayerMatchStats(
      formData,
      `${admin.user.email} (${admin.user.id})`,
      tx,
    ),
  );
  refreshFantasyMutation("stats");
}

export async function updateFantasyPlayerClassificationAction(
  formData: FormData,
) {
  const admin = await requireAdmin();
  await transactionDb.transaction((tx) =>
    updateFantasyPlayerClassification(
      formData,
      `${admin.user.email} (${admin.user.id})`,
      tx,
    ),
  );
  refreshFantasyMutation("classification");
}

export async function lockFantasyGameweekAction(formData: FormData) {
  const admin = await requireAdmin();
  await transactionDb.transaction((tx) =>
    lockFantasyGameweek(formData, `${admin.user.email} (${admin.user.id})`, tx),
  );
  refreshFantasyMutation("lifecycle");
}

export async function finalizeFantasyGameweekAction(formData: FormData) {
  const admin = await requireAdmin();
  await transactionDb.transaction((tx) =>
    finalizeFantasyGameweek(
      formData,
      `${admin.user.email} (${admin.user.id})`,
      tx,
    ),
  );
  refreshFantasyMutation("lifecycle");
}
