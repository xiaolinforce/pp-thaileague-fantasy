import type { Metadata } from "next";

import {
  LegalDocument,
  type LegalSection,
} from "@/components/fantasy/legal-document";

export const metadata: Metadata = {
  title: "Terms of Service | PP Thai League Fantasy",
  description: "Terms for using PP Thai League Fantasy.",
};

const sections: LegalSection[] = [
  {
    id: "acceptance",
    title: { th: "การยอมรับข้อกำหนด", en: "Acceptance of these terms" },
    paragraphs: [
      {
        th: "เมื่อคุณเข้าถึง สมัครสมาชิก หรือเล่น PP Thai League Fantasy ถือว่าคุณยอมรับข้อกำหนดนี้และกติกาเกมที่เผยแพร่ในเว็บไซต์ หากไม่ยอมรับ กรุณาหยุดใช้งานบริการ",
        en: "By accessing, registering for, or playing PP Thai League Fantasy, you agree to these terms and the game rules published on the website. If you do not agree, do not use the service.",
      },
      {
        th: "บริการดำเนินงานโดย ปิยวัชร์ ปราชญ์ศิลป์ ภายใต้แบรนด์ PP Football และเป็นผลิตภัณฑ์อิสระ ไม่ใช่เกมอย่างเป็นทางการของ Thai League และไม่มีการรับรองหรือความร่วมมืออย่างเป็นทางการเว้นแต่จะระบุไว้โดยชัดแจ้ง",
        en: "The service is operated by Piyawach Prachsilp under the PP Football brand as an independent product. It is not an official Thai League game and is not endorsed by or formally affiliated with Thai League unless expressly stated.",
      },
    ],
  },
  {
    id: "accounts",
    title: { th: "บัญชีและคุณสมบัติผู้ใช้", en: "Accounts and eligibility" },
    bullets: [
      {
        th: "คุณต้องให้ข้อมูลที่ถูกต้อง ดูแลการเข้าถึงอีเมลหรือ Google account ของตน และรับผิดชอบกิจกรรมที่เกิดขึ้นภายใต้บัญชี",
        en: "You must provide accurate information, protect access to your email or Google account, and remain responsible for activity under your account.",
      },
      {
        th: "Guest account ผูกกับ session หรืออุปกรณ์ปัจจุบันและอาจกู้คืนไม่ได้หากข้อมูลบนอุปกรณ์สูญหาย เว้นแต่จะอัปเกรดเป็นสมาชิกสำเร็จ",
        en: "A Guest account is tied to the current session or device and may not be recoverable if device data is lost unless it has been successfully upgraded to a member account.",
      },
      {
        th: "ห้ามปลอมตัว ใช้ชื่อที่ละเมิดสิทธิผู้อื่น สร้างบัญชีเพื่อหลีกเลี่ยงข้อจำกัด หรือใช้บริการในทางที่ผิดกฎหมาย",
        en: "Do not impersonate others, use names that infringe rights, create accounts to evade limits, or use the service unlawfully.",
      },
    ],
  },
  {
    id: "gameplay",
    title: {
      th: "กติกา คะแนน และเส้นตาย",
      en: "Rules, scoring, and deadlines",
    },
    paragraphs: [
      {
        th: "กติกา Fantasy ที่แสดงในหน้า “กติกาเกม” เป็นกติกาที่ใช้ตรวจทีม การย้ายทีม ชิป การคิดคะแนน และการจัดอันดับ คุณมีหน้าที่ตรวจทีมและบันทึกการเปลี่ยนแปลงก่อน deadline ของแต่ละ Gameweek",
        en: "The Fantasy rules shown on the Game Rules page govern squad validation, transfers, chips, scoring, and rankings. You are responsible for checking and saving your team before each Gameweek deadline.",
      },
      {
        th: "คะแนนอาจแสดงเป็น provisional ก่อนเปลี่ยนเป็น final เมื่อข้อมูลการแข่งขันได้รับการตรวจสอบ เราอาจแก้ข้อมูลหรือคำนวณใหม่เพื่อแก้ข้อผิดพลาด โดยจะรักษา snapshot และประวัติที่จำเป็นต่อความถูกต้องย้อนหลัง",
        en: "Scores may be shown as provisional before becoming final after match data is reviewed. We may correct data or recalculate results to fix errors while preserving snapshots and history needed for retrospective accuracy.",
      },
    ],
  },
  {
    id: "fair-play",
    title: { th: "การเล่นอย่างเป็นธรรม", en: "Fair play" },
    bullets: [
      {
        th: "ห้ามใช้ bot, script, ช่องโหว่ หรือวิธีอัตโนมัติที่ทำให้ได้เปรียบ รบกวนบริการ หรือเข้าถึงข้อมูลที่ไม่ได้รับอนุญาต",
        en: "Do not use bots, scripts, exploits, or automation to gain an unfair advantage, disrupt the service, or access unauthorized data.",
      },
      {
        th: "ห้ามคุกคามผู้ใช้ ส่งสแปม แบ่งปันเนื้อหาที่ผิดกฎหมาย หรือพยายามทำลายความถูกต้องของคะแนน ลีก และข้อมูลการแข่งขัน",
        en: "Do not harass users, send spam, share unlawful content, or attempt to undermine the integrity of scores, leagues, or competition data.",
      },
      {
        th: "เราอาจตรวจสอบ จำกัด ระงับ หรือลบบัญชีและทีมที่ละเมิดข้อกำหนด เพื่อปกป้องผู้ใช้และความเป็นธรรมของเกม",
        en: "We may investigate, restrict, suspend, or remove accounts and teams that breach these terms to protect users and game integrity.",
      },
    ],
  },
  {
    id: "money",
    title: {
      th: "ไม่มีการพนันหรือเงินรางวัล",
      en: "No gambling or cash prizes",
    },
    paragraphs: [
      {
        th: "บริการปัจจุบันไม่มีการชำระเงิน เงินรางวัล การพนัน หรือการแข่งขันด้วยเงินจริง คะแนนและอันดับมีไว้เพื่อความบันเทิงภายในเกมเท่านั้น",
        en: "The current service does not include payments, cash prizes, gambling, or real-money competitions. Scores and ranks are for in-game entertainment only.",
      },
    ],
  },
  {
    id: "content",
    title: {
      th: "ข้อมูล เนื้อหา และทรัพย์สินทางปัญญา",
      en: "Data, content, and intellectual property",
    },
    paragraphs: [
      {
        th: "ข้อมูลการแข่งขัน ผู้เล่น สโมสร เครื่องหมายการค้า และสื่อจากบุคคลภายนอกเป็นสิทธิของเจ้าของแต่ละรายและใช้เพื่อระบุข้อเท็จจริงหรือประกอบประสบการณ์ Fantasy เท่าที่เหมาะสม การมีข้อมูลดังกล่าวไม่หมายถึงการรับรองอย่างเป็นทางการ",
        en: "Competition, player, club, trademark, and third-party media rights remain with their respective owners and are used as appropriate to identify facts or support the fantasy experience. Their presence does not imply official endorsement.",
      },
      {
        th: "ซอฟต์แวร์ การออกแบบ ข้อความ และองค์ประกอบที่ ปิยวัชร์ ปราชญ์ศิลป์ สร้างขึ้นสำหรับแบรนด์ PP Football ได้รับความคุ้มครองตามกฎหมาย คุณใช้บริการเพื่อวัตถุประสงค์ส่วนบุคคลที่ชอบด้วยกฎหมายได้ แต่ห้ามคัดลอก จำหน่าย หรือดัดแปลงส่วนสำคัญโดยไม่ได้รับอนุญาต",
        en: "Software, design, text, and original elements created for PP Football by Piyawach Prachsilp are protected by law. You may use the service for lawful personal purposes, but may not copy, sell, or materially modify it without permission.",
      },
    ],
  },
  {
    id: "availability",
    title: {
      th: "ความพร้อมใช้งานและการเปลี่ยนแปลง",
      en: "Availability and changes",
    },
    paragraphs: [
      {
        th: "บริการอาจอยู่ระหว่างการปรับปรุง มีช่วงหยุดทำงาน หรือมีข้อผิดพลาด เราอาจเปลี่ยน เพิ่ม หยุด หรือจำกัดคุณสมบัติ กติกา และแหล่งข้อมูลเมื่อจำเป็น โดยจะพยายามแจ้งการเปลี่ยนแปลงที่มีผลสำคัญต่อฤดูกาลล่วงหน้า",
        en: "The service may be improved over time, experience downtime, or contain errors. We may change, add, stop, or limit features, rules, and data sources when necessary and will try to give advance notice of material season-impacting changes.",
      },
      {
        th: "เราให้บริการตามสภาพที่มีอยู่และไม่รับประกันว่าจะพร้อมใช้งานตลอดเวลา ปราศจากข้อผิดพลาด หรือข้อมูลจากภายนอกจะสมบูรณ์ ทั้งนี้ไม่ตัดสิทธิหรือความรับผิดที่กฎหมายไม่อนุญาตให้ตัด",
        en: "The service is provided as available without a guarantee of uninterrupted operation, error-free performance, or complete third-party data. Nothing in these terms excludes rights or liability that applicable law does not allow us to exclude.",
      },
    ],
  },
  {
    id: "liability",
    title: { th: "ความรับผิด", en: "Liability" },
    paragraphs: [
      {
        th: "ภายใต้ขอบเขตที่กฎหมายอนุญาต ปิยวัชร์ ปราชญ์ศิลป์ ผู้ดำเนินงานภายใต้แบรนด์ PP Football จะไม่รับผิดชอบต่อความเสียหายทางอ้อม การสูญเสียโอกาส หรือความเสียหายที่เกิดจากการตัดสินใจโดยอาศัยคะแนน อันดับ หรือข้อมูลบุคคลภายนอก โปรดติดต่อเราเมื่อพบข้อผิดพลาดเพื่อให้ตรวจสอบและแก้ไขได้",
        en: "To the extent permitted by law, Piyawach Prachsilp, operating under the PP Football brand, is not responsible for indirect loss, lost opportunities, or decisions based on scores, rankings, or third-party data. Contact us when you find an error so it can be investigated and corrected.",
      },
    ],
  },
  {
    id: "law-changes",
    title: {
      th: "กฎหมาย การเปลี่ยนแปลง และการติดต่อ",
      en: "Law, changes, and contact",
    },
    paragraphs: [
      {
        th: "ข้อกำหนดนี้อยู่ภายใต้กฎหมายไทย เราอาจปรับปรุงข้อกำหนดเมื่อบริการ กติกา หรือกฎหมายเปลี่ยน โดยจะแสดงวันที่ปรับปรุงและแจ้งเพิ่มเติมเมื่อมีการเปลี่ยนแปลงที่สำคัญ การใช้งานต่อหลังข้อกำหนดใหม่มีผลถือเป็นการยอมรับข้อกำหนดฉบับนั้น",
        en: "These terms are governed by Thai law. We may update them when the service, rules, or law changes, showing the updated date and providing additional notice for material changes. Continued use after new terms take effect constitutes acceptance of the updated terms.",
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      kind="terms"
      title={{ th: "ข้อกำหนดการใช้งาน", en: "Terms of Service" }}
      summary={{
        th: "เงื่อนไขสำหรับบัญชี การเล่นอย่างเป็นธรรม กติกา ข้อมูล และการใช้บริการ",
        en: "Conditions for accounts, fair play, rules, data, and use of the service.",
      }}
      updatedAt={{ th: "3 กันยายน 2569", en: "September 3, 2026" }}
      sections={sections}
    />
  );
}
