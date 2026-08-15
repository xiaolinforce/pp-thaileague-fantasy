import FixturesClient from "./client";
import { getCompetitionDataset } from "@/data/competition";

export default async function FixturesPage() {
  const data = await getCompetitionDataset();
  return <FixturesClient data={data} />;
}
