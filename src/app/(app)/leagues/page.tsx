import { FantasySignIn } from "@/app/fantasy-sign-in";
import { AppShell } from "@/components/fantasy/app-shell";
import { getLeagueOverview } from "@/data/leagues";
import { getAuthSession } from "@/lib/auth/context";
import { LeagueOverview } from "./client";

export default async function LeaguesPage({
  searchParams,
}: {
  searchParams: Promise<{ join?: string | string[] }>;
}) {
  if (!(await getAuthSession())) {
    const { join } = await searchParams;
    const returnTo =
      typeof join === "string"
        ? `/leagues?join=${encodeURIComponent(join)}`
        : "/leagues";
    return <FantasySignIn returnTo={returnTo} />;
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
