import StandingsClient from "./client";
import { getLeagueTable } from "@/data/standings";
import { requireFantasyProfile } from "@/lib/auth/context";

export default async function StandingsPage() {
  await requireFantasyProfile();
  const data = await getLeagueTable();
  return <StandingsClient data={data} />;
}
