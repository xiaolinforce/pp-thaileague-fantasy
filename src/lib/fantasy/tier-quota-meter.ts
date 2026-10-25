import { THAI_LEAGUE_FANTASY_RULES } from "./rules.ts";

export function buildTierQuotaMeter(levelCounts: Readonly<Record<1, number>>) {
  const limit = THAI_LEAGUE_FANTASY_RULES.tierSlots[0].slots;
  return Array.from({ length: limit }, (_, index) =>
    index < levelCounts[1] ? (1 as const) : null,
  );
}
