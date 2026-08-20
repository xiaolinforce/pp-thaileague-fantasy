import { redirect } from "next/navigation";

import OnboardingClient from "@/app/onboarding-client";
import { getCurrentFantasyIdentity } from "@/lib/auth/context";
import { authFeatures } from "@/lib/auth/server";

export default async function UpgradeGuestPage() {
  const identity = await getCurrentFantasyIdentity();
  if (!identity) redirect("/");
  if (!identity.isAnonymous) redirect("/profile");
  return (
    <OnboardingClient
      emailEnabled={authFeatures.email}
      googleEnabled={authFeatures.google}
      turnstileSiteKey={authFeatures.turnstileSiteKey}
      upgradeMode
    />
  );
}
