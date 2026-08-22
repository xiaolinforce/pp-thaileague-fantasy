import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import { clubs, competitionEntries } from "../src/db/schema";
import {
  clubNameEnOverrides,
  normalizeClubName,
} from "./sources/club-name-normalization";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const db = drizzle(databaseUrl);

async function normalizeClubDisplayNames() {
  const now = new Date();
  const changes = Object.entries(clubNameEnOverrides);

  for (const [sourceName, displayName] of changes) {
    await db
      .update(clubs)
      .set({
        nameEn: displayName,
        updatedAt: now,
      })
      .where(eq(clubs.nameEn, sourceName));

    await db
      .update(competitionEntries)
      .set({ displayNameEn: displayName, updatedAt: now })
      .where(eq(competitionEntries.displayNameEn, sourceName));
  }

  const clubRows = await db
    .select({ name: clubs.nameEn })
    .from(clubs)
    .orderBy(clubs.nameEn);
  const entryRows = await db
    .select({ name: competitionEntries.displayNameEn })
    .from(competitionEntries)
    .orderBy(competitionEntries.displayNameEn);
  const expected = new Set(Object.values(clubNameEnOverrides));
  const missingClubs = [...expected].filter(
    (name) => !clubRows.some((club) => club.name === name),
  );
  const missingEntries = [...expected].filter(
    (name) => !entryRows.some((entry) => entry.name === name),
  );

  if (missingClubs.length || missingEntries.length) {
    throw new Error(
      `Could not verify club names. Missing clubs: ${missingClubs.join(", ") || "none"}; missing entries: ${missingEntries.join(", ") || "none"}.`,
    );
  }

  console.table(
    changes.map(([sourceName]) => ({
      sourceName,
      displayName: normalizeClubName(sourceName),
    })),
  );
  console.log(`Updated and verified ${changes.length} club display names.`);
}

normalizeClubDisplayNames().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
