import {
  resolvePlayerTier,
  type CaptainRole,
  type TierRulesVersion,
} from "./rules.ts";
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
  tierRulesVersion = "two-tier-v1",
}: {
  selectionId: string;
  members: GameweekCarryoverMember[];
  currentClubs: ReadonlyMap<string, string>;
  tierRulesVersion?: TierRulesVersion;
}) {
  return refreshPlayerClubSnapshots(members, currentClubs).map((member) => ({
    selectionId,
    fantasyPlayerId: member.fantasyPlayerId,
    clubIdSnapshot: member.clubIdSnapshot,
    positionSnapshot: member.positionSnapshot,
    tierSnapshot: resolvePlayerTier(member.tierSnapshot, tierRulesVersion),
    isThaiSnapshot: member.isThaiSnapshot,
    lineupRole: member.lineupRole,
    benchOrder: member.benchOrder,
    captainRole: member.captainRole,
  }));
}
