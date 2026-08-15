import TeamClient from "./client";
import { getCompetitionDataset } from "@/data/competition";

export default async function TeamPage() {
  const data = await getCompetitionDataset();
  return <TeamClient data={data} />;
}
