import { redirect } from "next/navigation";

import OnboardingClient from "@/app/onboarding-client";
import { getCurrentFantasyIdentity } from "@/lib/auth/context";
import { authFeatures } from "@/lib/auth/server";
import { checkEmailAvailabilityAction } from "@/app/auth-email-actions";

export default async function HomePage() {
  const identity = await getCurrentFantasyIdentity();
  if (identity?.manager && identity.team) redirect("/team");
  if (identity) redirect("/auth/complete");
  return (
    <OnboardingClient
      emailEnabled={authFeatures.email}
      emailAvailable={await checkEmailAvailabilityAction()}
      googleEnabled={authFeatures.google}
      turnstileSiteKey={authFeatures.turnstileSiteKey}
    />
  );
}
