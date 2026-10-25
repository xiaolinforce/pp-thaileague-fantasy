export type TierMember = { id: string; tier: number };

// Only server-issued identities may exceed the ordinary five-player quota.
// An unsaved removal can be undone; a successful save shrinks this set.
export function isTierOneAllowed(
  players: readonly TierMember[],
  allowedPlayerIds: readonly string[] = [],
) {
  const elite = players.filter((player) => player.tier === 1);
  const allowed = new Set(allowedPlayerIds);
  return elite.length <= 5 || elite.every((player) => allowed.has(player.id));
}

export function remainingTierRelief(
  players: readonly TierMember[],
  allowedPlayerIds: readonly string[],
) {
  if (!isTierOneAllowed(players, allowedPlayerIds)) {
    throw new Error("Tier relief cannot introduce a new Level 1 player.");
  }
  const elite = players.filter((player) => player.tier === 1);
  return elite.length > 5 ? elite.map((player) => player.id).sort() : [];
}

export function reliefAfterTierChange(
  before: readonly TierMember[],
  after: readonly TierMember[],
  allowedPlayerIds: readonly string[] = [],
) {
  // Never legitimize an unrelated excess, incomplete squad or different roster.
  const ids = new Set(before.map((player) => player.id));
  if (
    before.length !== 15 ||
    ids.size !== 15 ||
    after.length !== 15 ||
    new Set(after.map((player) => player.id)).size !== 15 ||
    after.some((player) => !ids.has(player.id)) ||
    !isTierOneAllowed(before, allowedPlayerIds)
  )
    return [];
  const elite = after.filter((player) => player.tier === 1);
  return elite.length > 5 ? elite.map((player) => player.id).sort() : [];
}
