import "server-only";

import { countDistinct, eq, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import {
  fantasyTeamSelections,
  fantasyTeamSelectionPlayers,
} from "@/db/schema";

export const getPlayerOwnership = unstable_cache(
  async (gameweekId: string): Promise<Record<string, number>> => {
    const rows = db.$with("ownership").as(
      db
        .select({
          playerId: fantasyTeamSelectionPlayers.fantasyPlayerId,
          selectionId: fantasyTeamSelections.id,
        })
        .from(fantasyTeamSelectionPlayers)
        .innerJoin(
          fantasyTeamSelections,
          eq(fantasyTeamSelectionPlayers.selectionId, fantasyTeamSelections.id),
        )
        .where(eq(fantasyTeamSelections.fantasyGameweekId, gameweekId)),
    );
    const total = db
      .select({ count: countDistinct(rows.selectionId) })
      .from(rows);
    const counts = await db
      .with(rows)
      .select({
        playerId: rows.playerId,
        selected: sql<number>`round(count(*) * 100.0 / (${total}), 1)::float8`,
      })
      .from(rows)
      .groupBy(rows.playerId);
    return Object.fromEntries(
      counts.map((row) => [row.playerId, row.selected]),
    );
  },
  ["fantasy-ownership-v1"],
  { revalidate: 300, tags: ["fantasy-ownership"] },
);
