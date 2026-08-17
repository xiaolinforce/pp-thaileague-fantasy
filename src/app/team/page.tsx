import TeamClient from "./client";
import { getCompetitionDataset } from "@/data/competition";
import { getDemoFantasyState } from "@/data/fantasy";

export default async function TeamPage() {
  const [data, fantasy] = await Promise.all([
    getCompetitionDataset(),
    getDemoFantasyState(),
  ]);
  return <TeamClient data={data} fantasy={fantasy} />;
}
