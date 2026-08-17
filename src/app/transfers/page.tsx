import TransfersClient from "./client";
import { getCompetitionDataset } from "@/data/competition";
import { getDemoFantasyState } from "@/data/fantasy";

export default async function TransfersPage() {
  const [data, fantasy] = await Promise.all([
    getCompetitionDataset(),
    getDemoFantasyState(),
  ]);
  return <TransfersClient data={data} fantasy={fantasy} />;
}
