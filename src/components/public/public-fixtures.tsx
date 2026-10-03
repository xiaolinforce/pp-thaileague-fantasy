"use client";

import { AppShell } from "@/components/fantasy/app-shell";
import { useLanguage } from "@/components/fantasy/i18n";
import type { CompetitionFixtureView } from "@/lib/competition-types";
import { PublicLinks } from "./public-links";
import styles from "./public.module.css";

export default function PublicFixtures({
  fixtures,
  matchweeks,
}: {
  fixtures: CompetitionFixtureView[];
  matchweeks: number[];
}) {
  const { language } = useLanguage();
  const th = language === "th";
  return (
    <AppShell localizeContent={false}>
      <main id="main-content" className="content product-content reading-page">
        <header className="reading-page-header">
          <div>
            <h1>
              {th
                ? "โปรแกรมและผลไทยลีก 2026/27"
                : "Thai League fixtures and results 2026/27"}
            </h1>
            <p>
              {th
                ? "ไทยลีก 1 · เวลาประเทศไทย (UTC+7) · โปรแกรมอาจเปลี่ยนแปลงได้"
                : "Thai League 1 · Thailand time (UTC+7) · Fixtures may change"}
            </p>
          </div>
        </header>
        <p>
          {th
            ? "ใช้โปรแกรมนี้วางแผนเลือกนักเตะและย้ายทีม ข้อมูลมาจากชุดการแข่งขันที่ทีมงานตรวจและนำเข้าเกม หากยังไม่ระบุเวลา จะขึ้นว่ารอยืนยัน โปรดตรวจเส้นตาย Fantasy ในหน้าทีมอีกครั้งก่อนบันทึก"
            : "Use this schedule to plan your squad and transfers. It uses competition data reviewed and imported by our team. Unconfirmed times are marked TBC. Check the Fantasy deadline on your Team page before saving."}
        </p>
        <details className={styles.weekPicker}>
          <summary>
            {th ? "เลือกสัปดาห์การแข่งขัน" : "Jump to a matchweek"}
          </summary>
          <nav
            className={styles.matchweeks}
            aria-label={th ? "เลือกสัปดาห์การแข่งขัน" : "Choose a matchweek"}
          >
            {matchweeks.map((week) => (
              <a key={week} href={`#matchweek-${week}`}>
                {th ? `สัปดาห์ ${week}` : `MW ${week}`}
              </a>
            ))}
          </nav>
        </details>
        {fixtures.length === 0 && (
          <p>
            {th
              ? "ยังไม่มีโปรแกรมแข่งขันที่ยืนยันในระบบ"
              : "No confirmed fixtures are available yet."}
          </p>
        )}
        {matchweeks.map((week) => (
          <section
            className={styles.fixtureSection}
            key={week}
            id={`matchweek-${week}`}
            aria-labelledby={`week-${week}-title`}
          >
            <h2 id={`week-${week}-title`}>
              {th ? `สัปดาห์ที่ ${week}` : `Matchweek ${week}`}
            </h2>
            <ul className={styles.fixtureList}>
              {fixtures
                .filter((fixture) => fixture.matchweek === week)
                .map((fixture) => (
                  <li className={styles.fixture} key={fixture.id}>
                    <div>
                      {fixture.kickoffAt ? (
                        <time dateTime={fixture.kickoffAt}>
                          {fixture.dateLabel[language]} ·{" "}
                          {fixture.timeLabel[language]}
                        </time>
                      ) : (
                        <span>
                          {th ? "วันและเวลารอยืนยัน" : "Date and time TBC"}
                        </span>
                      )}
                      {fixture.venue && (
                        <small>{fixture.venue[language]}</small>
                      )}
                      {fixture.status === "postponed" && (
                        <small>{th ? "เลื่อนการแข่งขัน" : "Postponed"}</small>
                      )}
                    </div>
                    <div className={styles.teams}>
                      <span>{fixture.home.name[language]}</span>
                      <strong className={styles.score}>
                        {fixture.homeScore !== null &&
                        fixture.awayScore !== null
                          ? `${fixture.homeScore} – ${fixture.awayScore}`
                          : "–"}
                      </strong>
                      <span>{fixture.away.name[language]}</span>
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        ))}
        <p className={styles.note}>
          {th
            ? "โปรแกรมและผลที่แสดงเป็นข้อมูลที่มีในเกม อาจยังไม่ครอบคลุมการเปลี่ยนแปลงล่าสุดของผู้จัดการแข่งขัน PP Football เป็นผู้ให้บริการเกมอิสระ ไม่มีความเกี่ยวข้องอย่างเป็นทางการกับ Thai League"
            : "The schedule and results reflect data available in the game and may not yet include the organiser's latest changes. PP Football operates independently and is not officially affiliated with Thai League."}
        </p>
        <PublicLinks />
      </main>
    </AppShell>
  );
}
