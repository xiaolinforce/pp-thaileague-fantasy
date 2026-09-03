import type { InterfaceLanguage } from "@/lib/auth/preferences";

import { CLEAN_SHEET_POINTS, GOAL_POINTS } from "./scoring";
import { getCumulativeTierLimits, THAI_LEAGUE_FANTASY_RULES } from "./rules";

export type FantasyRuleSection = {
  id: string;
  title: string;
  summary: string;
  points: string[];
};

export function buildFantasyRuleSections(
  language: InterfaceLanguage,
): FantasyRuleSection[] {
  const rules = THAI_LEAGUE_FANTASY_RULES;
  const tiers = getCumulativeTierLimits(rules);

  if (language === "en") {
    return [
      {
        id: "squad",
        title: "Squad selection",
        summary:
          "Build a complete squad and a valid starting eleven before the deadline.",
        points: [
          `Select ${rules.squadSize} players: ${rules.positionLimits.goalkeeper} goalkeepers, ${rules.positionLimits.defender} defenders, ${rules.positionLimits.midfielder} midfielders, and ${rules.positionLimits.forward} forwards.`,
          `The starting XI needs ${rules.minimumStarters.goalkeeper} goalkeeper, at least ${rules.minimumStarters.defender} defenders, ${rules.minimumStarters.midfielder} midfielders, and ${rules.minimumStarters.forward} forward.`,
          `Select at most ${rules.sameClubLimit} players from one club and ${rules.foreignPlayerLimit} foreign players.`,
          "Auto-fill keeps existing picks and their current starter or substitute roles, fills only vacant slots, targets three players in each of Levels 1–3, prefers likely first-choice goalkeepers, and then fills as many foreign-player slots as possible. It does not use projected points or overall rank.",
          "Auto-fill never changes the current formation or bench order. When starter and substitute slots for the same position are both vacant, the better-tier new player fills the starter slot first.",
          "When captaincy is missing, auto-fill preserves any existing role and fills only the missing role from the best remaining tier, preferring forwards, midfielders, defenders, then goalkeepers.",
          "Choose one captain and one vice-captain from the starting eleven. Manual starter/bench swaps transfer the role to the incoming starter.",
        ],
      },
      {
        id: "tiers",
        title: "Player tiers",
        summary:
          "Tier limits keep squad construction balanced across the player pool.",
        points: [
          `Nominal tier slots are ${rules.tierSlots.map((tier) => `${tier.slots} for Level ${tier.level}`).join(", ")}.`,
          `Cumulative limits are ${tiers.map((tier) => `${tier.limit} players through Level ${tier.level}`).join(", ")}.`,
          "A lower-tier player may use an available higher-tier slot, but a higher-tier player cannot overflow into a lower-tier slot.",
          "Tiers are effective by Gameweek so later classification changes do not rewrite historical squads.",
        ],
      },
      {
        id: "transfers",
        title: "Transfers and deadline",
        summary:
          "Confirm or reverse squad changes before the first fixture closes the Gameweek.",
        points: [
          `Receive ${rules.weeklyFreeTransfers} free transfers after each deadline and bank up to ${rules.maximumFreeTransfers}.`,
          `Each net transfer beyond the free allowance costs ${rules.transferPointCost} points.`,
          `You may confirm at most ${rules.maximumChargeableTransfers} chargeable transfers in one Gameweek, for a maximum deduction of ${rules.maximumChargeableTransfers * rules.transferPointCost} points.`,
          "A team's first complete saved squad is free, even if earlier Gameweeks carried an incomplete draft.",
          "The deadline is 90 minutes before the first kickoff. Confirmed pre-deadline changes can be reversed until then.",
          "Wildcard transfers are free and preserve the free-transfer balance held before settlement.",
        ],
      },
      {
        id: "chips",
        title: "Chips",
        summary: "Use one tactical chip in a Gameweek when uses remain.",
        points: [
          `Triple Captain, Bench Boost, and Wildcard can each be used ${rules.chipUsesPerSeason} times per season.`,
          "Only one chip may be active in a Gameweek, and the same chip may be used in consecutive Gameweeks.",
          `Wildcard is available from Gameweek ${rules.wildcardStartGameweek}.`,
          "A chip can be cancelled before the deadline. Triple Captain multiplies the scoring captain by three; Bench Boost counts all 15 players.",
        ],
      },
      {
        id: "scoring",
        title: "Scoring",
        summary:
          "Points come only from reviewed match facts stored for the competition.",
        points: [
          `Goal points are ${GOAL_POINTS.goalkeeper} for goalkeepers, ${GOAL_POINTS.defender} for defenders, ${GOAL_POINTS.midfielder} for midfielders, and ${GOAL_POINTS.forward} for forwards. Every assist is worth 3 points.`,
          `A 60+ minute clean sheet is worth ${CLEAN_SHEET_POINTS.goalkeeper}/${CLEAN_SHEET_POINTS.defender}/${CLEAN_SHEET_POINTS.midfielder}/${CLEAN_SHEET_POINTS.forward} points for GK/DEF/MID/FWD.`,
          "Appearances, saves, penalties, cards, goals conceded while playing, and own goals are included. Bonus/BPS and Defensive Contributions are not used.",
          "A dismissed player is not charged for goals conceded after leaving the pitch.",
        ],
      },
      {
        id: "results",
        title: "Postponed matches and rankings",
        summary:
          "Historical results remain inspectable when match facts arrive or change later.",
        points: [
          "A postponed match scores back into its original Gameweek.",
          "Auto-subs, captaincy, chips, and rankings are recalculated after a score update.",
          "Classic leagues rank by total points, then fewer counted transfers, then team name. Wildcard transfers are excluded from the tiebreaker.",
          "Club, position, tier, and Thai-player status are snapshotted for each selection so current data cannot rewrite earlier results.",
        ],
      },
    ];
  }

  return [
    {
      id: "squad",
      title: "การจัดทีม",
      summary: "จัดทีมให้ครบและเลือกตัวจริงที่ถูกต้องก่อนถึง Deadline",
      points: [
        `เลือกนักเตะ ${rules.squadSize} คน: ผู้รักษาประตู ${rules.positionLimits.goalkeeper} กองหลัง ${rules.positionLimits.defender} กองกลาง ${rules.positionLimits.midfielder} และกองหน้า ${rules.positionLimits.forward} คน`,
        `ตัวจริง 11 คนต้องมีผู้รักษาประตู ${rules.minimumStarters.goalkeeper} คน กองหลังอย่างน้อย ${rules.minimumStarters.defender} คน กองกลาง ${rules.minimumStarters.midfielder} คน และกองหน้า ${rules.minimumStarters.forward} คน`,
        `เลือกนักเตะจากสโมสรเดียวกันได้สูงสุด ${rules.sameClubLimit} คน และมีนักเตะต่างชาติได้สูงสุด ${rules.foreignPlayerLimit} คน`,
        "จัดตัวอัตโนมัติจะเก็บนักเตะที่เลือกไว้พร้อมบทบาทตัวจริงหรือตัวสำรองเดิม เติมเฉพาะช่องว่าง พยายามเลือกผู้เล่นระดับ 1–3 ระดับละ 3 คน ให้ความสำคัญกับผู้รักษาประตูที่น่าจะเป็นตัวจริงของสโมสร แล้วเติมโควต้าต่างชาติให้มากที่สุด โดยไม่ใช้คะแนนคาดการณ์หรืออันดับรวม",
        "จัดตัวอัตโนมัติจะไม่เปลี่ยนแผนการเล่นหรือลำดับตัวสำรอง หากตำแหน่งเดียวกันมีทั้งช่องตัวจริงและตัวสำรองว่าง ผู้เล่นใหม่ที่ระดับดีกว่าจะลงช่องตัวจริงก่อน",
        "เมื่อกัปตันหรือรองกัปตันยังว่าง จัดตัวอัตโนมัติจะเก็บบทบาทที่ตั้งไว้และเติมเฉพาะบทบาทที่ขาดจากผู้เล่นระดับดีที่สุดที่ยังเลือกได้ โดยเรียงกองหน้า กองกลาง กองหลัง และผู้รักษาประตู",
        "เลือกกัปตันและรองกัปตันจากตัวจริงอย่างละหนึ่งคน เมื่อสลับตัวจริงกับตัวสำรอง บทบาทจะย้ายไปยังผู้เล่นที่ขึ้นมาเป็นตัวจริง",
      ],
    },
    {
      id: "tiers",
      title: "ระดับนักเตะ",
      summary: "ข้อจำกัดระดับช่วยกระจายการเลือกนักเตะให้สมดุลทั้งทีม",
      points: [
        `จำนวนช่องปกติคือ ${rules.tierSlots.map((tier) => `ระดับ ${tier.level} จำนวน ${tier.slots} ช่อง`).join(" • ")}`,
        `ข้อจำกัดสะสมคือ ${tiers.map((tier) => `${tier.level === 1 ? "ระดับ 1" : `ระดับ 1–${tier.level}`} รวมไม่เกิน ${tier.limit} คน`).join(" • ")}`,
        "ผู้เล่นระดับต่ำกว่าสามารถใช้ช่องระดับสูงกว่าที่ยังว่างได้ แต่ผู้เล่นระดับสูงกว่าไม่สามารถล้นลงมายังช่องระดับต่ำกว่า",
        "ระดับมีผลแยกตาม Gameweek เพื่อไม่ให้การแก้ไขภายหลังเปลี่ยนทีมย้อนหลัง",
      ],
    },
    {
      id: "transfers",
      title: "การซื้อขายและ Deadline",
      summary: "ยืนยันหรือยกเลิกการเปลี่ยนทีมก่อนคู่แรกปิดรับจัดทีม",
      points: [
        `ได้รับ Free Transfer เพิ่ม ${rules.weeklyFreeTransfers} ครั้งหลังแต่ละ Deadline และสะสมได้สูงสุด ${rules.maximumFreeTransfers} ครั้ง`,
        `Transfer สุทธิที่เกินโควต้าฟรีหัก ${rules.transferPointCost} คะแนนต่อครั้ง`,
        `ยืนยัน Transfer ที่เกินโควต้าฟรีได้สูงสุด ${rules.maximumChargeableTransfers} คนต่อ Gameweek หรือหักคะแนนได้สูงสุด ${rules.maximumChargeableTransfers * rules.transferPointCost} คะแนน`,
        "การบันทึกทีมครบครั้งแรกไม่คิดเป็น Transfer แม้ Gameweek ก่อนหน้าจะมี Draft ที่ยังไม่ครบ",
        "Deadline ปิดก่อนคู่แรก 90 นาที และยกเลิกการเปลี่ยนแปลงที่ยืนยันแล้วได้จนถึงเวลานั้น",
        "Wildcard ทำให้ Transfer ไม่มีค่าใช้จ่ายและคง Free Transfer ที่มีอยู่ก่อนสรุปรายการ",
      ],
    },
    {
      id: "chips",
      title: "Chips",
      summary: "เลือกใช้ตัวช่วยหนึ่งชนิดต่อ Gameweek เมื่อยังมีสิทธิ์เหลือ",
      points: [
        `Triple Captain, Bench Boost และ Wildcard ใช้ได้อย่างละ ${rules.chipUsesPerSeason} ครั้งต่อฤดูกาล`,
        "ใช้ได้หนึ่ง Chip ต่อ Gameweek และใช้ชนิดเดิมใน Gameweek ติดกันได้",
        `Wildcard ใช้ได้ตั้งแต่ Gameweek ${rules.wildcardStartGameweek} เป็นต้นไป`,
        "ยกเลิก Chip ได้ก่อน Deadline โดย Triple Captain คูณคะแนนกัปตันเป็นสามเท่า และ Bench Boost นับคะแนนผู้เล่นทั้ง 15 คน",
      ],
    },
    {
      id: "scoring",
      title: "การคิดคะแนน",
      summary:
        "คะแนนมาจากข้อมูลการแข่งขันที่ได้รับการตรวจสอบและบันทึกไว้เท่านั้น",
      points: [
        `ประตูมีค่า ${GOAL_POINTS.goalkeeper} คะแนนสำหรับผู้รักษาประตู ${GOAL_POINTS.defender} คะแนนสำหรับกองหลัง ${GOAL_POINTS.midfielder} คะแนนสำหรับกองกลาง และ ${GOAL_POINTS.forward} คะแนนสำหรับกองหน้า ส่วนแอสซิสต์ได้ 3 คะแนน`,
        `คลีนชีตเมื่อเล่นอย่างน้อย 60 นาทีได้ ${CLEAN_SHEET_POINTS.goalkeeper}/${CLEAN_SHEET_POINTS.defender}/${CLEAN_SHEET_POINTS.midfielder}/${CLEAN_SHEET_POINTS.forward} คะแนนตามลำดับ GK/DEF/MID/FWD`,
        "นับคะแนนจากนาทีลงสนาม การเซฟ จุดโทษ ใบเหลือง ใบแดง ประตูที่เสียระหว่างอยู่ในสนาม และประตูตัวเอง โดยไม่มี Bonus/BPS และ Defensive Contributions",
        "ผู้เล่นที่ถูกไล่ออกไม่ถูกคิดประตูที่ทีมเสียหลังออกจากสนาม",
      ],
    },
    {
      id: "results",
      title: "แมตช์ตกค้างและอันดับ",
      summary:
        "ผลย้อนหลังยังตรวจสอบได้เมื่อข้อมูลการแข่งขันถูกเพิ่มหรือแก้ไขภายหลัง",
      points: [
        "แมตช์ตกค้างให้คะแนนย้อนหลังใน Gameweek เดิม",
        "ระบบคำนวณ Auto-sub กัปตัน Chips และอันดับใหม่หลังอัปเดตคะแนน",
        "Classic League จัดอันดับจากคะแนนรวม จากนั้นใช้จำนวน Transfer ที่น้อยกว่าและชื่อทีมเป็นตัวตัดสิน โดยไม่นับ Wildcard",
        "ระบบเก็บสโมสร ตำแหน่ง ระดับ และสถานะนักเตะไทยของแต่ละ selection ไว้ เพื่อไม่ให้ข้อมูลปัจจุบันเปลี่ยนผลย้อนหลัง",
      ],
    },
  ];
}
