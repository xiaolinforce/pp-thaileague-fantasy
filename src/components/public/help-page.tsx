"use client";

import Link from "next/link";

import { PublicLanguageSwitcher } from "@/components/fantasy/public-providers";
import { publicHref } from "@/lib/i18n/public-pages";
import { AppShell } from "@/components/fantasy/app-shell";
import { useLanguage } from "@/components/fantasy/i18n";

const facebookUrl = "https://www.facebook.com/ppfo0tball";
const supportEmail = "support@ppfootball.net";

export default function HelpPage() {
  const { language } = useLanguage();

  return (
    <AppShell localizeContent={false}>
      <main id="main-content" className="content product-content reading-page">
        <header className="reading-page-header">
          <h1>{language === "th" ? "ช่วยเหลือ" : "Help"}</h1>
          <PublicLanguageSwitcher />
        </header>

        <section
          className="help-support-column"
          aria-label={
            language === "th" ? "ช่องทางช่วยเหลือ" : "Support options"
          }
        >
          <section className="product-card help-support-card help-support-card--facebook">
            <h2>
              {language === "th"
                ? "ติดต่อผ่าน Facebook"
                : "Contact us on Facebook"}
            </h2>
            <a
              href={facebookUrl}
              className="primary-button"
              target="_blank"
              rel="noreferrer"
            >
              {language === "th" ? "เปิดเพจ PP Football" : "Open PP Football"}
            </a>
          </section>

          <section className="product-card help-support-card">
            <h2>
              {language === "th" ? "ติดต่อทางอีเมล" : "Contact us by email"}
            </h2>
            <a href={`mailto:${supportEmail}`} className="secondary-button">
              {supportEmail}
            </a>
          </section>

          <section className="product-card help-support-card">
            <h2>
              {language === "th" ? "นโยบายและข้อกำหนด" : "Policies and terms"}
            </h2>
            <div className="help-legal-links">
              <Link
                href={publicHref("/privacy", language)}
                className="secondary-button"
              >
                {language === "th" ? "ความเป็นส่วนตัว" : "Privacy"}
              </Link>
              <Link
                href={publicHref("/terms", language)}
                className="secondary-button"
              >
                {language === "th" ? "ข้อกำหนด" : "Terms"}
              </Link>
            </div>
          </section>
        </section>
      </main>
    </AppShell>
  );
}
