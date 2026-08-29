import "server-only";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { fantasyManagers, fantasySeasons, fantasyTeams } from "@/db/schema";
import { auth } from "@/lib/auth/server";
import {
  ensureFantasyProfile,
  FANTASY_SEASON_SLUG,
} from "@/lib/fantasy/provisioning";

export async function getAuthSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function getCurrentFantasyIdentity() {
  const session = await getAuthSession();
  if (!session) return null;
  const season = await db.query.fantasySeasons.findFirst({
    where: eq(fantasySeasons.slug, FANTASY_SEASON_SLUG),
  });
  const manager = await db.query.fantasyManagers.findFirst({
    where: eq(fantasyManagers.authUserId, session.user.id),
  });
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
}

export async function requireFantasyProfile() {
  const session = await getAuthSession();
  if (!session) redirect("/");
  const isAnonymous = Boolean(
    (session.user as typeof session.user & { isAnonymous?: boolean | null })
      .isAnonymous,
  );
  return {
    session,
    ...(await ensureFantasyProfile({
      authUserId: session.user.id,
      isAnonymous,
    })),
    isAnonymous,
  };
}

export async function requireAdmin() {
  const session = await getAuthSession();
  if (!session) redirect("/");
  const role = String(
    (session.user as typeof session.user & { role?: string }).role ?? "member",
  );
  if (role !== "admin") redirect("/team");
  return session;
}
