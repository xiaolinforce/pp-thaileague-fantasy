"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { FantasyNavigationAvailability } from "@/lib/fantasy/navigation";

const NavigationAvailabilityContext =
  createContext<FantasyNavigationAvailability>({ pointsEnabled: true });

export function NavigationAvailabilityProvider({
  availability,
  children,
}: {
  availability: FantasyNavigationAvailability;
  children: ReactNode;
}) {
  return (
    <NavigationAvailabilityContext.Provider value={availability}>
      {children}
    </NavigationAvailabilityContext.Provider>
  );
}

export function useNavigationAvailability() {
  return useContext(NavigationAvailabilityContext);
}
