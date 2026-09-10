"use client";

import { useLanguage } from "@/components/fantasy/i18n";
import { PlayerKit } from "@/components/fantasy/player-kit";
import { PlayerMetaBadges } from "@/components/fantasy/player-meta-badges";
import { localize, type CompetitionPlayerView } from "@/lib/competition-types";

export function PlayerIdentity({
  player,
  useShortName = false,
  showMarketCompact = false,
  showPositionBadge = false,
  showTierBadge = false,
  showNationalityBadge = false,
}: {
  player: CompetitionPlayerView;
  useShortName?: boolean;
  showMarketCompact?: boolean;
  showPositionBadge?: boolean;
  showTierBadge?: boolean;
  showNationalityBadge?: boolean;
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
        <span className="player-identity-kit" aria-hidden="true">
          <PlayerKit color={player.color} accent={player.accent} size="small" />
        </span>
      )}
      <div>
        <strong>{playerName}</strong>
        <span className={showMarketCompact ? "market-compact-team" : ""}>
          {teamName}
        </span>
        {showPositionBadge && (
          <PlayerMetaBadges
            player={player}
            showTier={showTierBadge}
            showNationality={showNationalityBadge}
          />
        )}
      </div>
    </div>
  );
}
