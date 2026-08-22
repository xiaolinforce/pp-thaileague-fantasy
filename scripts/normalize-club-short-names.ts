import { loadEnvConfig } from "@next/env";
import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import { clubs } from "../src/db/schema";
import { clubShortNameOverrides } from "./sources/club-short-name-overrides";
import { THAI_LEAGUE_SOURCE } from "./sources/thai-league-2026-27";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const db = drizzle(databaseUrl);

async function normalizeClubShortNames() {
  const now = new Date();
  const entries = Object.entries(clubShortNameOverrides);

  for (const [externalId, names] of entries) {
    await db
      .update(clubs)
      .set({ shortNameTh: names.th, shortNameEn: names.en, updatedAt: now })
      .where(
        and(
          eq(clubs.sourceName, THAI_LEAGUE_SOURCE),
          eq(clubs.externalId, externalId),
        ),
      );
  }

  const rows = await db
    .select({
      externalId: clubs.externalId,
      shortNameTh: clubs.shortNameTh,
      shortNameEn: clubs.shortNameEn,
    })
    .from(clubs)
    .where(
      and(
        eq(clubs.sourceName, THAI_LEAGUE_SOURCE),
        inArray(
          clubs.externalId,
          entries.map(([externalId]) => externalId),
        ),
      ),
    );
  const byExternalId = new Map(rows.map((row) => [row.externalId, row]));
  const invalid = entries.filter(([externalId, names]) => {
    const row = byExternalId.get(externalId);
    return !row || row.shortNameTh !== names.th || row.shortNameEn !== names.en;
  });
  if (invalid.length > 0) {
    throw new Error(
      `Could not verify club short names for: ${invalid.map(([externalId]) => externalId).join(", ")}.`,
    );
  }

  console.table(
    entries.map(([externalId, names]) => ({ externalId, ...names })),
  );
  console.log(`Updated and verified ${entries.length} club short names.`);
}

normalizeClubShortNames().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
