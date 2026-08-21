"use client";

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type Language = "th" | "en";

const translations: Record<string, string> = {
  // Navigation and shared shell
  ภาพรวม: "Overview",
  หน้าแรก: "Home",
  ทีมของฉัน: "My Team",
  ทีม: "Team",
  ซื้อขาย: "Transfers",
  คะแนน: "Points",
  ลีก: "Leagues",
  โปรแกรมและสถิติ: "Fixtures & Stats",
  โปรแกรม: "Fixtures",
  โปรไฟล์และกติกา: "Profile & Rules",
  โปรไฟล์: "Profile",
  เมนูหลัก: "Main navigation",
  เมนูมือถือ: "Mobile navigation",
  เพิ่มเติม: "More",
  เมนูเพิ่มเติม: "More Menu",
  "เข้าถึงการแข่งขัน โปรแกรม และการตั้งค่าของคุณ":
    "Access competitions, fixtures, and your settings",
  กำลังโหลดข้อมูล: "Loading data",
  โหลดข้อมูลการแข่งขันไม่สำเร็จ: "Unable to load competition data",
  กรุณาตรวจสอบการเชื่อมต่อฐานข้อมูลแล้วลองอีกครั้ง:
    "Please check the database connection and try again",
  ลองอีกครั้ง: "Try again",
  ช่วยเหลือ: "Help",
  ตั้งค่า: "Settings",
  ภาษา: "Language",
  เลือกภาษาที่ใช้แสดงผลบนเว็บไซต์:
    "Choose the language used across the website",
  ภาษาที่ใช้แสดงผล: "Display Language",
  การตั้งค่านี้จะถูกจดจำในอุปกรณ์เครื่องนี้:
    "This preference is saved on this device",
  ผู้จัดการทีม: "Manager",
  ศูนย์สถิติ: "Stats Centre",
  การแจ้งเตือน: "Notifications",

  // Authentication and onboarding
  จัดทีมไทยลีกของคุณ: "Build your Thai League squad",
  "เก็บทีม Guest นี้ไว้กับบัญชีของคุณ": "Save this Guest team to your account",
  เข้าสู่ระบบเพื่อเก็บทีมนี้และเล่นต่อได้ทุกอุปกรณ์:
    "Sign in to save this team and continue on any device",
  "เลือกนักเตะ ลุ้นคะแนน และแข่งกับเพื่อนตลอดฤดูกาล":
    "Pick players, score points, and compete with friends all season",
  พร้อมลงสนาม: "Ready to play",
  เก็บทีมของคุณ: "Save your team",
  เริ่มเล่น: "Start playing",
  เข้าสู่ระบบ: "Sign in",
  สมัครสมาชิกหรือเข้าสู่ระบบ: "Sign up or sign in",
  เข้าสู่ระบบหรือสมัครสมาชิก: "Sign in or create an account",
  "ใช้บัญชี Google": "Use Google account",
  เลือกวิธีเริ่มเล่น: "Choose how to start",
  "เข้าสู่ระบบหรือสมัครด้วย GOOGLE": "Sign in or sign up with GOOGLE",
  "เข้าสู่ระบบหรือสมัครด้วย EMAIL": "Sign in or sign up with EMAIL",
  ย้อนกลับ: "Back",
  หรือ: "or",
  "รหัส OTP 6 หลัก": "6-digit OTP",
  ยืนยันและเริ่มเล่น: "Verify and start playing",
  เปลี่ยนอีเมลหรือขอรหัสใหม่: "Change email or request a new code",
  "ส่งรหัส OTP ทางอีเมล": "Send an OTP by email",
  "การเข้าสู่ระบบสมาชิกยังไม่เปิดใน environment นี้ แต่ยังทดลองเล่นแบบ Guest ได้":
    "Member sign-in is not enabled in this environment, but Guest play is available",
  ทดลองเล่นแบบไม่สมัครสมาชิก: "Try without creating an account",
  "สามารถสมัครสมาชิกภายหลังได้ มาลองเล่นกันก่อน":
    "You can create an account later. Let's try it first",
  "เล่นแบบ Guest": "Play as Guest",
  "บัญชี Guest": "Guest account",
  บัญชีสมาชิก: "Member account",
  สมัครสมาชิกเพื่อเก็บทีม: "Create an account to save this team",
  ออกจากระบบ: "Sign out",
  "Guest ไม่มีอีเมล": "Guest has no email",

  // Dashboard
  "ทุกอย่างพร้อมสำหรับ Gameweek แรก — ตรวจทีมก่อนเดดไลน์วันศุกร์":
    "Everything is ready for the opening Gameweek — check your squad before Friday's deadline",
  จัดทีมตอนนี้: "Pick Team",
  เริ่มฤดูกาล: "Start the season",
  ให้เหนือคู่แข่ง: "ahead of the competition",
  "เหลือเวลาอีก 5 วันก่อนตลาดปิด ทีมของคุณจัดครบ 15 คนแล้ว":
    "Five days remain before the deadline. Your 15-player squad is complete.",
  ดูทีมของฉัน: "View My Team",
  อันดับ: "Rank",
  อันดับรวม: "Overall Rank",
  "▲ 4,281 อันดับ": "▲ 4,281 places",
  คะแนนรวม: "Total Points",
  "เฉลี่ย 52 คะแนน": "52 points average",
  มูลค่าทีม: "Team Value",
  "คงเหลือ ฿3.5m": "฿3.5m remaining",
  อันดับมินิลีก: "Mini-league Rank",
  "จาก 24 ทีม": "of 24 teams",
  ดาวเด่นในทีม: "Squad Standouts",
  ผู้เล่นฟอร์มร้อน: "In-form Players",
  ดูคะแนนทั้งหมด: "View All Points",
  นัดถัดไป: "Next Fixture",
  "ศุกร์ 21 ส.ค.": "Friday 21 Aug",
  ดูโปรแกรมทั้งหมด: "View All Fixtures",

  // Team
  จัดทีมลุยไทยลีก: "Build Your Thai League Squad",
  "เลือก 11 ตัวจริง วางกัปตัน แล้วพาทีมของคุณขึ้นจ่าฝูง":
    "Choose your starting XI, name a captain, and take your team to the top",
  มุมมองรายชื่อ: "List View",
  มุมมองสนาม: "Pitch View",
  บันทึกทีม: "Save Team",
  เดดไลน์จัดทีม: "Team Deadline",
  "ศุกร์ 21 ส.ค. · 18:00 น.": "Friday 21 Aug · 6:00 PM",
  วัน: "days",
  "ชม.": "hrs",
  นาที: "mins",
  "แผนการเล่น 4 · 4 · 2": "Formation 4 · 4 · 2",
  ตัวสำรอง: "Substitutes",
  ม้านั่งสำรอง: "Bench",
  เรียงลำดับการลงสนาม: "Substitution order",
  ผู้เล่น: "Player",
  ราคา: "Price",
  สำรอง: "Bench",
  ภาพรวมทีม: "Team Summary",
  เฉลี่ย: "Average",
  สูงสุด: "Highest",
  "อันดับ GW": "GW Rank",
  งบประมาณ: "Budget",
  ล้าน: "million",
  ใช้ไป: "Spent",
  คงเหลือ: "Remaining",
  จัดทีมอัตโนมัติ: "Auto Pick",
  คะแนนล่าสุด: "Latest Points",
  ดูสถิติ: "View Stats",
  เลือกผู้เล่นนี้: "Select Player",
  บันทึกการจัดทีมแล้ว: "Team saved",
  ดูข้อมูล: "View details for",

  // Transfers
  ตลาดนักเตะ: "Player Market",
  ซื้อขายนักเตะ: "Transfers",
  "ค้นหา เปรียบเทียบ และปรับทีมให้พร้อมก่อนเดดไลน์":
    "Search, compare, and strengthen your squad before the deadline",
  ยืนยันการซื้อขาย: "Confirm Transfers",
  "ยืนยันการซื้อขาย?": "Confirm transfers?",
  "ตรวจสอบรายชื่อนักเตะและงบประมาณให้เรียบร้อยก่อนยืนยัน รายการนี้ยังเป็นข้อมูลเกมจำลอง":
    "Review your players and budget before confirming. This is still simulated game data.",
  กลับไปตรวจสอบ: "Review again",
  ยืนยัน: "Confirm",
  ยืนยันการซื้อขายแล้ว: "Transfers confirmed",
  งบคงเหลือ: "Bank",
  จาก: "of",
  ฟรีทรานส์เฟอร์: "Free Transfers",
  "ครั้งใน Gameweek นี้": "available this Gameweek",
  นักเตะในทีม: "Squad Size",
  ครบทุกตำแหน่ง: "All positions filled",
  รายการที่สนใจ: "Watchlist",
  นักเตะที่บันทึกไว้: "saved players",
  ตลาดกำลังร้อน: "Market Watch",
  "ธีราทร ถูกซื้อเข้ามากที่สุด": "Theerathon is the most transferred-in player",
  "ผู้จัดการ 18,421 คนซื้อเข้าภายใน 24 ชั่วโมง":
    "18,421 managers transferred him in during the last 24 hours",
  คาดว่าราคาจะขึ้นคืนนี้: "Price rise expected tonight",
  ค้นหาชื่อนักเตะหรือสโมสร: "Search player or club",
  ล้างคำค้น: "Clear search",
  ทั้งหมด: "All",
  คะแนนสูงสุด: "Most Points",
  ฟอร์มดีที่สุด: "Best Form",
  ราคาสูงสุด: "Highest Price",
  ตัวกรอง: "Filters",
  ตัวกรองเพิ่มเติม: "More Filters",
  จำกัดผลลัพธ์ตามรายการที่สนใจและงบประมาณ:
    "Narrow results by watchlist and budget",
  เฉพาะรายการที่สนใจ: "Watchlist only",
  ไม่จำกัด: "No limit",
  ฟอร์ม: "Form",
  เลือกโดย: "Selected By",
  นำออกจากรายการ: "Remove from watchlist",
  เพิ่มในรายการ: "Add to watchlist",
  ไม่พบนักเตะ: "No players found",
  ลองเปลี่ยนคำค้นหาหรือตัวกรอง: "Try changing your search or filters",
  แสดง: "Showing",
  นักเตะ: "players",
  ดูเพิ่มเติม: "Load More",

  // Points
  "ผลงาน Gameweek": "Gameweek Performance",
  ดูคะแนนทุกคนในทีมและที่มาของคะแนนแบบละเอียด:
    "See every player's score and a detailed points breakdown",
  "คะแนน Gameweek": "Gameweek Points",
  "สูงกว่าค่าเฉลี่ย 15 คะแนน": "15 points above average",
  กัปตัน: "Captain",
  ชนาธิป: "Chanathip",
  ดาวเด่น: "Top Performer",
  ธีราทร: "Theerathon",
  "11 คะแนน": "11 points",
  คะแนนรายบุคคล: "Player Points",
  ตัวจริงและตัวสำรอง: "Starting XI & Bench",
  อัปเดตแล้ว: "Updated",
  ลงสนาม: "Appearance",
  ประตู: "Goals",
  แอสซิสต์: "Assists",
  คลีนชีต: "Clean Sheets",
  โบนัส: "Bonus",
  ที่มาคะแนน: "Points Breakdown",
  "รวม 67 คะแนน": "67 points total",
  กัปตันของคุณ: "Your Captain",
  "ชนาธิปทำ 28 คะแนน!": "Chanathip scored 28 points!",
  "เลือกกัปตันได้ดีกว่า 72% ของผู้จัดการทั้งหมด":
    "Your captain choice beat 72% of all managers",

  // Leagues
  การแข่งขัน: "Competition",
  ลีกของฉัน: "My Leagues",
  วัดฝีมือกับเพื่อนและผู้จัดการทั่วประเทศตลอดฤดูกาล:
    "Compete with friends and managers across the country all season",
  เข้าร่วมลีก: "Join League",
  สร้างลีกใหม่: "Create League",
  มินิลีกส่วนตัว: "Private Mini-league",
  ผู้จัดการ: "managers",
  ลีกทั้งหมด: "Overall League",
  รหัสเชิญเพื่อน: "Invite Code",
  "ใช้ได้ถึง 31 สิงหาคม": "Valid until 31 August",
  แชร์ลีก: "Share League",
  "ทีม / ผู้จัดการ": "Team / Manager",
  รวม: "Total",
  การเปลี่ยนแปลง: "Movement",
  คุณ: "You",
  "อัปเดตล่าสุด 2 นาทีที่แล้ว": "Updated 2 minutes ago",
  ดูอันดับเพิ่มเติม: "View More Rankings",

  // Fixtures and stats
  ข้อมูลการแข่งขัน: "Match Centre",
  "วิเคราะห์โปรแกรม ฟอร์ม และตัวเลขสำคัญก่อนจัดทีม":
    "Analyse fixtures, form, and key numbers before selecting your team",
  สถิติ: "Stats",
  "21–23 สิงหาคม 2026": "21–23 August 2026",
  "ศุกร์ 21 สิงหาคม": "Friday 21 August",
  ความยากโปรแกรม: "Fixture Difficulty",
  "3 เกมถัดไป": "Next 3 Fixtures",
  ง่าย: "Easy",
  กลาง: "Medium",
  ยาก: "Hard",
  ดาวซัลโว: "Top Scorer",
  "8 ประตู": "8 goals",
  แอสซิสต์สูงสุด: "Most Assists",
  "6 แอสซิสต์": "6 assists",
  คลีนชีตสูงสุด: "Most Clean Sheets",
  "5 คลีนชีต": "5 clean sheets",
  อันดับผู้เล่น: "Player Rankings",
  ทุกตำแหน่ง: "All Positions",

  // Profile and settings
  บัญชีของฉัน: "My Account",
  โปรไฟล์และการตั้งค่า: "Profile & Settings",
  "จัดการข้อมูลทีม การแจ้งเตือน และอ่านกติกาของเกม":
    "Manage your team details, notifications, and game rules",
  บันทึกการเปลี่ยนแปลง: "Save Changes",
  "เข้าร่วมเมื่อ ส.ค. 2026": "Joined August 2026",
  ข้อมูลบัญชี: "Account Details",
  ข้อมูลทีม: "Team Details",
  กติกาเกม: "Game Rules",
  ความเป็นส่วนตัว: "Privacy",
  ข้อมูลที่ใช้แสดงในเกม: "Information shown in the game",
  ชื่อที่แสดง: "Display Name",
  อีเมล: "Email",
  จังหวัด: "Province",
  กรุงเทพมหานคร: "Bangkok",
  เชียงใหม่: "Chiang Mai",
  ชลบุรี: "Chonburi",
  ทีมโปรด: "Favourite Club",
  ชื่อและอัตลักษณ์ทีมแฟนตาซี: "Your fantasy team's name and identity",
  ชื่อทีม: "Team Name",
  "เปลี่ยนชื่อทีมได้ไม่เกิน 3 ครั้งต่อฤดูกาล":
    "You can rename your team up to three times per season",
  เปลี่ยนตราทีม: "Change Crest",
  เลือกข่าวที่คุณไม่อยากพลาด: "Choose the updates you do not want to miss",
  แจ้งเตือนเดดไลน์: "Deadline Reminders",
  "ก่อนตลาดปิด 24 ชั่วโมงและ 1 ชั่วโมง":
    "24 hours and 1 hour before the deadline",
  การเปลี่ยนแปลงราคา: "Price Changes",
  เมื่อนักเตะในรายการสนใจมีแนวโน้มขึ้นหรือลง:
    "When a watched player's price is likely to rise or fall",
  ข่าวและโปรโมชัน: "News & Promotions",
  "ข่าวสาร กิจกรรม และรางวัลจาก PP Thai League Fantasy":
    "News, activities, and rewards from PP Thai League Fantasy",
  กติกาเกมฉบับร่าง: "Draft Game Rules",
  รายละเอียดส่วนนี้สามารถปรับได้ก่อนเปิดฤดูกาล:
    "These details can be updated before the season begins",
  การจัดทีม: "Squad Selection",
  "แต่ละทีมมีนักเตะ 15 คน แบ่งเป็นผู้รักษาประตู 2 กองหลัง 5 กองกลาง 5 และกองหน้า 3 คน โดยเลือกนักเตะจากสโมสรเดียวกันได้ตามจำนวนที่กำหนด":
    "Each squad has 15 players: 2 goalkeepers, 5 defenders, 5 midfielders, and 3 forwards. The number allowed from one club will follow the final rules.",
  การคิดคะแนน: "Scoring",
  "คะแนนมาจากการลงสนาม ประตู แอสซิสต์ คลีนชีต การเซฟ และโบนัส ส่วนรายละเอียดตัวเลขยังเป็นฉบับร่างและสามารถปรับก่อนเปิดฤดูกาล":
    "Points come from appearances, goals, assists, clean sheets, saves, and bonuses. Exact values remain in draft and can be adjusted before launch.",
  การซื้อขาย: "Transfers",
  "ได้รับสิทธิ์ซื้อขายฟรีในแต่ละ Gameweek หากใช้เกินจำนวนฟรีอาจถูกหักคะแนน ทั้งนี้กติกาสุดท้ายจะประกาศก่อนเริ่มเกม":
    "You receive free transfers each Gameweek. Additional transfers may cost points. Final rules will be announced before the game begins.",
  กัปตันและตัวสำรอง: "Captain & Substitutes",
  "กัปตันได้รับคะแนนคูณสอง รองกัปตันจะทำหน้าที่แทนหากกัปตันไม่ได้ลงสนาม ระบบจะเปลี่ยนตัวสำรองอัตโนมัติตามลำดับ":
    "Your captain scores double points. The vice-captain takes over if the captain does not play, and automatic substitutions follow your bench order.",
  กติกายังไม่ใช่ฉบับสุดท้าย: "Rules are not final",
  "ระบบ UI": "The UI",
  "แยกจากสูตรคะแนน จึงปรับภายหลังได้โดยไม่กระทบหน้าจอ":
    "is separate from the scoring engine, so rules can change without affecting the interface.",
  "ระบบ UI แยกจากสูตรคะแนน จึงปรับภายหลังได้โดยไม่กระทบหน้าจอ":
    "The UI is separate from the scoring engine, so rules can change without affecting the interface.",
  บันทึกการตั้งค่าแล้ว: "Settings saved",

  // Player and club names
  "ชนาธิป สรงกระสินธ์": "Chanathip Songkrasin",
  "ธีราทร บุญมาทัน": "Theerathon Bunmathan",
  "บดินทร์ ผาลา": "Bordin Phala",
  "ศุภชัย ใจเด็ด": "Supachai Jaided",
  "พรรษา เหมวิบูลย์": "Pansa Hemviboon",
  "ศุภนันท์ บุรีรัตน์": "Suphanan Bureerat",
  "ปฏิวัติ คำไหม": "Patiwat Khammai",
  "สุภโชค สารชาติ": "Supachok Sarachat",
  "ธีรศิลป์ แดงดา": "Teerasil Dangda",
  "นิโคลัส มิคเคลสัน": "Nicholas Mickelson",
  "ปรเมศย์ อาจวิไล": "Poramet Arjvirai",
  "สรานนท์ อนุอินทร์": "Saranon Anuin",
  "เอเลียส ดอเลาะ": "Elias Dolah",
  "พิธิวัตต์ สุขจิตธรรมกุล": "Pitiwat Sukjitthammakul",
  "จักพัน ไพรสุวรรณ": "Jakkapan Praisuwan",
  บดินทร์: "Bordin",
  ศุภชัย: "Supachai",
  พรรษา: "Pansa",
  ศุภนันท์: "Suphanan",
  ปฏิวัติ: "Patiwat",
  สุภโชค: "Supachok",
  ธีรศิลป์: "Teerasil",
  นิโคลัส: "Nicholas",
  ปรเมศย์: "Poramet",
  สรานนท์: "Saranon",
  เอเลียส: "Elias",
  พิธิวัตต์: "Pitiwat",
  จักพัน: "Jakkapan",
  "บีจี ปทุม": "BG Pathum United",
  "บุรีรัมย์ ยูไนเต็ด": "Buriram United",
  การท่าเรือ: "Port FC",
  "ทรู แบงค็อก": "True Bangkok United",
  "คอนซาโดเล ซัปโปโร": "Hokkaido Consadole Sapporo",
  โอเดนเซ: "Odense",
  "เมืองทอง ยูไนเต็ด": "Muangthong United",
  "เชียงราย ยูไนเต็ด": "Chiangrai United",
  "ลำพูน วอริเออร์": "Lamphun Warriors",
  "ราชบุรี เอฟซี": "Ratchaburi FC",
  ลำพูน: "Lamphun",
  เชียงราย: "Chiangrai",
  ราชบุรี: "Ratchaburi",
  เมืองทอง: "Muangthong",
  นครราชสีมา: "Nakhon Ratchasima",
  สุโขทัย: "Sukhothai",
  แบงค็อก: "Bangkok",
  บุรีรัมย์: "Buriram",
};

const translationEntries = Object.entries(translations).sort(
  ([thaiA], [thaiB]) => thaiB.length - thaiA.length,
);

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  translate: (text: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function translateToEnglish(text: string) {
  const leading = text.match(/^\s*/)?.[0] ?? "";
  const trailing = text.match(/\s*$/)?.[0] ?? "";
  const core = text.trim();

  if (!core) return text;
  if (translations[core]) return `${leading}${translations[core]}${trailing}`;

  let translated = core;
  for (const [thai, english] of translationEntries) {
    if (translated.includes(thai))
      translated = translated.replaceAll(thai, english);
  }
  return `${leading}${translated}${trailing}`;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("th");

  useEffect(() => {
    const stored = window.localStorage.getItem("thai-fantasy-language");
    const preferred: Language =
      stored === "th" || stored === "en"
        ? stored
        : window.navigator.language.toLowerCase().startsWith("en")
          ? "en"
          : "th";
    const frame = window.requestAnimationFrame(() =>
      setLanguageState(preferred),
    );
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem("thai-fantasy-language", nextLanguage);
    document.documentElement.lang = nextLanguage;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      translate: language === "en" ? translateToEnglish : (text) => text,
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}

function localizeNode(
  node: ReactNode,
  translate: (text: string) => string,
): ReactNode {
  if (typeof node === "string") return translate(node);
  if (typeof node === "number" || node == null || typeof node === "boolean")
    return node;
  if (Array.isArray(node))
    return Children.map(node, (child) => localizeNode(child, translate));

  if (isValidElement(node)) {
    const element = node as ReactElement<Record<string, unknown>>;
    const localizedProps: Record<string, unknown> = {};
    for (const key of [
      "placeholder",
      "aria-label",
      "title",
      "defaultValue",
    ] as const) {
      const value = element.props[key];
      if (typeof value === "string") localizedProps[key] = translate(value);
    }
    if ("children" in element.props) {
      localizedProps.children = localizeNode(
        element.props.children as ReactNode,
        translate,
      );
    }
    return cloneElement(element, localizedProps);
  }

  return node;
}

export function Localized({ children }: { children: ReactNode }) {
  const { translate } = useLanguage();
  return <>{localizeNode(children, translate)}</>;
}

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return (
    <RadioGroup
      className="language-switcher"
      value={language}
      onValueChange={(value) => setLanguage(value as Language)}
      aria-label="Language"
    >
      <label
        className={
          language === "th" ? "language-option active" : "language-option"
        }
      >
        <RadioGroupItem value="th" />
        <span>
          <b>TH</b>
          <small>ไทย</small>
        </span>
      </label>
      <label
        className={
          language === "en" ? "language-option active" : "language-option"
        }
      >
        <RadioGroupItem value="en" />
        <span>
          <b>EN</b>
          <small>English</small>
        </span>
      </label>
    </RadioGroup>
  );
}

/**
 * Temporary shortcut for switching language while the product is in testing.
 * Keep this separate from LanguageSwitcher so it can be removed without
 * changing the Settings control.
 */
export function TemporarySidebarLanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const nextLanguage: Language = language === "th" ? "en" : "th";

  return (
    <button
      type="button"
      className="sidebar-language-test-switch"
      onClick={() => setLanguage(nextLanguage)}
      aria-label={
        language === "th"
          ? "Switch language to English"
          : "เปลี่ยนภาษาเป็นภาษาไทย"
      }
      title={language === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}
    >
      {language === "th" ? "TH" : "EN"}
    </button>
  );
}
