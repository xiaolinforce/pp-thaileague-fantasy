import { ChevronLeft, ChevronRight } from "lucide-react";

export function GameweekSelector({
  week,
  min = 1,
  max,
  subtitle,
  onChange,
}: {
  week: number;
  min?: number;
  max: number;
  subtitle?: string;
  onChange: (week: number) => void;
}) {
  return (
    <div className="fixture-week-bar" aria-label={`Gameweek ${week}`}>
      <button onClick={() => onChange(Math.max(min, week - 1))} disabled={week <= min} aria-label="Gameweek ก่อนหน้า">
        <ChevronLeft />
      </button>
      <div>
        <span>GAMEWEEK</span>
        <strong>{String(week).padStart(2, "0")}</strong>
        {subtitle && <small>{subtitle}</small>}
      </div>
      <button onClick={() => onChange(Math.min(max, week + 1))} disabled={week >= max} aria-label="Gameweek ถัดไป">
        <ChevronRight />
      </button>
    </div>
  );
}
