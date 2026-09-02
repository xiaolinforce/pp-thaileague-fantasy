export type FantasyGameweekLifecycleStatus =
  "planned" | "open" | "locked" | "provisional" | "final";

export type FantasyGameweekLifecycleRow = {
  number: number;
  status: FantasyGameweekLifecycleStatus;
};

export function resolveFantasyGameweekContext<
  TGameweek extends FantasyGameweekLifecycleRow,
>(gameweeks: readonly TGameweek[]) {
  const ordered = [...gameweeks].sort(
    (left, right) => left.number - right.number,
  );
  const provisioningGameweek =
    ordered.find((gameweek) => gameweek.status === "open") ??
    ordered.find((gameweek) => gameweek.status === "planned") ??
    null;
  const gameweek = provisioningGameweek ?? ordered.at(-1) ?? null;

  if (!gameweek) return null;

  return {
    gameweek,
    canProvisionSelection: provisioningGameweek !== null,
    seasonFinished: ordered.every((item) => item.status === "final"),
  };
}
