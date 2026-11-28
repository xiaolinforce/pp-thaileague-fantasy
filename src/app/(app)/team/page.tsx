import TeamClient from "./client";
import { getCompetitionDataset } from "@/data/competition";
import { getFantasyState } from "@/data/fantasy";
import { getDeadlineLabels } from "@/lib/fantasy/deadline-presentation";
import { getTeamPlayerData } from "@/data/team-players";
import { getAuthSession } from "@/lib/auth/context";
import { FantasySignIn } from "@/app/fantasy-sign-in";

export default async function TeamPage() {
  if (!(await getAuthSession())) return <FantasySignIn returnTo="/team" />;

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
