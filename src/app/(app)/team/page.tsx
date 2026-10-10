import TeamClient from "./client";
import { getCompetitionDataset } from "@/data/competition";
import { getFantasyState } from "@/data/fantasy";
import { getDeadlineLabels } from "@/lib/fantasy/deadline-presentation";
import { getTeamPlayerData } from "@/data/team-players";

export default async function TeamPage() {
  const [data, fantasy] = await Promise.all([
    getCompetitionDataset(),
    getFantasyState(),
  ]);
  return (
    <TeamClient
      data={await getTeamPlayerData(data, fantasy)}
      fantasy={fantasy}
      deadlineLabels={getDeadlineLabels(fantasy.gameweek.deadlineAt)}
    />
  );
}
