"use client";

import { createContext, useContext, type ReactNode } from "react";
import { authClient } from "@/lib/auth/client";

export type AppIdentity = {
  managerName: string;
  teamName: string;
  email: string | null;
  isGuest: boolean;
  role: string;
  teamNameChangesRemaining: number;
  managerNameChangeAvailableAt: string | null;
} | null;

const IdentityContext = createContext<AppIdentity>(null);

function SessionHeartbeat() {
  authClient.useSession();
  return null;
}

export function IdentityProvider({
  children,
  identity,
}: {
  children: ReactNode;
  identity: AppIdentity;
}) {
  return (
    <IdentityContext.Provider value={identity}>
      {identity && <SessionHeartbeat />}
      {children}
    </IdentityContext.Provider>
  );
}

export function useAppIdentity() {
  return useContext(IdentityContext);
}
