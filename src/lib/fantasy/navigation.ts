export type PointsAvailabilityGameweek = {
  number: number;
  status: string;
} | null;

export type FantasyNavigationAvailability = {
  pointsEnabled: boolean;
};

export function isPointsNavigationDisabled(
  gameweek: PointsAvailabilityGameweek,
) {
  return gameweek?.number === 1 && gameweek.status === "open";
}
