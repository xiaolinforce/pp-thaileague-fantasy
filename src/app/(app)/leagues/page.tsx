import { AppShell } from "@/components/fantasy/app-shell";
import { getLeagueOverview } from "@/data/leagues";
import { LeagueOverview } from "./client";

export default async function LeaguesPage({
  searchParams,
}: {
  searchParams: Promise<{ join?: string | string[] }>;
}) {
  const [overview, query] = await Promise.all([
    getLeagueOverview(),
    searchParams,
  ]);
  const initialJoinCode =
    typeof query.join === "string" ? query.join.slice(0, 8) : "";

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
