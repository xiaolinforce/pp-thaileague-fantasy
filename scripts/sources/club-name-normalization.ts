/**
 * English club names occasionally arrive from the source API in all caps.
 * Keep a small explicit override list so established abbreviations such as FC
 * remain uppercase while the public-facing name follows normal title casing.
 */
export const clubNameEnOverrides = {
  "AYUTTHAYA UNITED": "Ayutthaya United",
  "LAMPHUN WARRIORS": "Lamphun Warriors",
  "PATTANI FC": "Pattani FC",
  "RASISALAI UNITED": "Rasisalai United",
  "SISAKET UNITED": "Sisaket United",
} as const;

export function normalizeClubName(nameEn: string): string {
  return clubNameEnOverrides[nameEn as keyof typeof clubNameEnOverrides] ?? nameEn;
}
