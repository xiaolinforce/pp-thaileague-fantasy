import type { InterfaceLanguage } from "@/lib/auth/preferences";

import { CLEAN_SHEET_POINTS, GOAL_POINTS } from "./scoring.ts";
import { getCumulativeTierLimits, THAI_LEAGUE_FANTASY_RULES } from "./rules.ts";

export type FantasyRuleTable = {
  caption: string;
  headings: string[];
  rows: { id: string; label: string; values: number[] }[];
};

export type FantasyRuleSection = {
  id: string;
  title: string;
  summary: string;
  points: string[];
  table?: FantasyRuleTable;
  details?: { title: string; points: string[] };
};

export function buildFantasyRuleSections(
  language: InterfaceLanguage,
): FantasyRuleSection[] {
  const rules = THAI_LEAGUE_FANTASY_RULES;
  const tiers = getCumulativeTierLimits(rules);
  const th = language === "th";
  const copy = (thai: string, english: string) => (th ? thai : english);
  const positions = [
    "goalkeeper",
    "defender",
    "midfielder",
    "forward",
  ] as const;
  const allPositions = (points: number) => positions.map(() => points);

  return [
    {
      id: "squad",
      title: copy("การจัดทีม", "Squad selection"),
      summary: copy(
        "เลือกนักเตะให้ครบ 15 คน แล้วจัดตัวจริงและตัวสำรองก่อนเส้นตาย",
        "Pick all 15 players, then set your starting lineup and bench before the deadline.",
      ),
      points: [
        copy(
          `เลือกนักเตะ ${rules.squadSize} คน: ผู้รักษาประตู ${rules.positionLimits.goalkeeper} คน กองหลัง ${rules.positionLimits.defender} คน กองกลาง ${rules.positionLimits.midfielder} คน และกองหน้า ${rules.positionLimits.forward} คน`,
          `Select ${rules.squadSize} players: ${rules.positionLimits.goalkeeper} goalkeepers, ${rules.positionLimits.defender} defenders, ${rules.positionLimits.midfielder} midfielders and ${rules.positionLimits.forward} forwards.`,
        ),
        copy(
          `ตัวจริง 11 คนต้องมีผู้รักษาประตู ${rules.minimumStarters.goalkeeper} คน กองหลังอย่างน้อย ${rules.minimumStarters.defender} คน กองกลางอย่างน้อย ${rules.minimumStarters.midfielder} คน และกองหน้าอย่างน้อย ${rules.minimumStarters.forward} คน เช่น แผน 4-4-2 หรือ 3-5-2`,
          `Your starting eleven needs ${rules.minimumStarters.goalkeeper} goalkeeper, at least ${rules.minimumStarters.defender} defenders, at least ${rules.minimumStarters.midfielder} midfielders and at least ${rules.minimumStarters.forward} forward. For example, use a 4-4-2 or 3-5-2 formation.`,
        ),
        copy(
          `ทั้งทีม 15 คนเลือกจากสโมสรเดียวกันได้ไม่เกิน ${rules.sameClubLimit} คน และมีนักเตะต่างชาติได้ไม่เกิน ${rules.foreignPlayerLimit} คน`,
          `Across the full 15-player squad, select at most ${rules.sameClubLimit} players from one club and at most ${rules.foreignPlayerLimit} foreign players.`,
        ),
        copy(
          "จัดตัวอัตโนมัติช่วยเติมช่องว่างให้ครบตามกติกา โดยคงนักเตะ แผนการเล่น และลำดับตัวสำรองที่เลือกไว้ คุณปรับทีมต่อได้ และต้องกดบันทึกเพื่อยืนยัน",
          "Auto-fill completes vacant slots within the rules while keeping your existing players, formation and bench order. You can edit the suggestion and must save to confirm it.",
        ),
      ],
      details: {
        title: copy(
          "จัดตัวอัตโนมัติเลือกนักเตะอย่างไร",
          "How auto-fill chooses players",
        ),
        points: [
          copy(
            `ระบบพยายามเติมโควต้าระดับ ${rules.tierSlots
              .slice(0, -1)
              .map((tier) => `${tier.level} จำนวน ${tier.slots} คน`)
              .join(
                " ระดับ ",
              )} ให้ความสำคัญกับผู้รักษาประตูที่น่าจะเป็นตัวจริงของสโมสร แล้วเลือกนักเตะต่างชาติให้มากที่สุดภายในโควต้า`,
            `It targets ${rules.tierSlots
              .slice(0, -1)
              .map((tier) => `${tier.slots} Level ${tier.level} players`)
              .join(
                ", ",
              )}, prefers likely first-choice club goalkeepers, then fills as many foreign-player slots as the rules allow.`,
          ),
          copy(
            "เมื่อเงื่อนไขข้างต้นเสมอกัน ระบบเลือกกลุ่มคุณภาพที่ดีที่สุดที่ยังจัดทีมได้ โดยแบ่งผู้เล่นตำแหน่งและระดับเดียวกันตามคะแนนคาดการณ์ ใช้อันดับรวมตัดสินเมื่อคะแนนเท่ากัน แต่ละกลุ่มมีอย่างน้อย 3 คนหรือ 25% ของผู้เล่นในตำแหน่งและระดับนั้น ปัดขึ้นเป็นจำนวนเต็ม",
            "When those priorities tie, it prefers the best feasible quality bands. Players of the same position and level are grouped by projected points, with overall rank breaking ties. Each band contains at least three players or 25% of that position-level group, rounded up.",
          ),
          copy(
            "เมื่อมีทีมผู้เล่นที่เข้าเกณฑ์นับความนิยมอย่างน้อย 30 ทีม ระบบใช้ความนิยมช่วยตัดสินเมื่อกลุ่มคุณภาพเท่ากัน แล้วสุ่มเมื่อเงื่อนไขยังเสมอกัน",
            "Once at least 30 eligible human teams are counted, player popularity breaks ties between equal quality-band choices. Remaining ties are randomized.",
          ),
          copy(
            "หากตำแหน่งเดียวกันมีทั้งช่องตัวจริงและตัวสำรองว่าง ผู้เล่นใหม่ที่ระดับดีกว่าจะได้ลงตัวจริงก่อน ระบบเก็บกัปตันและรองกัปตันที่ตั้งไว้ เติมเฉพาะบทบาทที่ขาดจากตัวจริงระดับดีที่สุด โดยเรียงกองหน้า กองกลาง กองหลัง และผู้รักษาประตู แล้วใช้กลุ่มคุณภาพก่อนสุ่มเมื่อยังเสมอกัน",
            "When starter and bench slots for the same position are vacant, the better-tier new player starts. Existing captaincy is kept. Missing roles go to the best-tier available starters, preferring forwards, midfielders, defenders, then goalkeepers, with quality bands before random tie-breaking.",
          ),
        ],
      },
    },
    {
      id: "tiers",
      title: copy("ระดับนักเตะ", "Player tiers"),
      summary: copy(
        "นักเตะแบ่งเป็นระดับ 1–4 โดยระดับ 1 เป็นกลุ่มสูงสุด เลือกผสมกันได้ตามข้อจำกัดรวมในตาราง",
        "Players have levels 1–4, with Level 1 the highest tier. Mix levels within the cumulative limits below.",
      ),
      table: {
        caption: copy(
          "จำนวนสูงสุดเมื่อนับระดับรวมกัน",
          "Cumulative player limits",
        ),
        headings: [
          copy("ระดับที่นับรวม", "Levels counted together"),
          copy("ไม่เกิน (คน)", "Maximum players"),
        ],
        rows: tiers.map((tier) => ({
          id: `tier-${tier.level}`,
          label: copy(
            tier.level === 1 ? "ระดับ 1" : `ระดับ 1–${tier.level}`,
            tier.level === 1 ? "Level 1" : `Levels 1–${tier.level}`,
          ),
          values: [tier.limit],
        })),
      },
      points: [
        copy(
          "ไม่จำเป็นต้องใช้โควต้าระดับ 1 ให้เต็ม สามารถเลือกนักเตะระดับ 2–4 แทนได้ แต่เพิ่มระดับ 1 เกินโควต้าไม่ได้ แม้ระดับอื่นยังมีที่ว่าง",
          "You do not have to fill the Level 1 allowance: choose Levels 2–4 instead. You cannot exceed the Level 1 limit even if other levels have unused slots.",
        ),
        copy(
          "ตัวอย่างที่ผ่านโควต้าระดับ: ระดับ 1 จำนวน 2 คน + ระดับ 2 จำนวน 4 คน + ระดับ 3 จำนวน 6 คน + ระดับ 4 จำนวน 3 คน รวม 15 คน ทั้งนี้ยังต้องผ่านกฎตำแหน่ง สโมสร และต่างชาติด้วย",
          "Valid tier example: 2 Level 1 + 4 Level 2 + 6 Level 3 + 3 Level 4 players = 15. Position, club and foreign-player limits still apply.",
        ),
        copy(
          "ระดับนักเตะมีผลแยกตามรอบแข่งขัน การเปลี่ยนระดับภายหลังไม่เปลี่ยนทีมในรอบที่ปิดรับแล้ว",
          "Tiers apply by Gameweek. Later tier changes do not alter squads from closed Gameweeks.",
        ),
      ],
    },
    {
      id: "lineup",
      title: copy("ตัวจริง ตัวสำรอง และกัปตัน", "Lineup, bench and captain"),
      summary: copy(
        "ปกติคิดคะแนนจากตัวจริง 11 คน รวมคะแนนเพิ่มจากกัปตัน แล้วหักคะแนนการเปลี่ยนนักเตะ",
        "Normally, your total is the starting eleven's points plus the captain bonus, minus transfer deductions.",
      ),
      points: [
        copy(
          "เลือกกัปตันและรองกัปตันจากตัวจริงคนละคน กัปตันได้คะแนน ×2 เช่น ได้ 6 คะแนน จะนับเป็น 12 คะแนน",
          "Choose a captain and a different vice-captain from your starters. The captain scores ×2: for example, 6 points become 12.",
        ),
        copy(
          "หากกัปตันไม่ได้ลงสนามเลย รองกัปตันจะได้ตัวคูณแทน หากทั้งคู่ไม่ได้ลงสนาม จะไม่มีคะแนนเพิ่มจากกัปตัน",
          "If the captain does not play at all, the vice-captain receives the multiplier. If neither plays, there is no captain bonus.",
        ),
        copy(
          "ตัวสำรองมีผู้รักษาประตู 1 คนและผู้เล่นตำแหน่งอื่น 3 คน เรียงลำดับผู้เล่นสำรองทั้ง 3 คนตามที่ต้องการให้ระบบเลือกลงแทน",
          "Your bench has one goalkeeper and three outfield players. Order those three outfield substitutes by who should come on first.",
        ),
        copy(
          "เมื่อตัวจริงไม่ได้ลงสนามเลย ระบบเลือกตัวสำรองที่ได้ลงสนามตามลำดับ และต้องยังเป็นแผนที่ถูกกติกา ผู้รักษาประตูแทนกันได้เฉพาะผู้รักษาประตู ตัวสำรองแต่ละคนลงแทนได้ครั้งเดียว",
          "When a starter does not play at all, the first eligible substitute who played comes on, provided the formation stays valid. Goalkeepers replace only goalkeepers, and each substitute can be used once.",
        ),
        copy(
          "ลงสนามแม้เพียงช่วงทดเวลาก็ถือว่าได้เล่นแล้ว จึงไม่เปลี่ยนตัวอัตโนมัติหรือส่งสิทธิ์กัปตันต่อเพราะมีคะแนนน้อย",
          "Even a stoppage-time appearance counts as playing. A low score does not trigger an automatic substitution or transfer captaincy.",
        ),
        copy(
          "ก่อนเส้นตาย หากคุณสลับกัปตันหรือรองกัปตันไปเป็นตัวสำรอง บทบาทจะย้ายไปยังผู้เล่นที่ขึ้นมาเป็นตัวจริง ตรวจบทบาทอีกครั้งก่อนบันทึก",
          "Before the deadline, manually swapping a captain or vice-captain onto the bench transfers that role to the incoming starter. Check the roles before saving.",
        ),
      ],
    },
    {
      id: "transfers",
      title: copy("การเปลี่ยนนักเตะและเส้นตาย", "Transfers and deadline"),
      summary: copy(
        "ต้องบันทึกการเปลี่ยนทีมก่อนเส้นตาย ซึ่งอยู่ก่อนคู่แรกของรอบแข่งขัน 90 นาที",
        "Save your changes before the deadline, 90 minutes before the Gameweek's first kickoff.",
      ),
      points: [
        copy(
          `ได้รับสิทธิ์เปลี่ยนนักเตะฟรี (Free Transfer) เพิ่ม ${rules.weeklyFreeTransfers} ครั้งหลังแต่ละเส้นตาย และสะสมได้สูงสุด ${rules.maximumFreeTransfers} ครั้ง`,
          `Receive ${rules.weeklyFreeTransfers} free transfers after each deadline and bank up to ${rules.maximumFreeTransfers}.`,
        ),
        copy(
          "นับจำนวนเปลี่ยนนักเตะจากรายชื่อที่ต่างจากทีมตอนเริ่มรอบ ไม่ได้นับจำนวนครั้งที่กดบันทึก การสลับตัวจริงกับตัวสำรองในทีมเดิมไม่ใช้สิทธิ์เปลี่ยน",
          "Transfers count players changed from your start-of-Gameweek squad, not how many times you save. Rearranging starters and substitutes within the same squad does not use transfers.",
        ),
        copy(
          `เปลี่ยนเกินสิทธิ์ฟรีหัก ${rules.transferPointCost} คะแนนต่อคน ตัวอย่าง: มีสิทธิ์ฟรี ${rules.weeklyFreeTransfers} คน เปลี่ยน ${rules.weeklyFreeTransfers + 1} คน จะถูกหัก ${rules.transferPointCost} คะแนน`,
          `Each transfer beyond your free allowance costs ${rules.transferPointCost} points. Example: with ${rules.weeklyFreeTransfers} free transfers, changing ${rules.weeklyFreeTransfers + 1} players costs ${rules.transferPointCost} points.`,
        ),
        copy(
          `เปลี่ยนเกินสิทธิ์ฟรีได้สูงสุด ${rules.maximumChargeableTransfers} คนต่อรอบ หรือหักสูงสุด ${rules.maximumChargeableTransfers * rules.transferPointCost} คะแนน หากเกินกว่านี้จะบันทึกไม่ได้ ต้องลดจำนวนที่เปลี่ยนหรือใช้ Wildcard เมื่อมีสิทธิ์`,
          `You can confirm at most ${rules.maximumChargeableTransfers} paid transfers per Gameweek, for a maximum deduction of ${rules.maximumChargeableTransfers * rules.transferPointCost} points. Beyond that, reduce your changes or use Wildcard if available before saving.`,
        ),
        copy(
          "รอบแรกที่ทีมเริ่มเล่นเปลี่ยนนักเตะได้ไม่จำกัดจนถึงเส้นตาย แม้บันทึกทีมครบแล้วหรือเริ่มเล่นหลังรอบที่ 1 หากรอบก่อนยังจัดทีมไม่ครบ สิทธิ์นี้จะต่อเนื่องจนถึงรอบแรกที่ปิดรับพร้อมทีมครบ 15 คน",
          "Your team's opening Gameweek allows unlimited transfers until its deadline, even after saving a full squad or joining after Gameweek 1. If earlier rounds had incomplete squads, this continues until the first deadline with a complete 15-player squad.",
        ),
        copy(
          "การรีเซ็ตจะนำรายชื่อนักเตะ ตัวจริง ลำดับตัวสำรอง กัปตัน และตัวช่วยต้นรอบกลับมาเป็นฉบับร่างที่ยังไม่บันทึก ทีมที่ยืนยันไว้และสิทธิ์เปลี่ยนนักเตะยังไม่เปลี่ยนจนกว่าจะบันทึกฉบับร่างที่ถูกกติกา ในรอบแรกของทีม การรีเซ็ตจะล้างทั้ง 15 ช่องให้เลือกใหม่",
          "Reset restores the start-of-Gameweek squad, lineup, bench order, captaincy and chip as an unsaved draft. Your confirmed team and transfer allowance change only after saving a valid draft. In your opening Gameweek, Reset clears all 15 slots so you can pick again.",
        ),
      ],
    },
    {
      id: "chips",
      title: copy("ตัวช่วยพิเศษ (Chips)", "Chips"),
      summary: copy(
        `ใช้ได้หนึ่งชนิดต่อรอบแข่งขัน แต่ละชนิดใช้ได้ ${rules.chipUsesPerSeason} ครั้งต่อฤดูกาล`,
        `Use one chip per Gameweek. Each chip can be used ${rules.chipUsesPerSeason} times per season.`,
      ),
      points: [
        copy(
          "กัปตันสามเท่า (Triple Captain): เปลี่ยนตัวคูณกัปตันจาก ×2 เป็น ×3 หากกัปตันไม่ได้ลงสนาม ตัวคูณจะส่งต่อให้รองกัปตันที่ได้ลงสนาม",
          "Triple Captain: increases the captain multiplier from ×2 to ×3. If the captain does not play, the multiplier passes to the vice-captain who played.",
        ),
        copy(
          "คะแนนตัวสำรอง (Bench Boost): นับคะแนนนักเตะครบทั้ง 15 คน จึงไม่ต้องใช้การเปลี่ยนตัวอัตโนมัติ",
          "Bench Boost: counts all 15 players, so automatic substitutions are not applied.",
        ),
        copy(
          `เปลี่ยนตัวอิสระ (Wildcard): เปลี่ยนนักเตะได้ไม่จำกัดโดยไม่หักคะแนนในรอบนั้น เก็บสิทธิ์เปลี่ยนฟรีเดิมไว้และได้รับสิทธิ์เพิ่มตามปกติหลังเส้นตาย ใช้ได้ตั้งแต่รอบที่ ${rules.wildcardStartGameweek}`,
          `Wildcard: unlimited transfers with no point deductions for that Gameweek. Keep your existing free-transfer balance and receive the normal allowance after the deadline. Available from Gameweek ${rules.wildcardStartGameweek}.`,
        ),
        copy(
          "เลือกหรือยกเลิกตัวช่วยแล้วต้องบันทึกก่อนเส้นตาย ใช้ตัวช่วยชนิดเดิมในรอบติดกันได้หากยังมีสิทธิ์เหลือ",
          "Save chip selections or cancellations before the deadline. The same chip can be used in consecutive Gameweeks if uses remain.",
        ),
      ],
    },
    {
      id: "scoring",
      title: copy("การคิดคะแนน", "Scoring"),
      summary: copy(
        "นักเตะได้หรือเสียคะแนนจากผลงานจริงตามตำแหน่งในเกม ตารางนี้เป็นคะแนนก่อนใช้ตัวคูณกัปตัน",
        "Players gain or lose points from real match events according to their position in the game. These values are before captain multipliers.",
      ),
      table: {
        caption: copy(
          "คะแนนต่อเหตุการณ์และตำแหน่ง",
          "Points by event and position",
        ),
        headings: th
          ? ["เหตุการณ์", "ผู้รักษาประตู", "กองหลัง", "กองกลาง", "กองหน้า"]
          : ["Event", "Goalkeeper", "Defender", "Midfielder", "Forward"],
        rows: [
          {
            id: "no-appearance",
            label: copy(
              "ไม่ได้ลงสนาม (เฉพาะคะแนนลงเล่น)",
              "No appearance (appearance points only)",
            ),
            values: allPositions(0),
          },
          {
            id: "short-appearance",
            label: copy("ลงเล่นไม่ถึง 60 นาที", "Play fewer than 60 minutes"),
            values: allPositions(1),
          },
          {
            id: "full-appearance",
            label: copy("ลงเล่นตั้งแต่ 60 นาที", "Play 60 minutes or more"),
            values: allPositions(2),
          },
          {
            id: "goal",
            label: copy("ยิงประตูได้ (ต่อประตู)", "Goal scored (each)"),
            values: positions.map((position) => GOAL_POINTS[position]),
          },
          {
            id: "assist",
            label: copy("แอสซิสต์ (ต่อครั้ง)", "Assist (each)"),
            values: allPositions(3),
          },
          {
            id: "clean-sheet",
            label: copy(
              "ไม่เสียประตูขณะอยู่ในสนาม และเล่นตั้งแต่ 60 นาที",
              "No goals conceded while playing, with 60+ minutes",
            ),
            values: positions.map((position) => CLEAN_SHEET_POINTS[position]),
          },
          {
            id: "saves",
            label: copy("เซฟครบทุก 3 ครั้ง", "Every 3 saves"),
            values: [1, 0, 0, 0],
          },
          {
            id: "penalty-save",
            label: copy("เซฟจุดโทษ (ต่อครั้ง)", "Penalty saved (each)"),
            values: allPositions(5),
          },
          {
            id: "penalty-miss",
            label: copy("ยิงจุดโทษไม่เข้า (ต่อครั้ง)", "Penalty missed (each)"),
            values: allPositions(-2),
          },
          {
            id: "goals-conceded",
            label: copy(
              "เสียประตูขณะอยู่ในสนามครบทุก 2 ลูก",
              "Every 2 goals conceded while playing",
            ),
            values: [-1, -1, 0, 0],
          },
          {
            id: "yellow-card",
            label: copy("ใบเหลือง (ต่อใบ)", "Yellow card (each)"),
            values: allPositions(-1),
          },
          {
            id: "red-card",
            label: copy("ใบแดง (ต่อใบ)", "Red card (each)"),
            values: allPositions(-3),
          },
          {
            id: "own-goal",
            label: copy("ทำเข้าประตูตัวเอง (ต่อประตู)", "Own goal (each)"),
            values: allPositions(-2),
          },
        ],
      },
      points: [
        copy(
          "ผู้ที่ได้ลงสนามนับอย่างน้อย 1 นาทีในเกม รวมถึงตัวสำรองช่วงทดเวลา จึงได้คะแนนลงเล่น 1 คะแนน แม้อยู่ในสนามไม่ถึงหนึ่งนาทีจริง",
          "Any confirmed appearance counts as at least one Fantasy minute, including stoppage-time substitutes, and earns 1 appearance point even if the actual time was under a minute.",
        ),
        copy(
          "ตัวอย่าง: กองหน้าเล่น 90 นาที ยิง 1 ประตู ไม่มีเหตุการณ์อื่น ได้ 2 + 4 = 6 คะแนน หากเป็นกัปตันจะได้ 12 คะแนน",
          "Example: a forward plays 90 minutes and scores once, with no other events: 2 + 4 = 6 points, or 12 as captain.",
        ),
        copy(
          "ไม่มีคะแนนโบนัส (Bonus/BPS) หรือคะแนนผลงานเกมรับเพิ่มเติม (Defensive Contributions) ผู้เล่นที่ถูกไล่ออกไม่ถูกหักจากประตูที่ทีมเสียหลังออกจากสนาม",
          "There are no Bonus/BPS or Defensive Contributions points. A dismissed player is not charged for goals conceded after leaving the pitch.",
        ),
      ],
    },
    {
      id: "results",
      title: copy(
        "ผลคะแนน แมตช์ตกค้าง และอันดับ",
        "Results, postponed matches and rankings",
      ),
      summary: copy(
        "คะแนนและอันดับอาจเปลี่ยนเมื่อมีผลการแข่งขันเพิ่มเติมหรือแก้ไขข้อมูล",
        "Points and rankings can change when more match results arrive or data is corrected.",
      ),
      points: [
        copy(
          "ระหว่างรอสรุปคะแนน หากยังไม่มีผลของนักเตะ ระบบจะยังไม่ถือว่าไม่ได้ลงสนาม ต้องมีผลยืนยัน 0 นาทีก่อนจึงเปลี่ยนตัวอัตโนมัติหรือส่งตัวคูณให้รองกัปตัน เมื่อสรุปรอบแล้ว ผลที่ยังไม่มีจะถือว่าไม่ได้ลงสนาม",
          "While scoring is provisional, a missing result stays pending. A confirmed zero-minute result triggers automatic substitutions or vice-captain fallback. Once the Gameweek is final, missing results count as no appearance.",
        ),
        copy(
          "แมตช์ตกค้างคิดคะแนนในรอบแข่งขันเดิม เมื่อเพิ่มหรือแก้ไขผล ระบบจะคำนวณตัวสำรอง กัปตัน ตัวช่วย คะแนนรวม และอันดับใหม่",
          "Postponed matches score in their original Gameweek. Added or corrected results recalculate substitutions, captaincy, chips, totals and rankings.",
        ),
        copy(
          "ลีกแบบสะสมคะแนน (Classic) เรียงจากคะแนนรวมมากที่สุด หากเท่ากัน ทีมที่เปลี่ยนนักเตะรวมน้อยกว่าจะอยู่เหนือกว่า โดยไม่นับรอบที่ใช้ Wildcard หากยังเท่ากันจึงเรียงตามชื่อทีม",
          "Classic leagues rank by total points, highest first. Ties go to fewer counted transfers, excluding Wildcard Gameweeks, then team name.",
        ),
        copy(
          "สโมสร ตำแหน่ง ระดับ และสถานะนักเตะไทยที่ใช้กับทีมในรอบก่อนยังคงเดิม แม้ข้อมูลนักเตะปัจจุบันเปลี่ยนไป",
          "Earlier squads keep the club, position, tier and Thai-player status recorded for that Gameweek, even if current player data changes.",
        ),
      ],
    },
  ];
}
