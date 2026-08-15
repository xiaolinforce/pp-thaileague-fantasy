import { loadEnvConfig } from "@next/env";
import { inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import { clubs, clubVisualIdentities } from "../src/db/schema";
import {
  CLUB_COLOR_SOURCE_NAME,
  clubVisualIdentitySources,
} from "./sources/club-visual-identities";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const db = drizzle(databaseUrl);

function excluded(column: { name: string }) {
  return sql.raw(`excluded."${column.name}"`);
}

async function seedClubVisualIdentities() {
  const clubRecords = await db
    .select({ id: clubs.id, nameEn: clubs.nameEn })
    .from(clubs)
    .where(
      inArray(
        clubs.nameEn,
        clubVisualIdentitySources.map((identity) => identity.clubNameEn),
      ),
    );
  const clubIdByName = new Map(
    clubRecords.map((club) => [club.nameEn, club.id]),
  );
  const missing = clubVisualIdentitySources.filter(
    (identity) => !clubIdByName.has(identity.clubNameEn),
  );

  if (missing.length) {
    throw new Error(
      `Club records are missing for: ${missing.map((identity) => identity.clubNameEn).join(", ")}.`,
    );
  }

  const now = new Date();
  const rows: (typeof clubVisualIdentities.$inferInsert)[] =
    clubVisualIdentitySources.map((identity) => ({
      clubId: clubIdByName.get(identity.clubNameEn)!,
      topLeftColor: identity.colors[0],
      topRightColor: identity.colors[1],
      bottomLeftColor: identity.colors[2],
      bottomRightColor: identity.colors[3],
      sourceName: CLUB_COLOR_SOURCE_NAME,
      sourceUrl: identity.sourceUrl,
      notes: identity.notes,
      updatedAt: now,
    }));

  await db
    .insert(clubVisualIdentities)
    .values(rows)
    .onConflictDoUpdate({
      target: clubVisualIdentities.clubId,
      set: {
        topLeftColor: excluded(clubVisualIdentities.topLeftColor),
        topRightColor: excluded(clubVisualIdentities.topRightColor),
        bottomLeftColor: excluded(clubVisualIdentities.bottomLeftColor),
        bottomRightColor: excluded(clubVisualIdentities.bottomRightColor),
        sourceName: excluded(clubVisualIdentities.sourceName),
        sourceUrl: excluded(clubVisualIdentities.sourceUrl),
        notes: excluded(clubVisualIdentities.notes),
        updatedAt: now,
      },
    });

  console.log(`Seeded ${rows.length} club visual identities.`);
}

seedClubVisualIdentities().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
