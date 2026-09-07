import { redirect } from "next/navigation";

import OnboardingClient from "@/app/onboarding-client";
import { getCurrentFantasyIdentity } from "@/lib/auth/context";
import { authFeatures } from "@/lib/auth/server";
import { checkEmailAvailabilityAction } from "@/app/auth-email-actions";
import { normalizeAuthReturnTo } from "@/lib/auth/return-to";

export default async function UpgradeGuestPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const query = await searchParams;
  const hasReturnTo = typeof query.returnTo === "string";
  const returnTo = normalizeAuthReturnTo(query.returnTo);
  const identity = await getCurrentFantasyIdentity();
  if (!identity) {
    redirect(hasReturnTo ? `/?returnTo=${encodeURIComponent(returnTo)}` : "/");
  }
  if (!identity.isAnonymous) redirect(hasReturnTo ? returnTo : "/profile");
  return (
    <OnboardingClient
      emailEnabled={authFeatures.email}
      emailAvailable={await checkEmailAvailabilityAction()}
      googleEnabled={authFeatures.google}
      turnstileSiteKey={authFeatures.turnstileSiteKey}
      upgradeMode
      returnTo={returnTo}
    />
  );
}
