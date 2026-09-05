import {
  THAI_LEAGUE_FANTASY_RULES,
  type CaptainRole,
  type FantasyChip,
} from "./rules.ts";

export type FantasySelectionInput = {
  selectionId: string;
  expectedRevision: number;
  members: Array<{
    fantasyPlayerId: string;
    lineupRole: "starter" | "bench";
    benchOrder: number | null;
    captainRole: CaptainRole;
  }>;
  activeChip: FantasyChip | null;
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isFantasySelectionInput(
  value: unknown,
): value is FantasySelectionInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Record<string, unknown>;
  if (
    typeof input.selectionId !== "string" ||
    !uuid.test(input.selectionId) ||
    !Number.isSafeInteger(input.expectedRevision) ||
    (input.expectedRevision as number) < 0 ||
    !Array.isArray(input.members) ||
    input.members.length !== THAI_LEAGUE_FANTASY_RULES.squadSize ||
    ![null, "wildcard", "bench_boost", "triple_captain"].includes(
      input.activeChip as string | null,
    )
  )
    return false;
  const ids = new Set<string>();
  const benchOrders = new Set<number>();
  for (const value of input.members) {
    if (!value || typeof value !== "object") return false;
    const member = value as Record<string, unknown>;
    if (
      typeof member.fantasyPlayerId !== "string" ||
      !uuid.test(member.fantasyPlayerId) ||
      ids.has(member.fantasyPlayerId) ||
      !["none", "captain", "vice_captain"].includes(
        member.captainRole as string,
      )
    )
      return false;
    ids.add(member.fantasyPlayerId);
    if (member.lineupRole === "starter") {
      if (member.benchOrder !== null) return false;
    } else if (member.lineupRole === "bench") {
      if (
        !Number.isInteger(member.benchOrder) ||
        (member.benchOrder as number) < 0 ||
        (member.benchOrder as number) > 3 ||
        benchOrders.has(member.benchOrder as number) ||
        member.captainRole !== "none"
      )
        return false;
      benchOrders.add(member.benchOrder as number);
    } else return false;
  }
  return true;
}
