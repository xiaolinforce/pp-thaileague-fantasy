import assert from "node:assert/strict";
import test from "node:test";

import { buildFantasyRuleSections } from "./rule-content.ts";
import {
  calculatePlayerPoints,
  type PlayerMatchStats,
  type PointsBreakdown,
} from "./scoring.ts";
import { getCumulativeTierLimits } from "./rules.ts";

const emptyStats: PlayerMatchStats = {
  minutes: 0,
  goals: 0,
  sourceAssists: 0,
  goalsConcededWhilePlaying: 0,
  saves: 0,
  penaltySaves: 0,
  penaltyMisses: 0,
  yellowCards: 0,
  redCards: 0,
  ownGoals: 0,
};

// Compare every published table row with the actual scoring engine so that
// future scoring changes cannot silently leave either language's guide stale.
const events: Record<
  string,
  { stats: Partial<PlayerMatchStats>; category: keyof PointsBreakdown }
> = {
  "no-appearance": { stats: {}, category: "appearance" },
  "short-appearance": { stats: { minutes: 59 }, category: "appearance" },
  "full-appearance": { stats: { minutes: 60 }, category: "appearance" },
  goal: { stats: { goals: 1 }, category: "goals" },
  assist: { stats: { sourceAssists: 1 }, category: "assists" },
  "clean-sheet": { stats: { minutes: 60 }, category: "cleanSheet" },
  saves: { stats: { saves: 3 }, category: "saves" },
  "penalty-save": { stats: { penaltySaves: 1 }, category: "penaltySaves" },
  "penalty-miss": { stats: { penaltyMisses: 1 }, category: "penaltyMisses" },
  "goals-conceded": {
    stats: { goalsConcededWhilePlaying: 2 },
    category: "goalsConceded",
  },
  "yellow-card": { stats: { yellowCards: 1 }, category: "yellowCards" },
  "red-card": { stats: { redCards: 1 }, category: "redCards" },
  "own-goal": { stats: { ownGoals: 1 }, category: "ownGoals" },
};

for (const language of ["th", "en"] as const) {
  test(`${language} published scoring table matches every scoring category`, () => {
    const table = buildFantasyRuleSections(language).find(
      (section) => section.id === "scoring",
    )?.table;
    assert.ok(table);
    assert.deepEqual(
      table.rows.map((row) => row.id).sort(),
      Object.keys(events).sort(),
    );
    for (const row of table.rows) {
      const event = events[row.id];
      const expected = (
        ["goalkeeper", "defender", "midfielder", "forward"] as const
      ).map(
        (position) =>
          calculatePlayerPoints(position, { ...emptyStats, ...event.stats })
            .breakdown[event.category],
      );
      assert.deepEqual(row.values, expected, row.id);
    }
  });

  test(`${language} tier table matches cumulative squad validation limits`, () => {
    const table = buildFantasyRuleSections(language).find(
      (section) => section.id === "tiers",
    )?.table;
    assert.ok(table);
    assert.deepEqual(
      table.rows.map((row) => row.values[0]),
      getCumulativeTierLimits().map((tier) => tier.limit),
    );
  });
}
