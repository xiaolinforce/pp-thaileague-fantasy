"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { authClient } from "@/lib/auth/client";
import type { AppIdentity } from "@/lib/auth/types";

const IdentityContext = createContext<AppIdentity>(null);
const IdentityUpdateContext = createContext<Dispatch<
  SetStateAction<AppIdentity>
> | null>(null);

function SessionHeartbeat() {
  authClient.useSession();
  return null;
}

export function IdentityProvider({
  children,
  identity: initialIdentity,
}: {
  children: ReactNode;
  identity: AppIdentity;
}) {
  const [identity, setIdentity] = useState(initialIdentity);

  return (
    <IdentityUpdateContext.Provider value={setIdentity}>
      <IdentityContext.Provider value={identity}>
        {identity && <SessionHeartbeat />}
        {children}
      </IdentityContext.Provider>
    </IdentityUpdateContext.Provider>
  );
}

export function useAppIdentity() {
  return useContext(IdentityContext);
}

export function useSetAppIdentity() {
  const setIdentity = useContext(IdentityUpdateContext);
  if (!setIdentity) {
    throw new Error("useSetAppIdentity must be used within IdentityProvider.");
  }
  return setIdentity;
}
