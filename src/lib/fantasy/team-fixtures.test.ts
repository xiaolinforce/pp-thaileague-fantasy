import assert from "node:assert/strict";
import test from "node:test";
import type {
  CompetitionClubView,
  CompetitionFixtureView,
} from "../competition-types.ts";
import {
  getGameweekFixturesByClub,
  getGameweekOpponentInfo,
} from "./team-fixtures.ts";

function club(id: string, th: string): CompetitionClubView {
  return {
    id,
    name: { th, en: id },
    shortName: { th, en: id },
    abbreviation: id,
    colors: ["#000", "#000", "#000", "#000"],
  };
}
const buriram = club("Buriram", "บุรีรัมย์");
const prachuap = club("Prachuap", "ประจวบ");
const ratchaburi = club("Ratchaburi", "ราชบุรี");
function fixture(
  overrides: Partial<CompetitionFixtureView> = {},
): CompetitionFixtureView {
  return {
    id: "gw7",
    matchweek: 7,
    kickoffAt: "2027-01-03T12:00:00Z",
    home: buriram,
    away: prachuap,
    homeScore: null,
    awayScore: null,
    venue: null,
    dateLabel: { th: "3 ม.ค.", en: "3 Jan" },
    timeLabel: { th: "19:00", en: "19:00" },
    status: "scheduled",
    ...overrides,
  };
}

test("GW7 keeps Prachuap even when Ratchaburi is the next chronological fixture", () => {
  const laterGameweek = fixture({
    id: "gw8",
    matchweek: 8,
    away: ratchaburi,
    kickoffAt: "2026-11-01T12:00:00Z",
  });
  const byClub = getGameweekFixturesByClub([laterGameweek, fixture()], 7);
  assert.deepEqual(
    byClub.get(buriram.id)?.map((item) => item.id),
    ["gw7"],
  );
  assert.deepEqual(
    byClub.get(prachuap.id)?.map((item) => item.id),
    ["gw7"],
  );
  assert.equal(byClub.has(ratchaburi.id), false);
});

test("retains postponed, undated and finished GW fixtures but excludes cancelled ones", () => {
  const fixtures = [
    fixture({ id: "postponed", status: "postponed", kickoffAt: null }),
    fixture({ id: "finished", status: "finished" }),
    fixture({ id: "cancelled", status: "cancelled" }),
  ];
  const before = structuredClone(fixtures);
  const selected = getGameweekFixturesByClub(fixtures, 7).get(buriram.id)!;
  assert.deepEqual(
    selected.map((item) => item.id),
    ["finished", "postponed"],
  );
  assert.deepEqual(fixtures, before);
});

test("multiple GW fixtures retain every opponent with separate home/away markers", () => {
  const fixtures = [
    fixture({ id: "away", home: ratchaburi, away: buriram, kickoffAt: null }),
    fixture(),
  ];
  const selected = getGameweekFixturesByClub(fixtures, 7).get(buriram.id)!;
  for (const language of ["th", "en"] as const) {
    const info = getGameweekOpponentInfo(selected, buriram.id, 7, language);
    assert.deepEqual(
      info.opponents.map((item) => item.venue),
      ["H", "A"],
    );
    assert.deepEqual(
      info.opponents.map((item) => item.value),
      language === "th" ? ["ประจวบ", "ราชบุรี"] : ["Prachuap", "Ratchaburi"],
    );
    assert.match(info.title, /GW7:/);
    assert.ok(info.title.includes(language === "th" ? "3 ม.ค." : "3 Jan"));
  }
});

test("a blank GW does not fall back to a future fixture and explains the state in both languages", () => {
  const selected =
    getGameweekFixturesByClub([fixture({ matchweek: 8 })], 7).get(buriram.id) ??
    [];
  assert.equal(
    getGameweekOpponentInfo(selected, buriram.id, 7, "th").title,
    "ไม่มีโปรแกรมใน GW นี้ (GW7)",
  );
  assert.equal(
    getGameweekOpponentInfo(selected, buriram.id, 7, "en").title,
    "No fixture in this GW (GW7)",
  );
  assert.deepEqual(
    getGameweekOpponentInfo(selected, buriram.id, 7, "th").opponents,
    [],
  );
});
