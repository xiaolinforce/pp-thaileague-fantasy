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

type Formation = Record<FantasyPosition, number>;
type RoleGroup = {
  position: FantasyPosition;
  lineupRole: "starter" | "bench";
  count: number;
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

function captaincyFor(starters: OptimalTeamCandidate[]) {
  let best:
    { captainId: string; viceCaptainId: string; bonus: number } | undefined;
  for (const captain of starters) {
    for (const viceCaptain of starters) {
      if (captain.id === viceCaptain.id) continue;
      const bonus =
        captain.minutes > 0
          ? captain.points
          : viceCaptain.minutes > 0
            ? viceCaptain.points
            : 0;
      const key = `${captain.id}\u0000${viceCaptain.id}`;
      const bestKey = best
        ? `${best.captainId}\u0000${best.viceCaptainId}`
        : "";
      if (
        !best ||
        bonus > best.bonus ||
        (bonus === best.bonus && key.localeCompare(bestKey) < 0)
      ) {
        best = {
          captainId: captain.id,
          viceCaptainId: viceCaptain.id,
          bonus,
        };
      }
    }
  }
  return best;
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
    if (!best || score.totalPoints > best.score.totalPoints) {
      best = { members, score };
    }
  }
  return best;
}

function hasReachedUpperBound(team: OptimalTeam | null, upperBound: number) {
  return team !== null && team.score.totalPoints === upperBound;
}

export function findOptimalTeam(
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
  const rootUpperBound = (() => {
    const points = orderedCandidates
      .map((candidate) => Math.max(0, candidate.points))
      .slice(0, 11);
    return points.reduce((sum, value) => sum + value, 0) + (points[0] ?? 0);
  })();

  for (const formation of validFormations()) {
    if (hasReachedUpperBound(best, rootUpperBound)) break;
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
      if (best && upperBound() <= best.score.totalPoints) return;
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
        if (
          evaluated &&
          (!best || evaluated.score.totalPoints > best.score.totalPoints)
        ) {
          best = evaluated;
        }
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
        if (hasReachedUpperBound(best, rootUpperBound)) return;
      }
    };

    selectGroup(0, 0, groups[0].count);
  }

  return best;
}
