import { loadEnvConfig } from "@next/env";
import { and, asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import { fantasyPlayers, fantasySeasons, players } from "../src/db/schema";
import {
  extractTransfermarktHomeCountryName,
  getEnglishPlayerShortName,
  getThaiPlayerShortName,
} from "./sources/player-short-names";
import { PLAYER_SHORT_NAME_TH_OVERRIDES } from "./sources/player-short-name-overrides";
import { TRANSFERMARKT_SOURCE } from "./sources/thai-league-2026-27";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");

const db = drizzle(databaseUrl);
const FANTASY_SEASON_SLUG = "thai-league-1-2026-27";
const CONCURRENCY = 4;

type Options = { apply: boolean };

function parseOptions(): Options {
  const args = new Set(process.argv.slice(2));
  for (const argument of args) {
    if (argument !== "--apply")
      throw new Error(`Unknown argument: ${argument}`);
  }
  return { apply: args.has("--apply") };
}

async function mapWithConcurrency<T, R>(
  values: T[],
  worker: (value: T) => Promise<R>,
) {
  const results = new Array<R>(values.length);
  let nextIndex = 0;
  async function runWorker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(values[index]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, values.length) }, runWorker),
  );
  return results;
}

async function fetchThaiShortName(sourceUrl: string, externalId: string) {
  if (!sourceUrl.startsWith("https://www.transfermarkt.com/")) {
    throw new Error(`Unexpected player source URL: ${sourceUrl}`);
  }
  const response = await fetch(sourceUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
    },
  });
  if (!response.ok) {
    throw new Error(
      `Transfermarkt returned ${response.status} for ${sourceUrl}`,
    );
  }
  return (
    getThaiPlayerShortName(
      extractTransfermarktHomeCountryName(await response.text()),
    ) ??
    PLAYER_SHORT_NAME_TH_OVERRIDES[externalId] ??
    null
  );
}

async function normalizePlayerShortNames() {
  const options = parseOptions();
  const rows = await db
    .select({ player: players, fantasyPlayer: fantasyPlayers })
    .from(fantasyPlayers)
    .innerJoin(players, eq(fantasyPlayers.playerId, players.id))
    .innerJoin(
      fantasySeasons,
      eq(fantasyPlayers.fantasySeasonId, fantasySeasons.id),
    )
    .where(
      and(
        eq(fantasySeasons.slug, FANTASY_SEASON_SLUG),
        eq(fantasyPlayers.isAvailable, true),
        eq(players.isActive, true),
        eq(players.sourceName, TRANSFERMARKT_SOURCE),
      ),
    )
    .orderBy(asc(players.fullNameEn));
  if (rows.length === 0)
    throw new Error("No active Fantasy players were found.");

  const thaiRows = rows.filter((row) => row.fantasyPlayer.isThai);
  const thaiShortNames = await mapWithConcurrency(thaiRows, async (row) => ({
    id: row.player.id,
    shortNameTh: await fetchThaiShortName(
      row.player.sourceUrl,
      row.player.externalId,
    ),
  }));
  const thaiShortNameById = new Map(
    thaiShortNames.map((row) => [row.id, row.shortNameTh]),
  );
  const missingThaiNames = thaiRows.filter(
    (row) => !thaiShortNameById.get(row.player.id),
  );
  if (missingThaiNames.length > 0) {
    throw new Error(
      `Thai short names could not be sourced for ${missingThaiNames.length} players: ${missingThaiNames.map((row) => `${row.player.fullNameEn} (${row.player.sourceUrl})`).join(", ")}.`,
    );
  }

  const updates = rows.map((row) => ({
    id: row.player.id,
    fullNameEn: row.player.fullNameEn,
    shortNameEn: getEnglishPlayerShortName(
      row.player.fullNameEn,
      row.fantasyPlayer.isThai,
    ),
    shortNameTh: row.fantasyPlayer.isThai
      ? (thaiShortNameById.get(row.player.id) ?? null)
      : null,
  }));
  console.table(
    updates.slice(0, 20).map((row) => ({
      player: row.fullNameEn,
      th: row.shortNameTh,
      en: row.shortNameEn,
    })),
  );
  console.log(
    `${updates.length} player short names prepared (${thaiRows.length} Thai-classified players processed).`,
  );
  if (!options.apply) {
    console.log("Preview only. Re-run with --apply to update the database.");
    return;
  }

  const now = new Date();
  for (const update of updates) {
    await db
      .update(players)
      .set({
        shortNameTh: update.shortNameTh,
        shortNameEn: update.shortNameEn,
        updatedAt: now,
      })
      .where(eq(players.id, update.id));
  }
  console.log(`Updated ${updates.length} player short names.`);
}

normalizePlayerShortNames().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
