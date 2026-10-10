export function resolvePlayerClubs(
  rows: readonly { fantasyPlayerId: string; clubId: string }[],
) {
  const clubs = new Map<string, string>();
  for (const row of rows) {
    const previous = clubs.get(row.fantasyPlayerId);
    if (previous && previous !== row.clubId) {
      throw new Error("A Fantasy player has multiple eligible clubs.");
    }
    clubs.set(row.fantasyPlayerId, row.clubId);
  }
  return clubs;
}

// Only current/draft selections use current registrations. Locked history is
// preserved; its visual identity comes from the Gameweek's deadline pool.
export function refreshPlayerClubSnapshots<
  T extends { fantasyPlayerId: string; clubIdSnapshot: string },
>(members: readonly T[], clubs: ReadonlyMap<string, string>): T[] {
  return members.map((member) => ({
    ...member,
    clubIdSnapshot: clubs.get(member.fantasyPlayerId) ?? member.clubIdSnapshot,
  }));
}
