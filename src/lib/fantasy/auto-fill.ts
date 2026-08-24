import type { DraftLineupMember } from "./team-draft.ts";
import {
  THAI_LEAGUE_FANTASY_RULES,
  validateLineup,
  type FantasyPosition,
  type LineupPlayer,
} from "./rules.ts";

export type AutoFillCandidate = {
  id: string;
  clubId: string;
  position: FantasyPosition;
  tier: number;
  isThai: boolean;
  projectedPoints: number;
  overallRank: number;
};

export type AutoFillResult = {
  members: DraftLineupMember[];
  addedPlayerIds: string[];
};

type SearchState = {
  picked: AutoFillCandidate[];
  pickedIds: Set<string>;
  clubCounts: Map<string, number>;
  foreignCount: number;
  tierOneCount: number;
  topTwoTierCount: number;
  lastIndexByPosition: Map<FantasyPosition, number>;
  score: number;
};

const BEAM_WIDTH = 768;
const TIER_ONE_PRIORITY = 1_000_000_000;
const TIER_TWO_PRIORITY = 1_000_000;
const positions: FantasyPosition[] = [
  "goalkeeper",
  "defender",
  "midfielder",
  "forward",
];

function incrementCount<T>(counts: Map<T, number>, key: T) {
  const next = new Map(counts);
  next.set(key, (next.get(key) ?? 0) + 1);
  return next;
}

function countBy<T>(values: T[]) {
  const counts = new Map<T, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function candidatePriority(candidate: AutoFillCandidate, random: () => number) {
  const tierPriority =
    candidate.tier === 1
      ? TIER_ONE_PRIORITY
      : candidate.tier === 2
        ? TIER_TWO_PRIORITY
        : 0;
  const boundedRandom = Math.min(1, Math.max(0, random()));
  const qualityVariation = 0.88 + boundedRandom * 0.24;
  const rankTieBreaker = 1 / Math.max(1, candidate.overallRank);
  return (
    tierPriority +
    Math.max(0, candidate.projectedPoints) * qualityVariation +
    rankTieBreaker
  );
}

function canAddCandidate(state: SearchState, candidate: AutoFillCandidate) {
  const rules = THAI_LEAGUE_FANTASY_RULES;
  const tierOneLimit = rules.tierSlots
    .filter((slot) => slot.level <= 1)
    .reduce((sum, slot) => sum + slot.slots, 0);
  const topTwoTierLimit = rules.tierSlots
    .filter((slot) => slot.level <= 2)
    .reduce((sum, slot) => sum + slot.slots, 0);
  if (state.pickedIds.has(candidate.id)) return false;
  if ((state.clubCounts.get(candidate.clubId) ?? 0) >= rules.sameClubLimit) {
    return false;
  }
  if (!candidate.isThai && state.foreignCount >= rules.foreignPlayerLimit) {
    return false;
  }
  if (candidate.tier === 1 && state.tierOneCount >= tierOneLimit) return false;
  if (candidate.tier <= 2 && state.topTwoTierCount >= topTwoTierLimit) {
    return false;
  }
  return candidate.tier >= 1 && candidate.tier <= 3;
}

function assignCaptaincy(
  members: DraftLineupMember[],
  candidatesById: Map<string, AutoFillCandidate>,
) {
  const starterMembers = members.filter(
    (member) => member.lineupRole === "starter" && member.fantasyPlayerId,
  );
  const starterIds = new Set(
    starterMembers.map((member) => member.fantasyPlayerId!),
  );
  let captainId = members.find(
    (member) =>
      member.captainRole === "captain" &&
      member.fantasyPlayerId &&
      starterIds.has(member.fantasyPlayerId),
  )?.fantasyPlayerId;
  let viceCaptainId = members.find(
    (member) =>
      member.captainRole === "vice_captain" &&
      member.fantasyPlayerId &&
      starterIds.has(member.fantasyPlayerId),
  )?.fantasyPlayerId;
  const rankedStarters = starterMembers
    .map((member) => candidatesById.get(member.fantasyPlayerId!))
    .filter((candidate): candidate is AutoFillCandidate => Boolean(candidate))
    .sort(
      (left, right) =>
        right.projectedPoints - left.projectedPoints ||
        left.overallRank - right.overallRank ||
        left.id.localeCompare(right.id),
    );

  if (!captainId) {
    captainId = rankedStarters.find(
      (candidate) => candidate.id !== viceCaptainId,
    )?.id;
  }
  if (!viceCaptainId) {
    viceCaptainId = rankedStarters.find(
      (candidate) => candidate.id !== captainId,
    )?.id;
  }

  return members.map((member) => ({
    ...member,
    captainRole:
      member.fantasyPlayerId === captainId
        ? ("captain" as const)
        : member.fantasyPlayerId === viceCaptainId
          ? ("vice_captain" as const)
          : ("none" as const),
  }));
}

export function autoFillSquadDraft({
  members,
  candidates,
  random = Math.random,
}: {
  members: DraftLineupMember[];
  candidates: AutoFillCandidate[];
  random?: () => number;
}): AutoFillResult | null {
  const rules = THAI_LEAGUE_FANTASY_RULES;
  if (members.length !== rules.squadSize) return null;

  const candidatesById = new Map(
    candidates.map((candidate) => [candidate.id, candidate]),
  );
  const occupiedCandidates = members.flatMap((member) => {
    if (!member.fantasyPlayerId) return [];
    const candidate = candidatesById.get(member.fantasyPlayerId);
    return candidate ? [candidate] : [];
  });
  const occupiedIds = members.flatMap((member) =>
    member.fantasyPlayerId ? [member.fantasyPlayerId] : [],
  );
  if (
    occupiedCandidates.length !== occupiedIds.length ||
    new Set(occupiedIds).size !== occupiedIds.length
  ) {
    return null;
  }

  const vacancies = members.filter(
    (member) =>
      member.fantasyPlayerId === null && member.vacancyPosition !== null,
  );
  if (vacancies.length === 0) {
    const withCaptaincy = assignCaptaincy(members, candidatesById);
    return { members: withCaptaincy, addedPlayerIds: [] };
  }

  const finalPositionCounts = countBy([
    ...occupiedCandidates.map((candidate) => candidate.position),
    ...vacancies.map((member) => member.vacancyPosition!),
  ]);
  if (
    positions.some(
      (position) =>
        (finalPositionCounts.get(position) ?? 0) !==
        rules.positionLimits[position],
    )
  ) {
    return null;
  }

  const clubCounts = countBy(
    occupiedCandidates.map((candidate) => candidate.clubId),
  );
  const foreignCount = occupiedCandidates.filter(
    (candidate) => !candidate.isThai,
  ).length;
  const tierOneCount = occupiedCandidates.filter(
    (candidate) => candidate.tier === 1,
  ).length;
  const topTwoTierCount = occupiedCandidates.filter(
    (candidate) => candidate.tier <= 2,
  ).length;
  const tierOneLimit = rules.tierSlots
    .filter((slot) => slot.level <= 1)
    .reduce((sum, slot) => sum + slot.slots, 0);
  const topTwoTierLimit = rules.tierSlots
    .filter((slot) => slot.level <= 2)
    .reduce((sum, slot) => sum + slot.slots, 0);
  if (
    [...clubCounts.values()].some((count) => count > rules.sameClubLimit) ||
    foreignCount > rules.foreignPlayerLimit ||
    tierOneCount > tierOneLimit ||
    topTwoTierCount > topTwoTierLimit ||
    occupiedCandidates.some(
      (candidate) => candidate.tier < 1 || candidate.tier > 3,
    )
  ) {
    return null;
  }

  const availableByPosition = new Map(
    positions.map((position) => [
      position,
      candidates
        .filter(
          (candidate) =>
            candidate.position === position &&
            !occupiedIds.includes(candidate.id),
        )
        .sort((left, right) => left.id.localeCompare(right.id)),
    ]),
  );
  const vacancyCounts = countBy(
    vacancies.map((member) => member.vacancyPosition!),
  );
  const positionOrder = [...positions].sort((left, right) => {
    const leftNeed = vacancyCounts.get(left) ?? 0;
    const rightNeed = vacancyCounts.get(right) ?? 0;
    const leftRatio =
      leftNeed === 0
        ? Number.POSITIVE_INFINITY
        : (availableByPosition.get(left)?.length ?? 0) / leftNeed;
    const rightRatio =
      rightNeed === 0
        ? Number.POSITIVE_INFINITY
        : (availableByPosition.get(right)?.length ?? 0) / rightNeed;
    return leftRatio - rightRatio;
  });
  const pickSequence = positionOrder.flatMap((position) =>
    Array.from({ length: vacancyCounts.get(position) ?? 0 }, () => position),
  );
  const priorityByCandidate = new Map(
    candidates.map((candidate) => [
      candidate.id,
      candidatePriority(candidate, random),
    ]),
  );

  let states: SearchState[] = [
    {
      picked: [],
      pickedIds: new Set(occupiedIds),
      clubCounts,
      foreignCount,
      tierOneCount,
      topTwoTierCount,
      lastIndexByPosition: new Map(),
      score: 0,
    },
  ];

  for (let step = 0; step < pickSequence.length; step += 1) {
    const position = pickSequence[step];
    const pool = availableByPosition.get(position) ?? [];
    const remainingForPosition = pickSequence
      .slice(step + 1)
      .filter((item) => item === position).length;
    const expanded: SearchState[] = [];

    for (const state of states) {
      const startIndex = (state.lastIndexByPosition.get(position) ?? -1) + 1;
      for (let index = startIndex; index < pool.length; index += 1) {
        if (pool.length - index - 1 < remainingForPosition) break;
        const candidate = pool[index];
        if (!canAddCandidate(state, candidate)) continue;

        const nextIds = new Set(state.pickedIds);
        nextIds.add(candidate.id);
        const nextIndexes = new Map(state.lastIndexByPosition);
        nextIndexes.set(position, index);
        expanded.push({
          picked: [...state.picked, candidate],
          pickedIds: nextIds,
          clubCounts: incrementCount(state.clubCounts, candidate.clubId),
          foreignCount: state.foreignCount + (candidate.isThai ? 0 : 1),
          tierOneCount: state.tierOneCount + (candidate.tier === 1 ? 1 : 0),
          topTwoTierCount:
            state.topTwoTierCount + (candidate.tier <= 2 ? 1 : 0),
          lastIndexByPosition: nextIndexes,
          score: state.score + (priorityByCandidate.get(candidate.id) ?? 0),
        });
      }
    }

    if (expanded.length === 0) return null;
    states = expanded
      .sort((left, right) => right.score - left.score)
      .slice(0, BEAM_WIDTH);
  }

  const best = states[0];
  if (!best || best.picked.length !== vacancies.length) return null;

  const pickedByPosition = new Map(
    positions.map((position) => [
      position,
      best.picked
        .filter((candidate) => candidate.position === position)
        .sort(
          (left, right) =>
            right.projectedPoints - left.projectedPoints ||
            left.overallRank - right.overallRank ||
            left.id.localeCompare(right.id),
        ),
    ]),
  );
  const candidateBySlotId = new Map<string, AutoFillCandidate>();
  for (const position of positions) {
    const positionVacancies = vacancies
      .filter((member) => member.vacancyPosition === position)
      .sort((left, right) => {
        if (left.lineupRole !== right.lineupRole) {
          return left.lineupRole === "starter" ? -1 : 1;
        }
        return (
          (left.benchOrder ?? -1) - (right.benchOrder ?? -1) ||
          left.slotId.localeCompare(right.slotId)
        );
      });
    const positionCandidates = pickedByPosition.get(position) ?? [];
    positionVacancies.forEach((member, index) => {
      const candidate = positionCandidates[index];
      if (candidate) candidateBySlotId.set(member.slotId, candidate);
    });
  }
  const filledMembers = members.map((member) => {
    if (member.fantasyPlayerId || !member.vacancyPosition) return member;
    const candidate = candidateBySlotId.get(member.slotId);
    if (!candidate) return member;
    return {
      ...member,
      fantasyPlayerId: candidate.id,
      vacancyPosition: null,
      captainRole: "none" as const,
    };
  });
  const withCaptaincy = assignCaptaincy(filledMembers, candidatesById);
  const lineup = withCaptaincy.flatMap<LineupPlayer>((member) => {
    if (!member.fantasyPlayerId) return [];
    const candidate = candidatesById.get(member.fantasyPlayerId);
    return candidate
      ? [
          {
            id: candidate.id,
            clubId: candidate.clubId,
            position: candidate.position,
            tier: candidate.tier,
            isThai: candidate.isThai,
            isAvailable: true,
            lineupRole: member.lineupRole,
            benchOrder: member.benchOrder,
            captainRole: member.captainRole,
          },
        ]
      : [];
  });
  if (validateLineup(lineup).length > 0) return null;

  return {
    members: withCaptaincy,
    addedPlayerIds: best.picked.map((candidate) => candidate.id),
  };
}
