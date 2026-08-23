"use client";

import { useLanguage } from "@/components/fantasy/i18n";
import { PositionBadge } from "@/components/fantasy/position-badge";
import type { CompetitionPlayerView } from "@/lib/competition-types";

export function PlayerMetaBadges({
  player,
  showTier = true,
  showNationality = true,
}: {
  player: CompetitionPlayerView;
  showTier?: boolean;
  showNationality?: boolean;
}) {
  const { language } = useLanguage();

  return (
    <span className="player-meta-badges">
      <PositionBadge position={player.position} />
      {showTier && (
        <span
          className={`player-tier-badge player-tier-badge--${player.tier}`}
          aria-label={
            language === "th" ? `ระดับ ${player.tier}` : `Tier ${player.tier}`
          }
        >
          {player.tier}
        </span>
      )}
      {showNationality &&
        (player.isThai ? (
          <span
            className="player-nationality-badge player-nationality-badge--thai"
            aria-label={language === "th" ? "นักเตะไทย" : "Thai player"}
          />
        ) : (
          <span
            className="player-nationality-badge player-nationality-badge--foreign"
            aria-label={language === "th" ? "นักเตะต่างชาติ" : "Foreign player"}
          >
            F
          </span>
        ))}
    </span>
  );
}
