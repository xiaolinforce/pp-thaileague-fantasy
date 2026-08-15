import type { CompetitionPosition } from "@/lib/competition-types";

export function PositionBadge({ position }: { position: CompetitionPosition }) {
  return <span className={`position-badge position-${position.toLowerCase()}`}>{position}</span>;
}
