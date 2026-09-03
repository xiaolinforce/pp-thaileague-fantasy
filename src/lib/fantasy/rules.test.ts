import assert from "node:assert/strict";
import test from "node:test";
import {
  getCountedTransfers,
  getCumulativeTierLimits,
  getDeadline,
  getNetTransfers,
  getTransferUsage,
  getValidLineupSwapTargetIds,
  settleTransfers,
  swapLineupAssignments,
  THAI_LEAGUE_FANTASY_RULES,
  validateChipUse,
  validateLineup,
  validateLineupAssignment,
  validateSquad,
  validateTransferLimit,
  type LineupPlayer,
  type SquadPlayer,
} from "./rules.ts";
import { calculatePlayerPoints, resolveTeamScore } from "./scoring.ts";

const positions = [
  "goalkeeper",
  "goalkeeper",
  "defender",
  "defender",
  "defender",
  "defender",
  "defender",
  "midfielder",
  "midfielder",
  "midfielder",
  "midfielder",
  "midfielder",
  "forward",
  "forward",
  "forward",
] as const;

function makeSquad(tiers = [1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4]) {
  return positions.map<SquadPlayer>((position, index) => ({
    id: `p${index + 1}`,
    clubId: `c${Math.floor(index / 3) + 1}`,
    position,
    tier: tiers[index],
    isThai: index >= 7,
  }));
}

function makeValidLineup() {
  const starters = new Set([
    "p1",
    "p3",
    "p4",
    "p5",
    "p8",
    "p9",
    "p10",
    "p11",
    "p13",
    "p14",
    "p15",
  ]);
  const benchOrder = new Map([
    ["p2", 0],
    ["p6", 1],
    ["p7", 2],
    ["p12", 3],
  ]);
  return makeSquad().map<LineupPlayer>((player) => ({
    ...player,
    lineupRole: starters.has(player.id) ? "starter" : "bench",
    benchOrder: starters.has(player.id)
      ? null
      : (benchOrder.get(player.id) ?? null),
    captainRole:
      player.id === "p8"
        ? "captain"
        : player.id === "p13"
          ? "vice_captain"
          : "none",
  }));
}

test("accepts the four-tier nominal allocation", () => {
  assert.deepEqual(validateSquad(makeSquad()), []);
});

test("derives cumulative tier limits of 3, 6, 12, and 15", () => {
  assert.deepEqual(getCumulativeTierLimits(), [
    { level: 1, limit: 3 },
    { level: 2, limit: 6 },
    { level: 3, limit: 12 },
    { level: 4, limit: 15 },
  ]);
});

test("reports only the level-one quota when its overflow carries forward", () => {
  const violations = validateSquad(
    makeSquad([1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 4]),
  );
  assert.deepEqual(
    violations.filter((violation) => violation.code === "tier_quota"),
    [
      {
        code: "tier_quota",
        message: "ผู้เล่นระดับ 1 รวมกันได้ไม่เกิน 3 คน",
        details: { level: 1, limit: 3, actual: 4 },
      },
    ],
  );
});

test("allows lower tiers to fill unused higher-tier slots", () => {
  assert.deepEqual(
    validateSquad(makeSquad([2, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 4])),
    [],
  );
  assert.deepEqual(
    validateSquad(makeSquad([3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4])),
    [],
  );
  assert.deepEqual(validateSquad(makeSquad(Array(15).fill(4))), []);
});

test("accepts twelve players across the top three tiers", () => {
  assert.deepEqual(
    validateSquad(makeSquad([1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4])),
    [],
  );
});

test("rejects cumulative tier quota overflow", () => {
  const sevenTopTwo = makeSquad([1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 4, 4, 4]);
  const thirteenTopThree = makeSquad([
    1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4,
  ]);
  assert.ok(
    validateSquad(sevenTopTwo).some(
      (violation) =>
        violation.code === "tier_quota" && violation.details?.level === 2,
    ),
  );
  assert.ok(
    validateSquad(thirteenTopThree).some(
      (violation) =>
        violation.code === "tier_quota" && violation.details?.level === 3,
    ),
  );
});

test("rejects a tier outside the season definition", () => {
  const violations = validateSquad(
    makeSquad([1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 5]),
  );
  assert.ok(violations.some((violation) => violation.code === "unknown_tier"));
});

test("rejects more than seven foreign players", () => {
  const squad = makeSquad().map((player, index) => ({
    ...player,
    isThai: index >= 8,
  }));
  assert.ok(
    validateSquad(squad).some(
      (violation) => violation.code === "foreign_quota",
    ),
  );
});

test("validates formation, captain and ordered bench", () => {
  assert.deepEqual(validateLineup(makeValidLineup()), []);
});

test("rejects swaps that put two goalkeepers in the starting eleven", () => {
  const swapped = swapLineupAssignments(makeValidLineup(), "p3", "p2");
  assert.ok(swapped);
  const violationCodes = validateLineupAssignment(swapped).map(
    (violation) => violation.code,
  );
  assert.ok(violationCodes.includes("formation"));
  assert.ok(violationCodes.includes("bench_order"));
});

test("accepts valid starter and bench swaps", () => {
  const outfieldSwap = swapLineupAssignments(makeValidLineup(), "p3", "p6");
  assert.ok(outfieldSwap);
  assert.deepEqual(validateLineupAssignment(outfieldSwap), []);

  const goalkeeperSwap = swapLineupAssignments(makeValidLineup(), "p1", "p2");
  assert.ok(goalkeeperSwap);
  assert.deepEqual(validateLineupAssignment(goalkeeperSwap), []);
});

test("returns only meaningful valid swap targets", () => {
  const defenderTargets = getValidLineupSwapTargetIds(makeValidLineup(), "p3");
  assert.ok(defenderTargets.has("p6"));
  assert.ok(defenderTargets.has("p7"));
  assert.equal(defenderTargets.has("p2"), false);
  assert.equal(defenderTargets.has("p4"), false);

  const captainTargets = getValidLineupSwapTargetIds(makeValidLineup(), "p8");
  assert.ok(captainTargets.has("p6"));
  assert.ok(captainTargets.has("p7"));
  assert.ok(captainTargets.has("p12"));
  assert.equal(captainTargets.has("p2"), false);

  const viceCaptainTargets = getValidLineupSwapTargetIds(
    makeValidLineup(),
    "p13",
  );
  assert.ok(viceCaptainTargets.has("p6"));
  assert.ok(viceCaptainTargets.has("p7"));
  assert.ok(viceCaptainTargets.has("p12"));
});

test("passes captaincy to the substitute who replaces the captain", () => {
  const captainSwap = swapLineupAssignments(makeValidLineup(), "p8", "p12");
  assert.ok(captainSwap);
  assert.deepEqual(validateLineupAssignment(captainSwap), []);
  assert.equal(
    captainSwap.find((player) => player.id === "p8")?.captainRole,
    "none",
  );
  assert.equal(
    captainSwap.find((player) => player.id === "p12")?.captainRole,
    "captain",
  );
});

test("passes vice-captaincy when a bench player initiates the swap", () => {
  const viceCaptainSwap = swapLineupAssignments(makeValidLineup(), "p6", "p13");
  assert.ok(viceCaptainSwap);
  assert.deepEqual(validateLineupAssignment(viceCaptainSwap), []);
  assert.equal(
    viceCaptainSwap.find((player) => player.id === "p13")?.captainRole,
    "none",
  );
  assert.equal(
    viceCaptainSwap.find((player) => player.id === "p6")?.captainRole,
    "vice_captain",
  );
});

test("keeps captaincy with each player when both players are starters", () => {
  const lineup = makeValidLineup();
  const swapped = swapLineupAssignments(lineup, "p8", "p13");

  assert.equal(swapped, null);
  assert.equal(
    lineup.find((player) => player.id === "p8")?.captainRole,
    "captain",
  );
  assert.equal(
    lineup.find((player) => player.id === "p13")?.captainRole,
    "vice_captain",
  );
});

test("counts transfers by the net squad difference", () => {
  const diff = getNetTransfers(["a", "b", "c"], ["a", "b", "d"]);
  assert.deepEqual(diff, { outgoing: ["c"], incoming: ["d"], count: 1 });
});

test("does not count the first completed squad as transfers", () => {
  assert.equal(
    getCountedTransfers(
      [],
      Array.from({ length: 15 }, (_, i) => `p${i}`),
    ),
    0,
  );
  assert.equal(
    getCountedTransfers(
      Array.from({ length: 15 }, (_, i) => `p${i}`),
      Array.from({ length: 15 }, (_, i) =>
        i === 14 ? "replacement" : `p${i}`,
      ),
    ),
    1,
  );
});

test("allows up to three chargeable transfers and rejects the fourth", () => {
  assert.deepEqual(
    validateTransferLimit({
      freeTransfersBefore: 2,
      transferCount: 5,
      wildcard: false,
    }),
    [],
  );
  assert.deepEqual(
    getTransferUsage({
      freeTransfersBefore: 2,
      transferCount: 6,
      wildcard: false,
    }),
    {
      chargeableTransfers: 4,
      freeTransfersRemaining: 0,
      hasUnlimitedTransfers: false,
      maximumTransferPoints: 12,
      transferPoints: 16,
      exceedsChargeableTransferLimit: true,
    },
  );
  assert.deepEqual(
    validateTransferLimit({
      freeTransfersBefore: 2,
      transferCount: 6,
      wildcard: false,
    }),
    [
      {
        code: "transfer_limit",
        message:
          "เปลี่ยนนักเตะเกินโควต้าติดลบได้สูงสุด {count} คน (-{points} คะแนน)",
        details: {
          limit: 3,
          maximumTransferPoints: 12,
          chargeableTransfers: 4,
          transferPoints: 16,
        },
      },
    ],
  );
});

test("opening Gameweek and wildcard transfers bypass the paid-transfer cap", () => {
  for (const exception of [
    { wildcard: false, openingGameweek: true },
    { wildcard: true, openingGameweek: false },
  ]) {
    assert.deepEqual(
      validateTransferLimit({
        freeTransfersBefore: 0,
        transferCount: 15,
        ...exception,
      }),
      [],
    );
  }
});

test("adds two free transfers and caps the balance at four", () => {
  assert.deepEqual(
    settleTransfers({
      freeTransfersBefore: 2,
      transferCount: 0,
      wildcard: false,
    }),
    { transferPoints: 0, freeTransfersAfter: 4 },
  );
  assert.deepEqual(
    settleTransfers({
      freeTransfersBefore: 2,
      transferCount: 4,
      wildcard: false,
    }),
    { transferPoints: 8, freeTransfersAfter: 2 },
  );
});

test("wildcard preserves saved transfers and still adds the weekly allowance", () => {
  assert.deepEqual(
    settleTransfers({
      freeTransfersBefore: 2,
      transferCount: 12,
      wildcard: true,
    }),
    { transferPoints: 0, freeTransfersAfter: 4 },
  );
});

test("wildcard is unavailable in Gameweek 1 and available from Gameweek 2", () => {
  assert.deepEqual(
    validateChipUse({
      chip: "wildcard",
      activeChip: null,
      previousUses: 0,
      gameweekNumber: 1,
    }),
    [
      {
        code: "chip_unavailable",
        message: "เปลี่ยนตัวอิสระใช้ได้ตั้งแต่ GW2",
      },
    ],
  );
  assert.deepEqual(
    validateChipUse({
      chip: "wildcard",
      activeChip: null,
      previousUses: 0,
      gameweekNumber: 2,
    }),
    [],
  );
});

test("sets the deadline 90 minutes before the first kickoff", () => {
  const kickoff = new Date("2026-08-20T12:00:00.000Z");
  assert.equal(getDeadline(kickoff).toISOString(), "2026-08-20T10:30:00.000Z");
});

test("calculates FPL points without defensive contribution or bonus", () => {
  const score = calculatePlayerPoints("defender", {
    minutes: 90,
    goals: 1,
    sourceAssists: 1,
    goalsConcededWhilePlaying: 0,
    saves: 0,
    penaltySaves: 0,
    penaltyMisses: 0,
    yellowCards: 1,
    redCards: 0,
    ownGoals: 0,
  });
  assert.equal(score.total, 14);
  assert.equal("bonus" in score.breakdown, false);
});

test("ignores goals conceded after a player has left the pitch", () => {
  const score = calculatePlayerPoints("defender", {
    minutes: 65,
    goals: 0,
    sourceAssists: 0,
    goalsConcededWhilePlaying: 0,
    saves: 0,
    penaltySaves: 0,
    penaltyMisses: 0,
    yellowCards: 0,
    redCards: 1,
    ownGoals: 0,
  });
  assert.equal(score.breakdown.cleanSheet, 4);
  assert.equal(score.breakdown.goalsConceded, 0);
  assert.equal(score.total, 3);
});

test("auto-subs preserve formation and triple captain passes to vice captain", () => {
  const selection = [
    {
      playerId: "gk",
      position: "goalkeeper",
      lineupRole: "starter",
      benchOrder: null,
      captainRole: "none",
    },
    {
      playerId: "d1",
      position: "defender",
      lineupRole: "starter",
      benchOrder: null,
      captainRole: "none",
    },
    {
      playerId: "d2",
      position: "defender",
      lineupRole: "starter",
      benchOrder: null,
      captainRole: "none",
    },
    {
      playerId: "d3",
      position: "defender",
      lineupRole: "starter",
      benchOrder: null,
      captainRole: "none",
    },
    {
      playerId: "m1",
      position: "midfielder",
      lineupRole: "starter",
      benchOrder: null,
      captainRole: "captain",
    },
    {
      playerId: "m2",
      position: "midfielder",
      lineupRole: "starter",
      benchOrder: null,
      captainRole: "none",
    },
    {
      playerId: "m3",
      position: "midfielder",
      lineupRole: "starter",
      benchOrder: null,
      captainRole: "none",
    },
    {
      playerId: "m4",
      position: "midfielder",
      lineupRole: "starter",
      benchOrder: null,
      captainRole: "none",
    },
    {
      playerId: "m5",
      position: "midfielder",
      lineupRole: "starter",
      benchOrder: null,
      captainRole: "none",
    },
    {
      playerId: "f1",
      position: "forward",
      lineupRole: "starter",
      benchOrder: null,
      captainRole: "vice_captain",
    },
    {
      playerId: "f2",
      position: "forward",
      lineupRole: "starter",
      benchOrder: null,
      captainRole: "none",
    },
    {
      playerId: "gk2",
      position: "goalkeeper",
      lineupRole: "bench",
      benchOrder: 0,
      captainRole: "none",
    },
    {
      playerId: "m6",
      position: "midfielder",
      lineupRole: "bench",
      benchOrder: 1,
      captainRole: "none",
    },
    {
      playerId: "d4",
      position: "defender",
      lineupRole: "bench",
      benchOrder: 2,
      captainRole: "none",
    },
    {
      playerId: "f3",
      position: "forward",
      lineupRole: "bench",
      benchOrder: 3,
      captainRole: "none",
    },
  ] as const;
  const results = selection.map((player) => ({
    playerId: player.playerId,
    minutes: player.playerId === "m1" || player.playerId === "d1" ? 0 : 90,
    points: player.playerId === "f1" ? 8 : player.playerId === "d4" ? 6 : 2,
  }));
  const score = resolveTeamScore({
    selection: [...selection],
    playerResults: results,
    activeChip: "triple_captain",
    transferPoints: 0,
  });
  assert.deepEqual(score.autoSubstitutions, [
    { out: "d1", in: "d4" },
    { out: "m1", in: "m6" },
  ]);
  assert.equal(score.captainBonus, 16);
});

test("bench boost counts every squad member exactly once", () => {
  const selection = makeSquad().map((player, index) => ({
    playerId: player.id,
    position: player.position,
    lineupRole: index < 11 ? ("starter" as const) : ("bench" as const),
    benchOrder: index < 11 ? null : index - 11,
    captainRole:
      index === 0
        ? ("captain" as const)
        : index === 1
          ? ("vice_captain" as const)
          : ("none" as const),
  }));
  const score = resolveTeamScore({
    selection,
    playerResults: selection.map((player) => ({
      playerId: player.playerId,
      minutes: 90,
      points: 2,
    })),
    activeChip: "bench_boost",
    transferPoints: 0,
  });
  assert.equal(score.totalPoints, 32);
  assert.equal(score.countedPlayerIds.length, 15);
});

test("an unsaved empty selection scores zero when the Gameweek locks", () => {
  const score = resolveTeamScore({
    selection: [],
    playerResults: [],
    activeChip: null,
    transferPoints: 0,
  });

  assert.deepEqual(score, {
    lineupPoints: 0,
    benchPoints: 0,
    captainBonus: 0,
    transferPoints: 0,
    totalPoints: 0,
    countedPlayerIds: [],
    autoSubstitutions: [],
  });
});

test("default rules remain the agreed 15-player configuration", () => {
  assert.equal(THAI_LEAGUE_FANTASY_RULES.squadSize, 15);
  assert.equal(THAI_LEAGUE_FANTASY_RULES.maximumFreeTransfers, 4);
  assert.equal(THAI_LEAGUE_FANTASY_RULES.maximumChargeableTransfers, 3);
});
