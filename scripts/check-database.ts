import { loadEnvConfig } from "@next/env";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

loadEnvConfig(process.cwd());

async function checkDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const database = drizzle(databaseUrl);

  await database.execute(sql`select 1 as connected`);

  console.log("Database connection successful.");
}

checkDatabase().catch(() => {
  console.error("Database connection failed.");
  process.exitCode = 1;
});
