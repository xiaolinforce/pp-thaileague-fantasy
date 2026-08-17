import { loadEnvConfig } from "@next/env";
import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import {
  fantasyGameweeks,
  fantasyLeagueMembers,
  fantasyLeagues,
  fantasyManagers,
  fantasyPlayers,
  fantasyPlayerTiers,
  fantasySeasons,
  fantasyTeams,
  fantasyTeamSelectionPlayers,
  fantasyTeamSelections,
} from "../src/db/schema";

loadEnvConfig(process.cwd());
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
const db = drizzle(databaseUrl);

const tables = {
  fantasySeasons,
  fantasyGameweeks,
  fantasyPlayers,
  fantasyPlayerTiers,
  fantasyManagers,
  fantasyTeams,
  fantasyTeamSelections,
  fantasyTeamSelectionPlayers,
  fantasyLeagues,
  fantasyLeagueMembers,
};

async function verifyFantasyGame() {
  for (const [name, table] of Object.entries(tables)) {
    const result = await db.select({ count: count() }).from(table);
    console.log(`${name}: ${result[0].count}`);
  }
}

verifyFantasyGame().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
