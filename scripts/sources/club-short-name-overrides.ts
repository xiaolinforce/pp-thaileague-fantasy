export type ClubShortNameOverride = {
  th: string;
  en: string;
};

/**
 * Curated compact labels for the current Thai League 1 club pool. Keys are
 * stable Thai League club IDs, stored as `clubs.external_id`.
 */
export const clubShortNameOverrides: Record<string, ClubShortNameOverride> = {
  "11": { th: "บุรีรัมย์", en: "Buriram" },
  "18": { th: "ชลบุรี", en: "Chonburi" },
  "21": { th: "บีจี", en: "BG Pathum" },
  "26": { th: "เชียงราย", en: "Chiangrai" },
  "31": { th: "ระยอง", en: "Rayong" },
  "40": { th: "แบงค็อก", en: "Bangkok" },
  "45": { th: "ลำพูน", en: "Lamphun" },
  "46": { th: "ท่าเรือ", en: "Port" },
  "82": { th: "ปัตตานี", en: "Pattani" },
  "100": { th: "ศรีสะเกษ", en: "Sisaket" },
  "107": { th: "ประจวบ", en: "Prachuap" },
  "108": { th: "สุโขทัย", en: "Sukhothai" },
  "109": { th: "ราชบุรี", en: "Ratchaburi" },
  "114": { th: "อุทัยธานี", en: "Uthai Thani" },
  "128": { th: "อยุธยา", en: "Ayutthaya" },
  "196": { th: "ราษีไศล", en: "Rasisalai" },
};

export function getClubShortNames(
  externalId: string,
  fallback: ClubShortNameOverride,
) {
  return clubShortNameOverrides[externalId] ?? fallback;
}
