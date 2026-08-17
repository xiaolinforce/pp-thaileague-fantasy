import DashboardClient from "./client";
import { getCompetitionDataset } from "@/data/competition";
import { getDemoFantasyState } from "@/data/fantasy";

export default async function DashboardPage() {
  const [data, fantasy] = await Promise.all([
    getCompetitionDataset(),
    getDemoFantasyState(),
  ]);
  return <DashboardClient data={data} fantasy={fantasy} />;
}
