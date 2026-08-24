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
  กำลังโหลดคะแนน: "Loading points",
  กำลังโหลดตารางอันดับ: "Loading standings",
  กำลังโหลดโปรไฟล์: "Loading profile",
  กำลังโหลดเครื่องมือผู้ดูแล: "Loading admin tools",
  โหลดข้อมูลการแข่งขันไม่สำเร็จ: "Unable to load competition data",
  โหลดคะแนนไม่สำเร็จ: "Unable to load points",
  โหลดตารางอันดับไม่สำเร็จ: "Unable to load standings",
  โหลดโปรไฟล์ไม่สำเร็จ: "Unable to load profile",
  โหลดเครื่องมือผู้ดูแลไม่สำเร็จ: "Unable to load admin tools",
  กรุณาตรวจสอบการเชื่อมต่อฐานข้อมูลแล้วลองอีกครั้ง:
    "Please check the database connection and try again",
  "ลองโหลดคะแนน Gameweek นี้อีกครั้ง หากปัญหายังอยู่ให้กลับมาตรวจสอบภายหลัง":
    "Try loading this Gameweek again. If the problem continues, check back later",
  "ลองโหลดลีกและอันดับล่าสุดอีกครั้ง โดยคะแนนที่บันทึกไว้จะไม่สูญหาย":
    "Try loading the latest leagues and standings again. Your saved points are safe",
  "ลองโหลดข้อมูลบัญชี ทีม ภาษา และกติกาของคุณอีกครั้ง":
    "Try loading your account, team, language, and rules again",
  "ตรวจสอบสิทธิ์และการเชื่อมต่อข้อมูล แล้วลองเปิดเครื่องมือผู้ดูแลอีกครั้ง":
    "Check your access and data connection, then try opening the admin tools again",
  ลองอีกครั้ง: "Try again",
  บันทึกทีมไม่สำเร็จ: "Unable to save your team",
  บันทึกทีมไม่ได้: "Unable to save team",
  "การเปลี่ยนแปลงยังไม่ถูกบันทึก กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง":
    "Your changes were not saved. Check your connection and try again",
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
  ข้ามไปยังเนื้อหาหลัก: "Skip to main content",
  เปลี่ยนภาษาเป็นภาษาไทย: "Switch language to Thai",
  เปลี่ยนเป็นภาษาไทย: "Switch to Thai",
  สลับเป็นภาษาไทย: "Switch to Thai",

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
  "กำลังเริ่มโหมด Guest…": "Starting Guest mode…",
  "กำลังเปิด Google…": "Opening Google…",
  "กำลังส่งรหัส OTP…": "Sending OTP…",
  "กำลังตรวจสอบรหัส…": "Verifying code…",
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
  วางแผน: "Plan",
  ก่อนเดดไลน์: "before the deadline",
  ทีมของคุณมี: "Your squad has",
  "คน และแก้ไขได้จนถึง 90 นาทีก่อนคู่แรก":
    "players and remains editable until 90 minutes before the first kickoff",
  "นักเตะระดับ 1": "Tier 1 Players",
  "โควตาสูงสุด 3 คน": "Maximum 3 players",
  ยังไม่มีนักเตะในทีมสำหรับแสดงฟอร์ม:
    "No squad players are available for form highlights yet",
  "ยังไม่มีโปรแกรมที่ยืนยันสำหรับ Gameweek นี้":
    "No confirmed fixtures are available for this Gameweek yet",

  // Team
  จัดทีมและซื้อขาย: "Team & Transfers",
  "จัดตัวจริง เลือกกัปตัน และปรับนักเตะให้พร้อมก่อนเดดไลน์":
    "Set your lineup, choose a captain, and improve your squad before the deadline",
  จัดการทีม: "Manage team",
  จัดตัวจริง: "Lineup",
  เปลี่ยนนักเตะ: "Replace player",
  ลบ: "Remove",
  ว่าง: "Vacant",
  "เติมนักเตะให้ครบ 15 คนก่อน": "Complete your 15-player squad first",
  "เติมนักเตะให้ครบ 15 คนก่อนบันทึกทีม":
    "Complete your 15-player squad before saving",
  "เกิดข้อผิดพลาด โปรด Refresh หน้านี้":
    "An error occurred. Please refresh this page.",
  "คุณเลือกผู้เล่นจากสโมสร {club} เกิน {count} คน":
    "You have selected more than {count} players from {club}",
  สโมสรนี้: "this club",
  "คุณเลือกผู้เล่นต่างชาติเกิน {count} คน":
    "You have selected more than {count} foreign players",
  "ผู้เล่นระดับ {level} ขึ้นไปใช้ได้ไม่เกิน {count} ช่อง":
    "You can use no more than {count} slots at Tier {level} or above",
  ลบนักเตะออกจากตำแหน่งแล้ว: "Player removed from the slot",
  จัดทีมลุยไทยลีก: "Build Your Thai League Squad",
  "เลือก 11 ตัวจริง วางกัปตัน แล้วพาทีมของคุณขึ้นจ่าฝูง":
    "Choose your starting XI, name a captain, and take your team to the top",
  บันทึกทีม: "Save Team",
  เดดไลน์จัดทีม: "Team Deadline",
  ปิดรับการจัดทีมแล้ว: "Team selection is closed",
  "ปิดรับการจัดทีมสำหรับ Gameweek นี้แล้ว":
    "Team selection for this Gameweek is closed",
  "ศุกร์ 21 ส.ค. · 18:00 น.": "Friday 21 Aug · 6:00 PM",
  วัน: "days",
  "ชม.": "hrs",
  นาที: "mins",
  ตัวสำรอง: "Substitutes",
  ม้านั่งสำรอง: "Bench",
  เรียงลำดับการลงสนาม: "Substitution order",
  ผู้เล่น: "Player",
  ราคา: "Price",
  ระดับ: "Tier",
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
  "5 นัดล่าสุด": "Last 5 Matches",
  "5 โปรแกรมถัดไป": "Next 5 Fixtures",
  เหย้า: "Home",
  เยือน: "Away",
  ยังไม่มีโปรแกรมถัดไป: "No upcoming fixtures",
  ยังไม่มีผลการแข่งขัน: "No recent matches",
  ดูสถิติ: "View Stats",
  เลือกผู้เล่นนี้: "Select Player",
  บันทึกการจัดทีมแล้ว: "Team saved",
  ดูข้อมูล: "View details for",
  "กำลังบันทึกทีม…": "Saving Team…",
  ยังไม่มีการเปลี่ยนแปลง: "No unsaved changes",
  เลือกผู้เล่นอีกคนเพื่อสลับตำแหน่ง: "Choose another player to swap positions",
  "เลือกนักเตะที่ไฮไลท์เพื่อสลับ หรือกดคนเดิมเพื่อยกเลิก":
    "Choose a highlighted player to swap, or select the same player to cancel",
  ยกเลิกการสลับ: "Cancel swap for",
  สลับกับ: "Swap with",
  ไม่สามารถสลับกับ: "Cannot swap with",
  สลับตัวไม่ได้: "Unable to swap players",
  สลับตำแหน่งในทีมแล้ว: "Players swapped",
  ไม่พบข้อมูลตำแหน่งของผู้เล่นในทีม:
    "A squad player's position information is missing",
  "ตัวจริงต้องมี 1 GK, อย่างน้อย 3 DEF, 2 MID และ 1 FWD":
    "The starting XI needs 1 GK, at least 3 DEF, 2 MID, and 1 FWD",
  "ผู้รักษาประตูสำรองต้องเป็นลำดับ 0 และตัวสำรองเอาต์ฟิลด์เป็น 1–3":
    "The reserve goalkeeper must be in slot 0 and outfield substitutes in slots 1–3",
  ต้องเลือกกัปตันจากตัวจริงหนึ่งคน:
    "Choose exactly one captain from the starting XI",
  ต้องเลือกรองกัปตันจากตัวจริงหนึ่งคน:
    "Choose exactly one vice-captain from the starting XI",
  โควต้าระดับ: "Tier Quotas",
  "กัปตัน ×3": "Triple Captain",
  นับตัวสำรอง: "Bench Boost",
  ครั้ง: "uses",
  "เหลือใช้ {count} ครั้ง": "Remaining {count} times",
  สลับตัว: "Swap",
  รองกัปตัน: "Vice-captain",
  ปิด: "Close",
  กรองระดับ: "Filter by tier",
  เรียงลำดับ: "Sort players",
  ตัวช่วยพิเศษ: "Chips",

  // Transfers
  จัดตัวอัตโนมัติ: "Auto-fill",
  ตลาดนักเตะ: "Player Market",
  เติมอัตโนมัติ: "Auto-fill",
  "กำลังเติม…": "Auto-filling…",
  เติมทีมอัตโนมัติไม่สำเร็จ: "Unable to auto-fill the squad",
  เติมนักเตะอัตโนมัติแล้ว: "Players auto-filled",
  "เติมนักเตะ {count} คน พร้อมเลือกกัปตันและรองกัปตันแล้ว":
    "Added {count} players and selected the captain and vice-captain",
  ไม่มีช่องนักเตะว่างให้เติม: "There are no vacant player slots to fill",
  ข้อมูลช่องนักเตะไม่ถูกต้อง: "The player-slot data is invalid",
  ยังไม่มีอันดับนักเตะสำหรับเติมทีมอัตโนมัติ:
    "Player rankings are not available for auto-fill yet",
  ไม่สามารถหาทีมที่ผ่านทุกโควต้าได้:
    "No squad satisfying every quota could be found",
  กรุณาตรวจสอบการเชื่อมต่อแล้วลองเติมทีมอีกครั้ง:
    "Check your connection and try auto-fill again",
  ซื้อขายนักเตะ: "Transfers",
  ซื้อขายในมุมมองเดียว: "Transfers in the same view",
  "เลือกคนในทีม แล้วเลือกนักเตะตำแหน่งเดียวกันเข้ามาแทน":
    "Choose a squad player, then select a replacement in the same position",
  โควต้าผ่าน: "Quotas valid",
  เกินโควต้า: "Over quota",
  ฟรี: "Free",
  เปลี่ยนตัวอิสระ: "Wildcard",
  เปลี่ยนฟรีได้อีก: "Free transfers",
  "ผู้เล่นระดับ 1": "Tier 1 Players",
  "ผู้เล่นระดับ 2": "Tier 2 Players",
  รอบันทึก: "Pending save",
  ต่างชาติ: "Foreign",
  "L1 / พรีเมียม": "L1 / premium",
  ยกเลิก: "Cancel",
  ทุกระดับ: "All tiers",
  ระดับสูงสุด: "Highest tier",
  ทีมปัจจุบัน: "Current squad",
  กดบันทึกทีมด้านบนเมื่อพร้อม: "Save your team above when ready",
  เลือกนักเตะจากสนามหรือตลาด: "Choose a player from the pitch or market",
  นักเตะในทีมจะแสดงก่อนในรายการด้านล่าง:
    "Squad players appear first in the list below",
  กดบันทึกทีมเพื่อยืนยันการเปลี่ยนแปลง: "Save your team to confirm the change",
  ค้นหานักเตะหรือสโมสร: "Search player or club",
  "เลือกนักเตะในทีมก่อน แล้วเลือกคนตำแหน่งเดียวกันเข้ามาแทน":
    "Choose a player from your squad, then select a replacement in the same position",
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
  "ดูคะแนนบนสนามตามทีมที่บันทึกไว้ พร้อม Auto-sub กัปตัน Chips และรายละเอียดคะแนน":
    "See your saved squad on the pitch with auto-subs, captaincy, chips, and scoring details",
  "เลือก Gameweek": "Select Gameweek",
  "เลือก Gameweek ปัจจุบันคือ": "Select Gameweek, currently",
  "Gameweek ก่อนหน้า": "Previous Gameweek",
  "Gameweek ถัดไป": "Next Gameweek",
  ยังไม่มีคะแนน: "No points yet",
  "ยังไม่ได้บันทึกทีมสำหรับ Gameweek นี้":
    "No squad has been saved for this Gameweek",
  "เลือกนักเตะให้ครบ 15 คนจากหน้าทีมของฉัน":
    "Select all 15 players from the My Team page",
  ดูคะแนนทุกคนในทีมและที่มาของคะแนนแบบละเอียด:
    "See every player's score and a detailed points breakdown",
  "คะแนน Gameweek": "Gameweek Points",
  "สูงกว่าค่าเฉลี่ย 15 คะแนน": "15 points above average",
  กัปตัน: "Captain",
  กัปตันที่ได้คะแนน: "Scoring Captain",
  คะแนนเพิ่มจากกัปตัน: "extra captain points",
  ชนาธิป: "Chanathip",
  ดาวเด่น: "Top Performer",
  ธีราทร: "Theerathon",
  "11 คะแนน": "11 points",
  คะแนนรายบุคคล: "Player Points",
  ตัวจริงและตัวสำรอง: "Starting XI & Bench",
  แผนการเล่น: "Formation",
  "Bench Boost — นับคะแนนทุกคน": "Bench Boost — every player counts",
  "ม้านั่งสำรองหลัง Auto-sub": "Bench after auto-subs",
  ผู้เล่นสำรอง: "Bench players",
  นับคะแนน: "Counted",
  ไม่นับคะแนน: "Not counted",
  "Auto-sub เข้า": "Auto-sub in",
  "Auto-sub ออก": "Auto-sub out",
  สนามแสดงผู้เล่นที่ถูกนับคะแนนจริงแล้ว:
    "The pitch now shows the players whose points count",
  ที่มาคะแนนผู้เล่นในทีม: "Squad Points Breakdown",
  ดูรายละเอียดคะแนนรายบุคคล: "View individual points details",
  "ไม่มี DC และ Bonus": "No DC or Bonus",
  "ยังไม่มีข้อมูลสถิติสำหรับ Gameweek นี้":
    "No statistics are available for this Gameweek yet",
  แมตช์ตกค้าง: "Postponed matches",
  ระบบคำนวณย้อนหลังอัตโนมัติ: "Scores update automatically",
  "Auto-sub, กัปตัน, Chips และอันดับจะถูกคำนวณใหม่เมื่อข้อมูลนัดตกค้างเข้ามา":
    "Auto-subs, captaincy, chips, and ranks are recalculated when postponed-match data arrives",
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
  "อันดับเรียงจากคะแนนรวม และใช้จำนวน Transfer ที่น้อยกว่าเป็นตัวตัดสิน":
    "Rankings use total points, with fewer transfers as the tiebreaker",
  "Classic scoring · ไม่มีบอลถ้วย": "Classic scoring · no cup competition",
  "คะแนน Final": "Final points",
  "คะแนนชั่วคราว — อาจเปลี่ยนเมื่อมีแมตช์ตกค้าง":
    "Provisional points — postponed matches may change the ranking",
  "Wildcard ไม่นับจำนวน Transfer":
    "Wildcard transfers do not count toward the tiebreaker",
  ยังไม่มีลีกสำหรับทีมนี้: "No leagues are available for this team yet",
  ลีกโดยรวมและมินิลีกจะแสดงที่นี่เมื่อพร้อมใช้งาน:
    "The overall league and mini-leagues will appear here when available",

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
  กรองตำแหน่งผู้เล่น: "Filter players by position",
  "ยังไม่มีโปรแกรมใน Gameweek นี้":
    "No fixtures are available for this Gameweek",
  "ลองเลือก Gameweek อื่นเพื่อตรวจสอบโปรแกรม":
    "Try another Gameweek to view its fixtures",
  ไม่พบนักเตะในตำแหน่งนี้: "No players were found in this position",
  เลือกตำแหน่งอื่นเพื่อดูอันดับผู้เล่น:
    "Choose another position to view player rankings",

  // Profile and settings
  บัญชีของฉัน: "My Account",
  โปรไฟล์และการตั้งค่า: "Profile & Settings",
  "จัดการข้อมูลทีม การแจ้งเตือน และอ่านกติกาของเกม":
    "Manage your team details, notifications, and game rules",
  "จัดการชื่อบัญชีและทีม เลือกภาษา และตรวจสอบกติกาที่ใช้งานจริง":
    "Manage your account and team names, choose a language, and review the active rules",
  ข้อมูลผู้เล่นปัจจุบัน: "Current player details",
  "ส่วนต่าง ๆ ของโปรไฟล์": "Profile sections",
  บันทึกการเปลี่ยนแปลง: "Save Changes",
  "เข้าร่วมเมื่อ ส.ค. 2026": "Joined August 2026",
  ข้อมูลบัญชี: "Account Details",
  ข้อมูลทีม: "Team Details",
  กติกาเกม: "Game Rules",
  ความเป็นส่วนตัว: "Privacy",
  ข้อมูลที่ใช้แสดงในเกม: "Information shown in the game",
  ชื่อที่แสดง: "Display Name",
  อีเมล: "Email",
  "Guest ใช้ชื่อสุ่มและเปลี่ยนชื่อไม่ได้":
    "Guests use a generated name that cannot be changed",
  "เปลี่ยนชื่อผู้จัดการได้ โดยจะเปลี่ยนครั้งถัดไปได้ใน 30 วัน":
    "You can change the manager name; the next change will be available in 30 days",
  เปลี่ยนชื่อผู้จัดการได้อีกครั้งหลัง:
    "Manager name can be changed again after",
  "ใช้ภาษาไทย อังกฤษ ตัวเลข เว้นวรรค และ . _ - ได้ 3–30 ตัวอักษร":
    "Use 3–30 Thai or English letters, numbers, spaces, and . _ -",
  จังหวัด: "Province",
  กรุงเทพมหานคร: "Bangkok",
  เชียงใหม่: "Chiang Mai",
  ชลบุรี: "Chonburi",
  ทีมโปรด: "Favourite Club",
  ชื่อและอัตลักษณ์ทีมแฟนตาซี: "Your fantasy team's name and identity",
  ชื่อทีม: "Team Name",
  "Guest ใช้ชื่อทีมแบบสุ่มและเปลี่ยนไม่ได้":
    "Guests use a generated team name that cannot be changed",
  ใช้สิทธิ์เปลี่ยนชื่อทีมครบแล้วสำหรับฤดูกาลนี้:
    "All team-name changes have been used for this season",
  เปลี่ยนชื่อทีมได้อีก: "Team-name changes remaining:",
  ครั้งในฤดูกาลนี้: "this season",
  บันทึกชื่อบัญชีและทีม: "Save Account & Team Names",
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
  "กำลังบันทึก…": "Saving…",
  "กำลังออกจากระบบ…": "Signing out…",
  บันทึกชื่อเรียบร้อยแล้ว: "Names saved",
  "ผู้เล่น Guest ไม่สามารถเปลี่ยนชื่อได้ กรุณาสมัครสมาชิกก่อน":
    "Guest players cannot change names. Create an account first.",
  "ชื่อต้องมี 3–30 ตัวอักษร": "Names must contain 3–30 characters",
  "ใช้ได้เฉพาะภาษาไทย อังกฤษ ตัวเลข เว้นวรรค และ . _ -":
    "Use only Thai or English letters, numbers, spaces, and . _ -",
  ชื่อนี้อาจทำให้เข้าใจผิดว่าเป็นทีมงานหรือบัญชีทางการ:
    "This name could be mistaken for staff or an official account",
  ชื่อนี้มีคำที่ไม่อนุญาต: "This name contains a prohibited term",
  "ใช้สิทธิ์เปลี่ยนชื่อทีมครบ 3 ครั้งแล้ว":
    "All 3 team-name changes have already been used",
  ชื่อไม่ถูกต้อง: "The name is invalid",
  การเปลี่ยนแปลงระดับ: "Tier Changes",
  กติกาที่ระบบใช้ตรวจทีมและคำนวณคะแนน:
    "The rules used to validate squads and calculate points",
  ระดับนักเตะ: "Player Tiers",
  แมตช์ตกค้างและอันดับ: "Postponed Matches & Rankings",
  กติกาถูกบันทึกเป็นข้อมูลรายฤดูกาล:
    "Rules are stored separately for each season",
  "ระดับ ตำแหน่ง และทีมในแต่ละ Gameweek เก็บแบบ snapshot เพื่อรักษาประวัติย้อนหลัง":
    "Each Gameweek stores tier, position, and club snapshots to preserve historical results",
  "ทีมมี 15 คน: ผู้รักษาประตู 2 กองหลัง 5 กองกลาง 5 และกองหน้า 3 คน ตัวจริงต้องมี 1 GK, อย่างน้อย 3 DEF, 2 MID และ 1 FWD สโมสรเดียวกันไม่เกิน 3 คนและต่างชาติไม่เกิน 7 คน โดยลูกครึ่งไทยนับเป็นนักเตะไทย":
    "A squad has 15 players: 2 goalkeepers, 5 defenders, 5 midfielders, and 3 forwards. The starting XI needs 1 GK, at least 3 DEF, 2 MID, and 1 FWD. A squad may include at most 3 players from one club and 7 foreign players; dual-national Thai players count as Thai.",
  "ระดับ 1 มี 3 ช่อง ระดับ 2 มี 7 ช่อง และระดับ 3 มี 5 ช่อง ผู้เล่นระดับต่ำกว่าสามารถใช้ช่องระดับสูงกว่าที่ว่างได้ จึงมีระดับ 1 ได้สูงสุด 3 คน และระดับ 1–2 รวมกันสูงสุด 10 คน ระดับมีผลเป็นราย Gameweek":
    "Tier 1 has 3 slots, Tier 2 has 7, and Tier 3 has 5. Lower-tier players may use an open higher-tier slot, so a squad can have at most 3 Tier 1 players and 10 Tier 1–2 players combined. Tiers apply per Gameweek.",
  "ได้รับ Free Transfer เพิ่ม 2 ครั้งหลังแต่ละ Deadline สะสมได้สูงสุด 4 ครั้ง ส่วนที่เกินหัก 4 คะแนนต่อครั้ง นับจากความแตกต่างสุทธิของทีม และยกเลิกได้จนถึง Deadline 90 นาทีก่อนคู่แรก":
    "You receive 2 free transfers after each deadline and may bank up to 4. Each additional transfer costs 4 points. Transfers use the net squad difference and can be reversed until 90 minutes before the first kickoff.",
  "มี Triple Captain, Bench Boost และ Wildcard อย่างละ 2 ครั้งตลอดฤดูกาล ใช้ได้หนึ่ง Chip ต่อ Gameweek ใช้ชนิดเดิมติดกันได้ และยกเลิกได้ก่อน Deadline โดย Wildcard เก็บ Free Transfer ที่สะสมไว้":
    "Triple Captain, Bench Boost, and Wildcard can each be used twice per season. One chip may be active per Gameweek, the same chip may be used in consecutive Gameweeks, and it can be cancelled before the deadline. A Wildcard preserves banked free transfers.",
  "ใช้คะแนน FPL สำหรับนาที ประตู แอสซิสต์ คลีนชีต เซฟ จุดโทษ ใบเหลือง ใบแดง และประตูตัวเอง โดยไม่มี Defensive Contributions และ Bonus/BPS ผู้เล่นที่ถูกไล่ออกไม่ถูกคิดประตูที่ทีมเสียหลังออกจากสนาม":
    "Scoring follows FPL for minutes, goals, assists, clean sheets, saves, penalties, cards, and own goals, without Defensive Contributions or Bonus/BPS. A dismissed player is not charged for goals conceded after leaving the pitch.",
  "แมตช์ตกค้างให้คะแนนย้อนหลังแก่ Gameweek เดิม แล้วคำนวณ Auto-sub กัปตัน Chips และอันดับใหม่ Classic League ใช้คะแนนรวมและจำนวน Transfer ที่น้อยกว่าเป็นตัวตัดสิน โดยไม่นับ Wildcard":
    "Postponed matches score back into their original Gameweek, then auto-subs, captaincy, chips, and rankings are recalculated. Classic Leagues rank by total points, using fewer transfers as the tiebreaker; Wildcard transfers are excluded.",
  "ขนาดทีม 15 คน: ผู้รักษาประตู 2 กองหลัง 5 กองกลาง 5 และกองหน้า 3 คน":
    "Squad size: 15 players — 2 goalkeepers, 5 defenders, 5 midfielders, and 3 forwards",
  "ตัวจริง 11 คนต้องมี 1 GK, อย่างน้อย 3 DEF, 2 MID และ 1 FWD":
    "The starting XI needs 1 GK, at least 3 DEF, 2 MID, and 1 FWD",
  "เลือกนักเตะจากสโมสรเดียวกันได้สูงสุด 3 คน":
    "Select at most 3 players from one club",
  "มีนักเตะต่างชาติได้สูงสุด 7 คน โดยผู้เล่นที่ระบบจัดประเภทเป็นไทยนับในโควตานักเตะไทย":
    "Select at most 7 foreign players; players classified as Thai count toward the Thai-player quota",
  "เมื่อสลับกัปตันหรือรองกัปตันกับตัวสำรอง นักเตะที่ขึ้นมาเป็นตัวจริงจะรับบทบาทนั้นแทน ส่วนการสลับผู้เล่นที่เป็นตัวจริงทั้งคู่จะคงบทบาทไว้กับผู้เล่นเดิม":
    "When a captain or vice-captain is swapped with a substitute, the incoming starter inherits that role. Swapping two starters keeps each role with its existing player",
  "ระดับ 1 มี 3 ช่อง ระดับ 2 มี 7 ช่อง และระดับ 3 มี 5 ช่อง":
    "Tier 1 has 3 slots, Tier 2 has 7 slots, and Tier 3 has 5 slots",
  ผู้เล่นระดับต่ำกว่าสามารถใช้ช่องระดับสูงกว่าที่ยังว่างได้:
    "A lower-tier player may use an available higher-tier slot",
  "มีผู้เล่นระดับ 1 ได้สูงสุด 3 คน และระดับ 1–2 รวมกันสูงสุด 10 คน":
    "A squad may have at most 3 Tier 1 players and 10 Tier 1–2 players combined",
  "ระดับนักเตะมีผลแยกตาม Gameweek":
    "Player tiers apply separately to each Gameweek",
  "ได้รับ Free Transfer เพิ่ม 2 ครั้งหลังแต่ละ Deadline และสะสมได้สูงสุด 4 ครั้ง":
    "Receive 2 free transfers after each deadline and bank up to 4",
  "Transfer ที่เกินโควต้าฟรีหัก 4 คะแนนต่อครั้ง โดยนับจากความแตกต่างสุทธิของทีม":
    "Each transfer beyond the free allowance costs 4 points, based on the net squad difference",
  "ยกเลิกการเปลี่ยนแปลงได้ถึง Deadline ซึ่งปิดก่อนคู่แรก 90 นาที":
    "Changes can be reversed until the deadline, 90 minutes before the first kickoff",
  "Triple Captain, Bench Boost และ Wildcard ใช้ได้อย่างละ 2 ครั้งต่อฤดูกาล":
    "Triple Captain, Bench Boost, and Wildcard can each be used twice per season",
  "ใช้ได้ 1 Chip ต่อ Gameweek และใช้ชนิดเดิมใน Gameweek ติดกันได้":
    "Use 1 chip per Gameweek; the same chip may be used in consecutive Gameweeks",
  "ยกเลิก Chip ได้ก่อน Deadline โดย Wildcard ทำให้ Transfer ไม่มีค่าใช้จ่ายและคง Free Transfer ที่สะสมไว้":
    "Cancel a chip before the deadline; Wildcard makes transfers free and preserves banked free transfers",
  "คิดคะแนนจากนาทีลงสนาม ประตู แอสซิสต์ คลีนชีต การเซฟ จุดโทษ ใบเหลือง ใบแดง และประตูตัวเอง":
    "Points cover minutes played, goals, assists, clean sheets, saves, penalties, cards, and own goals",
  "ไม่มี Defensive Contributions และ Bonus/BPS":
    "Defensive Contributions and Bonus/BPS are not used",
  ผู้เล่นที่ถูกไล่ออกไม่ถูกคิดประตูที่ทีมเสียหลังออกจากสนาม:
    "A dismissed player is not charged for goals conceded after leaving the pitch",
  "แมตช์ตกค้างให้คะแนนย้อนหลังใน Gameweek เดิม":
    "Postponed matches score back into their original Gameweek",
  "ระบบคำนวณ Auto-sub กัปตัน Chips และอันดับใหม่หลังอัปเดตคะแนน":
    "Auto-subs, captaincy, chips, and rankings are recalculated after points update",
  "Classic League จัดอันดับจากคะแนนรวม แล้วใช้จำนวน Transfer ที่น้อยกว่าเป็นตัวตัดสิน โดยไม่นับ Wildcard":
    "Classic Leagues rank by total points, then fewer transfers; Wildcard transfers are excluded",
  ผลย้อนหลังของคุณจะคงเดิม: "Your historical results stay unchanged",
  "ระบบเก็บระดับ ตำแหน่ง สโมสร และสถานะนักเตะไทยของแต่ละ Gameweek ไว้แยกกัน เพื่อให้คะแนนและประวัติเดิมตรวจสอบได้เสมอ":
    "Tier, position, club, and Thai-player status are stored separately for each Gameweek so historical points remain verifiable",

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

export function SidebarLanguageButton() {
  const { language, setLanguage } = useLanguage();
  const nextLanguage = language === "th" ? "en" : "th";
  const label = language === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย";

  return (
    <button
      type="button"
      className="sidebar-language-button"
      onClick={() => setLanguage(nextLanguage)}
      aria-label={label}
      title={label}
    >
      {nextLanguage.toUpperCase()}
    </button>
  );
}
