import { notFound } from "next/navigation";

import { AppShell, PageHeader } from "@/components/fantasy/app-shell";
import { getLeagueDetail } from "@/data/leagues";
import { LeagueDetail } from "../client";

export default async function LeagueDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ leagueId: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const [{ leagueId }, query] = await Promise.all([params, searchParams]);
  const requestedPage = typeof query.page === "string" ? Number(query.page) : 1;
  const league = await getLeagueDetail(leagueId, requestedPage);
  if (!league) notFound();

  return (
    <AppShell>
      <main id="main-content" className="content product-content league-page">
        <PageHeader title={league.name} />
        <LeagueDetail
          key={`${league.id}:${league.name}:${league.inviteCode ?? ""}`}
          league={league}
        />
      </main>
    </AppShell>
  );
}
