"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { loadCurrentAppIdentityAction } from "@/app/auth-actions";
import { LanguageProvider, LanguageSwitcher, type Language } from "./i18n";
import { IdentityProvider, useSetAppIdentity } from "./identity";
import { NavigationBlockerProvider } from "./navigation-blocker";
import { TooltipProvider } from "@/components/ui/tooltip";
import { publicHref } from "@/lib/i18n/public-pages";

function PublicIdentityLoader() {
  const setIdentity = useSetAppIdentity();

  useEffect(() => {
    let active = true;

    void loadCurrentAppIdentityAction()
      .then((identity) => {
        if (active) setIdentity(identity);
      })
      .catch(() => {
        if (active) setIdentity(null);
      });

    return () => {
      active = false;
    };
  }, [setIdentity]);

  return null;
}

export function PublicProviders({
  children,
  language,
}: {
  children: ReactNode;
  language: Language;
}) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <LanguageProvider
      initialLanguage={language}
      onLanguageChange={(next) => router.push(publicHref(pathname, next))}
    >
      <IdentityProvider
        identity={null}
        initiallyLoading
        sessionHeartbeat={false}
      >
        <PublicIdentityLoader />
        <NavigationBlockerProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </NavigationBlockerProvider>
      </IdentityProvider>
    </LanguageProvider>
  );
}

export function PublicLanguageSwitcher() {
  return <LanguageSwitcher />;
}
