import "server-only";

import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { fantasyPlayerOwnerships } from "@/db/schema";

export const getPlayerOwnership = unstable_cache(
  async (gameweekId: string): Promise<Record<string, number>> => {
    const rows = await db
      .select({
        playerId: fantasyPlayerOwnerships.fantasyPlayerId,
        selected: fantasyPlayerOwnerships.selectedPercent,
      })
      .from(fantasyPlayerOwnerships)
      .where(eq(fantasyPlayerOwnerships.fantasyGameweekId, gameweekId));
    return Object.fromEntries(rows.map((row) => [row.playerId, row.selected]));
  },
  ["fantasy-ownership-v2"],
  { revalidate: 300, tags: ["fantasy-ownership"] },
);
