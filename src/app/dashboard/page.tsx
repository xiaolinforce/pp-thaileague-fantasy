import DashboardClient from "./client";
import { getCompetitionDataset } from "@/data/competition";

export default async function DashboardPage() {
  const data = await getCompetitionDataset();
  return <DashboardClient data={data} />;
}
