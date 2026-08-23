import type { CaptainRole, FantasyPosition } from "./rules";

export type DraftLineupMember = {
  slotId: string;
  fantasyPlayerId: string | null;
  vacancyPosition: FantasyPosition | null;
  lineupRole: "starter" | "bench";
  benchOrder: number | null;
  captainRole: CaptainRole;
};

export type CompleteSelectionMember = Omit<
  DraftLineupMember,
  "slotId" | "vacancyPosition" | "fantasyPlayerId"
> & {
  fantasyPlayerId: string;
};

export function removePlayerFromDraft(
  members: DraftLineupMember[],
  fantasyPlayerId: string,
  position: FantasyPosition,
) {
  return members.map((member) =>
    member.fantasyPlayerId === fantasyPlayerId
      ? {
          ...member,
          fantasyPlayerId: null,
          vacancyPosition: position,
          captainRole: "none" as const,
        }
      : member,
  );
}

export function fillDraftVacancy(
  members: DraftLineupMember[],
  slotId: string,
  fantasyPlayerId: string,
) {
  return members.map((member) =>
    member.slotId === slotId && member.fantasyPlayerId === null
      ? {
          ...member,
          fantasyPlayerId,
          vacancyPosition: null,
        }
      : member,
  );
}

export function fillFirstMatchingDraftVacancy(
  members: DraftLineupMember[],
  position: FantasyPosition,
  fantasyPlayerId: string,
) {
  const vacancy = members.find(
    (member) =>
      member.fantasyPlayerId === null && member.vacancyPosition === position,
  );
  return vacancy
    ? fillDraftVacancy(members, vacancy.slotId, fantasyPlayerId)
    : null;
}

export function getCompleteSelectionMembers(
  members: DraftLineupMember[],
): CompleteSelectionMember[] | null {
  if (members.some((member) => member.fantasyPlayerId === null)) return null;
  return members.map((member) => ({
    fantasyPlayerId: member.fantasyPlayerId!,
    lineupRole: member.lineupRole,
    benchOrder: member.benchOrder,
    captainRole: member.captainRole,
  }));
}
