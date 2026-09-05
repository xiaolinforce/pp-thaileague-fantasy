import { RootDocument } from "@/components/fantasy/root-document";
export { metadata } from "@/components/fantasy/root-document";
import type { ReactNode } from "react";
import { GameProviders } from "@/components/fantasy/game-providers";
import { getFantasyNavigationAvailability } from "@/data/navigation";
import { getCurrentFantasyIdentity } from "@/lib/auth/context";
import { createAppIdentity } from "@/lib/auth/types";
import { getRequestLanguage, getDeviceLanguage } from "@/lib/i18n/server";
export default async function GameLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [current, navigationAvailability, language, deviceLanguage] =
    await Promise.all([
      getCurrentFantasyIdentity(),
      getFantasyNavigationAvailability(),
      getRequestLanguage(),
      getDeviceLanguage(),
    ]);
  const identity =
    current?.manager && current.team
      ? createAppIdentity({
          manager: current.manager,
          team: current.team,
          email: current.user.email,
          isGuest: current.isAnonymous,
          role: current.role,
        })
      : null;

  return (
    <RootDocument language={language}>
      <GameProviders
        language={language}
        restoreDevicePreference={
          (!identity || identity.isGuest) && !deviceLanguage
        }
        identity={identity}
        availability={navigationAvailability}
      >
        <div lang={language} className="contents">
          {children}
        </div>
      </GameProviders>
    </RootDocument>
  );
}
