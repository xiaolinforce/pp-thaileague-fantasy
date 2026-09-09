import { solve, type Coefficients, type Constraint, type Model } from "yalps";

import {
  getCumulativeTierLimits,
  THAI_LEAGUE_FANTASY_RULES,
  validateLineup,
  type FantasyPosition,
  type LineupPlayer,
} from "./rules.ts";
import { resolveTeamScore, type TeamScore } from "./scoring.ts";

export type OptimalTeamCandidate = {
  id: string;
  clubId: string;
  position: FantasyPosition;
  tier: number;
  isThai: boolean;
  minutes: number;
  points: number;
};

export type OptimalTeamMember = OptimalTeamCandidate & {
  lineupRole: "starter" | "bench";
  benchOrder: number | null;
  captainRole: "none" | "captain" | "vice_captain";
};

export type OptimalTeam = {
  members: OptimalTeamMember[];
  score: TeamScore;
};

export const OPTIMAL_TEAM_ALGORITHM_VERSION = "canonical-full-squad-v2";

type Formation = Record<FantasyPosition, number>;
type RoleGroup = {
  position: FantasyPosition;
  lineupRole: "starter" | "bench";
  count: number;
};
type CaptaincyChoice = {
  captainId: string;
  viceCaptainId: string;
  bonus: number;
  captainPlayed: boolean;
  captainPoints: number;
  viceCaptainPlayed: boolean;
  viceCaptainPoints: number;
};

const positions: FantasyPosition[] = [
  "goalkeeper",
  "defender",
  "midfielder",
  "forward",
];

function validFormations(): Formation[] {
  const formations: Formation[] = [];
  for (let defenders = 3; defenders <= 5; defenders += 1) {
    for (let midfielders = 2; midfielders <= 5; midfielders += 1) {
      for (let forwards = 1; forwards <= 3; forwards += 1) {
        if (defenders + midfielders + forwards !== 10) continue;
        formations.push({
          goalkeeper: 1,
          defender: defenders,
          midfielder: midfielders,
          forward: forwards,
        });
      }
    }
  }
  return formations;
}

function permutations<T>(values: T[]): T[][] {
  if (values.length < 2) return [values];
  return values.flatMap((value, index) =>
    permutations(
      values.filter((_, candidateIndex) => candidateIndex !== index),
    ).map((remainder) => [value, ...remainder]),
  );
}

function isBetterCaptaincy(
  candidate: CaptaincyChoice,
  best: CaptaincyChoice | undefined,
) {
  if (!best) return true;
  if (candidate.bonus !== best.bonus) return candidate.bonus > best.bonus;
  if (candidate.captainPlayed !== best.captainPlayed) {
    return candidate.captainPlayed;
  }
  if (candidate.captainPoints !== best.captainPoints) {
    return candidate.captainPoints > best.captainPoints;
  }
  if (candidate.viceCaptainPlayed !== best.viceCaptainPlayed) {
    return candidate.viceCaptainPlayed;
  }
  if (candidate.viceCaptainPoints !== best.viceCaptainPoints) {
    return candidate.viceCaptainPoints > best.viceCaptainPoints;
  }
  return (
    `${candidate.captainId}\u0000${candidate.viceCaptainId}`.localeCompare(
      `${best.captainId}\u0000${best.viceCaptainId}`,
    ) < 0
  );
}

function captaincyFor(starters: OptimalTeamCandidate[]) {
  let best: CaptaincyChoice | undefined;
  for (const captain of starters) {
    for (const viceCaptain of starters) {
      if (captain.id === viceCaptain.id) continue;
      const bonus =
        captain.minutes > 0
          ? captain.points
          : viceCaptain.minutes > 0
            ? viceCaptain.points
            : 0;
      const candidate: CaptaincyChoice = {
        captainId: captain.id,
        viceCaptainId: viceCaptain.id,
        bonus,
        captainPlayed: captain.minutes > 0,
        captainPoints: captain.points,
        viceCaptainPlayed: viceCaptain.minutes > 0,
        viceCaptainPoints: viceCaptain.points,
      };
      if (isBetterCaptaincy(candidate, best)) best = candidate;
    }
  }
  return best;
}

function uncountedMembers(team: OptimalTeam) {
  const countedIds = new Set(team.score.countedPlayerIds);
  return team.members.filter((member) => !countedIds.has(member.id));
}

function benchPoints(team: OptimalTeam) {
  return uncountedMembers(team).reduce(
    (total, member) => total + member.points,
    0,
  );
}

function orderedOutfieldBenchPoints(team: OptimalTeam) {
  return team.members
    .filter(
      (member) =>
        member.lineupRole === "bench" && member.position !== "goalkeeper",
    )
    .sort((left, right) => (left.benchOrder ?? 99) - (right.benchOrder ?? 99))
    .map((member) => member.points);
}

function deterministicTeamKey(team: OptimalTeam) {
  return [...team.members]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map(
      (member) =>
        `${member.id}:${member.lineupRole}:${member.benchOrder ?? "-"}:${member.captainRole}`,
    )
    .join("\u0000");
}

function isBetterTeam(candidate: OptimalTeam, best: OptimalTeam | null) {
  if (!best) return true;
  if (candidate.score.totalPoints !== best.score.totalPoints) {
    return candidate.score.totalPoints > best.score.totalPoints;
  }

  const candidateBenchPoints = benchPoints(candidate);
  const bestBenchPoints = benchPoints(best);
  if (candidateBenchPoints !== bestBenchPoints) {
    return candidateBenchPoints > bestBenchPoints;
  }
  if (
    candidate.score.autoSubstitutions.length !==
    best.score.autoSubstitutions.length
  ) {
    return (
      candidate.score.autoSubstitutions.length <
      best.score.autoSubstitutions.length
    );
  }

  const candidateBenchOrder = orderedOutfieldBenchPoints(candidate);
  const bestBenchOrder = orderedOutfieldBenchPoints(best);
  for (let index = 0; index < candidateBenchOrder.length; index += 1) {
    if (candidateBenchOrder[index] !== bestBenchOrder[index]) {
      return candidateBenchOrder[index] > bestBenchOrder[index];
    }
  }
  return (
    deterministicTeamKey(candidate).localeCompare(deterministicTeamKey(best)) <
    0
  );
}

function evaluateSquad(
  assigned: Array<OptimalTeamCandidate & { lineupRole: "starter" | "bench" }>,
) {
  const starters = assigned.filter((member) => member.lineupRole === "starter");
  const goalkeeper = assigned.find(
    (member) =>
      member.lineupRole === "bench" && member.position === "goalkeeper",
  );
  const outfieldBench = assigned.filter(
    (member) =>
      member.lineupRole === "bench" && member.position !== "goalkeeper",
  );
  const captaincy = captaincyFor(starters);
  if (!goalkeeper || outfieldBench.length !== 3 || !captaincy) return null;

  let best: OptimalTeam | null = null;
  for (const orderedOutfieldBench of permutations(outfieldBench)) {
    const benchOrder = new Map<string, number>([
      [goalkeeper.id, 0],
      ...orderedOutfieldBench.map(
        (member, index) => [member.id, index + 1] as const,
      ),
    ]);
    const members: OptimalTeamMember[] = assigned.map((member) => ({
      ...member,
      benchOrder:
        member.lineupRole === "bench" ? benchOrder.get(member.id)! : null,
      captainRole:
        member.id === captaincy.captainId
          ? "captain"
          : member.id === captaincy.viceCaptainId
            ? "vice_captain"
            : "none",
    }));
    const score = resolveTeamScore({
      selection: members.map((member) => ({
        playerId: member.id,
        position: member.position,
        lineupRole: member.lineupRole,
        benchOrder: member.benchOrder,
        captainRole: member.captainRole,
      })),
      playerResults: members.map((member) => ({
        playerId: member.id,
        minutes: member.minutes,
        points: member.points,
      })),
      activeChip: null,
      transferPoints: 0,
    });
    const evaluated = { members, score };
    if (isBetterTeam(evaluated, best)) best = evaluated;
  }
  return best;
}

function findBestLineupForSquad(
  squad: OptimalTeamCandidate[],
): OptimalTeam | null {
  let best: OptimalTeam | null = null;

  for (const formation of validFormations()) {
    const starterIds = new Set<string>();
    const byPosition = new Map(
      positions.map((position) => [
        position,
        squad.filter((candidate) => candidate.position === position),
      ]),
    );
    const selectStarters = (
      groupIndex: number,
      startIndex: number,
      remaining: number,
    ) => {
      if (groupIndex >= positions.length) {
        const evaluated = evaluateSquad(
          squad.map((member) => ({
            ...member,
            lineupRole: starterIds.has(member.id)
              ? ("starter" as const)
              : ("bench" as const),
          })),
        );
        if (evaluated && isBetterTeam(evaluated, best)) best = evaluated;
        return;
      }
      if (remaining === 0) {
        selectStarters(
          groupIndex + 1,
          0,
          formation[positions[groupIndex + 1]] ?? 0,
        );
        return;
      }

      const pool = byPosition.get(positions[groupIndex]) ?? [];
      for (let index = startIndex; index < pool.length; index += 1) {
        if (pool.length - index < remaining) break;
        const candidate = pool[index];
        starterIds.add(candidate.id);
        selectStarters(groupIndex, index + 1, remaining - 1);
        starterIds.delete(candidate.id);
      }
    };

    selectStarters(0, 0, formation[positions[0]]);
  }

  return best;
}

function solveSquadUpperBound(
  candidates: OptimalTeamCandidate[],
  excludedSquads: ReadonlyArray<ReadonlySet<number>>,
) {
  const benchBaseline = Math.min(
    0,
    ...candidates.map((candidate) => candidate.points),
  );
  const benchValue = (candidate: OptimalTeamCandidate) =>
    candidate.points - benchBaseline;
  const primaryWeight =
    candidates.reduce((total, candidate) => total + benchValue(candidate), 0) +
    1;
  const constraints = new Map<string, Constraint>([
    ["squad:size", { equal: THAI_LEAGUE_FANTASY_RULES.squadSize }],
    ["starter:size", { equal: 11 }],
    ["starter:goalkeeper", { equal: 1 }],
    ["starter:defender", { min: 3 }],
    ["starter:midfielder", { min: 2 }],
    ["starter:forward", { min: 1 }],
    ["squad:foreign", { max: THAI_LEAGUE_FANTASY_RULES.foreignPlayerLimit }],
    ["captain:size", { equal: 1 }],
  ]);
  for (const position of positions) {
    constraints.set(`squad:${position}`, {
      equal: THAI_LEAGUE_FANTASY_RULES.positionLimits[position],
    });
  }
  for (const { level, limit } of getCumulativeTierLimits()) {
    constraints.set(`squad:tier:${level}`, { max: limit });
  }
  for (const clubId of new Set(
    candidates.map((candidate) => candidate.clubId),
  )) {
    constraints.set(`squad:club:${clubId}`, {
      max: THAI_LEAGUE_FANTASY_RULES.sameClubLimit,
    });
  }
  for (let index = 0; index < candidates.length; index += 1) {
    constraints.set(`link:starter:${index}`, { max: 0 });
    constraints.set(`link:captain:${index}`, { max: 0 });
  }
  for (let index = 0; index < excludedSquads.length; index += 1) {
    constraints.set(`exclude:${index}`, {
      max: THAI_LEAGUE_FANTASY_RULES.squadSize - 1,
    });
  }

  const variables = new Map<string, Coefficients<string>>();
  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const candidateBenchValue = benchValue(candidate);
    const squad = new Map<string, number>([
      ["score", candidateBenchValue],
      ["squad:size", 1],
      [`squad:${candidate.position}`, 1],
      [`squad:club:${candidate.clubId}`, 1],
      [`link:starter:${index}`, -1],
    ]);
    if (!candidate.isThai) squad.set("squad:foreign", 1);
    for (const { level } of getCumulativeTierLimits()) {
      if (candidate.tier <= level) squad.set(`squad:tier:${level}`, 1);
    }
    if (
      !THAI_LEAGUE_FANTASY_RULES.tierSlots.some(
        ({ level }) => level === candidate.tier,
      )
    ) {
      constraints.set(`valid:tier:${index}`, { max: 0 });
      squad.set(`valid:tier:${index}`, 1);
    }
    for (let excluded = 0; excluded < excludedSquads.length; excluded += 1) {
      if (excludedSquads[excluded].has(index)) {
        squad.set(`exclude:${excluded}`, 1);
      }
    }
    variables.set(`squad:${index}`, squad);

    variables.set(
      `starter:${index}`,
      new Map<string, number>([
        [
          "score",
          Math.max(0, candidate.points) * primaryWeight - candidateBenchValue,
        ],
        ["starter:size", 1],
        [`starter:${candidate.position}`, 1],
        [`link:starter:${index}`, 1],
        [`link:captain:${index}`, -1],
      ]),
    );
    variables.set(
      `captain:${index}`,
      new Map<string, number>([
        ["score", Math.max(0, candidate.points) * primaryWeight],
        ["captain:size", 1],
        [`link:captain:${index}`, 1],
      ]),
    );
  }

  const model: Model<string, string> = {
    direction: "maximize",
    objective: "score",
    constraints,
    variables,
    binaries: true,
  };
  return {
    solution: solve(model, { timeout: 5_000, maxIterations: 100_000 }),
    benchBaseline,
  };
}

export function findOptimalTeam(
  candidates: OptimalTeamCandidate[],
): OptimalTeam | null {
  const orderedCandidates = [...candidates].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
  if (
    new Set(orderedCandidates.map((candidate) => candidate.id)).size !==
    orderedCandidates.length
  ) {
    return null;
  }

  const excludedSquads: Array<ReadonlySet<number>> = [];
  let best: OptimalTeam | null = null;

  // One point in the primary objective outweighs the complete bench objective.
  // evaluateSquad remains the source of truth for substitutions and captaincy;
  // squads whose solver bounds are not tight are excluded before solving again.
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { solution, benchBaseline } = solveSquadUpperBound(
      orderedCandidates,
      excludedSquads,
    );
    if (solution.status === "infeasible") return best;
    if (solution.status !== "optimal") {
      if (orderedCandidates.length <= 60) {
        return findOptimalTeamLegacy(orderedCandidates);
      }
      throw new Error(
        `Optimal-team solver stopped with status ${solution.status}.`,
      );
    }
    const selectedIndexes = new Set<number>();
    const starterIndexes = new Set<number>();
    let captainIndex: number | null = null;
    for (const [variable, value] of solution.variables) {
      if (value < 0.5) continue;
      if (variable.startsWith("squad:")) {
        selectedIndexes.add(Number(variable.slice("squad:".length)));
      } else if (variable.startsWith("starter:")) {
        starterIndexes.add(Number(variable.slice("starter:".length)));
      } else if (variable.startsWith("captain:")) {
        captainIndex = Number(variable.slice("captain:".length));
      }
    }
    if (
      selectedIndexes.size !== THAI_LEAGUE_FANTASY_RULES.squadSize ||
      starterIndexes.size !== 11 ||
      captainIndex === null
    ) {
      return findOptimalTeamLegacy(orderedCandidates);
    }

    const primaryUpperBound =
      [...starterIndexes].reduce(
        (total, index) => total + Math.max(0, orderedCandidates[index].points),
        0,
      ) + Math.max(0, orderedCandidates[captainIndex].points);
    const benchUpperBound =
      [...selectedIndexes].reduce(
        (total, index) =>
          total + (orderedCandidates[index].points - benchBaseline),
        0,
      ) -
      [...starterIndexes].reduce(
        (total, index) =>
          total + (orderedCandidates[index].points - benchBaseline),
        0,
      ) +
      benchBaseline * 4;
    if (
      best &&
      (primaryUpperBound < best.score.totalPoints ||
        (primaryUpperBound === best.score.totalPoints &&
          benchUpperBound < benchPoints(best)))
    ) {
      return best;
    }

    const evaluated = findBestLineupForSquad(
      [...selectedIndexes].map((index) => orderedCandidates[index]),
    );
    if (evaluated && isBetterTeam(evaluated, best)) best = evaluated;
    if (
      best &&
      best.score.totalPoints === primaryUpperBound &&
      benchPoints(best) === benchUpperBound &&
      best.score.autoSubstitutions.length === 0
    ) {
      return best;
    }
    excludedSquads.push(selectedIndexes);
  }

  if (orderedCandidates.length <= 60) {
    return findOptimalTeamLegacy(orderedCandidates);
  }
  throw new Error("Optimal-team solver exceeded the exact-solution attempts.");
}

function findOptimalTeamLegacy(
  candidates: OptimalTeamCandidate[],
): OptimalTeam | null {
  const uniqueCandidates = new Map<string, OptimalTeamCandidate>();
  for (const candidate of candidates) {
    if (uniqueCandidates.has(candidate.id)) return null;
    uniqueCandidates.set(candidate.id, candidate);
  }
  const orderedCandidates = [...uniqueCandidates.values()].sort(
    (left, right) =>
      right.points - left.points ||
      right.minutes - left.minutes ||
      left.id.localeCompare(right.id),
  );
  const byPosition = new Map(
    positions.map((position) => [
      position,
      orderedCandidates.filter((candidate) => candidate.position === position),
    ]),
  );
  if (
    positions.some(
      (position) =>
        (byPosition.get(position)?.length ?? 0) <
        THAI_LEAGUE_FANTASY_RULES.positionLimits[position],
    )
  ) {
    return null;
  }

  let best: OptimalTeam | null = null;
  for (const formation of validFormations()) {
    const groups: RoleGroup[] = [
      ...positions.map((position) => ({
        position,
        lineupRole: "starter" as const,
        count: formation[position],
      })),
      ...positions.map((position) => ({
        position,
        lineupRole: "bench" as const,
        count:
          THAI_LEAGUE_FANTASY_RULES.positionLimits[position] -
          formation[position],
      })),
    ].filter((group) => group.count > 0);
    const assigned: Array<
      OptimalTeamCandidate & { lineupRole: "starter" | "bench" }
    > = [];
    const selectedIds = new Set<string>();
    const clubCounts = new Map<string, number>();
    const tierCounts = new Map<number, number>();
    let foreignCount = 0;

    const canAdd = (candidate: OptimalTeamCandidate) => {
      if (selectedIds.has(candidate.id)) return false;
      if (
        (clubCounts.get(candidate.clubId) ?? 0) >=
        THAI_LEAGUE_FANTASY_RULES.sameClubLimit
      ) {
        return false;
      }
      if (
        !candidate.isThai &&
        foreignCount >= THAI_LEAGUE_FANTASY_RULES.foreignPlayerLimit
      ) {
        return false;
      }
      const nextTierCount = new Map(tierCounts);
      nextTierCount.set(
        candidate.tier,
        (nextTierCount.get(candidate.tier) ?? 0) + 1,
      );
      return getCumulativeTierLimits().every(({ level, limit }) => {
        const used = [...nextTierCount].reduce(
          (sum, [tier, count]) => sum + (tier <= level ? count : 0),
          0,
        );
        return used <= limit;
      });
    };

    const add = (
      candidate: OptimalTeamCandidate,
      lineupRole: "starter" | "bench",
    ) => {
      assigned.push({ ...candidate, lineupRole });
      selectedIds.add(candidate.id);
      clubCounts.set(
        candidate.clubId,
        (clubCounts.get(candidate.clubId) ?? 0) + 1,
      );
      tierCounts.set(candidate.tier, (tierCounts.get(candidate.tier) ?? 0) + 1);
      if (!candidate.isThai) foreignCount += 1;
    };
    const remove = (candidate: OptimalTeamCandidate) => {
      assigned.pop();
      selectedIds.delete(candidate.id);
      const clubCount = (clubCounts.get(candidate.clubId) ?? 1) - 1;
      if (clubCount) clubCounts.set(candidate.clubId, clubCount);
      else clubCounts.delete(candidate.clubId);
      const tierCount = (tierCounts.get(candidate.tier) ?? 1) - 1;
      if (tierCount) tierCounts.set(candidate.tier, tierCount);
      else tierCounts.delete(candidate.tier);
      if (!candidate.isThai) foreignCount -= 1;
    };
    const upperBound = () => {
      const selectedStarters = assigned.filter(
        (member) => member.lineupRole === "starter",
      );
      const fixed = selectedStarters
        .filter((member) => member.minutes > 0)
        .reduce((sum, member) => sum + member.points, 0);
      const unresolved =
        11 - selectedStarters.filter((member) => member.minutes > 0).length;
      const possibleResults = orderedCandidates
        .filter(
          (candidate) =>
            !selectedIds.has(candidate.id) ||
            assigned.some(
              (member) =>
                member.id === candidate.id &&
                member.lineupRole === "bench" &&
                member.minutes > 0,
            ),
        )
        .map((candidate) => Math.max(0, candidate.points))
        .slice(0, unresolved);
      const bestCaptain = Math.max(
        0,
        ...selectedStarters
          .filter((member) => member.minutes > 0)
          .map((member) => member.points),
        ...possibleResults,
      );
      return (
        fixed +
        possibleResults.reduce((sum, value) => sum + value, 0) +
        bestCaptain
      );
    };

    const selectGroup = (
      groupIndex: number,
      startIndex: number,
      remaining: number,
    ) => {
      if (best && upperBound() < best.score.totalPoints) return;

      if (groupIndex >= groups.length) {
        const lineup: LineupPlayer[] = assigned.map((member) => ({
          id: member.id,
          clubId: member.clubId,
          position: member.position,
          tier: member.tier,
          isThai: member.isThai,
          isAvailable: true,
          lineupRole: member.lineupRole,
          benchOrder:
            member.lineupRole === "bench"
              ? member.position === "goalkeeper"
                ? 0
                : 1
              : null,
          captainRole: "none",
        }));
        if (
          validateLineup(lineup).some(
            (violation) =>
              violation.code !== "bench_order" &&
              violation.code !== "captain" &&
              violation.code !== "vice_captain",
          )
        ) {
          return;
        }
        const evaluated = evaluateSquad(assigned);
        if (evaluated && isBetterTeam(evaluated, best)) best = evaluated;
        return;
      }

      const group = groups[groupIndex];
      if (remaining === 0) {
        selectGroup(groupIndex + 1, 0, groups[groupIndex + 1]?.count ?? 0);
        return;
      }
      const pool = byPosition.get(group.position) ?? [];
      for (let index = startIndex; index < pool.length; index += 1) {
        if (pool.length - index < remaining) break;
        const candidate = pool[index];
        if (!canAdd(candidate)) continue;
        add(candidate, group.lineupRole);
        selectGroup(groupIndex, index + 1, remaining - 1);
        remove(candidate);
      }
    };

    selectGroup(0, 0, groups[0].count);
  }

  return best;
}
