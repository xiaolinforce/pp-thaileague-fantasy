import TransfersClient from "./client";
import { getCompetitionDataset } from "@/data/competition";

export default async function TransfersPage() {
  const data = await getCompetitionDataset();
  return <TransfersClient data={data} />;
}
