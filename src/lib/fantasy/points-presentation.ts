export type PointsLanguage = "th" | "en";

const breakdownLabels: Record<string, Record<PointsLanguage, string>> = {
  appearance: { th: "ลงสนาม", en: "Appearance" },
  goals: { th: "ประตู", en: "Goals" },
  assists: { th: "แอสซิสต์", en: "Assists" },
  cleanSheet: { th: "คลีนชีต", en: "Clean sheets" },
  saves: { th: "เซฟ", en: "Saves" },
  penaltySaves: { th: "เซฟจุดโทษ", en: "Penalty saves" },
  penaltyMisses: { th: "พลาดจุดโทษ", en: "Penalty misses" },
  goalsConceded: { th: "เสียประตู", en: "Goals conceded" },
  yellowCards: { th: "ใบเหลือง", en: "Yellow cards" },
  redCards: { th: "ใบแดง", en: "Red cards" },
  ownGoals: { th: "เข้าประตูตัวเอง", en: "Own goals" },
};

function normalizeBreakdownKey(key: string) {
  return key.replace(/_([a-z])/g, (_, character: string) =>
    character.toUpperCase(),
  );
}

export function getBreakdownLabel(key: string, language: PointsLanguage) {
  return (
    breakdownLabels[key]?.[language] ??
    breakdownLabels[normalizeBreakdownKey(key)]?.[language] ??
    (language === "th" ? "คะแนนอื่น" : "Other points")
  );
}

export function getDisplayedPlayerPoints({
  rawPoints,
  counted,
  isScoringCaptain,
  captainMultiplier,
}: {
  rawPoints: number;
  counted: boolean;
  isScoringCaptain: boolean;
  captainMultiplier: 2 | 3;
}) {
  return counted && isScoringCaptain
    ? rawPoints * captainMultiplier
    : rawPoints;
}

type BenchDisplayMember = {
  fantasyPlayerId: string;
  benchOrder: number | null;
};

type AutoSubstitution = {
  out: string;
  in: string;
};

export function sortBenchMembersForDisplay<T extends BenchDisplayMember>(
  benchMembers: readonly T[],
  squad: readonly BenchDisplayMember[],
  autoSubstitutions: readonly AutoSubstitution[],
) {
  const membersById = new Map(
    squad.map((member) => [member.fantasyPlayerId, member]),
  );
  const replacementByStarter = new Map(
    autoSubstitutions.map((substitution) => [
      substitution.out,
      substitution.in,
    ]),
  );
  const displayedBenchOrder = (member: BenchDisplayMember) => {
    if (member.benchOrder !== null) return member.benchOrder;
    const replacementId = replacementByStarter.get(member.fantasyPlayerId);
    return replacementId
      ? (membersById.get(replacementId)?.benchOrder ?? 99)
      : 99;
  };

  return [...benchMembers].sort(
    (left, right) => displayedBenchOrder(left) - displayedBenchOrder(right),
  );
}

export function summarizeGameweekScores(
  teams: Array<{ playerCount: number; totalPoints: number }>,
) {
  const scores = teams
    .filter((team) => team.playerCount > 0)
    .map((team) => team.totalPoints);
  if (scores.length === 0) {
    return { averagePoints: 0, highestPoints: 0 };
  }
  return {
    averagePoints: Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length,
    ),
    highestPoints: Math.max(...scores),
  };
}
