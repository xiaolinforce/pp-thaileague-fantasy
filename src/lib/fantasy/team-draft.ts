import {
  validateLineupAssignment,
  type CaptainRole,
  type FantasyPosition,
  type LineupAssignmentPlayer,
} from "./rules.ts";

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

export function swapDraftLineupMembers(
  members: DraftLineupMember[],
  sourceSlotId: string,
  targetSlotId: string,
) {
  if (sourceSlotId === targetSlotId) return null;
  const source = members.find((member) => member.slotId === sourceSlotId);
  const target = members.find((member) => member.slotId === targetSlotId);
  if (!source || !target) return null;

  const hasAssignmentChange =
    source.lineupRole !== target.lineupRole ||
    source.benchOrder !== target.benchOrder;
  if (!hasAssignmentChange) return null;

  const swapsStarterAndBench = source.lineupRole !== target.lineupRole;
  const outgoingStarter = swapsStarterAndBench
    ? source.lineupRole === "starter"
      ? source
      : target
    : null;
  const incomingStarterSlotId = swapsStarterAndBench
    ? source.lineupRole === "bench"
      ? source.slotId
      : target.slotId
    : null;

  return members.map((member) => {
    if (member.slotId === source.slotId) {
      return {
        ...member,
        lineupRole: target.lineupRole,
        benchOrder: target.benchOrder,
        captainRole: swapsStarterAndBench
          ? member.slotId === incomingStarterSlotId
            ? (outgoingStarter?.captainRole ?? "none")
            : "none"
          : member.captainRole,
      };
    }
    if (member.slotId === target.slotId) {
      return {
        ...member,
        lineupRole: source.lineupRole,
        benchOrder: source.benchOrder,
        captainRole: swapsStarterAndBench
          ? member.slotId === incomingStarterSlotId
            ? (outgoingStarter?.captainRole ?? "none")
            : "none"
          : member.captainRole,
      };
    }
    return member;
  });
}

function getDraftLineupAssignments(
  members: DraftLineupMember[],
  playerPositionsById: ReadonlyMap<string, FantasyPosition>,
) {
  const assignments: LineupAssignmentPlayer[] = [];
  for (const member of members) {
    const position = member.fantasyPlayerId
      ? playerPositionsById.get(member.fantasyPlayerId)
      : member.vacancyPosition;
    if (!position) return null;
    assignments.push({
      id: member.fantasyPlayerId ?? `vacancy:${member.slotId}`,
      position,
      lineupRole: member.lineupRole,
      benchOrder: member.benchOrder,
      captainRole: member.captainRole,
    });
  }
  return assignments;
}

export function getValidDraftSwapTargetSlotIds(
  members: DraftLineupMember[],
  sourceSlotId: string,
  playerPositionsById: ReadonlyMap<string, FantasyPosition>,
) {
  const targetSlotIds = new Set<string>();
  for (const member of members) {
    const swapped = swapDraftLineupMembers(
      members,
      sourceSlotId,
      member.slotId,
    );
    if (!swapped) continue;
    const assignments = getDraftLineupAssignments(swapped, playerPositionsById);
    if (!assignments) continue;
    const structuralViolations = validateLineupAssignment(assignments).filter(
      (violation) =>
        violation.code !== "captain" && violation.code !== "vice_captain",
    );
    if (structuralViolations.length === 0) {
      targetSlotIds.add(member.slotId);
    }
  }
  return targetSlotIds;
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
