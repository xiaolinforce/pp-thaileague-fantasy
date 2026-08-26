export type TierQuotaMeterLevel = 1 | 2 | 3;

const tierQuotaPlacements: ReadonlyArray<{
  level: TierQuotaMeterLevel;
  indexes: readonly number[];
}> = [
  { level: 1, indexes: [0, 1, 2] },
  { level: 2, indexes: [3, 4, 5, 2, 1, 0] },
  { level: 3, indexes: [6, 7, 8, 5, 4, 3, 2, 1, 0] },
];

export function buildTierQuotaMeter(
  levelCounts: Readonly<Record<TierQuotaMeterLevel, number>>,
) {
  const dots: Array<TierQuotaMeterLevel | null> = Array.from(
    { length: 9 },
    () => null,
  );

  for (const { level, indexes } of tierQuotaPlacements) {
    let playersLeft = levelCounts[level];

    for (const index of indexes) {
      if (playersLeft <= 0) break;
      if (dots[index] !== null) continue;

      dots[index] = level;
      playersLeft -= 1;
    }
  }

  return dots;
}
