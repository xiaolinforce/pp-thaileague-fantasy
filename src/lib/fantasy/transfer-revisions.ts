export type FantasyTransferRevisionState = {
  revision: number;
  status: "confirmed" | "cancelled";
  squad: unknown;
};

export function getTransferRevisionState(
  revisions: readonly FantasyTransferRevisionState[],
  openingGameweek: boolean,
) {
  const confirmed = revisions
    .filter((revision) => revision.status === "confirmed")
    .toSorted((a, b) => a.revision - b.revision);
  const baseline = confirmed[0] ?? null;
  const baselineSquadIds = Array.isArray(baseline?.squad)
    ? baseline.squad.filter(
        (fantasyPlayerId): fantasyPlayerId is string =>
          typeof fantasyPlayerId === "string",
      )
    : [];

  return {
    baselineRevision: openingGameweek ? null : (baseline?.revision ?? null),
    baselineSquadIds,
    hasPendingChanges: openingGameweek
      ? confirmed.length > 0
      : baseline !== null &&
        confirmed.some((revision) => revision.revision > baseline.revision),
  };
}
