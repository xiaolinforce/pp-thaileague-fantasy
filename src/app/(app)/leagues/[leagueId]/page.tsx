import { notFound } from "next/navigation";

import { FantasySignIn } from "@/app/fantasy-sign-in";
import { AppShell, PageHeader } from "@/components/fantasy/app-shell";
import { getLeagueDetail } from "@/data/leagues";
import { getAuthSession } from "@/lib/auth/context";
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
  if (!(await getAuthSession())) {
    const leaguePath = `/leagues/${encodeURIComponent(leagueId)}`;
    const returnTo =
      Number.isSafeInteger(requestedPage) && requestedPage > 1
        ? `${leaguePath}?page=${requestedPage}`
        : leaguePath;
    return <FantasySignIn returnTo={returnTo} />;
  }

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
