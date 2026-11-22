import assert from "node:assert/strict";
import test from "node:test";

import {
  attributeAssists,
  summarizeMatchDetails,
  type FixtureMatchDetails,
  type MatchDetailPlayer,
} from "./match-details.ts";

function player(
  id: string,
  side: MatchDetailPlayer["side"],
  overrides: Partial<MatchDetailPlayer> = {},
): MatchDetailPlayer {
  return {
    fantasyPlayerId: id,
    name: { th: id, en: id },
    side,
    position: "MID",
    minutes: 90,
    goals: 0,
    assists: 0,
    ownGoals: 0,
    yellowCards: 0,
    redCards: 0,
    penaltyMisses: 0,
    penaltySaves: 0,
    points: 2,
    ...overrides,
  };
}

function match(
  players: MatchDetailPlayer[],
  homeScore = 0,
  awayScore = 0,
): FixtureMatchDetails {
  return {
    fixtureId: "fixture",
    homeScore,
    awayScore,
    homePenaltyScore: null,
    awayPenaltyScore: null,
    attendance: null,
    players,
  };
}

test("credits own goals to the opposing side and lists them last", () => {
  const summary = summarizeMatchDetails(
    match(
      [
        player("Home Striker", "home", { goals: 2 }),
        player("Away Defender", "away", { ownGoals: 1 }),
        player("Away Winger", "away", { goals: 1 }),
      ],
      3,
      1,
    ),
  );

  assert.deepEqual(
    summary.goals.home.map((entry) => [
      entry.name.en,
      entry.count,
      entry.ownGoal,
    ]),
    [
      ["Home Striker", 2, false],
      ["Away Defender", 1, true],
    ],
  );
  assert.deepEqual(
    summary.goals.away.map((entry) => entry.name.en),
    ["Away Winger"],
  );
  assert.equal(summary.goalsComplete, true);
});

test("flags a scoreline that recorded scorers do not fully explain", () => {
  const summary = summarizeMatchDetails(
    match([player("Only Scorer", "home", { goals: 1 })], 2, 0),
  );
  assert.equal(summary.goalsComplete, false);
});

test("groups assists and cards by side with red cards first", () => {
  const summary = summarizeMatchDetails(
    match([
      player("Booked", "home", { yellowCards: 1 }),
      player("Sent Off", "home", { yellowCards: 1, redCards: 1 }),
      player("Creator", "away", { assists: 2 }),
    ]),
  );
  assert.deepEqual(
    summary.cards.home.map((entry) => entry.name.en),
    ["Sent Off", "Booked"],
  );
  assert.deepEqual(summary.cards.away, []);
  assert.deepEqual(
    summary.unattributedAssists.away.map((entry) => [
      entry.name.en,
      entry.count,
    ]),
    [["Creator", 2]],
  );
});

test("ranks top performers by points and excludes unscored or unused players", () => {
  const summary = summarizeMatchDetails(
    match([
      player("A", "home", { points: 6 }),
      player("B", "away", { points: 9 }),
      player("C", "home", { points: 6, goals: 1 }),
      player("Unscored", "away", { points: null }),
      player("Unused", "home", { minutes: 0, points: 0 }),
      player("D", "away", { points: 1 }),
      player("E", "home", { points: 1 }),
      player("F", "home", { points: 0 }),
    ]),
  );
  assert.deepEqual(
    summary.topPerformers.map((entry) => entry.name.en),
    ["B", "C", "A", "D", "E"],
  );
});

test("reports when no player statistics were recorded", () => {
  const summary = summarizeMatchDetails(match([], 1, 0));
  assert.equal(summary.hasPlayerStats, false);
  assert.equal(summary.goalsComplete, false);
});

test("places assists under the scorer when the totals allow one outcome", () => {
  const summary = summarizeMatchDetails(
    match(
      [
        player("Striker", "home", { goals: 2 }),
        player("Winger", "home", { assists: 1 }),
        player("Captain", "home", { assists: 1 }),
      ],
      2,
      0,
    ),
  );
  assert.deepEqual(
    summary.goals.home[0].assists.map((entry) => entry.name.en),
    ["Captain", "Winger"],
  );
  assert.deepEqual(summary.unattributedAssists.home, []);
});

test("uses the rule that a player cannot assist their own goal", () => {
  const summary = summarizeMatchDetails(
    match(
      [
        player("A", "home", { goals: 1, assists: 1 }),
        player("B", "home", { goals: 1, assists: 1 }),
      ],
      2,
      0,
    ),
  );
  assert.deepEqual(
    summary.goals.home.map((entry) => [
      entry.name.en,
      entry.assists.map((assist) => assist.name.en),
    ]),
    [
      ["A", ["B"]],
      ["B", ["A"]],
    ],
  );
});

test("keeps ambiguous assists at side level instead of guessing", () => {
  const summary = summarizeMatchDetails(
    match(
      [
        player("A", "home", { goals: 1 }),
        player("B", "home", { goals: 1 }),
        player("Creator", "home", { assists: 1 }),
      ],
      2,
      0,
    ),
  );
  assert.ok(summary.goals.home.every((entry) => entry.assists.length === 0));
  assert.deepEqual(
    summary.unattributedAssists.home.map((entry) => entry.name.en),
    ["Creator"],
  );
});

test("never attributes assists to own goals", () => {
  assert.equal(
    attributeAssists([], [{ fantasyPlayerId: "Creator", count: 1 }]),
    null,
  );
  const summary = summarizeMatchDetails(
    match(
      [
        player("Scorer", "home", { goals: 1 }),
        player("Creator", "home", { assists: 1 }),
        player("Unlucky", "away", { ownGoals: 1 }),
      ],
      2,
      0,
    ),
  );
  const [scorer, ownGoal] = summary.goals.home;
  assert.deepEqual(
    scorer.assists.map((entry) => entry.name.en),
    ["Creator"],
  );
  assert.deepEqual(ownGoal.assists, []);
});
