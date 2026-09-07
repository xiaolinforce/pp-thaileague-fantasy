import { redirect } from "next/navigation";

import { AppShell } from "@/components/fantasy/app-shell";
import { getLeagueOverview } from "@/data/leagues";
import { getCurrentFantasyIdentity } from "@/lib/auth/context";
import { LeagueOverview } from "./client";

export default async function LeaguesPage({
  searchParams,
}: {
  searchParams: Promise<{ join?: string | string[] }>;
}) {
  const [identity, query] = await Promise.all([
    getCurrentFantasyIdentity(),
    searchParams,
  ]);
  const initialJoinCode =
    typeof query.join === "string" ? query.join.slice(0, 8) : "";
  if (!identity) {
    const returnTo = initialJoinCode
      ? `/leagues?join=${encodeURIComponent(initialJoinCode)}`
      : "/leagues";
    redirect(`/?returnTo=${encodeURIComponent(returnTo)}`);
  }
  const overview = await getLeagueOverview();

  return (
    <AppShell>
      <main id="main-content" className="content product-content league-page">
        <h1 className="sr-only">ลีก</h1>
        <LeagueOverview
          key={initialJoinCode}
          overview={overview}
          initialJoinCode={initialJoinCode}
        />
      </main>
    </AppShell>
  );
}
