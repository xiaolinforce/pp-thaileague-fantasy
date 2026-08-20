import TeamClient from "./client";
import { getCompetitionDataset } from "@/data/competition";
import { getFantasyState } from "@/data/fantasy";

export default async function TeamPage() {
  const [data, fantasy] = await Promise.all([
    getCompetitionDataset(),
    getFantasyState(),
  ]);
  return <TeamClient data={data} fantasy={fantasy} />;
}
