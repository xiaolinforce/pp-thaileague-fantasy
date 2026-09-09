export const MINIMUM_AUTO_FILL_OWNERSHIP_TEAMS = 30;

export function calculateOwnershipPercent(
  selectedTeamCount: number,
  countedTeamCount: number,
) {
  if (selectedTeamCount <= 0 || countedTeamCount <= 0) return 0;
  return Math.round((selectedTeamCount * 1_000) / countedTeamCount) / 10;
}

export function getSelectionOwnershipChange(
  previousPlayerIds: string[],
  nextPlayerIds: string[],
  squadSize: number,
) {
  const previousCounted = previousPlayerIds.length === squadSize;
  const nextCounted = nextPlayerIds.length === squadSize;
  const previous = previousCounted
    ? new Set(previousPlayerIds)
    : new Set<string>();
  const next = nextCounted ? new Set(nextPlayerIds) : new Set<string>();

  return {
    addedPlayerIds: [...next].filter((playerId) => !previous.has(playerId)),
    removedPlayerIds: [...previous].filter((playerId) => !next.has(playerId)),
    countedTeamDelta: Number(nextCounted) - Number(previousCounted),
  };
}

export function getAutoFillOwnershipScore({
  selectedPercent,
  countedTeamCount,
}: {
  selectedPercent: number;
  countedTeamCount: number;
}) {
  return countedTeamCount >= MINIMUM_AUTO_FILL_OWNERSHIP_TEAMS
    ? selectedPercent
    : 0;
}
