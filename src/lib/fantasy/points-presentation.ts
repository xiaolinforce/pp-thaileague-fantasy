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

export function summarizeGameweekScores(
  scores: Array<{ selectionId: string; totalPoints: number }>,
  currentSelectionId: string,
) {
  if (scores.length === 0) {
    return { averagePoints: 0, highestOtherManagerPoints: null };
  }
  const otherManagerScores = scores.filter(
    (score) => score.selectionId !== currentSelectionId,
  );
  return {
    averagePoints: Math.round(
      scores.reduce((sum, score) => sum + score.totalPoints, 0) / scores.length,
    ),
    highestOtherManagerPoints:
      otherManagerScores.length > 0
        ? Math.max(...otherManagerScores.map((score) => score.totalPoints))
        : null,
  };
}
