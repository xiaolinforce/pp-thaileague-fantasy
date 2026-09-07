import { redirect } from "next/navigation";

import OnboardingClient from "@/app/onboarding-client";
import { getCurrentFantasyIdentity } from "@/lib/auth/context";
import { authFeatures } from "@/lib/auth/server";
import { checkEmailAvailabilityAction } from "@/app/auth-email-actions";
import { authCompleteHref, normalizeAuthReturnTo } from "@/lib/auth/return-to";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const query = await searchParams;
  const returnTo = normalizeAuthReturnTo(query.returnTo);
  const identity = await getCurrentFantasyIdentity();
  if (identity?.manager && identity.team) redirect(returnTo);
  if (identity) redirect(authCompleteHref(returnTo));
  return (
    <OnboardingClient
      emailEnabled={authFeatures.email}
      emailAvailable={await checkEmailAvailabilityAction()}
      googleEnabled={authFeatures.google}
      turnstileSiteKey={authFeatures.turnstileSiteKey}
      returnTo={returnTo}
    />
  );
}
