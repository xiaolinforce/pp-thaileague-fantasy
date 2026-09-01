import FixturesClient from "./client";
import { getCompetitionDataset } from "@/data/competition";
import { requireFantasyProfile } from "@/lib/auth/context";

export default async function FixturesPage() {
  await requireFantasyProfile();
  const data = await getCompetitionDataset();
  return (
    <FixturesClient
      data={{
        fixtures: data.fixtures,
        matchweeks: data.matchweeks,
        currentGameweek: data.currentGameweek,
      }}
    />
  );
}
