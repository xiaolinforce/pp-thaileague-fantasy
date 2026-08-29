"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { useLanguage } from "@/components/fantasy/i18n";
import type { FantasyPointsGameweek } from "@/data/fantasy";

export function PointsGameweekSwitcher({
  gameweeks,
  selected,
  className,
}: {
  gameweeks: FantasyPointsGameweek[];
  selected: number;
  className?: string;
}) {
  const router = useRouter();
  const { translate } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const selectedIndex = gameweeks.findIndex(
    (gameweek) => gameweek.number === selected,
  );
  const selectedGameweek = gameweeks[selectedIndex];
  const scoreStatus = selectedGameweek?.scoreComplete
    ? "Final"
    : selectedGameweek?.hasScore
      ? "Provisional"
      : translate("ยังไม่มีคะแนน");

  const goToGameweek = (gameweek: number) => {
    startTransition(() => router.push(`/points?gw=${gameweek}`));
  };

  return (
    <div
      className={`points-week-switcher${className ? ` ${className}` : ""}`}
      aria-label={`${translate("เลือก Gameweek ปัจจุบันคือ")} ${selected}${scoreStatus ? `, ${scoreStatus}` : ""}`}
      aria-busy={isPending}
    >
      <button
        type="button"
        onClick={() => goToGameweek(gameweeks[selectedIndex - 1].number)}
        disabled={isPending || selectedIndex <= 0}
        aria-label={translate("Gameweek ก่อนหน้า")}
      >
        <ChevronLeft size={18} />
      </button>
      <output className="points-week-current" aria-live="polite">
        <strong>Gameweek {String(selected).padStart(2, "0")}</strong>
      </output>
      <button
        type="button"
        onClick={() => goToGameweek(gameweeks[selectedIndex + 1].number)}
        disabled={isPending || selectedIndex >= gameweeks.length - 1}
        aria-label={translate("Gameweek ถัดไป")}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
