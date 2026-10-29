import {
  localize,
  type AppLanguage,
  type CompetitionFixtureView,
} from "../competition-types.ts";

export function getGameweekFixturesByClub(
  fixtures: readonly CompetitionFixtureView[],
  gameweek: number,
) {
  const byClub = new Map<string, CompetitionFixtureView[]>();
  for (const fixture of fixtures) {
    if (fixture.matchweek !== gameweek || fixture.status === "cancelled")
      continue;
    for (const clubId of [fixture.home.id, fixture.away.id]) {
      const clubFixtures = byClub.get(clubId) ?? [];
      clubFixtures.push(fixture);
      byClub.set(clubId, clubFixtures);
    }
  }
  for (const clubFixtures of byClub.values()) {
    clubFixtures.sort((a, b) => {
      const kickoffA = a.kickoffAt ? Date.parse(a.kickoffAt) : Infinity;
      const kickoffB = b.kickoffAt ? Date.parse(b.kickoffAt) : Infinity;
      return kickoffA - kickoffB || a.id.localeCompare(b.id);
    });
  }
  return byClub;
}

export function hasDeferredGameweekFixture(
  gameweekFixtures: readonly CompetitionFixtureView[],
  seasonFixtures: readonly CompetitionFixtureView[],
  gameweek: number,
) {
  // The source has no original kickoff history. Use the first dated fixture
  // from a later round as the boundary, comparing Bangkok calendar dates.
  const bangkokDay = (kickoffAt: string) =>
    Math.floor((Date.parse(kickoffAt) + 7 * 60 * 60 * 1000) / 86_400_000);
  const laterRoundStart = seasonFixtures.reduce(
    (earliest, fixture) =>
      fixture.matchweek > gameweek &&
      fixture.status !== "cancelled" &&
      fixture.kickoffAt
        ? Math.min(earliest, bangkokDay(fixture.kickoffAt))
        : earliest,
    Infinity,
  );
  return gameweekFixtures.some(
    (fixture) =>
      fixture.matchweek === gameweek &&
      fixture.status !== "cancelled" &&
      (fixture.status === "postponed" ||
        (fixture.kickoffAt !== null &&
          Number.isFinite(laterRoundStart) &&
          bangkokDay(fixture.kickoffAt) >= laterRoundStart)),
  );
}

export function getGameweekOpponentInfo(
  fixtures: readonly CompetitionFixtureView[],
  clubId: string,
  gameweek: number,
  language: AppLanguage,
) {
  const opponents = fixtures.map((fixture) => {
    const isHome = fixture.home.id === clubId;
    const opponent = isHome ? fixture.away : fixture.home;
    return {
      id: fixture.id,
      value: localize(opponent.shortName, language),
      venue: isHome ? ("H" as const) : ("A" as const),
      description: `${localize(opponent.name, language)} (${isHome ? "H" : "A"}) · ${localize(fixture.dateLabel, language)}`,
    };
  });
  return {
    value: language === "th" ? "ไม่มีนัด" : "No fixture",
    title: opponents.length
      ? `GW${gameweek}: ${opponents.map((opponent) => opponent.description).join(" / ")}`
      : language === "th"
        ? `ไม่มีโปรแกรมใน GW นี้ (GW${gameweek})`
        : `No fixture in this GW (GW${gameweek})`,
    opponents,
  };
}
