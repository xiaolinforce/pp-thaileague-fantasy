import type {
  CompetitionDataset,
  CompetitionPlayerView,
} from "../competition-types.ts";

const positions = {
  goalkeeper: "GK",
  defender: "DEF",
  midfielder: "MID",
  forward: "FWD",
} as const;

export function mergeTeamPlayerData(
  data: CompetitionDataset,
  retained: CompetitionPlayerView[],
  members: readonly {
    fantasyPlayerId: string;
    clubId: string;
    position: keyof typeof positions;
    tier: number;
    isThai: boolean;
    isAvailable?: boolean;
  }[],
): CompetitionDataset {
  const byId = new Map(
    [...data.players, ...retained].map((player) => [player.id, player]),
  );
  const byMember = new Map(
    members.map((member) => [member.fantasyPlayerId, member]),
  );
  const clubs = new Map(data.clubs.map((club) => [club.id, club]));
  return {
    ...data,
    players: [...byId.values()].map((player) => {
      const member = player.fantasyPlayerId
        ? byMember.get(player.fantasyPlayerId)
        : undefined;
      if (!member) return player;
      const club = clubs.get(member.clubId);
      return {
        ...player,
        clubId: member.clubId,
        club: club?.name ?? player.club,
        clubShort: club?.shortName ?? player.clubShort,
        color: club?.colors[0] ?? player.color,
        accent: club?.colors[1] ?? player.accent,
        position: positions[member.position],
        tier: member.tier,
        price: member.tier,
        isThai: member.isThai,
        isAvailable: member.isAvailable ?? player.isAvailable,
      };
    }),
  };
}
