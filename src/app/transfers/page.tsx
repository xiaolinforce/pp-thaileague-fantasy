import TransfersClient from "./client";
import { getCompetitionDataset } from "@/data/competition";
import { getFantasyState } from "@/data/fantasy";

export default async function TransfersPage() {
  const [data, fantasy] = await Promise.all([
    getCompetitionDataset(),
    getFantasyState(),
  ]);
  return <TransfersClient data={data} fantasy={fantasy} />;
}
