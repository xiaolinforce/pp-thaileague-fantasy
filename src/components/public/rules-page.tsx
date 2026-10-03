"use client";

import { useMemo } from "react";
import { PublicLinks } from "./public-links";

import { AppShell } from "@/components/fantasy/app-shell";
import { useLanguage } from "@/components/fantasy/i18n";
import { buildFantasyRuleSections } from "@/lib/fantasy/rule-content";
import { THAI_LEAGUE_FANTASY_RULES as rules } from "@/lib/fantasy/rules";
import styles from "./public.module.css";

export default function RulesPage() {
  const { language } = useLanguage();
  const th = language === "th";
  const gettingStarted = th
    ? [
        [
          "เริ่มเล่นและตั้งชื่อทีม",
          "ทดลองเล่นแบบ Guest หรือเข้าสู่ระบบด้วยอีเมลหรือ Google บัญชี Guest ผูกกับอุปกรณ์ปัจจุบัน อัปเกรดเป็นสมาชิกเพื่อกลับมาเล่นบนอุปกรณ์อื่นได้",
        ],
        [
          "เลือกนักเตะและจัดทีม",
          `เลือกนักเตะ ${rules.squadSize} คน จัดตัวจริง 11 คน กัปตัน รองกัปตัน และลำดับตัวสำรอง โดยทำตามข้อจำกัดที่แสดงในหน้าจัดทีม`,
        ],
        [
          "บันทึกก่อนเส้นตาย แล้วติดตามคะแนน",
          "ตรวจเวลาปิดรับจัดทีมที่แสดงในเกม แล้วบันทึกทีมให้เรียบร้อยก่อนเส้นตาย การเลือกนักเตะโดยยังไม่บันทึกไม่ได้ยืนยันทีม หลังการแข่งขันดูคะแนนและอันดับ หรือตั้งลีกส่วนตัวเพื่อแข่งกับเพื่อน",
        ],
      ]
    : [
        [
          "Start playing and name your team",
          "Try playing as a guest or sign in with email or Google. Guest access is tied to the current device; upgrade to a member account to return on another device.",
        ],
        [
          "Pick players and set your lineup",
          `Select ${rules.squadSize} players, then choose your starting eleven, captain, vice-captain and bench order. Follow the limits shown in the squad builder.`,
        ],
        [
          "Save before the deadline and follow your points",
          "Check the deadline shown in the game and save your squad before it closes. Picking players without saving does not confirm your team. After matches, follow your points and standings or create a private league to compete with friends.",
        ],
      ];
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
          <h1>{th ? "กติกาและวิธีเล่น" : "Rules and how to play"}</h1>
        </header>

        <div className="rules-page-layout">
          <nav
            className="product-card rules-toc"
            aria-label={
              language === "th" ? "ส่วนต่างๆ ของกติกา" : "Rules sections"
            }
          >
            <div>
              <a href="#getting-started">
                {th ? "เริ่มเล่น" : "Getting started"}
              </a>
              {sections.map((section) => (
                <a href={`#${section.id}`} key={section.id}>
                  {section.title}
                </a>
              ))}
            </div>
          </nav>

          <article className="product-card rules-document">
            <section
              className="rules-document-section"
              id="getting-started"
              aria-labelledby="getting-started-heading"
            >
              <h2 id="getting-started-heading">
                {th ? "เริ่มเล่นใน 3 ขั้นตอน" : "Get started in 3 steps"}
              </h2>
              <ol className={styles.quickStart}>
                {gettingStarted.map(([title, description]) => (
                  <li key={title}>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </li>
                ))}
              </ol>
              <p>
                {th
                  ? "เกมนี้ดำเนินงานโดย PP Football อย่างอิสระ ไม่ใช่เกมอย่างเป็นทางการของ Thai League ปัจจุบันไม่มีค่าเล่น เงินรางวัล หรือการพนัน"
                  : "This game is independently operated by PP Football and is not an official Thai League game. It currently has no entry fees, cash prizes or gambling."}
              </p>
            </section>
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
        <PublicLinks />
      </main>
    </AppShell>
  );
}
