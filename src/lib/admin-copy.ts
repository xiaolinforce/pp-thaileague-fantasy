export const adminFieldLabels: Record<string, string> = {
  minutes: "นาที",
  goals: "ประตู",
  sourceAssists: "Assist จากไทยลีก",
  fantasyAssists: "Fantasy Assist",
  goalsConcededWhilePlaying: "เสียประตูขณะอยู่ในสนาม",
  saves: "เซฟ",
  penaltySaves: "เซฟจุดโทษ",
  penaltyMisses: "ยิงจุดโทษพลาด",
  yellowCards: "ใบเหลือง",
  redCards: "ใบแดง",
  ownGoals: "ทำเข้าประตูตัวเอง",
  level: "ระดับ",
  tierSnapshot: "ระดับที่บันทึก",
  tierRulesVersion: "รุ่นกติกานักเตะ",
  tierSlots: "โควต้าแต่ละระดับ",
  gameweek: "Gameweek",
  gameweekId: "Gameweek ที่มีผล",
  isThai: "สถานะไทย",
  reason: "เหตุผล",
  effectiveGameweekId: "Gameweek ที่มีผล",
  status: "สถานะ",
  number: "Gameweek",
  nextGameweek: "Gameweek ถัดไป",
  kickoffAt: "เวลาแข่งขัน",
  deadlineAt: "Deadline ของ Gameweek",
  homeScore: "สกอร์เจ้าบ้าน",
  awayScore: "สกอร์ทีมเยือน",
  homePenaltyScore: "จุดโทษเจ้าบ้าน",
  awayPenaltyScore: "จุดโทษทีมเยือน",
  matchweek: "นัดที่",
  fullNameTh: "ชื่อภาษาไทย",
  fullNameEn: "ชื่อภาษาอังกฤษ",
  shortNameTh: "ชื่อย่อภาษาไทย",
  averagePoints: "คะแนนเฉลี่ย",
  highestPoints: "คะแนนสูงสุด",
};

/** Written status labels shared by admin badges and audit values. */
export const statusLabels: Record<string, string> = {
  planned: "ยังไม่เปิด",
  open: "เปิดรับจัดทีม",
  provisional: "รอตรวจคะแนน",
  final: "คะแนน Final",
  locked: "ล็อกแล้ว",
  member: "สมาชิก",
  guest: "Guest",
  bot: "Bot",
  abandoned: "Guest เก็บประวัติ",
  inactive: "ทีมไม่ใช้งาน",
  scheduled: "รอแข่งขัน",
  time_tbc: "รอยืนยันเวลาแข่งขัน",
  live: "กำลังแข่งขัน",
  finished: "จบการแข่งขัน",
  postponed: "เลื่อนการแข่งขัน",
  cancelled: "ยกเลิกการแข่งขัน",
};

export const adminTranslations: Record<string, string> = {
  เริ่มใช้กติกานักเตะสองระดับ: "Adopt two-tier player rules",
  ปรับระดับตามกติกาก่อนล็อกทีม: "Apply tier rules before locking",
  รุ่นกติกานักเตะ: "Player rule version",
  โควต้าแต่ละระดับ: "Slots by level",
  "กำลังดำเนินการ…": "Processing…",
  "กำลังส่ง…": "Sending…",
  "กำลังสร้างชุดผู้รับ…": "Creating recipient snapshot…",
  "กำลังโหลด…": "Loading…",
  "กำลังค้นหา…": "Searching…",
  แสดงข้อมูล: "View data",
  ปรับระดับนักเตะตามรายการ: "Apply tier changes",
  นำเข้าการแก้ไขจากเอกสารนักเตะ: "Apply reviewed player sheet",
  เผยแพร่ชุดจัดอันดับนักเตะ: "Publish player ranking",
  "รายการนี้ไม่มีรายละเอียดค่าก่อน–หลังที่แสดงได้":
    "No displayable before/after values were recorded for this operation.",
  "ยืนยันคะแนน Final": "Finalize scores",
  รอแข่งขัน: "Scheduled",
  กำลังแข่งขัน: "Live",
  จบการแข่งขัน: "Finished",
  เลื่อนการแข่งขัน: "Postponed",
  ยกเลิกการแข่งขัน: "Cancelled",
  บันทึกสำเร็จ: "Saved successfully",
  สถานะ: "Status",
  "Assist จากไทยลีก": "Thai League assists",
  "Fantasy Assist (เว้นว่างเพื่อใช้ต้นทาง)":
    "Fantasy assists (blank uses source)",
  เสียประตูขณะอยู่ในสนาม: "Goals conceded while playing",
  เซฟ: "Saves",
  เซฟจุดโทษ: "Penalty saves",
  ยิงจุดโทษพลาด: "Penalty misses",
  ใบเหลือง: "Yellow cards",
  ใบแดง: "Red cards",
  ทำเข้าประตูตัวเอง: "Own goals",
  บันทึกและคำนวณคะแนนใหม่: "Save and recalculate scores",
  "เหตุผล/แหล่งอ้างอิง": "Reason / reference",
  ค้นหา: "Search",
  ตำแหน่ง: "Position",
  ตัวจริง: "Starter",
  ค้นหานักเตะ: "Search players",
  สโมสร: "Club",
  "มีผลตั้งแต่ Gameweek": "Effective from Gameweek",
  บันทึกระดับและสถานะ: "Save classification",
  สถานะสัญชาติ: "Nationality status",
  "ไทย/ลูกครึ่งไทย": "Thai / Thai heritage",
  เหตุผล: "Reason",
  ภาพรวม: "Overview",
  ผู้ดูแลระบบ: "Administrator",
  ผู้เล่นและทีม: "Participants & teams",
  อีเมลเตือนจัดทีม: "Lineup reminder email",
  "เลือกกลุ่มผู้รับ ตรวจรายชื่อและเนื้อหา แล้วส่งเองทีละชุดหลังยืนยัน":
    "Choose an audience, review recipients and content, then confirm each manual batch",
  ส่งอีเมลแบบกดเอง: "Manual email delivery",
  "ไม่มี cron หรือการส่งอัตโนมัติ ต้องบันทึกชุดผู้รับ ตรวจ preview และยืนยันทีละชุดก่อนส่ง ระบบหยุดส่งเมื่อเลย Deadline":
    "No cron or automatic sends. Save the recipient snapshot, review the preview, and confirm each batch. Sending stops at the deadline.",
  "บันทึกชุดผู้รับแล้ว ตรวจจำนวนก่อนส่ง":
    "Recipient snapshot saved. Review the count before sending.",
  ชุดผู้รับนี้ถูกบันทึกไว้แล้ว: "This recipient snapshot already exists.",
  "สร้างชุดผู้รับไม่สำเร็จ ตรวจสถานะ Gameweek และลองใหม่":
    "Could not create the snapshot. Check the Gameweek and try again.",
  "ส่งชุดย่อยเสร็จแล้ว ตรวจสถานะก่อนส่งชุดถัดไป":
    "Batch finished. Review its status before sending the next batch.",
  "ผู้ให้บริการจำกัดอัตราส่ง รอตรวจโควตาก่อนกดส่งอีกครั้ง":
    "Provider rate limit reached. Check quota before sending again.",
  "ผลการส่งไม่แน่ชัด หยุดส่งชุดนี้และตรวจผู้ให้บริการก่อน":
    "Sending outcome is uncertain. Stop and check the provider first.",
  ไม่มีผู้รับที่รอส่งในชุดนี้: "No pending recipients remain in this campaign.",
  "ส่งไม่สำเร็จ ตรวจสถานะและผู้ให้บริการก่อนลองอีกครั้ง":
    "Sending failed. Review the campaign and provider before trying again.",
  "ย้ายรายการที่ค้างเป็นสถานะไม่แน่ชัดแล้ว ห้ามส่งซ้ำโดยไม่ตรวจผู้ให้บริการ":
    "Stale claims are now uncertain. Do not resend without checking the provider.",
  "Resend รับอีเมลทดสอบแล้ว ตรวจกล่องจดหมายและลิงก์ยกเลิกก่อนส่งจริง":
    "Resend accepted the test email. Check your inbox and unsubscribe link before the live send.",
  "ผลทดสอบไม่แน่ชัด ตรวจ Resend ก่อนลองอีกครั้ง เพื่อป้องกันอีเมลซ้ำ":
    "The test outcome is uncertain. Check Resend before retrying to avoid duplicates.",
  "ส่งอีเมลทดสอบไม่สำเร็จ ตรวจ Resend และการตั้งค่าก่อนส่งจริง":
    "The test email failed. Check Resend and configuration before the live send.",
  ทดสอบส่งถึงผู้ดูแล: "Send an administrator test",
  "ส่งอีเมลจริงไปยังที่อยู่ที่ยืนยันแล้วของบัญชีผู้ดูแลที่ล็อกอินอยู่ ไม่สร้างชุดผู้รับและไม่ส่งถึงสมาชิก":
    "Sends a real email to the signed-in administrator's verified address. It does not create a recipient snapshot or send to members.",
  ส่งอีเมลทดสอบให้ตัวเอง: "Send a test email to myself",
  คำขอไม่ถูกต้อง: "Invalid request.",
  "บันทึกทีมครบใน GW ก่อนหน้า แต่ยังไม่บันทึก GW นี้":
    "Saved a complete squad in the previous GW, but not this GW",
  "เฉพาะสมาชิกที่กดบันทึกทีมครบ 15 คนใน Gameweek ก่อนหน้า และยังไม่ได้กดบันทึกทีมของ Gameweek ที่จะเตือน":
    "Members who explicitly saved a complete 15-player squad in the previous Gameweek and have not saved their team for the target Gameweek.",
  ยกเลิกการแจ้งเตือน: "Unsubscribed",
  ถูกระงับการส่ง: "Suppressed",
  ชุดส่งอีเมล: "Email campaign",
  "รายชื่อถูกตรึงไว้ตอนสร้างชุดส่ง แต่ระบบจะตรวจสิทธิ์ อีเมล การยกเลิก และการบันทึกทีมซ้ำก่อนส่งแต่ละฉบับ":
    "Recipients are frozen at snapshot time. Eligibility, email, unsubscribe state, and team save are checked again before each send.",
  "มีผลไม่แน่ชัด ต้องตรวจ Resend และให้ผู้ดูแลแก้ไขสถานะก่อนส่งต่อ":
    "An uncertain result requires Resend review and an administrator's status correction before sending continues.",
  การส่งยังปิดอยู่: "Sending is disabled",
  "ส่ง 5 รายถัดไป": "Send next 5 recipients",
  "หากค้างเกิน 2 นาที ให้ตรวจ Resend ก่อน แล้วทำเครื่องหมายเป็น":
    "If a claim remains for over 2 minutes, check Resend first, then mark it as",
  รายการนี้จะไม่ถูกส่งซ้ำ:
    "These recipients will not be retried automatically.",
  ทำเครื่องหมายรายการค้าง: "Mark stale claims uncertain",
  "จะบันทึกเฉพาะผู้รับที่ตรงเงื่อนไขตอนนี้ โดยไม่เก็บอีเมลเต็มในชุดส่ง":
    "Only currently eligible recipients will be saved. The campaign does not store full email addresses.",
  สร้างชุดผู้รับ: "Create recipient snapshot",
  "Gameweek นี้ยังไม่เปิดหรือเลย Deadline แล้ว จึงสร้างชุดส่งไม่ได้":
    "This Gameweek is not open or its deadline has passed, so no campaign can be created.",
  "เลือกกลุ่มผู้รับจากข้อมูลสมาชิก แล้วตรวจรายชื่อและเนื้อหาก่อนเปิดการส่งจริง":
    "Select an audience from member data, then review recipients and content before delivery is enabled",
  "Phase 2 · ตรวจสอบเท่านั้น": "Phase 2 · Review only",
  "หน้านี้ไม่มีคำสั่งส่งอีเมลและไม่บันทึกการเปลี่ยนแปลง สถานะยกเลิกการแจ้งเตือนและ suppression ของผู้ให้บริการต้องนำมาคัดออกก่อนเปิดส่งใน Phase 3":
    "This page cannot send email or save changes. Unsubscribe state and provider suppressions must be excluded before delivery is enabled in Phase 3.",
  กำหนดผู้รับ: "Define audience",
  "ข้อมูลอัปเดตเมื่อเปิดหน้าหรือเปลี่ยนตัวเลือก · ตรวจล่าสุด":
    "Data refreshes when the page opens or a selection changes · Last checked",
  "อ่านจาก DATABASE_URL ของ deployment นี้ ให้ตรวจป้าย environment ก่อนใช้จำนวนผู้รับจริง":
    "Reads from this deployment's DATABASE_URL. Check the environment label before using the recipient count.",
  "Gameweek ที่จะเตือน": "Reminder Gameweek",
  กลุ่มผู้รับ: "Audience",
  "บันทึกทีมครบใน GW ก่อนหน้า": "Saved a complete squad in the previous GW",
  "เคยบันทึกทีมครบอย่างน้อยหนึ่ง GW":
    "Saved a complete squad in at least one GW",
  สมาชิกทุกคนที่มีทีม: "All members with a team",
  "เฉพาะสมาชิกที่กดบันทึกทีมครบ 15 คนใน Gameweek ก่อนหน้า เหมาะสำหรับการเตือนผู้เล่นที่เพิ่งมีส่วนร่วม":
    "Only members who explicitly saved a complete 15-player squad in the previous Gameweek; suited to recently engaged players.",
  "สมาชิกที่เคยกดบันทึกทีมครบ 15 คนในฤดูกาลนี้ แม้ไม่ได้บันทึกซ้ำใน Gameweek ก่อนหน้า":
    "Members who saved a complete 15-player squad this season, even if they did not save again in the previous Gameweek.",
  "สมาชิกที่มีทีมใช้งานอยู่ทั้งหมด รวมทีมที่ยังจัดไม่ครบ แต่ไม่รวม Guest, Bot และอีเมลที่ยังไม่ยืนยัน":
    "All members with an active team, including incomplete squads, excluding Guests, bots and unverified email addresses.",
  "เงื่อนไขเฉพาะที่สั่งผ่านแชทต้องสร้างเป็น recipient snapshot แยก และกลับมาตรวจจำนวนอีกครั้งก่อนส่ง":
    "Custom criteria requested in chat must produce a separate recipient snapshot and be reviewed again before sending.",
  สมาชิกที่มีทีมใช้งาน: "Members with an active team",
  อีเมลสมาชิกที่ยืนยันแล้ว: "Verified member email",
  อยู่ในกลุ่มที่เลือก: "Matches selected audience",
  อีเมลยังไม่พร้อม: "Email unavailable",
  ไม่ตรงเงื่อนไขกลุ่ม: "Outside selected audience",
  "กลุ่ม “GW ก่อนหน้า” อ้างอิง": "The “previous GW” audience uses",
  และนับเฉพาะการกดบันทึกทีมครบ: "and only counts an explicitly saved",
  "คน ไม่รวมการยกทีมอัตโนมัติ": "player squad, excluding automatic carryover",
  "Gameweek ที่เลือกยังไม่มี Gameweek ก่อนหน้า กลุ่มที่อ้างอิง GW ก่อนหน้าจึงไม่มีผู้รับ":
    "The selected Gameweek has no previous Gameweek, so previous-GW audiences have no recipients.",
  "รายชื่อที่จะเข้า recipient snapshot": "Recipient snapshot candidates",
  "แสดงสูงสุด 50 ทีม อีเมลถูก mask และไม่มีอีเมลเต็มส่งมาที่ browser":
    "Shows up to 50 teams. Addresses are masked and full email addresses are never sent to the browser.",
  รายชื่อผู้รับอีเมลเตือน: "Lineup reminder recipients",
  อีเมล: "Email",
  "GW ก่อนหน้า": "Previous GW",
  กดบันทึกแล้ว: "Explicitly saved",
  ไม่ได้กดบันทึก: "Not explicitly saved",
  ไม่พบสมาชิกที่ตรงเงื่อนไขกลุ่มนี้: "No members match this audience.",
  "Preview เนื้อหาอีเมล": "Email content preview",
  "แสดงข้อความที่จะใช้กับทุกคนในกลุ่ม โดยไม่เปิดเผยอีเมลเต็ม":
    "Shows the message for everyone in this audience without exposing full email addresses.",
  ตัวอย่างอีเมลเตือนจัดทีมสองภาษา: "Bilingual lineup reminder email preview",
  "ลิงก์ยกเลิกใน preview เป็น placeholder และจะสร้างแยกสำหรับผู้รับแต่ละคนก่อนเปิดส่งจริง":
    "The preview unsubscribe link is a placeholder and will be generated per recipient before delivery is enabled.",
  "ยังไม่มี Gameweek สำหรับสร้าง preview":
    "No Gameweek is available for an email preview.",
  ผลการแข่งขันและสถิติ: "Matches & stats",
  ข้อมูลนักเตะ: "Player data",
  ประวัติการแก้ไข: "Audit history",
  กลับโหมดผู้เล่น: "Back to player mode",
  "ติดตามผู้เล่นและงานที่ต้องจัดการในฤดูกาล 2026/27":
    "Track participants and operations for the 2026/27 season",
  ดูข้อมูล: "View data",
  ทีมทั้งหมด: "All teams",
  ทีมสมาชิก: "Member teams",
  "ทีม Guest": "Guest teams",
  "ทีม Bot": "Bot teams",
  "มีการจัดทีมใน 7 วัน": "Team activity in 7 days",
  "จัดครบ 15 คน": "15-player squads",
  "ยังไม่ครบ / ทีมไม่ใช้งาน": "Incomplete / inactive teams",
  "Guest เก็บประวัติ": "Preserved Guest teams",
  "นับเป็นทีมในฤดูกาล ไม่ใช่จำนวนคนไม่ซ้ำ กิจกรรม 7 วันนับการบันทึกหรือย้อนการจัดทีมของสมาชิกและ Guest ไม่รวม Bot และการยกทีมอัตโนมัติ":
    "Counts represent season teams, not unique people. Seven-day activity counts member and Guest saves or reverts, excluding bots and automatic carryover.",
  "จัดครบ 15 คนนับรวมทีมที่ยกมาจาก GW ก่อนหน้า ไม่ได้หมายถึงเข้ามาเล่นล่าสุดหรือผ่านการตรวจทุกกติกา":
    "15-player squads include automatic carryover. This does not imply recent activity or validation against every squad rule.",
  งานรอดำเนินการ: "Pending operations",
  "จัดการ Gameweek": "Manage Gameweek",
  "ไม่มี Gameweek ที่รอดำเนินการ": "No Gameweeks need attention",
  ตรวจข้อมูลการแข่งขัน: "Review match data",
  "เลือกคู่แข่งขันเพื่อตรวจสถิติและแก้ไขคะแนน หรือทบทวนประวัติการเปลี่ยนแปลง":
    "Select a match to review stats and correct scores, or inspect the change history.",
  "ค้นหาทีมและดูการมีส่วนร่วม แยกสมาชิก Guest และ Bot":
    "Find teams and review participation by members, Guests and bots",
  ค้นหาชื่อทีม: "Search team names",
  ประเภททีม: "Team type",
  ทุกประเภท: "All types",
  การจัดทีม: "Squad activity",
  ทีมไม่ใช้งาน: "Inactive team",
  รายชื่อทีม: "Team list",
  "คะแนน GW": "GW points",
  บันทึกทีมล่าสุด: "Last team save",
  ล้างตัวกรอง: "Clear filters",
  "กิจกรรมล่าสุดนับการบันทึกและย้อนการจัดทีม ไม่ใช่การเข้าชมเว็บ จำนวนทีมไม่ใช่จำนวนคนไม่ซ้ำ":
    "Recent activity counts team saves and reverts, not page visits. Team counts do not represent unique people.",
  รายละเอียดทีม: "Team details",
  "ตรวจทีมที่บันทึกไว้และคะแนนใน Gameweek ที่เลือก":
    "Inspect saved squads and scores for the selected Gameweek",
  กลับรายชื่อทีม: "Back to teams",
  ดูคะแนนนักเตะ: "View player points",
  คะแนนนักเตะในทีม: "Team player points",
  กลับรายละเอียดทีม: "Back to team details",
  "Gameweek นี้ยังไม่เริ่มคำนวณคะแนน":
    "Scoring has not started for this Gameweek yet.",
  คะแนนรวมฤดูกาล: "Season points",
  ระดับที่บันทึก: "Saved tier",
  บทบาทในทีม: "Squad role",
  "ยังไม่มีนักเตะที่บันทึกใน Gameweek นี้": "No saved squad for this Gameweek",
  "ตรวจสถานะและ Deadline ก่อนล็อกทีม หรือยืนยันคะแนน Final":
    "Review status and deadlines before locking squads or finalizing scores",
  "Deadline (เวลาไทย)": "Deadline (Bangkok time)",
  คะแนนเฉลี่ย: "Average points",
  คะแนนสูงสุด: "Highest points",
  ล็อกทีมและปิดรับจัดทีม: "Lock squads and close entries",
  "การล็อกมีผลกับทุกทีม และเปิด Gameweek ถัดไปหากยังไม่จบฤดูกาล":
    "Locking affects every team and opens the next Gameweek unless the season has ended.",
  ตรวจสถิติและการแก้ไขทั้งหมดก่อนยืนยันคะแนน:
    "Review all match stats and corrections before finalizing scores.",
  "Gameweek นี้ยืนยันคะแนนแล้ว": "This Gameweek is finalized",
  "ยังไม่มีการดำเนินการที่พร้อมสำหรับ Gameweek นี้":
    "No operation is available for this Gameweek yet",
  "Gameweek ทั้งฤดูกาล": "Season Gameweeks",
  ยังไม่เปิด: "Planned",
  เปิดรับจัดทีม: "Open for squad changes",
  รอตรวจคะแนน: "Provisional scores",
  "คะแนน Final": "Final scores",
  ล็อกแล้ว: "Locked",
  "เลือก Gameweek คู่แข่งขัน และนักเตะ แล้วตรวจค่าปัจจุบันก่อนบันทึกและคำนวณคะแนนใหม่":
    "Select a Gameweek, match and player, then review the current values before saving and recalculating scores",
  นักเตะในคู่แข่งขัน: "Match players",
  โหลดสถิติ: "Load stats",
  "ยังไม่มีสถิติที่บันทึกไว้ ระบบจะสร้างรายการใหม่":
    "No stats have been saved. Saving will create a new record.",
  "ยังไม่มีการแข่งขันหรือนักเตะใน Gameweek นี้":
    "No matches or players for this Gameweek",
  "ค้นหานักเตะและกำหนดระดับหรือสถานะไทย ตั้งแต่ Gameweek ที่เลือก":
    "Find players and set their tier for the selected Gameweek or update Thai status",
  เหตุผลและแหล่งอ้างอิงสำหรับการเปลี่ยนแปลง:
    "Reason and reference for this change",
  ไม่พบนักเตะที่ตรงกับตัวกรอง: "No players match these filters",
  โหลดข้อมูล: "Load data",
  ทุกระดับ: "All tiers",
  "ตรวจรายการที่บันทึกไว้ ผู้ดำเนินการ เหตุผล และค่าก่อน–หลัง":
    "Review recorded operations, operators, reasons and before/after values",
  การดำเนินการ: "Operation",
  บันทึกสถิติใหม่: "Create match stats",
  แก้ไขสถิติ: "Correct match stats",
  ปรับระดับและสถานะ: "Update classification",
  "ล็อก Gameweek": "Lock Gameweek",
  "สร้างทีม Bot": "Create bot team",
  ผู้ดำเนินการ: "Operator",
  รายการที่แก้ไข: "Affected record",
  "แสดงเฉพาะประวัติที่ระบบบันทึกไว้ การล็อกและ Final ก่อนเริ่มเก็บประวัติจะไม่ปรากฏ":
    "Only recorded operations are shown. Locks and finalizations performed before audit collection are not available.",
  ยังไม่มีประวัติในตัวกรองนี้: "No history matches this filter",
  ไม่พบข้อมูลที่ตรงกับตัวกรอง: "No results match these filters",
  ยังไม่มีข้อมูล: "No data yet",
  แบ่งหน้า: "Pagination",
  หน้า: "Page",
  ก่อนหน้า: "Previous",
  ถัดไป: "Next",
  "บันทึกไม่สำเร็จ ตรวจสอบข้อมูลและสถานะล่าสุดก่อนลองอีกครั้ง":
    "Could not save. Review the data and current status before trying again.",
  กลับไปตรวจสอบ: "Review again",
  ยืนยันการบันทึก: "Confirm save",
  สถานะไทย: "Thai status",
  "Gameweek ที่มีผล": "Effective Gameweek",
  "Gameweek ถัดไป": "Next Gameweek",
  "ข้อมูลที่แก้ไขจะหายไป หากออกจากหน้านี้โดยไม่บันทึก":
    "Your changes will be lost if you leave this page without saving.",
  ทีมที่ดีที่สุด: "Best possible team",
  ทีมคะแนนสูงสุดที่เป็นไปได้: "Best possible scoring team",
  "ดูการจัดทีมที่ถูกกติกาและทำคะแนนได้สูงสุดจากผลจริงของแต่ละ Gameweek":
    "See the highest-scoring legal lineup from each Gameweek's actual results",
  "จะแสดงทีมที่ดีที่สุดหลัง Gameweek นี้ปิดและเริ่มคำนวณคะแนนแล้ว":
    "The best team appears after this Gameweek closes and scoring begins.",
  "ยังไม่มีผลทีมที่ดีที่สุดที่บันทึกไว้สำหรับ Gameweek นี้":
    "No saved best-team result is available for this Gameweek yet.",
  "ไม่พบ snapshot รายชื่อนักเตะของ Gameweek นี้ จึงยังคำนวณทีมย้อนหลังไม่ได้":
    "No player-pool snapshot exists for this Gameweek, so a historical team cannot be calculated.",
  "ยังไม่มีผลคะแนนนักเตะสำหรับ Gameweek นี้":
    "No player scores are available for this Gameweek yet.",
  "ไม่สามารถจัดทีมครบตามกติกาจากรายชื่อนักเตะของ Gameweek นี้":
    "A complete legal team cannot be built from this Gameweek's player pool.",
  "ไม่พบ Gameweek สำหรับคำนวณ": "No Gameweek is available to calculate.",
  "ไม่พบ Gameweek สำหรับแสดงผล": "No Gameweek is available to display.",
  สรุปคะแนน: "Score summary",
  คะแนนสูงสุดที่เป็นไปได้: "Best possible score",
  คะแนนสูงสุดของทีมจริง: "Highest manager score",
  ส่วนต่าง: "Difference",
  "ทีมสมมติ · ไม่ใช้ Chip · ไม่คิดคะแนนหัก Transfer":
    "Hypothetical team · No chip · No transfer deductions",
  คำนวณใหม่จากคะแนนปัจจุบัน: "Recalculated from current scores",
  อ่านจากผลที่บันทึกไว้: "Loaded from the saved result",
  อัปเดตเมื่อมีการคำนวณคะแนนใหม่: "Updated when scores are recalculated",
  รายชื่อนักเตะ: "Player pool",
  คน: "players",
  แหล่งข้อมูล: "Source",
  "สร้าง snapshot รายชื่อนักเตะย้อนหลัง": "Backfill player-pool snapshot",
  // Admin workspace UX pass (2026-11-21)
  ทีมคะแนนสูงสุด: "Best possible team",
  ช่องข้อมูล: "Field",
  ค่าเดิม: "Before",
  ค่าใหม่: "After",
  "ไม่มีค่าที่เปลี่ยน ระบบจะบันทึกเป็นการตรวจซ้ำพร้อมเหตุผล":
    "Nothing changed. This will be saved as a re-review with the reason.",
  มุมมองทีม: "Team views",
  "งานที่ต้องจัดการและภาพรวมผู้เล่นในฤดูกาล 2026/27":
    "Tasks to handle and participation for the 2026/27 season",
  "ตรวจสถิติของ Gameweek ที่ค้างและยืนยันคะแนน Final ให้เรียงตามลำดับ":
    "Review the pending Gameweek's stats and finalize Gameweeks in order.",
  "รอตรวจสถิติให้ครบแล้วยืนยันคะแนน Final":
    "Review all stats, then finalize scores",
  ส่งอีเมลเตือน: "Send reminder",
  ไปหน้าล็อกทีม: "Go to locking",
  ตรวจสถิติ: "Review stats",
  "ไปหน้ายืนยัน Final": "Go to finalizing",
  "นับเป็นทีม ไม่ใช่จำนวนคนไม่ซ้ำ · กิจกรรม 7 วันนับการบันทึกหรือย้อนการจัดทีมของสมาชิกและ Guest ไม่รวม Bot · จัดครบ 15 คนรวมทีมที่ยกมาจาก GW ก่อนหน้า":
    "Counts are teams, not unique people · 7-day activity counts member and Guest saves or reverts, excluding bots · Complete squads include teams carried over from the previous GW",
  "ขั้นตอนของ Gameweek": "Gameweek lifecycle",
  แมตช์ที่จบแล้ว: "Finished matches",
  แมตช์ที่มีสถิติ: "Matches with stats",
  "ตรวจสถิติที่ค้างของ Gameweek นี้ แล้วยืนยันคะแนน Final":
    "Review this Gameweek's pending stats, then finalize scores.",
  "ถ้าล็อกตอนนี้ ผู้เล่นจะแก้ทีมไม่ได้ทันที แม้ยังไม่ถึง Deadline":
    "Locking now stops managers from editing immediately, before the deadline.",
  "แมตช์ที่เลื่อนหรือยังไม่แข่งจะไม่มีคะแนนใน Final":
    "Postponed or unplayed matches will not score in the final result.",
  ไปตรวจสถิติการแข่งขัน: "Review match stats",
  การลงเล่นและเกมรุก: "Appearance and attack",
  เกมรับ: "Defence",
  วินัยและอื่นๆ: "Discipline and other",
  เว้นว่างเพื่อใช้ค่าจากไทยลีก: "Leave blank to use the Thai League value",
  นับคะแนนเฉพาะผู้รักษาประตู: "Scores for goalkeepers only",
  "เลือกคู่แข่งขัน แล้วเลือกนักเตะจากรายชื่อเพื่อตรวจและแก้ไขสถิติ":
    "Choose a match, then choose a player from the roster to review and edit stats",
  เลือกการแข่งขัน: "Choose a match",
  การแข่งขันนี้ยังไม่จบ: "This match has not finished",
  ยังไม่มีสถิติที่บันทึกไว้: "No stats saved yet",
  ยังไม่มีสถิติ: "No stats yet",
  ไม่พบนักเตะที่ลงทะเบียนกับสองสโมสรนี้:
    "No players are registered with these clubs.",
  แก้ไขล่าสุด: "Last edited",
  "ตรวจสถานะการแข่งขันก่อนบันทึกสถิติ คะแนนจะถูกคำนวณใหม่ทันที":
    "Check the match status before saving. Scores are recalculated immediately.",
  ระบบจะสร้างรายการใหม่เมื่อบันทึก: "A new record is created when you save.",
  เลือกนักเตะจากรายชื่อเพื่อตรวจและแก้ไขสถิติของแมตช์นี้:
    "Choose a player from the roster to review and edit this match's stats.",
  "ยังไม่มีการแข่งขันใน Gameweek นี้": "No matches in this Gameweek yet.",
  สำรองผู้รักษาประตู: "Bench goalkeeper",
  "กัปตัน (C)": "Captain (C)",
  "รองกัปตัน (VC)": "Vice-captain (VC)",
  เรียงตาม: "Sort by",
  "ประเภท (สมาชิกก่อน)": "Type (members first)",
  คะแนนรวมสูงสุด: "Highest season points",
  "กิจกรรมล่าสุดนับการบันทึกและย้อนการจัดทีม ไม่ใช่การเข้าชมเว็บ · จำนวนทีมไม่ใช่จำนวนคนไม่ซ้ำ":
    "Recent activity counts squad saves and reverts, not visits · Counts are teams, not unique people",
  "ค้นหานักเตะ แล้วเลือกจากตารางเพื่อกำหนดระดับหรือสถานะไทย":
    "Search for a player, then choose one from the table to set level or Thai status",
  ตัวกรองนักเตะ: "Player filters",
  ชื่อไทยหรืออังกฤษ: "Thai or English name",
  แก้ไขระดับและสถานะ: "Edit level and status",
  เลือกนักเตะจากตารางเพื่อดูและแก้ไขระดับหรือสถานะไทย:
    "Choose a player from the table to review and edit level or Thai status.",
  "เว็บไซต์จริง · อีเมลจะถึงผู้เล่นจริง":
    "Production site · Email reaches real managers",
  "สภาพแวดล้อมทดสอบ · ไม่ใช่เว็บไซต์จริง":
    "Test environment · Not the production site",
  "ไม่มีการส่งอัตโนมัติ ต้องสร้างชุดผู้รับ ตรวจตัวอย่าง และยืนยันทีละชุดก่อนส่ง ระบบหยุดส่งเมื่อเลย Deadline":
    "Nothing is sent automatically. Create a recipient snapshot, review the preview, and confirm each batch. Sending stops at the deadline.",
  ตรวจล่าสุด: "Checked",
  "ตัวเลขอ่านจากฐานข้อมูลของเว็บไซต์นี้ ตรวจป้ายด้านบนก่อนส่ง":
    "Counts come from this site's database; check the banner above before sending",
  ตรวจรายชื่อผู้รับ: "Review recipients",
  ตัวอย่างอีเมล: "Email preview",
  ข้อความเดียวกันนี้ใช้กับทุกคนในกลุ่ม:
    "Everyone in the group receives this same message",
  หัวเรื่อง: "Subject",
  ข้อความในกล่องจดหมาย: "Inbox preview",
  "ลิงก์ยกเลิกในตัวอย่างใช้ไม่ได้จริง ระบบสร้างลิงก์แยกให้ผู้รับแต่ละคนตอนส่ง":
    "The unsubscribe link in the preview is a placeholder; each recipient gets their own link when sent.",
  "ยังไม่มี Gameweek สำหรับสร้างตัวอย่าง":
    "No Gameweek is available for a preview yet.",
  "ทดสอบส่งถึงตัวเอง (ไม่บังคับ)": "Send yourself a test (optional)",
  "ส่งหนึ่งฉบับไปยังอีเมลที่ยืนยันแล้วของบัญชีผู้ดูแลที่ล็อกอินอยู่ ไม่สร้างชุดผู้รับและไม่ส่งถึงสมาชิก":
    "Sends one email to the signed-in admin's verified address. No snapshot is created and no member is emailed.",
  สร้างชุดผู้รับและส่ง: "Create snapshot and send",
  มีผลไม่แน่ชัด: "Some results are uncertain",
  "ต้องตรวจ Resend และให้ผู้ดูแลแก้ไขสถานะก่อนส่งต่อ":
    "Check Resend and resolve the status before sending more.",
  มีรายการค้างสถานะกำลังส่ง: "Some emails are stuck in sending",
  "หากค้างเกิน 2 นาที ให้ตรวจ Resend ก่อน แล้วทำเครื่องหมายเป็น “ผลไม่แน่ชัด” รายการนี้จะไม่ถูกส่งซ้ำ":
    "If stuck for more than 2 minutes, check Resend, then mark them “uncertain”. They will not be sent again.",
  แก้ไขเวลาแข่งขัน: "Correct kickoff time",
  ตรวจการแก้ไขเวลาแข่งขัน: "Verify kickoff correction",
  เลื่อนเวลาแข่งขัน: "Reschedule match",
  ปรับตารางแข่งขันเสร็จสิ้น: "Complete fixture reschedule",
  "ปรับ Deadline ของ Gameweek": "Reschedule Gameweek deadline",
  บันทึกจบการแข่งขัน: "Mark match finished",
  แก้ไขผลการแข่งขัน: "Correct match result",
  "นำเข้าสถิติทั้ง Gameweek": "Import Gameweek stats",
  นำเข้าสถิติแมตช์เสร็จสิ้น: "Complete match import",
  แก้ไขชื่อภาษาไทยของนักเตะ: "Correct player Thai name",
  เปิดให้เลือกนักเตะ: "Activate Fantasy player",
  "ใช้สถานการณ์ทดสอบ (QA)": "Apply QA scenario",
  "จำลองการหักคะแนน Transfer (ทดสอบ)": "Simulate transfer deduction (test)",
  "ปรับข้อมูลตรวจสอบ migration": "Reconcile migration checksum",
  สถิตินักเตะ: "Player stats",
  "ฤดูกาล Fantasy": "Fantasy season",
  ระบบภายใน: "Internal system",
  "แสดงเฉพาะประวัติที่ระบบบันทึกไว้ การล็อกและ Final ก่อนเริ่มเก็บประวัติจะไม่ปรากฏ · รายการต่อเนื่องจากการทำงานชุดเดียวกันจะรวมเป็นกลุ่ม":
    "Only recorded history is shown; locks and finals before history began do not appear · Consecutive entries from one operation are grouped",
  เวลาแข่งขัน: "Kickoff",
  "Deadline ของ Gameweek": "Gameweek deadline",
  สกอร์เจ้าบ้าน: "Home score",
  สกอร์ทีมเยือน: "Away score",
  จุดโทษเจ้าบ้าน: "Home penalties",
  จุดโทษทีมเยือน: "Away penalties",
  นัดที่: "Matchweek",
  ชื่อภาษาไทย: "Thai name",
  ชื่อภาษาอังกฤษ: "English name",
  ชื่อย่อภาษาไทย: "Short Thai name",
  รอยืนยันเวลาแข่งขัน: "Kickoff time TBC",
  // Admin-only overrides of broader player-facing dictionary words.
  การแข่งขัน: "Match",
  นักเตะ: "Player",
  นาที: "Minutes",
  ทุกสโมสร: "All clubs",
  ทุกตำแหน่ง: "All positions",
};
