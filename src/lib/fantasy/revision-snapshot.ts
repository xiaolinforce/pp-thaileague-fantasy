function readSnapshotValue(
  member: Record<string, unknown>,
  canonicalKey: string,
  ...legacyKeys: string[]
) {
  for (const key of [canonicalKey, ...legacyKeys]) {
    if (Object.prototype.hasOwnProperty.call(member, key)) return member[key];
  }
  return undefined;
}

export function normalizeFantasyRevisionMembers(
  value: unknown,
): Array<Record<string, unknown>> | null {
  if (!Array.isArray(value)) return null;

  const normalized: Array<Record<string, unknown>> = [];
  for (const valueMember of value) {
    if (!valueMember || typeof valueMember !== "object") return null;
    const member = valueMember as Record<string, unknown>;
    normalized.push({
      fantasyPlayerId: readSnapshotValue(
        member,
        "fantasyPlayerId",
        "fantasy_player_id",
      ),
      clubIdSnapshot: readSnapshotValue(
        member,
        "clubIdSnapshot",
        "club_id_snapshot",
        "club_id",
      ),
      positionSnapshot: readSnapshotValue(
        member,
        "positionSnapshot",
        "position_snapshot",
        "position",
      ),
      tierSnapshot: readSnapshotValue(
        member,
        "tierSnapshot",
        "tier_snapshot",
        "tier",
      ),
      isThaiSnapshot: readSnapshotValue(
        member,
        "isThaiSnapshot",
        "is_thai_snapshot",
        "is_thai",
      ),
      lineupRole: readSnapshotValue(member, "lineupRole", "lineup_role"),
      benchOrder: readSnapshotValue(member, "benchOrder", "bench_order"),
      captainRole: readSnapshotValue(member, "captainRole", "captain_role"),
    });
  }
  return normalized;
}
