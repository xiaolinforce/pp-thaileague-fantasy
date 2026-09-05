import "server-only";

import { eq } from "drizzle-orm";
import { fantasySeasons } from "@/db/schema";
import type { transactionDb } from "@/db/transaction";

export type FantasyTransaction = Parameters<
  Parameters<typeof transactionDb.transaction>[0]
>[0];

// Always acquire this before Gameweek, selection, team, or score locks.
// Saves share the season lock; lifecycle, classifications and scoring take it exclusively.
export async function lockFantasySeason(
  tx: Pick<FantasyTransaction, "select">,
  seasonId: string,
  mode: "share" | "update" = "update",
) {
  const [season] = await tx
    .select()
    .from(fantasySeasons)
    .where(eq(fantasySeasons.id, seasonId))
    .for(mode);
  if (!season) throw new Error("Fantasy season was not found.");
  return season;
}
