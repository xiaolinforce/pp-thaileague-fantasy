export type FantasyPosition =
  "goalkeeper" | "defender" | "midfielder" | "forward";

export type FantasyChip = "triple_captain" | "bench_boost" | "wildcard";

export type CaptainRole = "none" | "captain" | "vice_captain";

export type SquadPlayer = {
  id: string;
  clubId: string;
  position: FantasyPosition;
  tier: number;
  isThai: boolean;
  isAvailable?: boolean;
};

export type LineupPlayer = SquadPlayer & {
  lineupRole: "starter" | "bench";
  benchOrder: number | null;
  captainRole: CaptainRole;
};

export type LineupAssignmentPlayer = Pick<
  LineupPlayer,
  "id" | "position" | "lineupRole" | "benchOrder" | "captainRole"
>;

export type TierSlot = {
  level: number;
  slots: number;
};

export type FantasyRules = {
  squadSize: number;
  positionLimits: Record<FantasyPosition, number>;
  minimumStarters: Record<FantasyPosition, number>;
  sameClubLimit: number;
  foreignPlayerLimit: number;
  tierSlots: TierSlot[];
  weeklyFreeTransfers: number;
  maximumFreeTransfers: number;
  transferPointCost: number;
  chipUsesPerSeason: number;
  wildcardStartGameweek: number;
};

export type RuleViolationCode =
  | "duplicate_player"
  | "squad_size"
  | "position_quota"
  | "club_quota"
  | "foreign_quota"
  | "tier_quota"
  | "unknown_tier"
  | "unavailable_player"
  | "starter_count"
  | "formation"
  | "bench_order"
  | "captain"
  | "vice_captain"
  | "chip_already_active"
  | "chip_unavailable"
  | "chip_limit";

export type RuleViolation = {
  code: RuleViolationCode;
  message: string;
  details?: Record<string, string | number | boolean>;
};

export const THAI_LEAGUE_FANTASY_RULES: FantasyRules = {
  squadSize: 15,
  positionLimits: {
    goalkeeper: 2,
    defender: 5,
    midfielder: 5,
    forward: 3,
  },
  minimumStarters: {
    goalkeeper: 1,
    defender: 3,
    midfielder: 2,
    forward: 1,
  },
  sameClubLimit: 3,
  foreignPlayerLimit: 7,
  tierSlots: [
    { level: 1, slots: 3 },
    { level: 2, slots: 3 },
    { level: 3, slots: 3 },
    { level: 4, slots: 6 },
  ],
  weeklyFreeTransfers: 2,
  maximumFreeTransfers: 4,
  transferPointCost: 4,
  chipUsesPerSeason: 2,
  wildcardStartGameweek: 2,
};

export function getCumulativeTierLimits(
  rules: Pick<FantasyRules, "tierSlots"> = THAI_LEAGUE_FANTASY_RULES,
) {
  let cumulativeLimit = 0;
  return [...rules.tierSlots]
    .sort((left, right) => left.level - right.level)
    .map((tier) => {
      cumulativeLimit += tier.slots;
      return { level: tier.level, limit: cumulativeLimit };
    });
}

function countBy<T extends string | number>(values: T[]) {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

export function validateSquad(
  squad: SquadPlayer[],
  rules: FantasyRules = THAI_LEAGUE_FANTASY_RULES,
): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const ids = countBy(squad.map((player) => player.id));

  for (const [playerId, count] of ids) {
    if (count > 1) {
      violations.push({
        code: "duplicate_player",
        message: "นักเตะหนึ่งคนอยู่ในทีมได้เพียงครั้งเดียว",
        details: { playerId },
      });
    }
  }

  if (squad.length !== rules.squadSize) {
    violations.push({
      code: "squad_size",
      message: `ทีมต้องมีนักเตะ ${rules.squadSize} คน`,
      details: { expected: rules.squadSize, actual: squad.length },
    });
  }

  const positions = countBy(squad.map((player) => player.position));
  for (const [position, expected] of Object.entries(
    rules.positionLimits,
  ) as Array<[FantasyPosition, number]>) {
    const actual = positions.get(position) ?? 0;
    if (actual !== expected) {
      violations.push({
        code: "position_quota",
        message: `จำนวนผู้เล่นตำแหน่ง ${position} ต้องเท่ากับ ${expected}`,
        details: { position, expected, actual },
      });
    }
  }

  for (const [clubId, count] of countBy(squad.map((player) => player.clubId))) {
    if (count > rules.sameClubLimit) {
      violations.push({
        code: "club_quota",
        message: `เลือกผู้เล่นจากสโมสรเดียวกันได้ไม่เกิน ${rules.sameClubLimit} คน`,
        details: { clubId, limit: rules.sameClubLimit, actual: count },
      });
    }
  }

  const foreignPlayers = squad.filter((player) => !player.isThai).length;
  if (foreignPlayers > rules.foreignPlayerLimit) {
    violations.push({
      code: "foreign_quota",
      message: `มีนักเตะต่างชาติได้ไม่เกิน ${rules.foreignPlayerLimit} คน`,
      details: { limit: rules.foreignPlayerLimit, actual: foreignPlayers },
    });
  }

  const sortedTierSlots = [...rules.tierSlots].sort(
    (a, b) => a.level - b.level,
  );
  const knownTiers = new Set(sortedTierSlots.map((tier) => tier.level));
  for (const player of squad) {
    if (!knownTiers.has(player.tier)) {
      violations.push({
        code: "unknown_tier",
        message: `ไม่พบระดับ ${player.tier} ในกติกาฤดูกาลนี้`,
        details: { playerId: player.id, tier: player.tier },
      });
    }
    if (player.isAvailable === false) {
      violations.push({
        code: "unavailable_player",
        message: "นักเตะไม่เปิดให้เลือกในตลาด",
        details: { playerId: player.id },
      });
    }
  }

  for (const tier of getCumulativeTierLimits(rules)) {
    const usedSlots = squad.filter(
      (player) => player.tier <= tier.level,
    ).length;
    if (usedSlots > tier.limit) {
      violations.push({
        code: "tier_quota",
        message: `ผู้เล่นระดับ 1–${tier.level} รวมกันได้ไม่เกิน ${tier.limit} คน`,
        details: {
          level: tier.level,
          limit: tier.limit,
          actual: usedSlots,
        },
      });
    }
  }

  return violations;
}

export function isValidStartingFormation(
  starters: Pick<SquadPlayer, "position">[],
  rules: FantasyRules = THAI_LEAGUE_FANTASY_RULES,
) {
  if (starters.length !== 11) return false;
  const positions = countBy(starters.map((player) => player.position));
  if ((positions.get("goalkeeper") ?? 0) !== 1) return false;
  return (
    Object.entries(rules.minimumStarters) as Array<[FantasyPosition, number]>
  ).every(([position, minimum]) => (positions.get(position) ?? 0) >= minimum);
}

export function swapLineupAssignments(
  lineup: LineupAssignmentPlayer[],
  fromId: string,
  toId: string,
): LineupAssignmentPlayer[] | null {
  const from = lineup.find((player) => player.id === fromId);
  const to = lineup.find((player) => player.id === toId);
  if (!from || !to || from.id === to.id) return null;

  const swapsStarterAndBench = from.lineupRole !== to.lineupRole;
  const outgoingStarter = swapsStarterAndBench
    ? from.lineupRole === "starter"
      ? from
      : to
    : null;
  const incomingStarter = swapsStarterAndBench
    ? from.lineupRole === "bench"
      ? from
      : to
    : null;

  const swapped = lineup.map((player) => {
    if (player.id === from.id) {
      return {
        ...player,
        lineupRole: to.lineupRole,
        benchOrder: to.benchOrder,
        captainRole: swapsStarterAndBench
          ? player.id === incomingStarter?.id
            ? (outgoingStarter?.captainRole ?? "none")
            : "none"
          : player.captainRole,
      };
    }
    if (player.id === to.id) {
      return {
        ...player,
        lineupRole: from.lineupRole,
        benchOrder: from.benchOrder,
        captainRole: swapsStarterAndBench
          ? player.id === incomingStarter?.id
            ? (outgoingStarter?.captainRole ?? "none")
            : "none"
          : player.captainRole,
      };
    }
    return player;
  });

  const hasAssignmentChange = swapped.some((player, index) => {
    const previous = lineup[index];
    return (
      player.lineupRole !== previous.lineupRole ||
      player.benchOrder !== previous.benchOrder ||
      player.captainRole !== previous.captainRole
    );
  });
  return hasAssignmentChange ? swapped : null;
}

export function validateLineupAssignment(
  lineup: LineupAssignmentPlayer[],
  rules: FantasyRules = THAI_LEAGUE_FANTASY_RULES,
): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const starters = lineup.filter((player) => player.lineupRole === "starter");
  const bench = lineup.filter((player) => player.lineupRole === "bench");

  if (starters.length !== 11 || bench.length !== rules.squadSize - 11) {
    violations.push({
      code: "starter_count",
      message: "ต้องเลือกตัวจริง 11 คนและตัวสำรอง 4 คน",
      details: { starters: starters.length, bench: bench.length },
    });
  }

  if (!isValidStartingFormation(starters, rules)) {
    violations.push({
      code: "formation",
      message: "ตัวจริงต้องมี 1 GK, อย่างน้อย 3 DEF, 2 MID และ 1 FWD",
    });
  }

  const benchOrders = bench.map((player) => player.benchOrder).sort();
  const hasExpectedBenchOrders =
    benchOrders.length === 4 &&
    benchOrders.every((order, index) => order === index) &&
    bench.filter(
      (player) => player.position === "goalkeeper" && player.benchOrder === 0,
    ).length === 1;
  if (!hasExpectedBenchOrders) {
    violations.push({
      code: "bench_order",
      message:
        "ผู้รักษาประตูสำรองต้องเป็นลำดับ 0 และตัวสำรองเอาต์ฟิลด์เป็น 1–3",
    });
  }

  const captains = starters.filter(
    (player) => player.captainRole === "captain",
  );
  const viceCaptains = starters.filter(
    (player) => player.captainRole === "vice_captain",
  );
  if (captains.length !== 1) {
    violations.push({
      code: "captain",
      message: "ต้องเลือกกัปตันจากตัวจริงหนึ่งคน",
    });
  }
  if (viceCaptains.length !== 1) {
    violations.push({
      code: "vice_captain",
      message: "ต้องเลือกรองกัปตันจากตัวจริงหนึ่งคน",
    });
  }

  return violations;
}

export function getValidLineupSwapTargetIds(
  lineup: LineupAssignmentPlayer[],
  fromId: string,
  rules: FantasyRules = THAI_LEAGUE_FANTASY_RULES,
) {
  const targetIds = new Set<string>();
  for (const candidate of lineup) {
    const swapped = swapLineupAssignments(lineup, fromId, candidate.id);
    if (swapped && validateLineupAssignment(swapped, rules).length === 0) {
      targetIds.add(candidate.id);
    }
  }
  return targetIds;
}

export function validateLineup(
  lineup: LineupPlayer[],
  rules: FantasyRules = THAI_LEAGUE_FANTASY_RULES,
): RuleViolation[] {
  return [
    ...validateSquad(lineup, rules),
    ...validateLineupAssignment(lineup, rules),
  ];
}

export function getNetTransfers(
  previousSquadIds: string[],
  nextSquadIds: string[],
) {
  const previous = new Set(previousSquadIds);
  const next = new Set(nextSquadIds);
  const outgoing = [...previous].filter((id) => !next.has(id));
  const incoming = [...next].filter((id) => !previous.has(id));
  return {
    outgoing,
    incoming,
    count: Math.max(outgoing.length, incoming.length),
  };
}

export function settleTransfers({
  freeTransfersBefore,
  transferCount,
  wildcard,
  rules = THAI_LEAGUE_FANTASY_RULES,
}: {
  freeTransfersBefore: number;
  transferCount: number;
  wildcard: boolean;
  rules?: FantasyRules;
}) {
  const safeFreeTransfers = Math.max(
    0,
    Math.min(rules.maximumFreeTransfers, freeTransfersBefore),
  );
  const safeTransferCount = Math.max(0, transferCount);
  const chargeableTransfers = wildcard
    ? 0
    : Math.max(0, safeTransferCount - safeFreeTransfers);
  const remainingFreeTransfers = wildcard
    ? safeFreeTransfers
    : Math.max(0, safeFreeTransfers - safeTransferCount);

  return {
    transferPoints: chargeableTransfers * rules.transferPointCost,
    freeTransfersAfter: Math.min(
      rules.maximumFreeTransfers,
      remainingFreeTransfers + rules.weeklyFreeTransfers,
    ),
  };
}

export function validateChipUse({
  chip,
  activeChip,
  previousUses,
  gameweekNumber,
  rules = THAI_LEAGUE_FANTASY_RULES,
}: {
  chip: FantasyChip;
  activeChip: FantasyChip | null;
  previousUses: number;
  gameweekNumber: number;
  rules?: FantasyRules;
}): RuleViolation[] {
  if (chip === "wildcard" && gameweekNumber < rules.wildcardStartGameweek) {
    return [
      {
        code: "chip_unavailable",
        message: "เปลี่ยนตัวอิสระใช้ได้ตั้งแต่ GW2",
      },
    ];
  }
  if (activeChip && activeChip !== chip) {
    return [
      {
        code: "chip_already_active",
        message: "ใช้ได้เพียงหนึ่ง Chip ต่อ Gameweek",
      },
    ];
  }
  if (previousUses >= rules.chipUsesPerSeason) {
    return [
      {
        code: "chip_limit",
        message: `Chip ชนิดนี้ใช้ได้ ${rules.chipUsesPerSeason} ครั้งต่อฤดูกาล`,
      },
    ];
  }
  return [];
}

export function getDeadline(firstKickoff: Date, offsetMinutes = 90) {
  return new Date(firstKickoff.getTime() - offsetMinutes * 60_000);
}

export function isBeforeDeadline(deadline: Date, now = new Date()) {
  return now.getTime() < deadline.getTime();
}
