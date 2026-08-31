import type { ReactNode } from "react";

import { requireFantasyProfile } from "@/lib/auth/context";

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireFantasyProfile();
  return children;
}
