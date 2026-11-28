import StandingsClient from "./client";
import { getLeagueTable } from "@/data/standings";

export default async function StandingsPage() {
  const data = await getLeagueTable();
  return <StandingsClient data={data} />;
}
