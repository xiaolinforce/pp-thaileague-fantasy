"use server";

import { requireFantasyProfile } from "@/lib/auth/context";
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
