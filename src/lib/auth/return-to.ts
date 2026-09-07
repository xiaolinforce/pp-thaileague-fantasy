export const DEFAULT_AUTH_RETURN_TO = "/team";

const allowedAppPath =
  /^\/(?:team|points|leagues(?:\/[^/?#]+)?|fixtures|profile|settings|rules|help|privacy|terms)(?:[/?#]|$)/;

export function normalizeAuthReturnTo(value: unknown) {
  if (typeof value !== "string") return DEFAULT_AUTH_RETURN_TO;

  const candidate = value.trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return DEFAULT_AUTH_RETURN_TO;
  }

  try {
    const decoded = decodeURIComponent(candidate);
    if (decoded.includes("\\") || decoded.startsWith("//")) {
      return DEFAULT_AUTH_RETURN_TO;
    }
  } catch {
    return DEFAULT_AUTH_RETURN_TO;
  }

  return allowedAppPath.test(candidate) ? candidate : DEFAULT_AUTH_RETURN_TO;
}

export function authCompleteHref(returnTo: string) {
  return returnTo === DEFAULT_AUTH_RETURN_TO
    ? "/auth/complete"
    : `/auth/complete?returnTo=${encodeURIComponent(returnTo)}`;
}
