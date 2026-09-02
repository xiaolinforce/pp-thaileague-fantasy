import type { Metadata } from "next";

import {
  LegalDocument,
  type LegalSection,
} from "@/components/fantasy/legal-document";

export const metadata: Metadata = {
  title: "Privacy Policy | PP Thai League Fantasy",
  description:
    "How PP Thai League Fantasy collects, uses, stores, and protects personal data.",
};

const sections: LegalSection[] = [
  {
    id: "controller",
    title: {
      th: "ผู้ให้บริการและผู้ควบคุมข้อมูล",
      en: "Service operator and data controller",
    },
    paragraphs: [
      {
        th: "PP Thai League Fantasy ดำเนินงานและควบคุมข้อมูลโดย ปิยวัชร์ ปราชญ์ศิลป์ ภายใต้แบรนด์ PP Football ในฐานะผลิตภัณฑ์ Fantasy Football อิสระสำหรับแฟนฟุตบอลไทย และไม่ใช่เกมอย่างเป็นทางการของ Thai League",
        en: "PP Thai League Fantasy is operated and its data is controlled by Piyawach Prachsilp under the PP Football brand as an independent fantasy football product for Thai football fans. It is not an official Thai League game.",
      },
      {
        th: "นโยบายนี้อธิบายการประมวลผลข้อมูลส่วนบุคคลเมื่อคุณเข้าชม สมัครสมาชิก เข้าสู่ระบบ หรือใช้งานเกมผ่าน fantasy.ppfootball.net",
        en: "This policy explains how personal data is processed when you visit, register, sign in to, or use the game at fantasy.ppfootball.net.",
      },
    ],
  },
  {
    id: "data-collected",
    title: { th: "ข้อมูลที่เราเก็บ", en: "Data we collect" },
    bullets: [
      {
        th: "ข้อมูลบัญชี เช่น ชื่อ อีเมล รูปโปรไฟล์ สถานะการยืนยันอีเมล และตัวระบุบัญชีจาก Google หรือผู้ให้บริการเข้าสู่ระบบ",
        en: "Account data such as name, email address, profile image, email-verification status, and identifiers from Google or another sign-in provider.",
      },
      {
        th: "ข้อมูลเซสชันและความปลอดภัย เช่น session token, IP address, user agent, เวลาหมดอายุ และสถานะ rate limit",
        en: "Session and security data such as session tokens, IP address, user agent, expiry time, and rate-limit state.",
      },
      {
        th: "ข้อมูลการเล่น เช่น ชื่อทีม โปรไฟล์ผู้จัดการ ภาษา ทีมที่เลือก กัปตัน ตัวสำรอง การย้ายทีม ชิป ลีก คะแนน อันดับ และประวัติการเปลี่ยนแปลง",
        en: "Game data such as team name, manager profile, language, squad selections, captaincy, bench order, transfers, chips, leagues, scores, ranks, and revision history.",
      },
      {
        th: "ข้อมูลการส่งอีเมล เช่น hash ของผู้รับ ผู้ให้บริการ สถานะการส่ง message ID และรหัสข้อผิดพลาด โดยบันทึกให้น้อยที่สุดเพื่อความปลอดภัยและแก้ปัญหา",
        en: "Email-delivery data such as a recipient hash, provider, delivery status, message ID, and error code, kept to the minimum needed for security and troubleshooting.",
      },
      {
        th: "ข้อมูลบนอุปกรณ์ เช่น ภาษาและสถานะ Guest ที่จำเป็นต่อการใช้งานต่อเนื่อง",
        en: "Device data such as language preference and Guest state needed to continue using the service.",
      },
    ],
  },
  {
    id: "purposes",
    title: { th: "เหตุผลที่ใช้ข้อมูล", en: "Why we use data" },
    bullets: [
      {
        th: "สร้างและดูแลบัญชี เซสชัน ทีม ลีก คะแนน และประวัติ Fantasy ของคุณ",
        en: "To create and maintain your account, session, team, leagues, scores, and fantasy history.",
      },
      {
        th: "ยืนยันตัวตน ส่งรหัส OTP ป้องกันสแปม การใช้งานผิดวัตถุประสงค์ และการเข้าถึงที่ไม่ได้รับอนุญาต",
        en: "To authenticate users, deliver OTPs, and prevent spam, misuse, and unauthorized access.",
      },
      {
        th: "คำนวณผลการแข่งขัน แสดงอันดับ ตรวจสอบข้อร้องเรียน และรักษาความถูกต้องของข้อมูลย้อนหลัง",
        en: "To calculate results, display standings, investigate reports, and preserve historical accuracy.",
      },
      {
        th: "ดูแลความเสถียร แก้ข้อผิดพลาด และปฏิบัติตามหน้าที่ตามกฎหมาย โดยจะขอความยินยอมเมื่อกฎหมายกำหนด",
        en: "To operate reliably, resolve errors, and meet legal obligations, requesting consent where applicable law requires it.",
      },
    ],
  },
  {
    id: "public-data",
    title: {
      th: "ข้อมูลที่ผู้อื่นอาจเห็น",
      en: "Information visible to others",
    },
    paragraphs: [
      {
        th: "ชื่อทีม คะแนน อันดับ และข้อมูลลีกที่เกี่ยวข้องอาจแสดงต่อสมาชิกคนอื่นตามรูปแบบของเกม ชื่อและอีเมลจากผู้ให้บริการเข้าสู่ระบบจะไม่ถูกใช้เป็นชื่อสาธารณะในเกม",
        en: "Your team name, scores, rank, and relevant league information may be visible to other members as part of the game. Your sign-in provider name and email are not used as your public in-game identity.",
      },
    ],
  },
  {
    id: "processors",
    title: { th: "ผู้ให้บริการภายนอก", en: "Service providers" },
    paragraphs: [
      {
        th: "เราใช้ผู้ให้บริการที่จำเป็นต่อการทำงานของระบบ ได้แก่ Vercel สำหรับโฮสติ้ง, Neon สำหรับฐานข้อมูล, Google สำหรับ OAuth และรับอีเมลช่วยเหลือ, Cloudflare Turnstile สำหรับป้องกันบอต, Resend สำหรับส่งอีเมล และ ImprovMX สำหรับส่งต่ออีเมลช่วยเหลือ ผู้ให้บริการเหล่านี้อาจประมวลผลข้อมูลในต่างประเทศภายใต้มาตรการของตน",
        en: "We use service providers necessary to operate the product: Vercel for hosting, Neon for the database, Google for OAuth and support-email delivery, Cloudflare Turnstile for bot protection, Resend for sending email, and ImprovMX for forwarding support email. These providers may process data outside Thailand under their own safeguards.",
      },
      {
        th: "เราไม่ขายข้อมูลส่วนบุคคล และจะเปิดเผยข้อมูลเมื่อจำเป็นต่อการให้บริการ ป้องกันความเสียหาย ปฏิบัติตามกฎหมาย หรือเมื่อคุณอนุญาตเท่านั้น",
        en: "We do not sell personal data. We disclose it only as needed to provide the service, prevent harm, comply with law, or with your authorization.",
      },
    ],
  },
  {
    id: "retention",
    title: { th: "ระยะเวลาเก็บและการลบ", en: "Retention and deletion" },
    paragraphs: [
      {
        th: "เราเก็บข้อมูลบัญชีและข้อมูล Fantasy ตราบเท่าที่บัญชียังใช้งานหรือจำเป็นต่อการดำเนินเกม ความถูกต้องของคะแนน ประวัติการแข่งขัน ความปลอดภัย และหน้าที่ตามกฎหมาย ข้อมูลบางประเภทอาจคงอยู่ใน backup หรือ audit history ตามรอบการเก็บรักษาที่เหมาะสม",
        en: "We retain account and fantasy data while an account is active or as needed to operate the game, preserve score and competition integrity, maintain security, and meet legal obligations. Some data may remain in backups or audit history for an appropriate retention period.",
      },
      {
        th: "คุณสามารถขอเข้าถึง แก้ไข ส่งออก คัดค้าน จำกัด หรือขอลบข้อมูลได้ตามสิทธิที่กฎหมายให้ โดยติดต่อ support@ppfootball.net การลบข้อมูลบางส่วนอาจถูกจำกัดเมื่อจำเป็นต่อคะแนน ประวัติที่เป็นธรรม ความปลอดภัย หรือกฎหมาย",
        en: "You may request access, correction, export, objection, restriction, or deletion where provided by law by contacting support@ppfootball.net. Some deletion requests may be limited where data is needed for fair scoring, historical integrity, security, or legal compliance.",
      },
    ],
  },
  {
    id: "cookies-security",
    title: {
      th: "คุกกี้ อุปกรณ์ และความปลอดภัย",
      en: "Cookies, devices, and security",
    },
    paragraphs: [
      {
        th: "เราใช้คุกกี้หรือพื้นที่จัดเก็บบนอุปกรณ์ที่จำเป็นสำหรับ session, Guest account, ความปลอดภัย และการตั้งค่าภาษา ปัจจุบันไม่ได้ใช้เพื่อโฆษณาแบบเจาะจงบุคคล",
        en: "We use cookies or device storage necessary for sessions, Guest accounts, security, and language preferences. We do not currently use them for targeted advertising.",
      },
      {
        th: "เราใช้มาตรการทางเทคนิคและการจัดการที่เหมาะสม แต่ไม่มีระบบออนไลน์ใดรับประกันความปลอดภัยได้ทั้งหมด โปรดแจ้งเราหากสงสัยว่าบัญชีหรือข้อมูลถูกเข้าถึงโดยไม่ได้รับอนุญาต",
        en: "We use reasonable technical and organizational safeguards, but no online system can guarantee complete security. Contact us if you suspect unauthorized access to your account or data.",
      },
    ],
  },
  {
    id: "changes-contact",
    title: { th: "การเปลี่ยนแปลงและการติดต่อ", en: "Changes and contact" },
    paragraphs: [
      {
        th: "เราอาจปรับนโยบายนี้เมื่อบริการหรือข้อกำหนดทางกฎหมายเปลี่ยนแปลง โดยจะแสดงวันที่ปรับปรุงบนหน้านี้ และแจ้งเพิ่มเติมเมื่อการเปลี่ยนแปลงมีสาระสำคัญ",
        en: "We may update this policy when the service or legal requirements change. We will show the updated date here and provide additional notice for material changes when appropriate.",
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      kind="privacy"
      title={{ th: "นโยบายความเป็นส่วนตัว", en: "Privacy Policy" }}
      summary={{
        th: "ข้อมูลที่เราเก็บ เหตุผลที่ใช้ การเปิดเผย การเก็บรักษา และสิทธิของคุณ",
        en: "What we collect, why we use it, how it is shared and retained, and your rights.",
      }}
      updatedAt={{ th: "3 กันยายน 2569", en: "September 3, 2026" }}
      sections={sections}
    />
  );
}
