"use client";

import { useMemo } from "react";

import { PublicLanguageSwitcher } from "@/components/fantasy/public-providers";
import { AppShell } from "@/components/fantasy/app-shell";
import { useLanguage } from "@/components/fantasy/i18n";
import { buildFantasyRuleSections } from "@/lib/fantasy/rule-content";

export default function RulesPage() {
  const { language } = useLanguage();
  const sections = useMemo(
    () =>
      buildFantasyRuleSections(language).filter(
        (section) => section.id !== "results",
      ),
    [language],
  );

  return (
    <AppShell localizeContent={false}>
      <main id="main-content" className="content product-content reading-page">
        <header className="reading-page-header">
          <h1>{language === "th" ? "กติกาเกม" : "Game rules"}</h1>
          <PublicLanguageSwitcher />
        </header>

        <div className="rules-page-layout">
          <nav
            className="product-card rules-toc"
            aria-label={
              language === "th" ? "ส่วนต่างๆ ของกติกา" : "Rules sections"
            }
          >
            <div>
              {sections.map((section) => (
                <a href={`#${section.id}`} key={section.id}>
                  {section.title}
                </a>
              ))}
            </div>
          </nav>

          <article className="product-card rules-document">
            {sections.map((section) => (
              <section
                className="rules-document-section"
                id={section.id}
                aria-labelledby={`${section.id}-heading`}
                key={section.id}
              >
                <h2 id={`${section.id}-heading`}>{section.title}</h2>
                <p>{section.summary}</p>
                <ul>
                  {section.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </section>
            ))}
          </article>
        </div>
      </main>
    </AppShell>
  );
}
