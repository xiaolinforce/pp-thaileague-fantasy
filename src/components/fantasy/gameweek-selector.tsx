"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/fantasy/i18n";

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
  const { language } = useLanguage();
  return (
    <div className="fixture-week-bar" aria-label={`Gameweek ${week}`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, week - 1))}
        disabled={week <= min}
        aria-label={
          language === "th" ? "Gameweek ก่อนหน้า" : "Previous Gameweek"
        }
      >
        <ChevronLeft aria-hidden="true" />
      </button>
      <div>
        <span>GAMEWEEK</span>
        <strong>{String(week).padStart(2, "0")}</strong>
        {subtitle && <small>{subtitle}</small>}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, week + 1))}
        disabled={week >= max}
        aria-label={language === "th" ? "Gameweek ถัดไป" : "Next Gameweek"}
      >
        <ChevronRight aria-hidden="true" />
      </button>
    </div>
  );
}
