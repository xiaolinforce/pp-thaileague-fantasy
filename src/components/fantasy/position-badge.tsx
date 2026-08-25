import type { CompetitionPosition } from "@/lib/competition-types";
import { cn } from "@/lib/utils";

export function PositionBadge({
  position,
  className,
}: {
  position: CompetitionPosition;
  className?: string;
}) {
  return (
    <span
      className={cn("position-badge", `position-${position.toLowerCase()}`, className)}
    >
      {position}
    </span>
  );
}
