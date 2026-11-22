import { THAI_LEAGUE_FANTASY_RULES } from "./rules.ts";

export function buildTierQuotaMeter(levelOneCount: number) {
  const limit = THAI_LEAGUE_FANTASY_RULES.tierSlots[0].slots;
  return Array.from({ length: Math.max(limit, levelOneCount) }, (_, index) => {
    if (index >= limit) return "overflow";
    return index < levelOneCount ? "filled" : "empty";
  });
}
