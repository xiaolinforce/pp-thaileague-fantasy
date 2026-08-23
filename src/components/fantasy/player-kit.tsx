import { Shirt } from "lucide-react";
import { useId } from "react";

export function PlayerKit({
  color,
  accent,
  size = "medium",
}: {
  color: string;
  accent: string;
  size?: "small" | "medium" | "large";
}) {
  const gradientId = `player-kit-${useId().replaceAll(":", "")}`;

  return (
    <span className={`data-player-kit kit-${size}`}>
      <svg
        aria-hidden="true"
        focusable="false"
        width="0"
        height="0"
        style={{
          height: 0,
          overflow: "hidden",
          position: "absolute",
          width: 0,
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="50%" stopColor={color} />
            <stop offset="50%" stopColor={accent} />
            <stop offset="100%" stopColor={accent} />
          </linearGradient>
        </defs>
      </svg>
      <Shirt
        style={{ color: "var(--line)", fill: `url(#${gradientId})` }}
        strokeWidth={1}
      />
    </span>
  );
}
