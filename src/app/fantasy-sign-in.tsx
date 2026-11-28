import OnboardingClient from "@/app/onboarding-client";
import { checkEmailAvailabilityAction } from "@/app/auth-email-actions";
import { AppShell } from "@/components/fantasy/app-shell";
import { authFeatures } from "@/lib/auth/server";

export async function FantasySignIn({ returnTo }: { returnTo: string }) {
  return (
    <AppShell>
      <OnboardingClient
        emailEnabled={authFeatures.email}
        emailAvailable={await checkEmailAvailabilityAction()}
        googleEnabled={authFeatures.google}
        turnstileSiteKey={authFeatures.turnstileSiteKey}
        mode="embedded"
        returnTo={returnTo}
      />
    </AppShell>
  );
}
