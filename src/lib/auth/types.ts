export type AppIdentity = {
  teamName: string;
  email: string | null;
  isGuest: boolean;
  role: string;
  preferredLanguage: "th" | "en" | null;
  teamNameChangesRemaining: number;
} | null;

export function createAppIdentity(input: {
  manager: {
    preferredLanguage: string | null;
  };
  team: { name: string; nameChangesUsed: number };
  email: string;
  isGuest: boolean;
  role: string;
}): Exclude<AppIdentity, null> {
  return {
    teamName: input.team.name,
    email: input.isGuest ? null : input.email,
    isGuest: input.isGuest,
    role: input.role,
    preferredLanguage:
      input.manager.preferredLanguage === "th" ||
      input.manager.preferredLanguage === "en"
        ? input.manager.preferredLanguage
        : null,
    teamNameChangesRemaining: Math.max(0, 3 - input.team.nameChangesUsed),
  };
}
