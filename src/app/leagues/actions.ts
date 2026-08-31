"use server";

import { revalidatePath } from "next/cache";

import { getPrivateLeagueInvitePreview } from "@/data/leagues";
import { requireFantasyProfile } from "@/lib/auth/context";
import {
  validateLeagueInviteCode,
  validatePrivateLeagueName,
} from "@/lib/fantasy/leagues";
import {
  createPrivateLeague,
  deletePrivateLeague,
  joinPrivateLeague,
  LeagueServiceError,
  leavePrivateLeague,
  regeneratePrivateLeagueInvite,
  removePrivateLeagueMember,
  renamePrivateLeague,
  type LeagueServiceErrorCode,
} from "@/lib/fantasy/league-service";

export type LeagueActionResult =
  | {
      ok: true;
      message: string;
      leagueId?: string;
      inviteCode?: string;
    }
  | { ok: false; message: string; code?: string };

export type LeagueInvitePreviewResult =
  | {
      ok: true;
      league: {
        id: string;
        name: string;
        memberCount: number;
        alreadyMember: boolean;
        full: boolean;
      };
      inviteCode: string;
    }
  | { ok: false; message: string };

const serviceMessages: Record<LeagueServiceErrorCode, string> = {
  league_not_found: "ไม่พบลีกจากข้อมูลนี้ หรือรหัสเชิญหมดอายุแล้ว",
  not_owner: "เฉพาะเจ้าของลีกเท่านั้นที่ทำรายการนี้ได้",
  not_member: "ทีมนี้ไม่ได้เป็นสมาชิกของลีก",
  owner_cannot_leave: "เจ้าของลีกออกจากลีกไม่ได้ หากไม่ใช้ลีกแล้วให้ลบลีกแทน",
  already_member: "ทีมของคุณอยู่ในลีกนี้แล้ว",
  owner_limit: "คุณสร้าง Private League ครบ 10 ลีกแล้ว",
  membership_limit: "คุณเป็นสมาชิก Private League ครบ 20 ลีกแล้ว",
  member_limit: "ลีกนี้มีสมาชิกครบ 100 ทีมแล้ว",
  cannot_remove_owner: "ไม่สามารถนำเจ้าของลีกออกได้",
  invite_collision: "สร้างรหัสเชิญไม่สำเร็จ กรุณาลองอีกครั้ง",
};

function actionFailure(error: unknown): LeagueActionResult {
  if (error instanceof LeagueServiceError) {
    return {
      ok: false,
      code: error.code,
      message: serviceMessages[error.code],
    };
  }
  return {
    ok: false,
    message: "ทำรายการลีกไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง",
  };
}

function revalidateLeaguePaths(leagueId?: string) {
  revalidatePath("/leagues");
  if (leagueId) revalidatePath(`/leagues/${leagueId}`);
}

async function requireMemberProfile(): Promise<
  | { ok: true; profile: Awaited<ReturnType<typeof requireFantasyProfile>> }
  | { ok: false; result: LeagueActionResult }
> {
  try {
    const profile = await requireFantasyProfile();
    if (!profile.isAnonymous) return { ok: true, profile };
    return {
      ok: false,
      result: {
        ok: false,
        code: "member_required",
        message: "บัญชี Guest ต้องสมัครสมาชิกก่อนใช้ Private League",
      },
    };
  } catch (error) {
    return { ok: false, result: actionFailure(error) };
  }
}

export async function createPrivateLeagueAction(input: {
  name: string;
}): Promise<LeagueActionResult> {
  const member = await requireMemberProfile();
  if (!member.ok) return member.result;
  const name = validatePrivateLeagueName(String(input?.name ?? ""));
  if (!name.ok) return { ok: false, message: name.message };
  try {
    const league = await createPrivateLeague({
      seasonId: member.profile.season.id,
      teamId: member.profile.team.id,
      name: name.value,
    });
    revalidateLeaguePaths(league.id);
    return {
      ok: true,
      message: "สร้าง Private League เรียบร้อยแล้ว",
      leagueId: league.id,
      inviteCode: league.inviteCode ?? undefined,
    };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function previewPrivateLeagueInviteAction(input: {
  inviteCode: string;
}): Promise<LeagueInvitePreviewResult> {
  const member = await requireMemberProfile();
  if (!member.ok) return { ok: false, message: member.result.message };
  const code = validateLeagueInviteCode(String(input?.inviteCode ?? ""));
  if (!code.ok) return { ok: false, message: code.message };
  try {
    const league = await getPrivateLeagueInvitePreview(
      code.value,
      member.profile.team.id,
      member.profile.season.id,
    );
    if (!league) {
      return { ok: false, message: "ไม่พบลีกจากรหัสนี้ หรือรหัสหมดอายุแล้ว" };
    }
    return { ok: true, league, inviteCode: code.value };
  } catch {
    return {
      ok: false,
      message: "ทำรายการลีกไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง",
    };
  }
}

export async function joinPrivateLeagueAction(input: {
  inviteCode: string;
}): Promise<LeagueActionResult> {
  const member = await requireMemberProfile();
  if (!member.ok) return member.result;
  const inviteCode = validateLeagueInviteCode(String(input?.inviteCode ?? ""));
  if (!inviteCode.ok) return { ok: false, message: inviteCode.message };
  try {
    const league = await joinPrivateLeague({
      seasonId: member.profile.season.id,
      teamId: member.profile.team.id,
      inviteCode: inviteCode.value,
    });
    revalidateLeaguePaths(league.id);
    return {
      ok: true,
      message: "เข้าร่วม Private League เรียบร้อยแล้ว",
      leagueId: league.id,
    };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function leavePrivateLeagueAction(input: {
  leagueId: string;
}): Promise<LeagueActionResult> {
  const member = await requireMemberProfile();
  if (!member.ok) return member.result;
  try {
    const league = await leavePrivateLeague({
      seasonId: member.profile.season.id,
      teamId: member.profile.team.id,
      leagueId: String(input?.leagueId ?? ""),
    });
    revalidateLeaguePaths(league.id);
    return { ok: true, message: "ออกจาก Private League แล้ว" };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function renamePrivateLeagueAction(input: {
  leagueId: string;
  name: string;
}): Promise<LeagueActionResult> {
  const member = await requireMemberProfile();
  if (!member.ok) return member.result;
  const name = validatePrivateLeagueName(String(input?.name ?? ""));
  if (!name.ok) return { ok: false, message: name.message };
  try {
    const league = await renamePrivateLeague({
      seasonId: member.profile.season.id,
      teamId: member.profile.team.id,
      leagueId: String(input?.leagueId ?? ""),
      name: name.value,
    });
    revalidateLeaguePaths(league.id);
    return { ok: true, message: "เปลี่ยนชื่อลีกเรียบร้อยแล้ว" };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function regeneratePrivateLeagueInviteAction(input: {
  leagueId: string;
}): Promise<LeagueActionResult> {
  const member = await requireMemberProfile();
  if (!member.ok) return member.result;
  try {
    const league = await regeneratePrivateLeagueInvite({
      seasonId: member.profile.season.id,
      teamId: member.profile.team.id,
      leagueId: String(input?.leagueId ?? ""),
    });
    revalidateLeaguePaths(league.id);
    return {
      ok: true,
      message: "สร้างรหัสเชิญใหม่แล้ว รหัสเดิมใช้ไม่ได้อีกต่อไป",
      leagueId: league.id,
      inviteCode: league.inviteCode ?? undefined,
    };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function removePrivateLeagueMemberAction(input: {
  leagueId: string;
  targetTeamId: string;
}): Promise<LeagueActionResult> {
  const member = await requireMemberProfile();
  if (!member.ok) return member.result;
  try {
    const league = await removePrivateLeagueMember({
      seasonId: member.profile.season.id,
      teamId: member.profile.team.id,
      leagueId: String(input?.leagueId ?? ""),
      targetTeamId: String(input?.targetTeamId ?? ""),
    });
    revalidateLeaguePaths(league.id);
    return { ok: true, message: "นำสมาชิกออกจากลีกแล้ว" };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function deletePrivateLeagueAction(input: {
  leagueId: string;
}): Promise<LeagueActionResult> {
  const member = await requireMemberProfile();
  if (!member.ok) return member.result;
  try {
    await deletePrivateLeague({
      seasonId: member.profile.season.id,
      teamId: member.profile.team.id,
      leagueId: String(input?.leagueId ?? ""),
    });
    revalidateLeaguePaths();
    return { ok: true, message: "ลบ Private League แล้ว" };
  } catch (error) {
    return actionFailure(error);
  }
}
