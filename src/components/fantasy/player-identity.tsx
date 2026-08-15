"use client";

import { useLanguage } from "@/components/fantasy/i18n";
import { PlayerKit } from "@/components/fantasy/player-kit";
import { localize, type CompetitionPlayerView } from "@/lib/competition-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function PlayerIdentity({ player }: { player: CompetitionPlayerView }) {
  const { language } = useLanguage();
  return (
    <div className="market-player player-identity-component">
      <Avatar className="player-photo" size="lg">
        {player.photoUrl && <AvatarImage src={player.photoUrl} alt={localize(player.name, language)} />}
        <AvatarFallback><PlayerKit color={player.color} accent={player.accent} size="small" /></AvatarFallback>
      </Avatar>
      <div>
        <strong>{localize(player.name, language)}</strong>
        <span>{localize(player.club, language)} · {player.position}</span>
      </div>
    </div>
  );
}
