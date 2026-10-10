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
          "เริ่มเล่น",
          "ทดลองเล่นแบบผู้เยี่ยมชม (Guest) หรือเข้าสู่ระบบด้วยอีเมลหรือ Google บัญชี Guest ผูกกับอุปกรณ์ปัจจุบัน สมัครสมาชิกเพื่อตั้งชื่อทีมและกลับมาเล่นบนอุปกรณ์อื่นได้",
        ],
        [
          "เลือกนักเตะและจัดทีม",
          `เลือกนักเตะ ${rules.squadSize} คน จัดตัวจริง 11 คน กัปตัน รองกัปตัน และลำดับตัวสำรอง โดยทำตามข้อจำกัดที่แสดงในหน้าจัดทีม`,
        ],
        [
          "บันทึกก่อนเส้นตาย แล้วติดตามคะแนน",
          "ตรวจเวลาปิดรับจัดทีมที่แสดงในเกม แล้วบันทึกทีมให้เรียบร้อยก่อนเส้นตาย การเลือกนักเตะโดยยังไม่บันทึกไม่ได้ยืนยันทีม หลังการแข่งขันดูคะแนนและอันดับ สมาชิกสามารถตั้งลีกส่วนตัวเพื่อแข่งกับเพื่อนได้",
        ],
      ]
    : [
        [
          "Start playing",
          "Try playing as a guest or sign in with email or Google. Guest access is tied to the current device; upgrade to a member account to name your team and return on another device.",
        ],
        [
          "Pick players and set your lineup",
          `Select ${rules.squadSize} players, then choose your starting eleven, captain, vice-captain and bench order. Follow the limits shown in the squad builder.`,
        ],
        [
          "Save before the deadline and follow your points",
          "Check the deadline shown in the game and save your squad before it closes. Picking players without saving does not confirm your team. After matches, follow your points and standings. Members can create private leagues to compete with friends.",
        ],
      ];
  const sections = useMemo(
    () => buildFantasyRuleSections(language),
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
              className={`rules-document-section ${styles.ruleSection}`}
              id="getting-started"
              aria-labelledby="getting-started-heading"
            >
              <h2 id="getting-started-heading">
                {th ? "เริ่มเล่นใน 3 ขั้นตอน" : "Get started in 3 steps"}
              </h2>
              <p>
                {th
                  ? "จัดทีมจากนักเตะไทยลีก แล้วสะสมคะแนนจากผลงานจริงในแต่ละรอบแข่งขัน (Gameweek หรือ GW) แต่ละรอบมีเส้นตายปิดรับจัดทีม (Deadline) ของตัวเอง"
                  : "Build a squad of Thai League players and earn points from their real performances in each scoring round (Gameweek or GW). Each round has its own deadline for team changes."}
              </p>
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
                className={`rules-document-section ${styles.ruleSection}`}
                id={section.id}
                aria-labelledby={`${section.id}-heading`}
                key={section.id}
              >
                <h2 id={`${section.id}-heading`}>{section.title}</h2>
                <p>{section.summary}</p>
                {section.table && (
                  <>
                    {section.id === "scoring" && (
                      <p id="scoring-scroll-hint">
                        {th
                          ? "หากเห็นไม่ครบทุกตำแหน่ง เลื่อนตารางซ้าย–ขวาเพื่อดูคะแนน"
                          : "Scroll the table sideways if not all positions are visible."}
                      </p>
                    )}
                    <div
                      className={styles.tableScroll}
                      role={section.id === "scoring" ? "region" : undefined}
                      tabIndex={section.id === "scoring" ? 0 : undefined}
                      aria-labelledby={
                        section.id === "scoring"
                          ? `${section.id}-caption`
                          : undefined
                      }
                      aria-describedby={
                        section.id === "scoring"
                          ? "scoring-scroll-hint"
                          : undefined
                      }
                    >
                      <table
                        className={`${styles.rulesTable} ${section.id === "scoring" ? styles.scoringTable : ""}`}
                      >
                        <caption id={`${section.id}-caption`}>
                          {section.table.caption}
                        </caption>
                        <thead>
                          <tr>
                            {section.table.headings.map((heading) => (
                              <th scope="col" key={heading}>
                                {heading}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.table.rows.map((row) => (
                            <tr key={row.id}>
                              <th scope="row">{row.label}</th>
                              {row.values.map((value, index) => (
                                <td key={section.table!.headings[index + 1]}>
                                  {value}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                <ul>
                  {section.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                {section.details && (
                  <details className={styles.ruleDetails}>
                    <summary>{section.details.title}</summary>
                    <ul>
                      {section.details.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </section>
            ))}
          </article>
        </div>
        <PublicLinks />
      </main>
    </AppShell>
  );
}
