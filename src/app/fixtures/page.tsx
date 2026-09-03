import FixturesClient from "./client";
import { getFixturesDataset } from "@/data/fixtures";
import { requireFantasyProfile } from "@/lib/auth/context";

export default async function FixturesPage() {
  await requireFantasyProfile();
  const data = await getFixturesDataset();
  return <FixturesClient data={data} />;
}
