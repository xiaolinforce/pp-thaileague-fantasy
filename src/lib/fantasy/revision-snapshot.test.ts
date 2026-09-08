import assert from "node:assert/strict";
import test from "node:test";

import { normalizeFantasyRevisionMembers } from "./revision-snapshot.ts";

const canonicalMember = {
  fantasyPlayerId: "00000000-0000-0000-0000-000000000001",
  clubIdSnapshot: "00000000-0000-0000-0000-000000000002",
  positionSnapshot: "goalkeeper",
  tierSnapshot: 2,
  isThaiSnapshot: true,
  lineupRole: "starter",
  benchOrder: null,
  captainRole: "none",
};

test("keeps the canonical revision member contract", () => {
  assert.deepEqual(normalizeFantasyRevisionMembers([canonicalMember]), [
    canonicalMember,
  ]);
});

test("normalizes legacy scenario revision members", () => {
  assert.deepEqual(
    normalizeFantasyRevisionMembers([
      {
        fantasy_player_id: canonicalMember.fantasyPlayerId,
        club_id: canonicalMember.clubIdSnapshot,
        position: canonicalMember.positionSnapshot,
        tier: canonicalMember.tierSnapshot,
        is_thai: canonicalMember.isThaiSnapshot,
        lineup_role: canonicalMember.lineupRole,
        bench_order: canonicalMember.benchOrder,
        captain_role: canonicalMember.captainRole,
      },
    ]),
    [canonicalMember],
  );
});

test("rejects malformed revision member containers", () => {
  assert.equal(normalizeFantasyRevisionMembers(null), null);
  assert.equal(normalizeFantasyRevisionMembers([null]), null);
});
