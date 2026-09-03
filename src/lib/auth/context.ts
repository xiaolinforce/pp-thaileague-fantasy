import "server-only";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { db } from "@/db";
import { fantasyManagers, fantasySeasons, fantasyTeams } from "@/db/schema";
import { auth } from "@/lib/auth/server";
import {
  ensureFantasyProfile,
  FANTASY_SEASON_SLUG,
} from "@/lib/fantasy/provisioning";

export const getAuthSession = cache(async function getAuthSession() {
  return auth.api.getSession({ headers: await headers() });
});

export const getCurrentFantasyIdentity = cache(
  async function getCurrentFantasyIdentity() {
    const session = await getAuthSession();
    if (!session) return null;
    const [season, manager] = await Promise.all([
      db.query.fantasySeasons.findFirst({
        where: eq(fantasySeasons.slug, FANTASY_SEASON_SLUG),
      }),
      db.query.fantasyManagers.findFirst({
        where: eq(fantasyManagers.authUserId, session.user.id),
      }),
    ]);
    const team =
      season && manager
        ? await db.query.fantasyTeams.findFirst({
            where: and(
              eq(fantasyTeams.fantasySeasonId, season.id),
              eq(fantasyTeams.managerId, manager.id),
            ),
          })
        : null;
    return {
      authSession: session,
      user: session.user,
      session: session.session,
      manager: manager ?? null,
      team: team ?? null,
      season: season ?? null,
      isAnonymous: Boolean(
        (session.user as typeof session.user & { isAnonymous?: boolean | null })
          .isAnonymous,
      ),
      role: String(
        (session.user as typeof session.user & { role?: string }).role ??
          "member",
      ),
    };
  },
);

export const requireFantasyProfile = cache(
  async function requireFantasyProfile() {
    const identity = await getCurrentFantasyIdentity();
    if (!identity) redirect("/");
    return {
      session: identity.authSession,
      ...(await ensureFantasyProfile({
        authUserId: identity.user.id,
        isAnonymous: identity.isAnonymous,
        existing: {
          manager: identity.manager,
          team: identity.team,
          season: identity.season,
        },
      })),
      isAnonymous: identity.isAnonymous,
    };
  },
);

export async function requireAdmin() {
  const session = await getAuthSession();
  if (!session) redirect("/");
  const role = String(
    (session.user as typeof session.user & { role?: string }).role ?? "member",
  );
  if (role !== "admin") redirect("/team");
  return session;
}
