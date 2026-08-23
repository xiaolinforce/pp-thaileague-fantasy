"use client";

import { useLanguage } from "@/components/fantasy/i18n";
import { PlayerKit } from "@/components/fantasy/player-kit";
import { PositionBadge } from "@/components/fantasy/position-badge";
import { localize, type CompetitionPlayerView } from "@/lib/competition-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function PlayerIdentity({
  player,
  useShortName = false,
  showMarketCompact = false,
  showPositionBadge = false,
  showTierBadge = false,
}: {
  player: CompetitionPlayerView;
  useShortName?: boolean;
  showMarketCompact?: boolean;
  showPositionBadge?: boolean;
  showTierBadge?: boolean;
}) {
  const { language } = useLanguage();
  const playerName = useShortName
    ? localize(player.shortName, language)
    : localize(player.name, language);
  const teamName = useShortName
    ? localize(player.clubShort, language)
    : localize(player.club, language);
  return (
    <div
      className={`market-player player-identity-component${showMarketCompact ? " market-player--compact" : ""}`}
    >
      {showMarketCompact ? (
        <PlayerKit color={player.color} accent={player.accent} />
      ) : (
        <Avatar className="player-photo" size="lg">
          {player.photoUrl && (
            <AvatarImage src={player.photoUrl} alt={playerName} />
          )}
          <AvatarFallback>
            <PlayerKit
              color={player.color}
              accent={player.accent}
              size="small"
            />
          </AvatarFallback>
        </Avatar>
      )}
      <div>
        <strong>{playerName}</strong>
        <span className={showMarketCompact ? "market-compact-team" : ""}>
          {teamName}
        </span>
        {showPositionBadge && (
          <span className="market-position-badge-wrap">
            <PositionBadge position={player.position} />
            {showTierBadge && (
              <span
                className={`market-tier-badge market-tier-${player.tier}`}
                aria-label={
                  language === "th"
                    ? `ระดับ ${player.tier}`
                    : `Tier ${player.tier}`
                }
              >
                {player.tier}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
