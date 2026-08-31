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
export type Language = "th" | "en";

const translations: Record<string, string> = {
  // Navigation and shared shell
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
  เปิดเมนูหลัก: "Open main navigation",
  ปิดเมนูหลัก: "Close main navigation",
  เมนูมือถือ: "Mobile navigation",
  เพิ่มเติม: "More",
  เมนูเพิ่มเติม: "More Menu",
  "เข้าถึงการแข่งขัน โปรแกรม และการตั้งค่าของคุณ":
    "Access competitions, fixtures, and your settings",
  กำลังโหลดข้อมูล: "Loading data",
  กำลังโหลดคะแนน: "Loading points",
  กำลังโหลดตารางอันดับ: "Loading standings",
  กำลังโหลดโปรไฟล์: "Loading profile",
  กำลังโหลดการตั้งค่า: "Loading settings",
  กำลังโหลดเครื่องมือผู้ดูแล: "Loading admin tools",
  โหลดข้อมูลการแข่งขันไม่สำเร็จ: "Unable to load competition data",
  โหลดคะแนนไม่สำเร็จ: "Unable to load points",
  โหลดตารางอันดับไม่สำเร็จ: "Unable to load standings",
  "กำลังโหลดตารางอันดับ…": "Loading standings…",
  "โหลดตารางอันดับไม่สำเร็จ กรุณาลองอีกครั้ง":
    "Could not load the standings. Please try again.",
  โหลดโปรไฟล์ไม่สำเร็จ: "Unable to load profile",
  โหลดการตั้งค่าไม่สำเร็จ: "Unable to load settings",
  โหลดเครื่องมือผู้ดูแลไม่สำเร็จ: "Unable to load admin tools",
  กรุณาตรวจสอบการเชื่อมต่อฐานข้อมูลแล้วลองอีกครั้ง:
    "Please check the database connection and try again",
  "ลองโหลดคะแนน Gameweek นี้อีกครั้ง หากปัญหายังอยู่ให้กลับมาตรวจสอบภายหลัง":
    "Try loading this Gameweek again. If the problem continues, check back later",
  "ลองโหลดลีกและอันดับล่าสุดอีกครั้ง โดยคะแนนที่บันทึกไว้จะไม่สูญหาย":
    "Try loading the latest leagues and standings again. Your saved points are safe",
  "ลองโหลดข้อมูลบัญชี ทีม ภาษา และกติกาของคุณอีกครั้ง":
    "Try loading your account, team, language, and rules again",
  ลองโหลดข้อมูลบัญชีและทีมของคุณอีกครั้ง:
    "Try loading your account and team details again",
  ลองโหลดการตั้งค่าบัญชีและภาษาอีกครั้ง:
    "Try loading your account and language settings again",
  "ตรวจสอบสิทธิ์และการเชื่อมต่อข้อมูล แล้วลองเปิดเครื่องมือผู้ดูแลอีกครั้ง":
    "Check your access and data connection, then try opening the admin tools again",
  ลองอีกครั้ง: "Try again",
  บันทึกทีมไม่สำเร็จ: "Unable to save your team",
  บันทึกทีมไม่ได้: "Unable to save team",
  "การเปลี่ยนแปลงยังไม่ถูกบันทึก กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง":
    "Your changes were not saved. Check your connection and try again",
  ยังไม่ได้บันทึกการเปลี่ยนแปลง: "You have unsaved changes",
  "การเปลี่ยนแปลงทีมของคุณจะหายไป หากออกจากหน้านี้โดยไม่บันทึก":
    "Your team changes will be lost if you leave this page without saving",
  อยู่หน้านี้ต่อ: "Stay on this page",
  ออกจากหน้านี้: "Leave this page",
  ช่วยเหลือ: "Help",
  ตั้งค่า: "Settings",
  เมนูผู้จัดการทีม: "Manager menu",
  เปิดเมนูผู้จัดการทีม: "Open manager menu",
  "เริ่มเล่น Fantasy": "Start playing Fantasy",
  ยังไม่มีทีม: "No team yet",
  เริ่มจัดทีมไทยลีกของคุณ: "Start building your Thai League squad",
  ภาษา: "Language",
  เลือกภาษาที่ใช้แสดงผลบนเว็บไซต์:
    "Choose the language used across the website",
  ภาษาที่ใช้แสดงผล: "Display Language",
  การตั้งค่านี้จะถูกจดจำในอุปกรณ์เครื่องนี้:
    "This preference is saved on this device",
  ผู้จัดการทีม: "Manager",
  บัญชีผู้เล่น: "Player account",
  "ผู้เล่น Guest": "Guest player",
  อันดับ: "Rank",
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
  สมัครสมาชิกเพื่อเก็บทีม: "Create an account to save this team",
  ออกจากระบบ: "Sign out",
  "Guest ไม่มีอีเมล": "Guest has no email",

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
  "ผู้เล่นระดับ 1–{level} รวมกันได้ไม่เกิน {count} คน":
    "You can select no more than {count} players from Tiers 1–{level} combined",
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
  ยืนยันทีมใหม่แล้ว: "New squad confirmed:",
  "เลย Deadline ของ Gameweek นี้แล้ว": "This Gameweek deadline has passed",
  พบรายชื่อนักเตะซ้ำในทีม: "The squad contains duplicate players",
  ทีมยังไม่ผ่านกติกา: "The squad does not meet the rules",
  นักเตะหนึ่งคนอยู่ในทีมได้เพียงครั้งเดียว:
    "Each player can appear in the squad only once",
  "ทีมต้องมีนักเตะ 15 คน": "The squad must contain 15 players",
  "จำนวนผู้เล่นตำแหน่ง goalkeeper ต้องเท่ากับ 2":
    "The squad must contain 2 goalkeepers",
  "จำนวนผู้เล่นตำแหน่ง defender ต้องเท่ากับ 5":
    "The squad must contain 5 defenders",
  "จำนวนผู้เล่นตำแหน่ง midfielder ต้องเท่ากับ 5":
    "The squad must contain 5 midfielders",
  "จำนวนผู้เล่นตำแหน่ง forward ต้องเท่ากับ 3":
    "The squad must contain 3 forwards",
  "เลือกผู้เล่นจากสโมสรเดียวกันได้ไม่เกิน 3 คน":
    "Select no more than 3 players from one club",
  "มีนักเตะต่างชาติได้ไม่เกิน 7 คน": "Select no more than 7 foreign players",
  "ผู้เล่นระดับ 1–1 รวมกันได้ไม่เกิน 3 คน":
    "Select no more than 3 Tier 1 players",
  "ผู้เล่นระดับ 1–2 รวมกันได้ไม่เกิน 6 คน":
    "Select no more than 6 players across Tiers 1–2",
  "ผู้เล่นระดับ 1–3 รวมกันได้ไม่เกิน 9 คน":
    "Select no more than 9 players across Tiers 1–3",
  ไม่พบระดับ: "Tier",
  ในกติกาฤดูกาลนี้: "is not defined in this season's rules",
  นักเตะไม่เปิดให้เลือกในตลาด: "This player is not available in the market",
  "ต้องเลือกตัวจริง 11 คนและตัวสำรอง 4 คน":
    "Select 11 starters and 4 substitutes",
  "ใช้ได้เพียงหนึ่ง Chip ต่อ Gameweek":
    "Only one chip can be active in a Gameweek",
  "Chip ชนิดนี้ใช้ได้ 2 ครั้งต่อฤดูกาล":
    "This chip can be used twice per season",
  ยกเลิกการเปลี่ยนแปลงและคืนโควต้าแล้ว:
    "Changes cancelled and transfer allowance restored",
  ไม่พบทีมตั้งต้นสำหรับยกเลิกการเปลี่ยนแปลง:
    "No baseline squad is available to restore",
  "ข้อมูลทีมตั้งต้นไม่ครบ 15 คน":
    "The baseline squad does not contain 15 players",
  นักเตะในทีมตั้งต้นบางคนไม่พร้อมให้เลือกแล้ว:
    "Some players in the baseline squad are no longer eligible",
  ทีมตั้งต้นไม่ผ่านกติกาปัจจุบัน:
    "The baseline squad no longer meets the current rules",
  เปลี่ยนชื่อผู้จัดการได้อีกครั้งวันที่:
    "The manager name can be changed again on",
  ใช้ครบแล้ว: "All uses consumed",
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
  "โควต้านักเตะระดับ 1-3": "Player quota for Tiers 1-3",
  ดูวิธีนับโควต้าระดับ: "How tier quotas work",
  โควต้าระดับเป็นแบบสะสม: "Tier quotas are cumulative",
  "นักเตะระดับ 1-3 มีรวมได้สูงสุด 9 คน นักเตะระดับ 1 มีได้สูงสุด 3 คน นักเตะระดับ 2 มีได้สูงสุด 6 คน":
    "Tiers 1–3 can be selected up to 9 players in total. Tier 1 is capped at 3 players, and Tier 2 is capped at 6 players.",
  "ระดับ 1 เติมวง 1–3 ระดับ 2 เติมวง 4–6 แล้วถอยกลับไปวง 3–1 ส่วนระดับ 3 เติมวง 7–9 แล้วถอยกลับไปวง 6–1 โดยข้ามวงที่ถูกใช้แล้ว ระดับ 4 ไม่ใช้วงกลมชุดนี้":
    "Tier 1 fills circles 1–3. Tier 2 fills 4–6, then works backward through 3–1. Tier 3 fills 7–9, then works backward through 6–1, skipping occupied circles. Tier 4 does not use these circles.",
  "ใช้ระดับ 1 {level1} คน ระดับ 2 {level2} คน และระดับ 3 {level3} คน":
    "Tier 1: {level1} players, Tier 2: {level2} players, and Tier 3: {level3} players",
  "กัปตัน ×3": "Triple Captain",
  นับตัวสำรอง: "Bench Boost",
  ครั้ง: "uses",
  "เหลือใช้ {count} ครั้ง": "Remaining {count} times",
  "ใช้ได้ตั้งแต่ GW2": "Available from GW2",
  "เปลี่ยนตัวอิสระใช้ได้ตั้งแต่ GW2": "Wildcard is available from GW2",
  สลับตัว: "Swap",
  รองกัปตัน: "Vice-captain",
  ปิด: "Close",
  ค้นหาชื่อนักเตะ: "Search players",
  กรองสโมสร: "Filter by club",
  ทุกสโมสร: "All clubs",
  กรองระดับ: "Filter by tier",
  กรองสัญชาติ: "Filter nationality",
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
  "ระดับ 1": "Tier 1",
  "ระดับ 1–2": "Tiers 1–2",
  "ระดับ 1–3": "Tiers 1–3",
  "ระดับ 2": "Tier 2",
  "ระดับ 3": "Tier 3",
  "ระดับ 4": "Tier 4",
  "ผู้เล่นระดับ 1": "Tier 1 Players",
  "ผู้เล่นระดับ 2": "Tier 2 Players",
  รอบันทึก: "Pending save",
  ต่างชาติ: "Foreign",
  "L1 / พรีเมียม": "L1 / premium",
  ทุกระดับ: "All tiers",
  ทุกสัญชาติ: "All nationalities",
  นักเตะไทย: "Thai players",
  นักเตะต่างชาติ: "Foreign players",
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
  กลับไปตรวจสอบ: "Review again",
  ยืนยัน: "Confirm",
  ยืนยันการซื้อขายแล้ว: "Transfers confirmed",
  งบคงเหลือ: "Bank",
  จาก: "of",
  ฟรีทรานส์เฟอร์: "Free Transfers",
  "ครั้งใน Gameweek นี้": "available this Gameweek",
  นักเตะในทีม: "Squad Players",
  สลับมุมมองทีม: "Switch team view",
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
  คะแนนสูงสุด: "Highest score",
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
  คะแนนชั่วคราว: "Provisional points",
  คะแนนสุดท้าย: "Final points",
  รายละเอียดคะแนนรวม: "Score calculation",
  คะแนนตัวจริง: "Lineup points",
  โบนัสกัปตัน: "Captain bonus",
  "หักคะแนน Transfer": "Transfer deduction",
  "Chip ที่ใช้": "Active chip",
  "Chip ที่ใช้ใน Gameweek นี้": "Chip used this Gameweek",
  "คะแนน Gameweek รวม": "Gameweek total",
  "สรุปคะแนน Gameweek": "Gameweek score summary",
  คะแนนเฉลี่ย: "Average score",
  "ยังไม่ได้บันทึกทีมสำหรับ Gameweek นี้":
    "No squad has been saved for this Gameweek",
  "เลือกนักเตะให้ครบ 15 คนจากหน้าทีมของฉัน":
    "Select all 15 players from the My Team page",
  ดูคะแนนทุกคนในทีมและที่มาของคะแนนแบบละเอียด:
    "See every player's score and a detailed points breakdown",
  "คะแนน Gameweek": "Gameweek Points",
  แต้มที่หัก: "Deductions",
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
  สนามอัปเดตผู้เล่นตัวจริงแล้ว: "The pitch reflects the updated lineup",
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
  อันดับทั้งหมด: "Overall ranking",
  ลีกส่วนตัว: "Private Leagues",
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
  "ติดตามอันดับ Overall และแข่งขันกับกลุ่มเพื่อนด้วยคะแนน Classic ตลอดฤดูกาล":
    "Track your Overall rank and compete with friends through season-long Classic scoring",
  "สมัครสมาชิกเพื่อใช้ Private League": "Sign up to use Private Leagues",
  สร้างลีกส่วนตัว: "Create a Private League",
  สร้างลีก: "Create League",
  "ตั้งชื่อลีกสำหรับกลุ่มของคุณ ระบบจะสร้างรหัสเชิญ 8 ตัวให้ทันที":
    "Name your group and an eight-character invite code will be created immediately",
  ชื่อลีก: "League name",
  "ใช้ภาษาไทย อังกฤษ ตัวเลข เว้นวรรค และ . _ - ได้ 3–40 ตัว":
    "Use Thai or English letters, numbers, spaces, and . _ -; 3–40 characters",
  ยกเลิก: "Cancel",
  "กำลังสร้างลีก…": "Creating league…",
  "เข้าร่วม Private League": "Join a Private League",
  เข้าร่วมลีกส่วนตัว: "Join a Private League",
  ตรวจสอบชื่อลีกและจำนวนสมาชิกก่อนยืนยันเข้าร่วม:
    "Review the league name and member count before joining",
  "รหัสเชิญ 8 ตัว": "Eight-character invite code",
  "พิมพ์ตัวเล็กหรือตัวใหญ่ก็ได้ รหัสไม่มี O, 0, I, L และ 1":
    "Uppercase and lowercase are both accepted; codes exclude O, 0, I, L, and 1",
  สมาชิก: "members",
  ทีมของคุณอยู่ในลีกนี้แล้ว: "Your team is already in this league",
  ลีกนี้มีสมาชิกครบแล้ว: "This league is full",
  พร้อมเข้าร่วมด้วยทีมปัจจุบัน: "Ready to join with your current team",
  "กำลังเข้าร่วม…": "Joining…",
  ยืนยันเข้าร่วม: "Confirm and join",
  เปิดลีกนี้: "Open this league",
  "กำลังตรวจสอบ…": "Checking…",
  ตรวจสอบรหัส: "Check code",
  ลีกที่คุณเป็นสมาชิกจะปรากฏเฉพาะกับคนในกลุ่ม:
    "Only group members can see leagues you have joined",
  คุณเป็นเจ้าของ: "You are the owner",
  คะแนนรวม: "Total points",
  "Private League สำหรับสมาชิก": "Private Leagues are for members",
  "ยังไม่มี Private League": "No Private Leagues yet",
  สมัครสมาชิกเพื่อสร้างลีกหรือเข้าร่วมกลุ่มของเพื่อน:
    "Sign up to create a league or join a group of friends",
  "สร้างกลุ่มใหม่หรือใช้รหัสเชิญ 8 ตัวจากเจ้าของลีก":
    "Create a new group or use an eight-character code from a league owner",
  สมัครสมาชิก: "Sign up",
  ยังไม่มีลีกส่วนตัว: "No private leagues yet",
  กรอกรหัสเชิญ: "Enter invite code",
  "คะแนน Gameweek นี้ยังเป็นคะแนนชั่วคราว และอาจเปลี่ยนหลังตรวจแมตช์ตกค้าง":
    "This Gameweek is provisional and may change after postponed matches are reviewed",
  "ยังไม่พบ Overall League": "Overall League is not available yet",
  กรุณาติดต่อผู้ดูแลก่อนเริ่มแข่งขันในฤดูกาลนี้:
    "Contact an administrator before competing this season",
  กลับไปลีกของฉัน: "Back to My Leagues",
  "Overall Classic": "Overall Classic",
  "Private Classic": "Private Classic",
  อันดับของคุณ: "Your rank",
  "คะแนน GW": "GW points",
  ตารางอันดับ: "Standings",
  "เรียงจากคะแนนรวม แล้วใช้ Transfer ที่น้อยกว่าเป็นตัวตัดสิน":
    "Ranked by total points, then by fewer transfers",
  จัดการสมาชิก: "Manage member",
  เจ้าของ: "Owner",
  นำออก: "Remove",
  หน้าตารางอันดับ: "Standings pages",
  ก่อนหน้า: "Previous",
  หน้า: "Page",
  ถัดไป: "Next",
  อันดับนี้สรุปแล้ว: "These standings are final",
  อันดับอาจเปลี่ยนหลังอัปเดตคะแนน:
    "Standings may change after points are updated",
  ข้อมูลและการจัดการลีก: "League information and management",
  ลีกของผู้เล่นทุกคน: "League for every manager",
  "ทุกทีมเข้าร่วม Overall อัตโนมัติและไม่สามารถออกจากลีกนี้ได้":
    "Every team joins Overall automatically and cannot leave it",
  เชิญสมาชิก: "Invite members",
  แชร์รหัสหรือลิงก์นี้กับสมาชิกที่เข้าสู่ระบบแล้ว:
    "Share this code or link with a signed-in member",
  คัดลอกรหัส: "Copy code",
  คัดลอกลิงก์: "Copy link",
  สร้างรหัสใหม่: "Generate new code",
  ตั้งค่าลีก: "League settings",
  บันทึกชื่อ: "Save name",
  ลบลีก: "Delete league",
  "สมาชิก Private League": "Private League member",
  อันดับนี้เห็นได้เฉพาะสมาชิกของลีกเท่านั้น:
    "Only members of this league can see these standings",
  ออกจากลีก: "Leave league",
  "กำลังดำเนินการ…": "Working…",
  นำสมาชิกออก: "Remove member",
  ลบลีกถาวร: "Delete league permanently",
  คัดลอกรหัสแล้ว: "Invite code copied",
  คัดลอกลิงก์เชิญแล้ว: "Invite link copied",
  "คัดลอกไม่สำเร็จ กรุณาเลือกรหัสแล้วคัดลอกด้วยตนเอง":
    "Could not copy. Select the code and copy it manually",
  "สร้างรหัสเชิญใหม่แล้ว รหัสเดิมใช้ไม่ได้อีกต่อไป":
    "A new invite code was created; the old code no longer works",
  นำสมาชิกออกจากลีกแล้ว: "Member removed from the league",
  เปลี่ยนชื่อลีกเรียบร้อยแล้ว: "League name updated",
  "บัญชี Guest ต้องสมัครสมาชิกก่อนใช้ Private League":
    "Guest accounts must sign up before using Private Leagues",
  "ไม่พบลีกจากรหัสนี้ หรือรหัสหมดอายุแล้ว":
    "No league was found for this code, or the code has expired",
  "รหัสลีกต้องมี 8 ตัว และใช้เฉพาะตัวอักษรอังกฤษหรือตัวเลขที่กำหนด":
    "A league code must contain eight approved English letters or numbers",
  "คุณสร้าง Private League ครบ 10 ลีกแล้ว":
    "You have reached the limit of 10 owned Private Leagues",
  "คุณเป็นสมาชิก Private League ครบ 20 ลีกแล้ว":
    "You have reached the limit of 20 Private League memberships",
  "ลีกนี้มีสมาชิกครบ 100 ทีมแล้ว": "This league has reached 100 teams",
  เฉพาะเจ้าของลีกเท่านั้นที่ทำรายการนี้ได้:
    "Only the league owner can perform this action",
  "เจ้าของลีกออกจากลีกไม่ได้ หากไม่ใช้ลีกแล้วให้ลบลีกแทน":
    "A league owner cannot leave; delete the league if it is no longer needed",
  "ทำรายการลีกไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง":
    "Could not complete the league action. Check your connection and try again",
  "ไม่พบลีกจากข้อมูลนี้ หรือรหัสเชิญหมดอายุแล้ว":
    "The league was not found, or its invite code has expired",
  ทีมนี้ไม่ได้เป็นสมาชิกของลีก: "This team is not a league member",
  ไม่สามารถนำเจ้าของลีกออกได้: "The league owner cannot be removed",
  "สร้างรหัสเชิญไม่สำเร็จ กรุณาลองอีกครั้ง":
    "Could not generate an invite code. Try again",
  "สร้าง Private League เรียบร้อยแล้ว": "Private League created",
  "เข้าร่วม Private League เรียบร้อยแล้ว": "Joined the Private League",
  "ออกจาก Private League แล้ว": "Left the Private League",
  "ลบ Private League แล้ว": "Private League deleted",

  // Fixtures and stats
  ติดตามโปรแกรมจริงและเปรียบเทียบผลงานนักเตะจากข้อมูลที่ตรวจสอบได้:
    "Follow verified fixtures and compare player performance",
  สถิติผู้เล่น: "Player statistics",
  แยกตัวเลขฟุตบอลทางการออกจากคะแนนที่คำนวณตามกติกาแฟนตาซี:
    "Official football statistics are separated from rule-based Fantasy points",
  แฟนตาซี: "Fantasy",
  สถิติการแข่งขัน: "Match stats",
  ฤดูกาลนี้ยังไม่มีสถิติ: "No statistics are available this season yet",
  ไม่พบนักเตะตามตัวกรอง: "No players match these filters",
  ลองล้างคำค้นหาหรือเลือกตัวกรองอื่น:
    "Clear the search or choose different filters",
  "URL เอกสารต้นทาง หรือเหตุผลการแก้ไข":
    "Source document URL or correction reason",
  ข้อมูลการแข่งขัน: "Match Centre",
  "วิเคราะห์โปรแกรม ฟอร์ม และตัวเลขสำคัญก่อนจัดทีม":
    "Analyse fixtures, form, and key numbers before selecting your team",
  สถิติ: "Stats",
  "สถิติจะเปิดหลัง Gameweek แรกสิ้นสุดลง":
    "Statistics unlock after Gameweek 1 ends",
  "21–23 สิงหาคม 2026": "21–23 August 2026",
  "ศุกร์ 21 สิงหาคม": "Friday 21 August",
  ความยากโปรแกรม: "Fixture Difficulty",
  "3 เกมถัดไป": "Next 3 Fixtures",
  ง่าย: "Easy",
  กลาง: "Medium",
  ยาก: "Hard",
  ดาวซัลโว: "Top Scorer",
  แอสซิสต์สูงสุด: "Most Assists",
  คลีนชีตสูงสุด: "Most Clean Sheets",
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
  โปรไฟล์ผู้จัดการทีม: "Manager profile",
  จัดการชื่อที่ใช้แสดงและข้อมูลทีมแฟนตาซีของคุณ:
    "Manage your display name and Fantasy team details",
  "บัญชี Guest": "Guest account",
  บัญชีสมาชิก: "Member account",
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
  ชื่อทีมที่แสดงในคะแนนและตารางอันดับ:
    "The team name shown in points and standings",
  ชื่อทีม: "Team Name",
  "Guest ใช้ชื่อทีมแบบสุ่มและเปลี่ยนไม่ได้":
    "Guests use a generated team name that cannot be changed",
  ใช้สิทธิ์เปลี่ยนชื่อทีมครบแล้วสำหรับฤดูกาลนี้:
    "All team-name changes have been used for this season",
  เปลี่ยนชื่อทีมได้อีก: "Team-name changes remaining:",
  ครั้งในฤดูกาลนี้: "this season",
  บันทึกชื่อบัญชีและทีม: "Save Account & Team Names",
  "ต้องการเก็บทีมไว้ข้ามอุปกรณ์?": "Want to keep this team across devices?",
  "สมัครสมาชิกแล้วใช้ทีม Guest เดิมต่อได้":
    "Create an account and continue with this Guest team",
  เลือกภาษาที่ใช้แสดงผลให้เหมาะกับการใช้งานของคุณ:
    "Choose the display language that works for you",
  เปลี่ยนภาษาไทยและอังกฤษได้ทันที:
    "Switch between Thai and English immediately",
  "Guest จะบันทึกการตั้งค่านี้ไว้ในอุปกรณ์เครื่องนี้":
    "Guests save this preference on the current device",
  สมาชิกจะซิงก์การตั้งค่านี้กับบัญชีและอุปกรณ์อื่น:
    "Members sync this preference with their account and other devices",
  บันทึกภาษาบนอุปกรณ์เครื่องนี้แล้ว: "Language saved on this device",
  บันทึกภาษาสำหรับบัญชีนี้แล้ว: "Language saved for this account",
  "กำลังบันทึกภาษา…": "Saving language…",
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
  "ชื่อลีกต้องมี 3–40 ตัวอักษร": "League names must contain 3–40 characters",
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
  "ระดับ 1–3 มีระดับละ 3 ช่อง และระดับ 4 มี 6 ช่อง ผู้เล่นระดับต่ำกว่าสามารถใช้ช่องระดับสูงกว่าที่ว่างได้ จึงมีระดับ 1 ได้สูงสุด 3 คน ระดับ 1–2 รวมกันสูงสุด 6 คน และระดับ 1–3 รวมกันสูงสุด 9 คน ระดับมีผลเป็นราย Gameweek":
    "Tiers 1–3 have 3 slots each, and Tier 4 has 6. Lower-tier players may use an open higher-tier slot, so a squad can have at most 3 Tier 1 players, 6 players from Tiers 1–2 combined, and 9 from Tiers 1–3 combined. Tiers apply per Gameweek.",
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
  "ระดับ 1–3 มีระดับละ 3 ช่อง และระดับ 4 มี 6 ช่อง":
    "Tiers 1–3 have 3 slots each, and Tier 4 has 6 slots",
  ผู้เล่นระดับต่ำกว่าสามารถใช้ช่องระดับสูงกว่าที่ยังว่างได้:
    "A lower-tier player may use an available higher-tier slot",
  "ระดับ 1 ได้สูงสุด 3 คน ระดับ 1–2 รวมกันสูงสุด 6 คน และระดับ 1–3 รวมกันสูงสุด 9 คน":
    "A squad may have at most 3 Tier 1 players, 6 players from Tiers 1–2 combined, and 9 from Tiers 1–3 combined",
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
  "Wildcard ใช้ได้ตั้งแต่ GW2 เป็นต้นไป":
    "Wildcard is available from GW2 onward",
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

const positionLabels: Record<Language, Record<string, string>> = {
  th: {
    GK: "ผู้รักษาประตู",
    DEF: "กองหลัง",
    MID: "กองกลาง",
    FWD: "กองหน้า",
    goalkeeper: "ผู้รักษาประตู",
    defender: "กองหลัง",
    midfielder: "กองกลาง",
    forward: "กองหน้า",
  },
  en: {
    GK: "Goalkeeper",
    DEF: "Defender",
    MID: "Midfielder",
    FWD: "Forward",
    goalkeeper: "Goalkeeper",
    defender: "Defender",
    midfielder: "Midfielder",
    forward: "Forward",
  },
};

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

export function LanguageProvider({
  children,
  initialLanguage = null,
}: {
  children: ReactNode;
  initialLanguage?: Language | null;
}) {
  const [language, setLanguageState] = useState<Language>(
    initialLanguage ?? "th",
  );

  useEffect(() => {
    if (initialLanguage) {
      const frame = window.requestAnimationFrame(() =>
        setLanguageState(initialLanguage),
      );
      return () => window.cancelAnimationFrame(frame);
    }
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
  }, [initialLanguage]);

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

export function getLocalizedPositionLabel(
  position: string,
  language: Language,
) {
  return positionLabels[language][position] ?? position;
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
    if (element.props["data-localize"] === "off") return element;
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

export function LanguageSwitcher({
  disabled = false,
  describedBy,
  onValueChange,
}: {
  disabled?: boolean;
  describedBy?: string;
  onValueChange?: (language: Language) => void;
} = {}) {
  const { language, setLanguage } = useLanguage();
  return (
    <div
      className="language-switcher"
      role="radiogroup"
      aria-label="Language"
      aria-describedby={describedBy}
    >
      <label
        className={
          language === "th" ? "language-option active" : "language-option"
        }
      >
        <input
          type="radio"
          name="interface-language"
          value="th"
          checked={language === "th"}
          disabled={disabled}
          onChange={() => {
            if (language === "th" || disabled) return;
            if (onValueChange) onValueChange("th");
            else setLanguage("th");
          }}
        />
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
        <input
          type="radio"
          name="interface-language"
          value="en"
          checked={language === "en"}
          disabled={disabled}
          onChange={() => {
            if (language === "en" || disabled) return;
            if (onValueChange) onValueChange("en");
            else setLanguage("en");
          }}
        />
        <span>
          <b>EN</b>
          <small>English</small>
        </span>
      </label>
    </div>
  );
}
