import type { Metadata } from "next";

export const SITE_URL = "https://fantasy.ppfootball.net";
export const SITE_NAME = "PP Thai League Fantasy";
export const PUBLIC_PATHS = [
  "/",
  "/rules",
  "/thai-league/2026-27/fixtures",
  "/help",
  "/privacy",
  "/terms",
] as const;
export type PublicPath = (typeof PUBLIC_PATHS)[number];
export const isPreview = process.env.VERCEL_ENV === "preview";

const copy: Record<PublicPath, { th: [string, string]; en: [string, string] }> =
  {
    "/": {
      th: [
        "แฟนตาซีไทยลีก 2026/27",
        "เล่นแฟนตาซีฟุตบอลไทยลีก เลือกนักเตะ 15 คน จัดตัวจริงและกัปตัน ลุ้นคะแนนจากผลงานจริง แล้วสร้างลีกแข่งกับเพื่อน เริ่มทดลองเล่นแบบ Guest ได้",
      ],
      en: [
        "Thai League Fantasy 2026/27",
        "Build a 15-player Thai League fantasy squad, choose your captain and compete with friends using points from real matches. Try playing as a guest.",
      ],
    },
    "/rules": {
      th: [
        "กติกาและวิธีเล่นแฟนตาซีไทยลีก",
        "เริ่มเล่น PP Thai League Fantasy พร้อมกติกาเลือกทีม โควตานักเตะ Level การย้ายทีม ชิป กัปตัน ตัวสำรอง และการคิดคะแนน",
      ],
      en: [
        "Thai League Fantasy rules and how to play",
        "Get started with PP Thai League Fantasy and read the squad limits, player tiers, transfers, chips, captaincy, substitutions and scoring rules.",
      ],
    },
    "/thai-league/2026-27/fixtures": {
      th: [
        "โปรแกรมและผลการแข่งขันไทยลีก 2026/27",
        "ดูโปรแกรมและผลการแข่งขันไทยลีก 1 ฤดูกาล 2026/27 แยกตามสัปดาห์ พร้อมเวลาประเทศไทย เพื่อวางแผนทีมแฟนตาซีของคุณ",
      ],
      en: [
        "Thai League 1 fixtures and results 2026/27",
        "Browse Thai League 1 fixtures and results for 2026/27 by matchweek, with kickoff times in Thailand, to plan your fantasy squad.",
      ],
    },
    "/help": {
      th: [
        "ช่วยเหลือและติดต่อ PP Football",
        "ติดต่อทีมงาน PP Thai League Fantasy ผ่าน Facebook หรืออีเมล อ่านวิธีเล่น กติกา นโยบายความเป็นส่วนตัว และข้อกำหนดการใช้งาน",
      ],
      en: [
        "Help and contact PP Football",
        "Contact PP Thai League Fantasy through Facebook or email. Find the beginner guide, game rules, privacy policy and terms of service.",
      ],
    },
    "/privacy": {
      th: [
        "นโยบายความเป็นส่วนตัว",
        "การเก็บ ใช้ เปิดเผย และเก็บรักษาข้อมูลบัญชีและการเล่น PP Thai League Fantasy พร้อมช่องทางติดต่อและสิทธิของคุณ",
      ],
      en: [
        "Privacy policy",
        "How PP Thai League Fantasy collects, uses, shares and retains account and game data, including your choices and how to contact us.",
      ],
    },
    "/terms": {
      th: [
        "ข้อกำหนดการใช้งาน",
        "เงื่อนไขบัญชี การเล่นอย่างเป็นธรรม กติกา ข้อมูลการแข่งขัน และการใช้บริการ PP Thai League Fantasy",
      ],
      en: [
        "Terms of service",
        "Conditions for accounts, fair play, game rules, competition data and using PP Thai League Fantasy.",
      ],
    },
  };

export function publicMetadata(
  path: PublicPath,
  language: "th" | "en",
): Metadata {
  const [heading, description] = copy[path][language];
  const title = `${heading} | ${SITE_NAME}`;
  const url = new URL(path, SITE_URL).href;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: !isPreview, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: language === "th" ? "th_TH" : "en_GB",
      images: [
        { url: `${SITE_URL}/og.png`, width: 1728, height: 910, alt: SITE_NAME },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/og.png`],
    },
  };
}

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  alternateName: "PP แฟนตาซีไทยลีก",
  inLanguage: "th",
  publisher: {
    "@type": "Organization",
    name: "PP Football",
    url: "https://www.ppfootball.net/",
    sameAs: ["https://www.facebook.com/ppfo0tball"],
  },
};
