"use client";

import Link from "next/link";
import { AppShell } from "@/components/fantasy/app-shell";
import { useLanguage } from "@/components/fantasy/i18n";
import { THAI_LEAGUE_FANTASY_RULES as rules } from "@/lib/fantasy/rules";
import { PublicLinks } from "./public-links";
import styles from "./public.module.css";

export default function HowToPlay() {
  const { language } = useLanguage();
  const th = language === "th";
  const steps = th
    ? [
        [
          "เริ่มเล่นและตั้งชื่อทีม",
          "เลือกทดลองเล่นแบบ Guest หรือเข้าสู่ระบบด้วยอีเมลหรือ Google แล้วตั้งชื่อทีมของคุณ บัญชี Guest อาจกู้คืนไม่ได้หากข้อมูลบนอุปกรณ์หาย จึงควรอัปเกรดเป็นสมาชิกเมื่อพร้อม",
        ],
        [
          "เลือกนักเตะให้ครบทีม",
          `เลือก ${rules.squadSize} คน: ผู้รักษาประตู ${rules.positionLimits.goalkeeper} กองหลัง ${rules.positionLimits.defender} กองกลาง ${rules.positionLimits.midfielder} และกองหน้า ${rules.positionLimits.forward} เลือกได้ไม่เกิน ${rules.sameClubLimit} คนต่อสโมสร และนักเตะต่างชาติไม่เกิน ${rules.foreignPlayerLimit} คน ระบบจะแจ้งข้อจำกัด Level ขณะจัดทีม หรือใช้จัดทีมอัตโนมัติเพื่อเติมช่องว่างได้`,
        ],
        [
          "จัดตัวจริง กัปตัน และตัวสำรอง",
          "เลือกตัวจริง 11 คนในแผนที่ถูกกติกา กำหนดกัปตันและรองกัปตันจากตัวจริง กัปตันได้คะแนนสองเท่าตามกติกาปกติ จัดลำดับตัวสำรองให้พร้อมสำหรับการเปลี่ยนอัตโนมัติเมื่อมีผู้เล่นไม่ลงสนาม",
        ],
        [
          "บันทึกทีมก่อนเส้นตาย",
          "ตรวจว่าทีมผ่านข้อจำกัดทั้งหมดแล้วบันทึก เส้นตายคือ 90 นาทีก่อนการแข่งขันนัดแรกของ Gameweek โดยดูเวลาที่แสดงในเกม การเลือกนักเตะโดยยังไม่บันทึกไม่ได้ยืนยันทีม",
        ],
        [
          "ดูคะแนนและแข่งกับเพื่อน",
          "หลังการแข่งขัน ดูคะแนนที่หน้า Points คะแนนอาจยังเป็น provisional ระหว่างตรวจข้อมูล และจะเปลี่ยนเป็น final เมื่อยืนยันแล้ว สร้างลีกส่วนตัวและส่งรหัสให้เพื่อนเข้าร่วมได้",
        ],
        [
          "วางแผนรอบถัดไป",
          `ตรวจโปรแกรมแข่งขันก่อนเปลี่ยนนักเตะ คุณได้รับการย้ายฟรี ${rules.weeklyFreeTransfers} ครั้งหลังแต่ละเส้นตาย สะสมได้สูงสุด ${rules.maximumFreeTransfers} ครั้ง การย้ายสุทธิที่เกินสิทธิ์เสีย ${rules.transferPointCost} คะแนนต่อครั้ง ส่วน Gameweek แรกที่ทีมลงเล่นย้ายได้ไม่จำกัดก่อนเส้นตาย อ่านข้อยกเว้นและชิปในกติกาฉบับเต็ม`,
        ],
      ]
    : [
        [
          "Start playing and name your team",
          "Try a guest account or sign in with email or Google, then name your team. Guest accounts may be lost if device data is cleared, so upgrade when you are ready.",
        ],
        [
          "Fill your squad",
          `Select ${rules.squadSize} players: ${rules.positionLimits.goalkeeper} goalkeepers, ${rules.positionLimits.defender} defenders, ${rules.positionLimits.midfielder} midfielders and ${rules.positionLimits.forward} forwards. Pick at most ${rules.sameClubLimit} per club and ${rules.foreignPlayerLimit} foreign players. The squad builder shows tier limits; auto-fill can help fill empty slots.`,
        ],
        [
          "Choose your lineup and captain",
          "Select a valid starting eleven, a captain and a vice-captain from the starters. The captain normally scores double points. Order your substitutes for automatic replacements when starters do not play.",
        ],
        [
          "Save before the deadline",
          "Check that your squad is valid and save it. The deadline is 90 minutes before the Gameweek's first kickoff; use the time shown in the game. Picking players without saving does not confirm your squad.",
        ],
        [
          "Follow your points and compete with friends",
          "Check Points after matches. Scores may remain provisional while data is reviewed and become final after confirmation. Create a private league and share its code with your friends.",
        ],
        [
          "Plan the next Gameweek",
          `Review the fixtures before making transfers. Receive ${rules.weeklyFreeTransfers} free transfers after each deadline, bank up to ${rules.maximumFreeTransfers}, and pay ${rules.transferPointCost} points for each net transfer beyond your allowance. Your first playing Gameweek has unlimited transfers before its deadline. Read the full rules for exceptions and chips.`,
        ],
      ];
  return (
    <AppShell localizeContent={false}>
      <main id="main-content" className="content product-content reading-page">
        <header className="reading-page-header">
          <div>
            <h1>
              {th ? "วิธีเล่นแฟนตาซีไทยลีก" : "How to play Thai League Fantasy"}
            </h1>
            <p>
              {th
                ? "คู่มือเริ่มเล่น PP Thai League Fantasy ฤดูกาล 2026/27"
                : "Your guide to getting started in the 2026/27 season"}
            </p>
          </div>
        </header>
        <article className={styles.guide}>
          <ol className={styles.steps}>
            {steps.map(([title, body]) => (
              <li key={title}>
                <h2>{title}</h2>
                <p>{body}</p>
              </li>
            ))}
          </ol>
          <section className={styles.faq}>
            <h2>{th ? "คำถามก่อนเริ่มเล่น" : "Before you start"}</h2>
            <h3>{th ? "ต้องจ่ายเงินหรือไม่?" : "Does it cost anything?"}</h3>
            <p>
              {th
                ? "ปัจจุบันไม่มีค่าเล่น เงินรางวัล หรือการพนัน คะแนนและอันดับมีไว้เพื่อความสนุกในเกม"
                : "There are currently no fees, cash prizes or gambling. Points and ranks are for in-game enjoyment."}
            </p>
            <h3>
              {th
                ? "เกมนี้เป็นของ Thai League หรือไม่?"
                : "Is this an official Thai League game?"}
            </h3>
            <p>
              {th
                ? "ไม่ใช่ เกมนี้ดำเนินงานโดย PP Football อย่างอิสระ ข้อมูลสโมสรและการแข่งขันไม่หมายถึงการรับรองอย่างเป็นทางการ"
                : "No. PP Football operates the game independently. Club and competition information does not imply official endorsement."}
            </p>
            <h3>
              {th
                ? "คะแนนไม่ตรงกับที่คาดไว้ ทำอย่างไร?"
                : "What if my points look wrong?"}
            </h3>
            <p>
              {th
                ? "ตรวจสถานะ provisional/final และกติกาคะแนนก่อน หากยังพบปัญหา ติดต่อทีมงานผ่านหน้าช่วยเหลือพร้อม Gameweek และนักเตะที่ต้องการให้ตรวจ"
                : "Check the provisional/final status and scoring rules first. If something is still wrong, contact support with the Gameweek and player to review."}
            </p>
          </section>
          <div className={styles.actions}>
            <Link className="primary-button" href="/">
              {th ? "เริ่มจัดทีม" : "Start your squad"}
            </Link>
            <Link className="secondary-button" href="/rules">
              {th ? "อ่านกติกาฉบับเต็ม" : "Read the full rules"}
            </Link>
          </div>
        </article>
        <PublicLinks />
      </main>
    </AppShell>
  );
}
