import type { DraftLineupMember } from "./team-draft.ts";
import {
  getCumulativeTierLimits,
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
  isLikelyClubStartingGoalkeeper: boolean;
};

export function classifyLikelyClubStartingGoalkeepers(
  candidates: AutoFillCandidate[],
) {
  const bestGoalkeeperTierByClub = new Map<string, number>();
  for (const candidate of candidates) {
    if (candidate.position !== "goalkeeper") continue;
    bestGoalkeeperTierByClub.set(
      candidate.clubId,
      Math.min(
        candidate.tier,
        bestGoalkeeperTierByClub.get(candidate.clubId) ??
          Number.POSITIVE_INFINITY,
      ),
    );
  }
  return candidates.map((candidate) => ({
    ...candidate,
    isLikelyClubStartingGoalkeeper:
      candidate.position === "goalkeeper" &&
      candidate.tier === bestGoalkeeperTierByClub.get(candidate.clubId),
  }));
}

export type AutoFillResult = {
  members: DraftLineupMember[];
  addedPlayerIds: string[];
};

type SearchState = {
  picked: AutoFillCandidate[];
  pickedIds: Set<string>;
  clubCounts: Map<string, number>;
  foreignCount: number;
  tierCounts: Map<number, number>;
  likelyStartingGoalkeeperCount: number;
  lastIndexByPosition: Map<FantasyPosition, number>;
  randomScore: number;
};

const BEAM_WIDTH = 768;
const tierTargetDeficitCache = new Map<
  string,
  { total: number; largest: number }
>();
const positions: FantasyPosition[] = [
  "goalkeeper",
  "defender",
  "midfielder",
  "forward",
];
const captaincyPositionPriority: Record<FantasyPosition, number> = {
  forward: 0,
  midfielder: 1,
  defender: 2,
  goalkeeper: 3,
};

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

function tierTargetDeficit(
  tierCounts: Map<number, number>,
  remainingPickCount = 0,
) {
  const highestTier = Math.max(
    ...THAI_LEAGUE_FANTASY_RULES.tierSlots.map((slot) => slot.level),
  );
  const deficits = THAI_LEAGUE_FANTASY_RULES.tierSlots
    .filter((slot) => slot.level < highestTier)
    .map((slot) => Math.max(0, slot.slots - (tierCounts.get(slot.level) ?? 0)));
  const cacheKey = `${remainingPickCount}:${deficits.join(":")}`;
  const cached = tierTargetDeficitCache.get(cacheKey);
  if (cached) return cached;
  let best = {
    total: deficits.reduce((sum, deficit) => sum + deficit, 0),
    largest: Math.max(0, ...deficits),
  };

  function allocate(index: number, remaining: number, next: number[]) {
    if (index === deficits.length) {
      const objective = {
        total: next.reduce((sum, deficit) => sum + deficit, 0),
        largest: Math.max(0, ...next),
      };
      if (
        objective.total < best.total ||
        (objective.total === best.total && objective.largest < best.largest)
      ) {
        best = objective;
      }
      return;
    }
    for (
      let filled = 0;
      filled <= Math.min(deficits[index], remaining);
      filled += 1
    ) {
      allocate(index + 1, remaining - filled, [
        ...next,
        deficits[index] - filled,
      ]);
    }
  }

  allocate(0, remainingPickCount, []);
  tierTargetDeficitCache.set(cacheKey, best);
  return best;
}

function searchStateObjective(
  state: SearchState,
  remainingPickCount: number,
  remainingGoalkeeperCount: number,
) {
  const tierDeficit = tierTargetDeficit(state.tierCounts, remainingPickCount);
  return {
    ...tierDeficit,
    likelyStartingGoalkeeperCount:
      state.likelyStartingGoalkeeperCount + remainingGoalkeeperCount,
    foreignCount: Math.min(
      THAI_LEAGUE_FANTASY_RULES.foreignPlayerLimit,
      state.foreignCount + remainingPickCount,
    ),
  };
}

function compareSearchStates(
  left: {
    state: SearchState;
    objective: ReturnType<typeof searchStateObjective>;
  },
  right: {
    state: SearchState;
    objective: ReturnType<typeof searchStateObjective>;
  },
) {
  const leftObjective = left.objective;
  const rightObjective = right.objective;
  return (
    leftObjective.total - rightObjective.total ||
    leftObjective.largest - rightObjective.largest ||
    rightObjective.likelyStartingGoalkeeperCount -
      leftObjective.likelyStartingGoalkeeperCount ||
    rightObjective.foreignCount - leftObjective.foreignCount ||
    right.state.randomScore - left.state.randomScore ||
    left.state.picked
      .map((candidate) => candidate.id)
      .join("\u0000")
      .localeCompare(
        right.state.picked.map((candidate) => candidate.id).join("\u0000"),
      )
  );
}

function exceedsTierLimit(tierCounts: Map<number, number>) {
  return getCumulativeTierLimits().some(({ level, limit }) => {
    const used = [...tierCounts.entries()].reduce(
      (sum, [tier, count]) => sum + (tier <= level ? count : 0),
      0,
    );
    return used > limit;
  });
}

function canAddCandidate(state: SearchState, candidate: AutoFillCandidate) {
  const rules = THAI_LEAGUE_FANTASY_RULES;
  const knownTiers = new Set(rules.tierSlots.map((slot) => slot.level));
  if (state.pickedIds.has(candidate.id)) return false;
  if ((state.clubCounts.get(candidate.clubId) ?? 0) >= rules.sameClubLimit) {
    return false;
  }
  if (!candidate.isThai && state.foreignCount >= rules.foreignPlayerLimit) {
    return false;
  }
  if (!knownTiers.has(candidate.tier)) return false;
  return !exceedsTierLimit(incrementCount(state.tierCounts, candidate.tier));
}

function assignCaptaincy(
  members: DraftLineupMember[],
  candidatesById: Map<string, AutoFillCandidate>,
  randomPriorityByCandidate: Map<string, number>,
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
  const preferredStarters = starterMembers
    .map((member) => candidatesById.get(member.fantasyPlayerId!))
    .filter((candidate): candidate is AutoFillCandidate => Boolean(candidate))
    .sort(
      (left, right) =>
        left.tier - right.tier ||
        captaincyPositionPriority[left.position] -
          captaincyPositionPriority[right.position] ||
        (randomPriorityByCandidate.get(right.id) ?? 0) -
          (randomPriorityByCandidate.get(left.id) ?? 0) ||
        left.id.localeCompare(right.id),
    );

  if (!captainId) {
    captainId = preferredStarters.find(
      (candidate) => candidate.id !== viceCaptainId,
    )?.id;
  }
  if (!viceCaptainId) {
    viceCaptainId = preferredStarters.find(
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
  const randomPriorityByCandidate = new Map(
    [...candidates]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((candidate) => [candidate.id, Math.min(1, Math.max(0, random()))]),
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
    const withCaptaincy = assignCaptaincy(
      members,
      candidatesById,
      randomPriorityByCandidate,
    );
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
  const tierCounts = countBy(
    occupiedCandidates.map((candidate) => candidate.tier),
  );
  const knownTiers = new Set(rules.tierSlots.map((slot) => slot.level));
  if (
    [...clubCounts.values()].some((count) => count > rules.sameClubLimit) ||
    foreignCount > rules.foreignPlayerLimit ||
    exceedsTierLimit(tierCounts) ||
    occupiedCandidates.some((candidate) => !knownTiers.has(candidate.tier))
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
    if (left === "goalkeeper" && right !== "goalkeeper") return -1;
    if (right === "goalkeeper" && left !== "goalkeeper") return 1;
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
  let states: SearchState[] = [
    {
      picked: [],
      pickedIds: new Set(occupiedIds),
      clubCounts,
      foreignCount,
      tierCounts,
      likelyStartingGoalkeeperCount: occupiedCandidates.filter(
        (candidate) => candidate.isLikelyClubStartingGoalkeeper,
      ).length,
      lastIndexByPosition: new Map(),
      randomScore: 0,
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
          tierCounts: incrementCount(state.tierCounts, candidate.tier),
          likelyStartingGoalkeeperCount:
            state.likelyStartingGoalkeeperCount +
            (candidate.isLikelyClubStartingGoalkeeper ? 1 : 0),
          lastIndexByPosition: nextIndexes,
          randomScore:
            state.randomScore +
            (randomPriorityByCandidate.get(candidate.id) ?? 0),
        });
      }
    }

    if (expanded.length === 0) return null;
    const remainingPickSequence = pickSequence.slice(step + 1);
    const remainingGoalkeeperCount = remainingPickSequence.filter(
      (remainingPosition) => remainingPosition === "goalkeeper",
    ).length;
    states = expanded
      .map((state) => ({
        state,
        objective: searchStateObjective(
          state,
          remainingPickSequence.length,
          remainingGoalkeeperCount,
        ),
      }))
      .sort(compareSearchStates)
      .slice(0, BEAM_WIDTH)
      .map(({ state }) => state);
  }

  const best = states[0];
  if (!best || best.picked.length !== vacancies.length) return null;

  const pickedByPosition = new Map(
    positions.map((position) => [
      position,
      best.picked
        .filter((candidate) => candidate.position === position)
        .sort((left, right) => {
          if (
            position === "goalkeeper" &&
            left.isLikelyClubStartingGoalkeeper !==
              right.isLikelyClubStartingGoalkeeper
          ) {
            return left.isLikelyClubStartingGoalkeeper ? -1 : 1;
          }
          return (
            left.tier - right.tier ||
            (randomPriorityByCandidate.get(right.id) ?? 0) -
              (randomPriorityByCandidate.get(left.id) ?? 0) ||
            left.id.localeCompare(right.id)
          );
        }),
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
  const withCaptaincy = assignCaptaincy(
    filledMembers,
    candidatesById,
    randomPriorityByCandidate,
  );
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
