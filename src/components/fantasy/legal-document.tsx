"use client";

import { ScrollText, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { PublicLanguageSwitcher } from "@/components/fantasy/public-providers";
import { publicHref } from "@/lib/i18n/public-pages";
import { AppShell } from "@/components/fantasy/app-shell";
import { useLanguage } from "@/components/fantasy/i18n";

export type LocalizedLegalText = {
  th: string;
  en: string;
};

export type LegalSection = {
  id: string;
  title: LocalizedLegalText;
  paragraphs?: LocalizedLegalText[];
  bullets?: LocalizedLegalText[];
};

type LegalDocumentProps = {
  kind: "privacy" | "terms";
  title: LocalizedLegalText;
  summary: LocalizedLegalText;
  updatedAt: LocalizedLegalText;
  sections: LegalSection[];
};

const supportEmail = "support@ppfootball.net";

export function LegalDocument({
  kind,
  title,
  summary,
  updatedAt,
  sections,
}: LegalDocumentProps) {
  const { language } = useLanguage();
  const localize = (value: LocalizedLegalText) => value[language];
  const Icon = kind === "privacy" ? ShieldCheck : ScrollText;

  return (
    <AppShell localizeContent={false}>
      <main id="main-content" className="content product-content reading-page">
        <header className="reading-page-header">
          <span className="reading-page-icon" aria-hidden="true">
            <Icon />
          </span>
          <div>
            <h1>{localize(title)}</h1>
            <p>{localize(summary)}</p>
          </div>
          <PublicLanguageSwitcher />
        </header>

        <div className="legal-page-layout">
          <nav
            className="product-card legal-toc"
            aria-label={
              language === "th" ? "หัวข้อในเอกสาร" : "Document sections"
            }
          >
            <div>
              {sections.map((section) => (
                <a href={`#${section.id}`} key={section.id}>
                  {localize(section.title)}
                </a>
              ))}
            </div>
          </nav>

          <article className="product-card legal-document">
            <p className="legal-effective-date">
              {language === "th" ? "ปรับปรุงล่าสุด" : "Last updated"}:{" "}
              {localize(updatedAt)}
            </p>

            {sections.map((section) => (
              <section
                className="legal-document-section"
                id={section.id}
                aria-labelledby={`${section.id}-heading`}
                key={section.id}
              >
                <h2 id={`${section.id}-heading`}>{localize(section.title)}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph.th}>{localize(paragraph)}</p>
                ))}
                {section.bullets?.length ? (
                  <ul>
                    {section.bullets.map((bullet) => (
                      <li key={bullet.th}>{localize(bullet)}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            <footer className="legal-document-footer">
              <p>
                {language === "th"
                  ? "หากมีคำถามเกี่ยวกับเอกสารนี้ ติดต่อ"
                  : "For questions about this document, contact"}{" "}
                <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
              </p>
              <div>
                <Link href={publicHref("/privacy", language)}>
                  {language === "th"
                    ? "นโยบายความเป็นส่วนตัว"
                    : "Privacy Policy"}
                </Link>
                <Link href={publicHref("/terms", language)}>
                  {language === "th" ? "ข้อกำหนดการใช้งาน" : "Terms of Service"}
                </Link>
                <Link href={publicHref("/help", language)}>
                  {language === "th" ? "ช่วยเหลือ" : "Help"}
                </Link>
              </div>
            </footer>
          </article>
        </div>
      </main>
    </AppShell>
  );
}
