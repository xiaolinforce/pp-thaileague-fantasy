type FixtureProgress = {
  matchweek: number;
  status: string;
  kickoffAt: string | null;
};

export function getInitialFixtureMatchweek(
  fixtures: readonly FixtureProgress[],
  now: number,
) {
  let first: number | null = null;
  let live: number | null = null;
  let latestFinished: number | null = null;
  let next: { matchweek: number; kickoff: number } | null = null;

  for (const { matchweek, status, kickoffAt } of fixtures) {
    first = Math.min(first ?? matchweek, matchweek);

    if (status === "live") {
      live = Math.min(live ?? matchweek, matchweek);
    } else if (status === "finished") {
      latestFinished = Math.max(latestFinished ?? matchweek, matchweek);
    } else if (status === "scheduled" && kickoffAt) {
      const kickoff = Date.parse(kickoffAt);
      if (
        kickoff >= now &&
        (!next ||
          kickoff < next.kickoff ||
          (kickoff === next.kickoff && matchweek < next.matchweek))
      ) {
        next = { matchweek, kickoff };
      }
    }
  }

  return live ?? next?.matchweek ?? latestFinished ?? first;
}
