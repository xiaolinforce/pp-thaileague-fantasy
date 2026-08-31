export type AppIdentity = {
  managerName: string;
  teamName: string;
  email: string | null;
  isGuest: boolean;
  role: string;
  preferredLanguage: "th" | "en" | null;
  teamNameChangesRemaining: number;
  managerNameChangeAvailableAt: string | null;
} | null;

export function createAppIdentity(input: {
  manager: {
    displayName: string;
    nameChangeAvailableAt: Date | null;
    preferredLanguage: string | null;
  };
  team: { name: string; nameChangesUsed: number };
  email: string;
  isGuest: boolean;
  role: string;
}): Exclude<AppIdentity, null> {
  return {
    managerName: input.manager.displayName,
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
    managerNameChangeAvailableAt:
      input.manager.nameChangeAvailableAt &&
      input.manager.nameChangeAvailableAt > new Date()
        ? input.manager.nameChangeAvailableAt.toISOString()
        : null,
  };
}
