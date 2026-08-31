export type InterfaceLanguage = "th" | "en";

export function parseInterfaceLanguage(
  value: unknown,
): InterfaceLanguage | null {
  return value === "th" || value === "en" ? value : null;
}
