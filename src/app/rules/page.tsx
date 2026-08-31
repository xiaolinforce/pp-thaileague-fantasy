"use client";

import { BookOpenText, ShieldCheck } from "lucide-react";
import { useMemo } from "react";

import { AppShell } from "@/components/fantasy/app-shell";
import { useLanguage } from "@/components/fantasy/i18n";
import { buildFantasyRuleSections } from "@/lib/fantasy/rule-content";

export default function RulesPage() {
  const { language } = useLanguage();
  const sections = useMemo(
    () => buildFantasyRuleSections(language),
    [language],
  );

  return (
    <AppShell>
      <main id="main-content" className="content product-content reading-page">
        <header className="reading-page-header">
          <span className="reading-page-icon" aria-hidden="true">
            <BookOpenText />
          </span>
          <div>
            <h1>{language === "th" ? "กติกาเกม" : "Game rules"}</h1>
            <p>
              {language === "th"
                ? "กติกาที่ระบบใช้ตรวจทีม ซื้อขาย และคำนวณคะแนนสำหรับฤดูกาล 2026/27"
                : "The rules used to validate squads, settle transfers, and calculate points for the 2026/27 season."}
            </p>
          </div>
        </header>

        <div className="rules-page-layout">
          <nav
            className="product-card rules-toc"
            aria-label={language === "th" ? "สารบัญกติกา" : "Rules contents"}
          >
            <strong>{language === "th" ? "สารบัญ" : "Contents"}</strong>
            <div>
              {sections.map((section) => (
                <a href={`#${section.id}`} key={section.id}>
                  {section.title}
                </a>
              ))}
            </div>
          </nav>

          <article className="product-card rules-document">
            <div className="rules-source-note">
              <ShieldCheck aria-hidden="true" />
              <div>
                <strong>
                  {language === "th"
                    ? "ใช้กติกาชุดเดียวกับระบบเกม"
                    : "Backed by the same rules as the game"}
                </strong>
                <span>
                  {language === "th"
                    ? "ค่าจำนวนทีม โควต้า Transfer และ Chips อ่านจากกติกากลางของระบบ ไม่ใช่ข้อมูลตัวอย่าง"
                    : "Squad, quota, transfer, and chip values come from the shared executable rules—not sample data."}
                </span>
              </div>
            </div>

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
