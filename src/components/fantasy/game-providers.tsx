"use client";

import { useRouter } from "next/navigation";
import { useCallback, type ReactNode } from "react";
import { LanguageProvider, type Language } from "./i18n";
import { translateLegacyEnglish } from "@/lib/i18n/legacy";
import { IdentityProvider } from "./identity";
import { NavigationAvailabilityProvider } from "./navigation-availability";
import { NavigationBlockerProvider } from "./navigation-blocker";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import type { AppIdentity } from "@/lib/auth/types";
import type { FantasyNavigationAvailability } from "@/lib/fantasy/navigation";

export function GameProviders({
  children,
  identity,
  language,
  availability,
  restoreDevicePreference = false,
}: {
  children: ReactNode;
  identity: AppIdentity;
  language: Language;
  restoreDevicePreference?: boolean;
  availability: FantasyNavigationAvailability;
}) {
  const router = useRouter();
  const refreshLanguage = useCallback(() => router.refresh(), [router]);
  return (
    <LanguageProvider
      initialLanguage={restoreDevicePreference ? null : language}
      translateEnglish={translateLegacyEnglish}
      onLanguageChange={refreshLanguage}
    >
      <NavigationAvailabilityProvider availability={availability}>
        <NavigationBlockerProvider>
          <IdentityProvider key={JSON.stringify(identity)} identity={identity}>
            <TooltipProvider>{children}</TooltipProvider>
          </IdentityProvider>
        </NavigationBlockerProvider>
      </NavigationAvailabilityProvider>
      <Toaster position="bottom-center" />
    </LanguageProvider>
  );
}
