export function hasConfirmedNoAppearance(
  results: ReadonlyMap<string, { minutes: number }>,
  playerId: string,
  scoreComplete: boolean,
) {
  const result = results.get(playerId);
  return result ? result.minutes === 0 : scoreComplete;
}

export function getScoringCaptainId(
  captainId: string | null,
  viceCaptainId: string | null,
  results: ReadonlyMap<string, { minutes: number }>,
  scoreComplete: boolean,
) {
  if (!captainId) return null;
  if ((results.get(captainId)?.minutes ?? 0) > 0) {
    return captainId;
  }
  if (!hasConfirmedNoAppearance(results, captainId, scoreComplete)) {
    return null;
  }
  return viceCaptainId && (results.get(viceCaptainId)?.minutes ?? 0) > 0
    ? viceCaptainId
    : null;
}
