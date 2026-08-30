import { THAI_LEAGUE_FANTASY_RULES, type FantasyChip } from "./rules.ts";

export function getChipOptionState({
  chip,
  gameweekNumber,
  remaining,
}: {
  chip: FantasyChip;
  gameweekNumber: number;
  remaining: number;
}) {
  if (remaining <= 0) return { disabled: true, reason: "exhausted" } as const;
  if (
    chip === "wildcard" &&
    gameweekNumber < THAI_LEAGUE_FANTASY_RULES.wildcardStartGameweek
  ) {
    return { disabled: true, reason: "not_started" } as const;
  }
  return { disabled: false, reason: "available" } as const;
}
