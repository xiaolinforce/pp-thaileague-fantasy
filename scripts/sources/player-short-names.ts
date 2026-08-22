function compact(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function getEnglishPlayerShortName(fullNameEn: string) {
  const parts = compact(fullNameEn).split(" ").filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? fullNameEn;
  const suffixes = new Set(["jr.", "jr", "ii", "iii", "iv"]);
  const last = parts.at(-1)!;
  return suffixes.has(last.toLocaleLowerCase("en"))
    ? (parts.at(-2) ?? last)
    : last;
}

export function getThaiPlayerShortName(homeCountryName: string | null) {
  if (!homeCountryName || !/[\u0e00-\u0e7f]/.test(homeCountryName)) {
    return null;
  }
  return compact(homeCountryName).split(" ")[0] || null;
}

export function extractTransfermarktHomeCountryName(html: string) {
  const match = html.match(
    /Name in home country:<\/span>\s*<span[^>]*>([\s\S]*?)<\/span>/i,
  );
  if (!match) return null;
  return compact(
    match[1]
      .replace(/<[^>]+>/g, " ")
      .replaceAll("&nbsp;", " ")
      .replaceAll("&#x27;", "'")
      .replaceAll("&amp;", "&"),
  );
}
