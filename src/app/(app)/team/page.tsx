import TeamClient from "./client";
import { getCompetitionDataset } from "@/data/competition";
import { getFantasyState } from "@/data/fantasy";
import { getDeadlineLabels } from "@/lib/fantasy/deadline-presentation";

export default async function TeamPage() {
  const [data, fantasy] = await Promise.all([
    getCompetitionDataset(),
    getFantasyState(),
  ]);
  return (
    <TeamClient
      data={data}
      fantasy={fantasy}
      deadlineLabels={getDeadlineLabels(fantasy.gameweek.deadlineAt)}
    />
  );
}
