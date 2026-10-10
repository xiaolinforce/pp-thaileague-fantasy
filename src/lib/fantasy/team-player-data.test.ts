import assert from "node:assert/strict";
import test from "node:test";
import type {
  CompetitionDataset,
  CompetitionPlayerView,
} from "../competition-types.ts";
import { mergeTeamPlayerData } from "./team-player-data.ts";

function player(id: string): CompetitionPlayerView {
  return {
    id,
    fantasyPlayerId: id,
    clubId: "old",
    name: { th: id, en: id },
    shortName: { th: id, en: id },
    club: { th: "เก่า", en: "Old" },
    clubShort: { th: "เก่า", en: "Old" },
    position: "MID",
    price: 3,
    tier: 3,
    isThai: true,
    points: 11,
    form: 2.2,
    fantasyAppearances: 1,
    selected: 5,
    next: { th: "—", en: "—" },
    recentMatches: [],
    color: "#000000",
    accent: "#000000",
  };
}

test("team retains unavailable players, refreshes club colors, and leaves market data and scores unchanged", () => {
  const moved = player("moved");
  const retired = { ...player("retired"), isAvailable: false };
  const data: CompetitionDataset = {
    season: { th: "2026/27", en: "2026/27" },
    players: [moved],
    fixtures: [],
    clubs: [
      {
        id: "new",
        name: { th: "ใหม่", en: "New" },
        shortName: { th: "ใหม่", en: "New" },
        abbreviation: "NEW",
        colors: ["#ff0000", "#ffffff", "#ff0000", "#ffffff"],
      },
    ],
    matchweeks: [],
    currentGameweek: 5,
    statistics: {
      fantasy: { available: true, lastUpdatedAt: null },
      football: {
        available: false,
        lastUpdatedAt: null,
        sourceUrl: null,
        players: [],
      },
    },
  };
  const result = mergeTeamPlayerData(
    data,
    [retired],
    [
      {
        fantasyPlayerId: "moved",
        clubId: "new",
        position: "midfielder",
        tier: 3,
        isThai: true,
        isAvailable: true,
      },
      {
        fantasyPlayerId: "retired",
        clubId: "old",
        position: "defender",
        tier: 4,
        isThai: true,
        isAvailable: false,
      },
    ],
  );
  assert.equal(result.players.length, 2);
  assert.equal(result.players[0].club.en, "New");
  assert.equal(result.players[0].color, "#ff0000");
  assert.equal(result.players[0].points, 11);
  assert.equal(result.players[1].isAvailable, false);
  assert.equal(result.players[1].position, "DEF");
  assert.equal(data.players.length, 1);
  assert.equal(data.players[0].clubId, "old");
  const historical = mergeTeamPlayerData(
    data,
    [],
    [
      {
        fantasyPlayerId: "moved",
        clubId: "old",
        position: "midfielder",
        tier: 2,
        isThai: true,
      },
    ],
  );
  assert.equal(historical.players[0].clubId, "old");
  assert.equal(historical.players[0].tier, 2);
});
