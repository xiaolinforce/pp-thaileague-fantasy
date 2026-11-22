import assert from "node:assert/strict";
import test from "node:test";

import {
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
    summary.assists.away.map((entry) => [entry.name.en, entry.count]),
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

test("summarizes assists per side without attaching them to scorers", () => {
  const summary = summarizeMatchDetails(
    match(
      [
        player("A", "home", { goals: 1, assists: 1 }),
        player("B", "home", { goals: 1, assists: 1 }),
        player("Unlucky", "away", { ownGoals: 1 }),
      ],
      3,
      0,
    ),
  );
  assert.deepEqual(
    summary.assists.home.map((entry) => entry.name.en),
    ["A", "B"],
  );
  assert.ok(summary.goals.home.every((entry) => !("assists" in entry)));
});
