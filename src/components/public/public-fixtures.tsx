"use client";

import { AppShell } from "@/components/fantasy/app-shell";
import {
  FixturesBrowser,
  type FixturesPageData,
} from "@/components/fantasy/fixtures-browser";
import { useLanguage } from "@/components/fantasy/i18n";
import { PublicLinks } from "./public-links";
import styles from "./public.module.css";

export default function PublicFixtures({ data }: { data: FixturesPageData }) {
  const { language } = useLanguage();
  return (
    <AppShell localizeContent={false}>
      <main id="main-content" className="content product-content fixtures-page">
        <FixturesBrowser data={data} />
        <p className={styles.fixtureNote}>
          {language === "th"
            ? "ไทยลีก 1 ฤดูกาล 2026/27 · เวลาประเทศไทย (UTC+7) · โปรแกรมอาจเปลี่ยนแปลงได้ โปรแกรมและผลที่แสดงเป็นข้อมูลที่มีในเกม อาจยังไม่ครอบคลุมการเปลี่ยนแปลงล่าสุดของผู้จัดการแข่งขัน PP Football เป็นผู้ให้บริการเกมอิสระ ไม่มีความเกี่ยวข้องอย่างเป็นทางการกับ Thai League"
            : "Thai League 1, season 2026/27 · Thailand time (UTC+7) · Fixtures may change. The schedule and results reflect data available in the game and may not yet include the organiser's latest changes. PP Football operates independently and is not officially affiliated with Thai League."}
        </p>
        <PublicLinks />
      </main>
    </AppShell>
  );
}
