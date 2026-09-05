import type { Metadata } from "next";

export const publicPages = {
  rules: {
    th: {
      title: "กติกาเกม",
      description:
        "กติกาการจัดทีม การซื้อขาย ชิป และคะแนนของ PP Thai League Fantasy",
    },
    en: {
      title: "Game rules",
      description:
        "Squad, transfer, chip and scoring rules for PP Thai League Fantasy.",
    },
  },
  help: {
    th: {
      title: "ช่วยเหลือ",
      description: "ช่องทางติดต่อและช่วยเหลือผู้เล่น PP Thai League Fantasy",
    },
    en: {
      title: "Help",
      description:
        "Contact and support options for PP Thai League Fantasy players.",
    },
  },
  privacy: {
    th: {
      title: "นโยบายความเป็นส่วนตัว",
      description: "ข้อมูลที่เราเก็บ เหตุผลที่ใช้ การเก็บรักษา และสิทธิของคุณ",
    },
    en: {
      title: "Privacy Policy",
      description:
        "What we collect, why we use it, how it is retained, and your rights.",
    },
  },
  terms: {
    th: {
      title: "ข้อกำหนดการใช้งาน",
      description:
        "เงื่อนไขสำหรับบัญชี การเล่นอย่างเป็นธรรม กติกา และการใช้บริการ",
    },
    en: {
      title: "Terms of Service",
      description:
        "Conditions for accounts, fair play, rules, and use of the service.",
    },
  },
} as const;

export function publicHref(path: string, language: "th" | "en") {
  const base = path.replace(/^\/en(?=\/)/, "");
  return Object.keys(publicPages).some((route) => base === `/${route}`)
    ? `${language === "en" ? "/en" : ""}${base}`
    : path;
}

export function publicPageMetadata(
  page: keyof typeof publicPages,
  language: "th" | "en",
): Metadata {
  const copy = publicPages[page][language];
  const canonical = publicHref(`/${page}`, language);
  return {
    title: `${copy.title} | PP Thai League Fantasy`,
    description: copy.description,
    alternates: {
      canonical,
      languages: { th: `/${page}`, en: `/en/${page}`, "x-default": `/${page}` },
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: canonical,
      locale: language === "th" ? "th_TH" : "en_GB",
      type: "website",
      images: ["/og.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: ["/og.png"],
    },
  };
}
