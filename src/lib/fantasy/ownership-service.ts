import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { transactionDb } from "@/db/transaction";
import { fantasyGameweeks, fantasyPlayerOwnerships } from "@/db/schema";
import { lockFantasySeason, type FantasyTransaction } from "./season-lock";
import { getSelectionOwnershipChange } from "./ownership";
import { THAI_LEAGUE_FANTASY_RULES } from "./rules";

type OwnershipDatabase = Pick<
  FantasyTransaction,
  "execute" | "select" | "update"
>;

async function lockOwnershipRefresh(
  gameweekId: string,
  database: Pick<OwnershipDatabase, "execute">,
) {
  await database.execute(
    sql`select pg_advisory_xact_lock(hashtext(${"fantasy-player-ownership"}), hashtext(${gameweekId}))`,
  );
}

export async function refreshFantasyPlayerOwnership(
  gameweekId: string,
  database: Pick<OwnershipDatabase, "execute">,
) {
  await lockOwnershipRefresh(gameweekId, database);
  await refreshFantasyPlayerOwnershipWithoutLock(gameweekId, database);
}

export async function updateFantasyPlayerOwnershipForSelection({
  gameweekId,
  previousPlayerIds,
  nextPlayerIds,
  isCountedTeam,
  database,
}: {
  gameweekId: string;
  previousPlayerIds: string[];
  nextPlayerIds: string[];
  isCountedTeam: boolean;
  database: OwnershipDatabase;
}) {
  if (!isCountedTeam) return;

  const change = getSelectionOwnershipChange(
    previousPlayerIds,
    nextPlayerIds,
    THAI_LEAGUE_FANTASY_RULES.squadSize,
  );
  if (
    change.countedTeamDelta === 0 &&
    change.addedPlayerIds.length === 0 &&
    change.removedPlayerIds.length === 0
  ) {
    return;
  }

  await lockOwnershipRefresh(gameweekId, database);
  const changedPlayerIds = [
    ...new Set([...change.removedPlayerIds, ...change.addedPlayerIds]),
  ];
  const existingRows = await database
    .select({ fantasyPlayerId: fantasyPlayerOwnerships.fantasyPlayerId })
    .from(fantasyPlayerOwnerships)
    .where(
      and(
        eq(fantasyPlayerOwnerships.fantasyGameweekId, gameweekId),
        inArray(fantasyPlayerOwnerships.fantasyPlayerId, changedPlayerIds),
      ),
    );
  if (existingRows.length !== changedPlayerIds.length) {
    await refreshFantasyPlayerOwnershipWithoutLock(gameweekId, database);
    return;
  }

  const changedAt = new Date();
  const updateSelectedCounts = async (playerIds: string[], delta: 1 | -1) => {
    if (playerIds.length === 0) return;
    await database
      .update(fantasyPlayerOwnerships)
      .set({
        selectedTeamCount: sql`${fantasyPlayerOwnerships.selectedTeamCount} + ${delta}`,
        selectedPercent: sql`case
          when ${fantasyPlayerOwnerships.countedTeamCount} = 0 then 0
          else round(
            (${fantasyPlayerOwnerships.selectedTeamCount} + ${delta}) * 100.0 /
            ${fantasyPlayerOwnerships.countedTeamCount},
            1
          )::double precision
        end`,
        calculatedAt: changedAt,
        updatedAt: changedAt,
      })
      .where(
        and(
          eq(fantasyPlayerOwnerships.fantasyGameweekId, gameweekId),
          inArray(fantasyPlayerOwnerships.fantasyPlayerId, playerIds),
        ),
      );
  };
  const updateCountedTeamTotal = async () => {
    if (change.countedTeamDelta === 0) return;
    await database
      .update(fantasyPlayerOwnerships)
      .set({
        countedTeamCount: sql`${fantasyPlayerOwnerships.countedTeamCount} + ${change.countedTeamDelta}`,
        selectedPercent: sql`case
          when ${fantasyPlayerOwnerships.countedTeamCount} + ${change.countedTeamDelta} = 0 then 0
          else round(
            ${fantasyPlayerOwnerships.selectedTeamCount} * 100.0 /
            (${fantasyPlayerOwnerships.countedTeamCount} + ${change.countedTeamDelta}),
            1
          )::double precision
        end`,
        calculatedAt: changedAt,
        updatedAt: changedAt,
      })
      .where(eq(fantasyPlayerOwnerships.fantasyGameweekId, gameweekId));
  };

  if (change.countedTeamDelta < 0) {
    await updateSelectedCounts(change.removedPlayerIds, -1);
    await updateCountedTeamTotal();
  } else {
    await updateCountedTeamTotal();
    await updateSelectedCounts(change.removedPlayerIds, -1);
  }
  await updateSelectedCounts(change.addedPlayerIds, 1);
}

async function refreshFantasyPlayerOwnershipWithoutLock(
  gameweekId: string,
  database: Pick<OwnershipDatabase, "execute">,
) {
  await database.execute(sql`
    with counted_selections as (
      select selection.id
      from fantasy_team_selections selection
      inner join fantasy_teams team on team.id = selection.fantasy_team_id
      inner join fantasy_managers manager on manager.id = team.manager_id
      inner join fantasy_team_selection_players member on member.selection_id = selection.id
      where selection.fantasy_gameweek_id = ${gameweekId}::uuid
        and team.is_active = true
        and manager.is_bot = false
        and manager.status in ('guest', 'member')
      group by selection.id
      having count(member.id) = ${THAI_LEAGUE_FANTASY_RULES.squadSize}
    ),
    counted_total as (
      select count(*)::integer as team_count from counted_selections
    ),
    player_counts as (
      select member.fantasy_player_id, count(*)::integer as selected_count
      from counted_selections counted
      inner join fantasy_team_selection_players member on member.selection_id = counted.id
      group by member.fantasy_player_id
    )
    insert into fantasy_player_ownerships (
      fantasy_season_id, fantasy_gameweek_id, fantasy_player_id,
      selected_team_count, counted_team_count, selected_percent,
      calculated_at, updated_at
    )
    select gameweek.fantasy_season_id, gameweek.id, player.id,
           coalesce(player_count.selected_count, 0), counted_total.team_count,
           case when counted_total.team_count = 0 then 0
                else round(coalesce(player_count.selected_count, 0) * 100.0 /
                  counted_total.team_count, 1)::double precision end,
           now(), now()
    from fantasy_gameweeks gameweek
    inner join fantasy_players player on player.fantasy_season_id = gameweek.fantasy_season_id
    cross join counted_total
    left join player_counts player_count on player_count.fantasy_player_id = player.id
    where gameweek.id = ${gameweekId}::uuid
    on conflict (fantasy_gameweek_id, fantasy_player_id)
    do update set
      selected_team_count = excluded.selected_team_count,
      counted_team_count = excluded.counted_team_count,
      selected_percent = excluded.selected_percent,
      calculated_at = excluded.calculated_at,
      updated_at = excluded.updated_at
  `);
}

export async function reconcileOpenFantasyPlayerOwnership() {
  const openGameweeks = await db
    .select({
      id: fantasyGameweeks.id,
      fantasySeasonId: fantasyGameweeks.fantasySeasonId,
    })
    .from(fantasyGameweeks)
    .where(eq(fantasyGameweeks.status, "open"));
  let refreshedGameweeks = 0;

  for (const gameweek of openGameweeks) {
    const refreshed = await transactionDb.transaction(async (database) => {
      await lockFantasySeason(database, gameweek.fantasySeasonId);
      const rows = await database
        .select({ id: fantasyGameweeks.id })
        .from(fantasyGameweeks)
        .where(
          and(
            eq(fantasyGameweeks.id, gameweek.id),
            eq(fantasyGameweeks.status, "open"),
          ),
        )
        .limit(1);
      if (rows.length === 0) return false;
      await refreshFantasyPlayerOwnership(gameweek.id, database);
      return true;
    });
    if (refreshed) refreshedGameweeks += 1;
  }

  return { refreshedGameweeks };
}
