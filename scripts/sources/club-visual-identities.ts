export type ClubVisualIdentitySource = {
  clubNameEn: string;
  colors: readonly [string, string, string, string];
  sourceUrl: string;
  notes: string;
};

const alternate = (
  first: string,
  second: string,
): readonly [string, string, string, string] => [
  first,
  second,
  second,
  first,
];

const solid = (color: string): readonly [string, string, string, string] => [
  color,
  color,
  color,
  color,
];

const threeColor = (
  primary: string,
  secondary: string,
  accent: string,
): readonly [string, string, string, string] => [
  primary,
  secondary,
  accent,
  primary,
];

export const CLUB_COLOR_SOURCE_NAME = "club-kit-research-2026-08-16";

export const clubVisualIdentitySources: readonly ClubVisualIdentitySource[] = [
  {
    clubNameEn: "Ayutthaya United",
    colors: threeColor("#071C3D", "#1D4ED8", "#D6A53A"),
    sourceUrl:
      "https://www.arifootballstore.com/jerseys/ay-033-ego-sport-ayutthaya-united-2025-2026-home-jersey-navy-blue-gold.html",
    notes: "Navy, blue and gold from the 2025/26 home identity.",
  },
  {
    clubNameEn: "BG Pathum United",
    colors: alternate("#0757B9", "#FFFFFF"),
    sourceUrl:
      "https://www.footballkitarchive.com/bg-pathum-united-2025-26-home-kit-371343/",
    notes: "Blue and white home stripes.",
  },
  {
    clubNameEn: "Buriram United",
    colors: solid("#101C46"),
    sourceUrl:
      "https://www.footballkitarchive.com/buriram-united-2026-27-home-kit-493588/",
    notes: "User-curated solid navy identity.",
  },
  {
    clubNameEn: "Chonburi FC",
    colors: threeColor("#0054A6", "#29A9E1", "#D4AF37"),
    sourceUrl:
      "https://www.footballkitarchive.com/chonburi-fc-2025-26-home-kit-396720/",
    notes: "Blue, sky blue and gold home identity.",
  },
  {
    clubNameEn: "Lamphun Warriors",
    colors: solid("#F7F5EF"),
    sourceUrl: "https://lamphunwarriors.net/",
    notes: "User-curated solid white identity.",
  },
  {
    clubNameEn: "PT Prachuap FC",
    colors: alternate("#F36C21", "#151515"),
    sourceUrl:
      "https://www.arionline.com/products/ari-pt-prachuap-fc-2025-2026-home-player-jersey-orange-black-white",
    notes: "Orange and black home identity.",
  },
  {
    clubNameEn: "Pattani FC",
    colors: alternate("#F2C230", "#087443"),
    sourceUrl:
      "https://www.footballkitarchive.com/ms/pattani-fc-2025-26-kit-home-400790/",
    notes: "Yellow and green home identity.",
  },
  {
    clubNameEn: "Port FC",
    colors: alternate("#F47A20", "#174B9A"),
    sourceUrl:
      "https://tqpr.com/port-f-c-unveils-2025-26-mizuno-kits-a-new-era-in-thai-football-storytelling/",
    notes: "Traditional orange and blue stripes.",
  },
  {
    clubNameEn: "Rasisalai United",
    colors: threeColor("#C92336", "#203F88", "#FFFFFF"),
    sourceUrl:
      "https://www.footballkitarchive.com/rasisalai-united-2025-26-home-kit/405871/",
    notes: "Red, blue and white home identity.",
  },
  {
    clubNameEn: "Ratchaburi FC",
    colors: alternate("#F36A21", "#FFFFFF"),
    sourceUrl: "https://shop.line.me/%40egosport/product/1007800708",
    notes: "User-curated orange and white identity.",
  },
  {
    clubNameEn: "Rayong FC",
    colors: solid("#164A96"),
    sourceUrl:
      "https://www.footballkitarchive.com/rayong-fc-2025-26-home-kit/396376/",
    notes: "User-curated solid blue identity.",
  },
  {
    clubNameEn: "Singha Chiangrai United",
    colors: alternate("#FF5F00", "#171717"),
    sourceUrl:
      "https://www.supersports.co.th/en/products/chiangrai-united-tpl-apparel-accessories-club-jersey-ch019ap538epth-086-003",
    notes: "Orange and black club identity.",
  },
  {
    clubNameEn: "Sisaket United",
    colors: solid("#F47721"),
    sourceUrl:
      "https://egosportthailand.com/together-for-the-next-chapter-together-with-sisaket-united/",
    notes:
      "Solid orange sampled from the user-provided 2025/26 home-jersey reference.",
  },
  {
    clubNameEn: "Sukhothai FC",
    colors: solid("#C72535"),
    sourceUrl:
      "https://www.footballkitarchive.com/sukhothai-fc-2025-26-home-kit/387571/",
    notes: "User-curated solid red identity.",
  },
  {
    clubNameEn: "True Bangkok United",
    colors: alternate("#E51B2A", "#151515"),
    sourceUrl: "https://www.true.th/blog/truebangkokunitedxadidas/",
    notes: "Red home identity paired with the club's black detailing.",
  },
  {
    clubNameEn: "Uthai Thani FC",
    colors: alternate("#711C36", "#151515"),
    sourceUrl:
      "https://www.footballkitarchive.com/uthai-thani-fc-2025-26-home-kit-387262/",
    notes: "Claret and black home identity.",
  },
];
