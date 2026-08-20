import DashboardClient from "./client";
import { getCompetitionDataset } from "@/data/competition";
import { getFantasyState } from "@/data/fantasy";

export default async function DashboardPage() {
  const [data, fantasy] = await Promise.all([
    getCompetitionDataset(),
    getFantasyState(),
  ]);
  return <DashboardClient data={data} fantasy={fantasy} />;
}
