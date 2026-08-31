export type RecentFixturePoints = {
  fixtureId: string;
  matchweek: number;
  points: number;
};

export type SeasonStatTotals = {
  appearances: number;
  starts: number;
  minutes: number;
  goals: number;
  sourceAssists: number;
  cleanSheets: number;
  goalsConceded: number;
  penaltyGoals: number;
  penaltyMisses: number;
  yellowCards: number;
  redCards: number;
  ownGoals: number;
};

export function calculateFiveFixtureForm(fixtures: RecentFixturePoints[]) {
  const lastFive = fixtures.slice(0, 5);
  if (lastFive.length === 0) return 0;

  return Number(
    (
      lastFive.reduce((total, fixture) => total + fixture.points, 0) /
      lastFive.length
    ).toFixed(1),
  );
}

export function addSeasonStatTotals(
  current: SeasonStatTotals,
  next: SeasonStatTotals,
): SeasonStatTotals {
  return {
    appearances: current.appearances + next.appearances,
    starts: current.starts + next.starts,
    minutes: current.minutes + next.minutes,
    goals: current.goals + next.goals,
    sourceAssists: current.sourceAssists + next.sourceAssists,
    cleanSheets: current.cleanSheets + next.cleanSheets,
    goalsConceded: current.goalsConceded + next.goalsConceded,
    penaltyGoals: current.penaltyGoals + next.penaltyGoals,
    penaltyMisses: current.penaltyMisses + next.penaltyMisses,
    yellowCards: current.yellowCards + next.yellowCards,
    redCards: current.redCards + next.redCards,
    ownGoals: current.ownGoals + next.ownGoals,
  };
}

export const EMPTY_SEASON_STAT_TOTALS: SeasonStatTotals = {
  appearances: 0,
  starts: 0,
  minutes: 0,
  goals: 0,
  sourceAssists: 0,
  cleanSheets: 0,
  goalsConceded: 0,
  penaltyGoals: 0,
  penaltyMisses: 0,
  yellowCards: 0,
  redCards: 0,
  ownGoals: 0,
};

export type OfficialPlayerMatchCandidate = {
  playerId: string;
  clubExternalId: string;
  fullNameEn: string;
};

export type OfficialPlayerMatchResult =
  | { status: "matched"; playerId: string; method: "exact_name" | "manual" }
  | { status: "unmatched" | "ambiguous"; playerId: null; method: null };

function normalizeName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function matchOfficialSeasonPlayer(
  official: {
    personId: string;
    clubExternalId: string;
    fullNameEn: string;
  },
  candidates: OfficialPlayerMatchCandidate[],
  manualOverrides: Record<string, string>,
): OfficialPlayerMatchResult {
  const manualPlayerId = manualOverrides[official.personId];
  if (manualPlayerId) {
    const manualCandidate = candidates.find(
      (candidate) => candidate.playerId === manualPlayerId,
    );
    return manualCandidate
      ? {
          status: "matched",
          playerId: manualCandidate.playerId,
          method: "manual",
        }
      : { status: "unmatched", playerId: null, method: null };
  }

  const normalizedOfficialName = normalizeName(official.fullNameEn);
  const exactMatches = candidates.filter(
    (candidate) =>
      candidate.clubExternalId === official.clubExternalId &&
      normalizeName(candidate.fullNameEn) === normalizedOfficialName,
  );
  if (exactMatches.length === 1) {
    return {
      status: "matched",
      playerId: exactMatches[0].playerId,
      method: "exact_name",
    };
  }
  return {
    status: exactMatches.length > 1 ? "ambiguous" : "unmatched",
    playerId: null,
    method: null,
  };
}
