"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { useLanguage } from "@/components/fantasy/i18n";
import type { FantasyPointsGameweek } from "@/data/fantasy";

export function PointsGameweekSwitcher({
  gameweeks,
  selected,
}: {
  gameweeks: FantasyPointsGameweek[];
  selected: number;
}) {
  const router = useRouter();
  const { translate } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const selectedIndex = gameweeks.findIndex(
    (gameweek) => gameweek.number === selected,
  );

  const goToGameweek = (gameweek: number) => {
    startTransition(() => router.push(`/points?gw=${gameweek}`));
  };

  return (
    <div
      className="points-week-switcher"
      aria-label={`${translate("เลือก Gameweek ปัจจุบันคือ")} ${selected}`}
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
      <label>
        <span>{translate("เลือก Gameweek")}</span>
        <select
          value={selected}
          onChange={(event) => goToGameweek(Number(event.target.value))}
          disabled={isPending}
          aria-label={translate("เลือก Gameweek")}
        >
          {gameweeks.map((gameweek) => (
            <option value={gameweek.number} key={gameweek.number}>
              Gameweek {String(gameweek.number).padStart(2, "0")}
              {gameweek.scoreComplete
                ? " · Final"
                : gameweek.hasScore
                  ? " · Provisional"
                  : ` · ${translate("ยังไม่มีคะแนน")}`}
            </option>
          ))}
        </select>
      </label>
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
