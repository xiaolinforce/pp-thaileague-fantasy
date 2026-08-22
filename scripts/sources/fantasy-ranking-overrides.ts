export type FantasyRankingOverride = {
  officialPersonId?: number;
  manualAdjustment?: number;
  reason: string;
};

/**
 * Reviewed exceptions only. Keys are stable Transfermarkt player IDs from the
 * current-season registration source. Never add a name-only override.
 */
export const fantasyRankingOverrides: Record<string, FantasyRankingOverride> =
  {};
