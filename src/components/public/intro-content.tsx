"use client";

import Link from "next/link";
import { useLanguage } from "@/components/fantasy/i18n";
import { PublicLinks } from "./public-links";
import { THAI_LEAGUE_FANTASY_RULES as rules } from "@/lib/fantasy/rules";
import styles from "./public.module.css";

export function IntroContent() {
  const { language } = useLanguage();
  const th = language === "th";
  return (
    <section className={styles.intro} data-localize="off">
      <div className={styles.introInner}>
        <h2>
          {th ? "แฟนตาซีไทยลีก เล่นอย่างไร?" : "What is Thai League Fantasy?"}
        </h2>
        <p>
          {th
            ? `เลือกนักเตะไทยลีก 1 จำนวน ${rules.squadSize} คน แล้วจัดตัวจริง 11 คนพร้อมกัปตัน คะแนนมาจากผลงานในการแข่งขันจริง เช่น การลงสนาม ประตู แอสซิสต์ และคลีนชีต คุณปรับทีมก่อนเส้นตายแต่ละ Gameweek และสร้างลีกเพื่อแข่งกับเพื่อนได้`
            : `Choose ${rules.squadSize} Thai League 1 players, then pick a starting eleven and captain. Earn points from real match performances including appearances, goals, assists and clean sheets. Update your squad before each Gameweek deadline and create a league with friends.`}
        </p>
        <p>
          {th
            ? "เริ่มได้ทั้งแบบ Guest หรือสมาชิก บัญชี Guest ผูกกับอุปกรณ์ปัจจุบัน จึงควรอัปเกรดด้วยอีเมลหรือ Google เพื่อกลับมาเล่นบนอุปกรณ์อื่นได้"
            : "Start as a guest or a member. A guest account is tied to your current device; upgrade with email or Google to return on another device."}
        </p>
        <Link className="secondary-button" href="/how-to-play">
          {th ? "อ่านวิธีเล่นทีละขั้นตอน" : "Read the step-by-step guide"}
        </Link>
        <p className={styles.note}>
          {th
            ? "PP Thai League Fantasy เป็นเกมอิสระโดย PP Football ไม่ใช่เกมอย่างเป็นทางการของ Thai League ปัจจุบันไม่มีค่าเล่น เงินรางวัล หรือการพนัน"
            : "PP Thai League Fantasy is an independent game by PP Football, not an official Thai League game. It currently has no entry fees, cash prizes or gambling."}
        </p>
        <PublicLinks />
      </div>
    </section>
  );
}
