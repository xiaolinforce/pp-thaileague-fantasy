import { redirect } from "next/navigation";

import { AppShell } from "@/components/fantasy/app-shell";
import { getLeagueOverview } from "@/data/leagues";
import { getCurrentFantasyIdentity } from "@/lib/auth/context";
import { LeagueOverview } from "./client";

export default async function LeaguesPage() {
  const identity = await getCurrentFantasyIdentity();
  if (!identity) {
    redirect(`/?returnTo=${encodeURIComponent("/leagues")}`);
  }
  const overview = await getLeagueOverview();

  return (
    <AppShell>
      <main id="main-content" className="content product-content league-page">
        <h1 className="sr-only">ลีก</h1>
        <LeagueOverview overview={overview} />
      </main>
    </AppShell>
  );
}
