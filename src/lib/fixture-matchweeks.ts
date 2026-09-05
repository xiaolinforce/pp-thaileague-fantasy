type FixtureProgress = {
  matchweek: number;
  status: string;
};

const COMPLETED_FIXTURE_STATUSES = new Set(["finished", "cancelled"]);

export function getInitialFixtureMatchweek(
  fixtures: readonly FixtureProgress[],
) {
  const matchweeks = [
    ...new Set(fixtures.map((fixture) => fixture.matchweek)),
  ].sort((a, b) => a - b);

  return (
    matchweeks.find((matchweek) =>
      fixtures.some(
        (fixture) =>
          fixture.matchweek === matchweek &&
          !COMPLETED_FIXTURE_STATUSES.has(fixture.status),
      ),
    ) ?? null
  );
}
