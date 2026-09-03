export type TierQuotaMeterLevel = 1 | 2 | 3;

const tierQuotaMeterLevels: readonly TierQuotaMeterLevel[] = [1, 2, 3];
const tierQuotaMeterSize = 9;

export function buildTierQuotaMeter(
  levelCounts: Readonly<Record<TierQuotaMeterLevel, number>>,
) {
  const dots: Array<TierQuotaMeterLevel | null> = [];

  for (const level of tierQuotaMeterLevels) {
    const availableDots = tierQuotaMeterSize - dots.length;
    const visiblePlayers = Math.min(levelCounts[level], availableDots);

    for (let index = 0; index < visiblePlayers; index += 1) {
      dots.push(level);
    }

    if (dots.length === tierQuotaMeterSize) break;
  }

  while (dots.length < tierQuotaMeterSize) dots.push(null);

  return dots;
}
