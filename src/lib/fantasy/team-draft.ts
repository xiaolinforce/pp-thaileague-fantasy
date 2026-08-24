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

const starterShape: Array<[FantasyPosition, number]> = [
  ["goalkeeper", 1],
  ["defender", 4],
  ["midfielder", 4],
  ["forward", 2],
];

const benchShape: Array<[FantasyPosition, number]> = [
  ["goalkeeper", 0],
  ["defender", 1],
  ["midfielder", 2],
  ["forward", 3],
];

export function createEmptySquadDraft(): DraftLineupMember[] {
  const starters = starterShape.flatMap(([position, count]) =>
    Array.from({ length: count }, (_, index) => ({
      slotId: `initial-starter-${position}-${index + 1}`,
      fantasyPlayerId: null,
      vacancyPosition: position,
      lineupRole: "starter" as const,
      benchOrder: null,
      captainRole: "none" as const,
    })),
  );
  const bench = benchShape.map(([position, benchOrder]) => ({
    slotId: `initial-bench-${position}`,
    fantasyPlayerId: null,
    vacancyPosition: position,
    lineupRole: "bench" as const,
    benchOrder,
    captainRole: "none" as const,
  }));
  return [...starters, ...bench];
}

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
