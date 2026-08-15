import { Shirt } from "lucide-react";

export function PlayerKit({
  color,
  accent,
  size = "medium",
}: {
  color: string;
  accent: string;
  size?: "small" | "medium" | "large";
}) {
  return (
    <span className={`data-player-kit kit-${size}`}>
      <Shirt style={{ color: accent, fill: color }} strokeWidth={1.7} />
    </span>
  );
}
