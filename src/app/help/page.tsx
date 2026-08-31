"use client";

import {
  ArrowUpRight,
  CircleHelp,
  LifeBuoy,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { AppShell } from "@/components/fantasy/app-shell";
import { useAppIdentity } from "@/components/fantasy/identity";
import { useLanguage } from "@/components/fantasy/i18n";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const facebookUrl = "https://www.facebook.com/ppfo0tball";

export default function HelpPage() {
  const identity = useAppIdentity();
  const { language } = useLanguage();
  const faqs = useMemo(
    () =>
      language === "th"
        ? [
            {
              question: "Guest เริ่มเล่นได้อย่างไร?",
              answer:
                "เลือกเริ่มแบบ Guest จากหน้าแรก ระบบจะสร้างผู้จัดการ ทีม และสมาชิก Overall League ให้โดยอัตโนมัติ จากนั้นเลือกนักเตะให้ครบ 15 คนก่อนบันทึกทีมครั้งแรก",
            },
            {
              question: "สมัครสมาชิกแล้วทีม Guest จะหายหรือไม่?",
              answer:
                "หากอัปเกรด Guest เป็นบัญชีใหม่ ระบบจะย้ายสิทธิ์ผู้จัดการไปยังบัญชีนั้นและใช้ทีมเดิมต่อได้ การเข้าสู่บัญชีที่มีทีมอยู่แล้วจะเก็บทีมของบัญชีนั้นและไม่รวมสองทีมเข้าด้วยกัน",
            },
            {
              question: "ทำไมยังเปิดหน้าคะแนนไม่ได้?",
              answer:
                "หน้าคะแนนจะเปิดหลัง Gameweek 1 ปิดรับจัดทีม เมื่อระบบมี selection ที่ล็อกและเริ่มคำนวณคะแนนแบบ provisional แล้ว",
            },
            {
              question: "เข้าร่วมลีกส่วนตัวไม่ได้ต้องตรวจอะไรบ้าง?",
              answer:
                "Private League ใช้ได้เฉพาะสมาชิก ตรวจรหัสเชิญ 8 ตัวอักษรและจำนวนลีกที่เข้าร่วม หากเป็น Guest ให้สมัครสมาชิกก่อน ส่วน Overall League เข้าร่วมให้อัตโนมัติทุกบัญชี",
            },
            {
              question: "เปลี่ยนชื่อผู้จัดการหรือชื่อทีมได้บ่อยแค่ไหน?",
              answer:
                "สมาชิกเปลี่ยนชื่อผู้จัดการได้ทุก 30 วัน และเปลี่ยนชื่อทีมได้สูงสุด 3 ครั้งต่อฤดูกาล Guest ใช้ชื่อที่ระบบสร้างและแก้ไขไม่ได้",
            },
            {
              question: "ข้อมูลหรือหน้าจอไม่อัปเดตควรทำอย่างไร?",
              answer:
                "ตรวจการเชื่อมต่อแล้วลองรีเฟรชหน้า หากยังเกิดปัญหา ให้แจ้งชื่อหน้า ขั้นตอนก่อนเกิดปัญหา และภาพหน้าจอผ่าน Facebook เพื่อช่วยตรวจสอบได้ตรงจุด",
            },
          ]
        : [
            {
              question: "How do I start as a Guest?",
              answer:
                "Choose Guest play on the landing page. The system creates a manager, team, and Overall League membership, then you select all 15 players before the first save.",
            },
            {
              question: "Will upgrading remove my Guest team?",
              answer:
                "Upgrading a Guest to a new account transfers the manager ownership and keeps the same team. Signing in to an account that already owns a team keeps that account's team and does not merge the two.",
            },
            {
              question: "Why is the Points page unavailable?",
              answer:
                "Points becomes available after Gameweek 1 closes, when selections are locked and provisional scoring can begin.",
            },
            {
              question:
                "What should I check if I cannot join a Private League?",
              answer:
                "Private Leagues are member-only. Check the eight-character invite code and your membership limit. Guests must upgrade first; every team already joins Overall automatically.",
            },
            {
              question: "How often can I rename my manager or team?",
              answer:
                "Members can change a manager name every 30 days and a team name up to three times per season. Guest names are generated and read-only.",
            },
            {
              question:
                "What should I do when data or a screen does not update?",
              answer:
                "Check your connection and refresh the page. If the issue remains, send the page name, the steps immediately before the issue, and a screenshot through Facebook.",
            },
          ],
    [language],
  );

  return (
    <AppShell>
      <main id="main-content" className="content product-content reading-page">
        <header className="reading-page-header">
          <span className="reading-page-icon" aria-hidden="true">
            <LifeBuoy />
          </span>
          <div>
            <h1>{language === "th" ? "ช่วยเหลือ" : "Help"}</h1>
            <p>
              {language === "th"
                ? "คำตอบสำหรับการเริ่มเล่น บัญชี การจัดทีม คะแนน และลีก"
                : "Answers for getting started, accounts, squad management, points, and leagues."}
            </p>
          </div>
        </header>

        <div className="help-page-layout">
          <section
            className="product-card help-faq"
            aria-labelledby="faq-heading"
          >
            <div className="profile-section-heading">
              <span className="settings-icon purple" aria-hidden="true">
                <CircleHelp />
              </span>
              <div>
                <h2 id="faq-heading">
                  {language === "th"
                    ? "คำถามที่พบบ่อย"
                    : "Frequently asked questions"}
                </h2>
                <p>
                  {language === "th"
                    ? "เปิดดูเฉพาะหัวข้อที่ต้องการ"
                    : "Open the topic you need."}
                </p>
              </div>
            </div>
            <Accordion defaultValue={["0"]}>
              {faqs.map((faq, index) => (
                <AccordionItem value={String(index)} key={faq.question}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>
                    <p>{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <aside
            className="help-support-column"
            aria-label={
              language === "th" ? "ช่องทางช่วยเหลือ" : "Support options"
            }
          >
            <section className="product-card help-support-card">
              <h2>
                {language === "th" ? "อ่านกติกาเกม" : "Read the game rules"}
              </h2>
              <p>
                {language === "th"
                  ? "ตรวจโควต้านักเตะ Transfer Chips และวิธีคิดคะแนนจากแหล่งกติกาเดียวกับระบบ"
                  : "Review player quotas, transfers, chips, and scoring from the same rules used by the game."}
              </p>
              <Link href="/rules" className="secondary-button">
                {language === "th" ? "เปิดกติกาเกม" : "Open game rules"}
              </Link>
            </section>

            <section className="product-card help-support-card help-support-card--facebook">
              <MessageCircle aria-hidden="true" />
              <h2>
                {language === "th"
                  ? "ติดต่อผ่าน Facebook"
                  : "Contact us on Facebook"}
              </h2>
              <p>
                {language === "th"
                  ? "หาก FAQ ยังไม่ตอบปัญหา สามารถส่งรายละเอียดและภาพหน้าจอถึงเพจ PP Football"
                  : "If the FAQ does not solve the issue, send the details and a screenshot to the PP Football page."}
              </p>
              <a
                href={facebookUrl}
                className="primary-button"
                target="_blank"
                rel="noreferrer"
              >
                {language === "th" ? "เปิดเพจ PP Football" : "Open PP Football"}
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            </section>

            {!identity ? (
              <p className="help-public-note">
                {language === "th"
                  ? "หน้านี้และกติกาเกมเปิดอ่านได้โดยไม่ต้องเข้าสู่ระบบ"
                  : "Help and game rules are available without signing in."}
              </p>
            ) : null}
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
