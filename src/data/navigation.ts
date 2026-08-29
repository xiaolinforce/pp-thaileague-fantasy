import "server-only";

import { and, eq } from "drizzle-orm";
import { connection } from "next/server";
import { cache } from "react";

import { db } from "@/db";
import { fantasyGameweeks, fantasySeasons } from "@/db/schema";
import {
  isPointsNavigationDisabled,
  type FantasyNavigationAvailability,
} from "@/lib/fantasy/navigation";
import { FANTASY_SEASON_SLUG } from "@/lib/fantasy/provisioning";

export const getFantasyNavigationAvailability = cache(
  async (): Promise<FantasyNavigationAvailability> => {
    await connection();
    const [gameweekOne] = await db
      .select({
        number: fantasyGameweeks.number,
        status: fantasyGameweeks.status,
      })
      .from(fantasyGameweeks)
      .innerJoin(
        fantasySeasons,
        eq(fantasyGameweeks.fantasySeasonId, fantasySeasons.id),
      )
      .where(
        and(
          eq(fantasySeasons.slug, FANTASY_SEASON_SLUG),
          eq(fantasyGameweeks.number, 1),
        ),
      )
      .limit(1);

    return {
      pointsEnabled: !isPointsNavigationDisabled(gameweekOne ?? null),
    };
  },
);
