export type InterfaceLanguage = "th" | "en";

export function parseInterfaceLanguage(
  value: unknown,
): InterfaceLanguage | null {
  return value === "th" || value === "en" ? value : null;
}

export function getInitialInterfaceLanguage(
  storedLanguage: unknown,
): InterfaceLanguage {
  return parseInterfaceLanguage(storedLanguage) ?? "th";
}
