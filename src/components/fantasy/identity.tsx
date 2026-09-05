"use client";

import {
  createContext,
  useCallback,
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
const IdentityLoadingContext = createContext(false);

function SessionHeartbeat() {
  authClient.useSession();
  return null;
}

export function IdentityProvider({
  children,
  identity: initialIdentity,
  initiallyLoading = false,
  sessionHeartbeat = true,
}: {
  children: ReactNode;
  identity: AppIdentity;
  initiallyLoading?: boolean;
  sessionHeartbeat?: boolean;
}) {
  const [identity, setIdentity] = useState(initialIdentity);
  const [loading, setLoading] = useState(initiallyLoading);
  const updateIdentity = useCallback<Dispatch<SetStateAction<AppIdentity>>>(
    (nextIdentity) => {
      setIdentity(nextIdentity);
      setLoading(false);
    },
    [],
  );

  return (
    <IdentityUpdateContext.Provider value={updateIdentity}>
      <IdentityLoadingContext.Provider value={loading}>
        <IdentityContext.Provider value={identity}>
          {sessionHeartbeat && identity && <SessionHeartbeat />}
          {children}
        </IdentityContext.Provider>
      </IdentityLoadingContext.Provider>
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

export function useAppIdentityLoading() {
  return useContext(IdentityLoadingContext);
}
