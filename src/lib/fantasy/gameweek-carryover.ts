import type { CaptainRole } from "./rules.ts";
import { refreshPlayerClubSnapshots } from "./player-club.ts";

export type GameweekCarryoverMember = {
  fantasyPlayerId: string;
  clubIdSnapshot: string;
  positionSnapshot:
    "goalkeeper" | "defender" | "midfielder" | "forward" | "unknown";
  tierSnapshot: number;
  isThaiSnapshot: boolean;
  lineupRole: "starter" | "bench";
  benchOrder: number | null;
  captainRole: CaptainRole;
};

export function createGameweekCarryover({
  selectionId,
  members,
  currentClubs,
}: {
  selectionId: string;
  members: GameweekCarryoverMember[];
  currentClubs: ReadonlyMap<string, string>;
}) {
  return refreshPlayerClubSnapshots(members, currentClubs).map((member) => ({
    selectionId,
    fantasyPlayerId: member.fantasyPlayerId,
    clubIdSnapshot: member.clubIdSnapshot,
    positionSnapshot: member.positionSnapshot,
    tierSnapshot: member.tierSnapshot,
    isThaiSnapshot: member.isThaiSnapshot,
    lineupRole: member.lineupRole,
    benchOrder: member.benchOrder,
    captainRole: member.captainRole,
  }));
}
