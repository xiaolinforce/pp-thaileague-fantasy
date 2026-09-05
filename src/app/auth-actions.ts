"use server";

import {
  getCurrentFantasyIdentity,
  requireFantasyProfile,
} from "@/lib/auth/context";
import { createAppIdentity } from "@/lib/auth/types";

export async function completeAuthenticationAction() {
  const profile = await requireFantasyProfile();
  const role = String(
    (
      profile.session.user as typeof profile.session.user & {
        role?: string;
      }
    ).role ?? "member",
  );
  const identity = createAppIdentity({
    manager: profile.manager,
    team: profile.team,
    email: profile.session.user.email,
    isGuest: profile.isAnonymous,
    role,
  });

  return {
    destination: "/team",
    identity,
  };
}

export async function loadCurrentAppIdentityAction() {
  const current = await getCurrentFantasyIdentity();
  if (!current?.manager || !current.team) return null;

  return createAppIdentity({
    manager: current.manager,
    team: current.team,
    email: current.user.email,
    isGuest: current.isAnonymous,
    role: current.role,
  });
}
