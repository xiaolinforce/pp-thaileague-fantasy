"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LanguageProvider, LanguageSwitcher, type Language } from "./i18n";
import { NavigationBlockerProvider } from "./navigation-blocker";
import { TooltipProvider } from "@/components/ui/tooltip";
import { publicHref } from "@/lib/i18n/public-pages";

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
      <NavigationBlockerProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </NavigationBlockerProvider>
    </LanguageProvider>
  );
}

export function PublicLanguageSwitcher() {
  return <LanguageSwitcher />;
}
