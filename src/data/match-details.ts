import "server-only";

import { sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { db } from "@/db";
import { FANTASY_SEASON_SLUG } from "@/lib/fantasy/provisioning";
import type {
  FixtureMatchDetails,
  MatchDetailPlayer,
} from "@/lib/fantasy/match-details";

type FixtureRow = {
  id: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenaltyScore: number | null;
  awayPenaltyScore: number | null;
  attendance: number | null;
  status: string;
};

type PlayerRow = {
  fantasyPlayerId: string;
  nameTh: string | null;
  nameEn: string;
  shortNameTh: string | null;
  shortNameEn: string | null;
  position: string;
  side: "home" | "away" | null;
  minutes: number;
  goals: number;
  assists: number;
  ownGoals: number;
  yellowCards: number;
  redCards: number;
  penaltyMisses: number;
  penaltySaves: number;
  points: number | null;
};

const POSITIONS = {
  goalkeeper: "GK",
  defender: "DEF",
  midfielder: "MID",
  forward: "FWD",
} as const;

async function loadFixtureMatchDetails(
  fixtureId: string,
): Promise<FixtureMatchDetails | null> {
  const fixtureResult = await db.execute<FixtureRow>(sql`
    select f.id, f.home_score "homeScore", f.away_score "awayScore",
      f.home_penalty_score "homePenaltyScore", f.away_penalty_score "awayPenaltyScore",
      f.attendance, f.status::text status
    from fixtures f
    join fantasy_seasons s on s.competition_season_id = f.competition_season_id
    where s.slug = ${FANTASY_SEASON_SLUG} and f.id = ${fixtureId}::uuid`);
  const fixture = fixtureResult.rows[0];
  if (
    !fixture ||
    fixture.status !== "finished" ||
    fixture.homeScore === null ||
    fixture.awayScore === null
  ) {
    return null;
  }

  // Attribute each player to the club they represented in this match: the
  // Gameweek pool snapshot first, then the registration valid on match day.
  // Current registrations never rewrite a historical match.
  const playerResult = await db.execute<PlayerRow>(sql`
    with game as (
      select f.id, f.home_entry_id, f.away_entry_id, home.club_id home_club,
        away.club_id away_club, gw.id gw_id,
        coalesce((f.kickoff_at at time zone 'Asia/Bangkok')::date, current_date) match_date
      from fixtures f
      join competition_entries home on home.id = f.home_entry_id
      join competition_entries away on away.id = f.away_entry_id
      join fantasy_seasons fs on fs.competition_season_id = f.competition_season_id
        and fs.slug = ${FANTASY_SEASON_SLUG}
      left join fantasy_gameweeks gw on gw.fantasy_season_id = fs.id and gw.number = f.matchweek
      where f.id = ${fixtureId}::uuid
    )
    select fp.id "fantasyPlayerId", p.full_name_th "nameTh", p.full_name_en "nameEn",
      p.short_name_th "shortNameTh", p.short_name_en "shortNameEn",
      coalesce(pool.position_snapshot, fp.locked_position)::text position,
      case
        when pool.club_id_snapshot = g.home_club then 'home'
        when pool.club_id_snapshot = g.away_club then 'away'
        when reg.competition_entry_id = g.home_entry_id then 'home'
        when reg.competition_entry_id = g.away_entry_id then 'away'
      end side,
      s.minutes, s.goals, coalesce(s.fantasy_assists, s.source_assists) assists,
      s.own_goals "ownGoals", s.yellow_cards "yellowCards", s.red_cards "redCards",
      s.penalty_misses "penaltyMisses", s.penalty_saves "penaltySaves",
      mp.total_points points
    from game g
    join fantasy_player_match_stats s on s.fixture_id = g.id
    join fantasy_players fp on fp.id = s.fantasy_player_id
    join players p on p.id = fp.player_id
    left join fantasy_player_match_points mp on mp.player_match_stats_id = s.id
    left join fantasy_gameweek_player_pool pool
      on pool.fantasy_gameweek_id = g.gw_id and pool.fantasy_player_id = fp.id
    left join lateral (
      select r.competition_entry_id from player_registrations r
      where r.player_id = fp.player_id
        and r.competition_entry_id in (g.home_entry_id, g.away_entry_id)
        and r.registered_from <= g.match_date
        and (r.registered_until >= g.match_date
          or (r.registered_until is null and r.status = 'active'))
      order by r.registered_from desc
      limit 1
    ) reg on true`);

  const players: MatchDetailPlayer[] = playerResult.rows.flatMap((row) => {
    if (!row.side) return [];
    const fullTh = row.nameTh || row.nameEn;
    return [
      {
        fantasyPlayerId: row.fantasyPlayerId,
        name: {
          th: row.shortNameTh || fullTh,
          en: row.shortNameEn || row.nameEn,
        },
        side: row.side,
        position: POSITIONS[row.position as keyof typeof POSITIONS] ?? null,
        minutes: row.minutes,
        goals: row.goals,
        assists: row.assists,
        ownGoals: row.ownGoals,
        yellowCards: row.yellowCards,
        redCards: row.redCards,
        penaltyMisses: row.penaltyMisses,
        penaltySaves: row.penaltySaves,
        points: row.points,
      },
    ];
  });

  return {
    fixtureId: fixture.id,
    homeScore: fixture.homeScore,
    awayScore: fixture.awayScore,
    homePenaltyScore: fixture.homePenaltyScore,
    awayPenaltyScore: fixture.awayPenaltyScore,
    attendance: fixture.attendance,
    players,
  };
}

const getCachedFixtureMatchDetails = unstable_cache(
  loadFixtureMatchDetails,
  ["fixture-match-details-v1"],
  {
    revalidate: 300,
    // Score and lifecycle changes expire fixtures; stat edits expire the
    // competition dataset (see ARCHITECTURE.md cache boundaries).
    tags: ["fixtures-dataset", "competition-dataset"],
  },
);

export function getFixtureMatchDetails(fixtureId: string) {
  return getCachedFixtureMatchDetails(fixtureId);
}
