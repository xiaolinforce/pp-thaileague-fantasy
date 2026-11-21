import { calculatePlayerPoints, type PlayerMatchStats } from "./scoring.ts";
import type { FantasyPosition } from "./rules.ts";

export class MatchImportError extends Error {
  readonly messageTh: string;
  constructor(message: string, messageTh: string) {
    super(message);
    this.messageTh = messageTh;
  }
}

export interface MatchRosterPlayer {
  fantasyPlayerId: string;
  name: string;
  nameEn: string;
  nameTh: string | null;
  side: "home" | "away";
  position: FantasyPosition;
  registered?: boolean;
}

const fields = [
  "minutes",
  "goals",
  "sourceAssists",
  "fantasyAssists",
  "goalsConcededWhilePlaying",
  "saves",
  "penaltySaves",
  "penaltyMisses",
  "yellowCards",
  "redCards",
  "ownGoals",
] as const;

function object(
  value: unknown,
  allowed: readonly string[],
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new MatchImportError(
      "Expected a JSON object.",
      "กรุณาระบุข้อมูลเป็นออบเจ็กต์ JSON",
    );
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key))
      throw new MatchImportError(
        `Unknown field: ${key}`,
        `ไม่รู้จักช่องข้อมูล ${key}`,
      );
  }
  return value as Record<string, unknown>;
}

function integer(value: unknown, key: string, max = 120) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > max
  )
    throw new MatchImportError(
      `${key} must be an integer between 0 and ${max}.`,
      `${key} ต้องเป็นจำนวนเต็มระหว่าง 0 ถึง ${max}`,
    );
  return value;
}

function list(value: unknown, key: string): string[] {
  if (
    !Array.isArray(value) ||
    value.length > 300 ||
    !value.every((v) => typeof v === "string" && v.trim() && v.length <= 3000)
  )
    throw new MatchImportError(
      `Invalid ${key} list.`,
      `กรุณาตรวจรายการ ${key}`,
    );
  return value.map((v: string) => v.trim());
}

export function prepareMatchImport(
  fixtureId: string,
  raw: string,
  roster: MatchRosterPlayer[],
) {
  if (raw.length > 500_000)
    throw new MatchImportError(
      "Report is too large.",
      "รายงานมีขนาดใหญ่เกินกำหนด",
    );
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new MatchImportError("Invalid JSON.", "รูปแบบ JSON ไม่ถูกต้อง");
  }
  const input = object(parsed, [
    "fixtureId",
    "homeScore",
    "awayScore",
    "sources",
    "events",
    "uncertainties",
    "players",
  ]);
  if (input.fixtureId !== fixtureId)
    throw new MatchImportError(
      "Fixture ID differs from the selected fixture.",
      "รหัสแมตช์ในรายงานไม่ตรงกับคู่ที่เลือก",
    );
  const homeScore = integer(input.homeScore, "homeScore");
  const awayScore = integer(input.awayScore, "awayScore");
  const sources = list(input.sources, "sources");
  if (
    !sources.length ||
    !sources.every(
      (s) =>
        URL.canParse(s) && ["https:", "http:"].includes(new URL(s).protocol),
    )
  )
    throw new MatchImportError(
      "Supply at least one valid source URL.",
      "กรุณาระบุลิงก์แหล่งข้อมูลที่ถูกต้องอย่างน้อยหนึ่งลิงก์",
    );
  const events = list(input.events, "events");
  const uncertainties = list(input.uncertainties, "uncertainties");
  if (!Array.isArray(input.players) || input.players.length !== roster.length)
    throw new MatchImportError(
      "Include the full match roster, including confirmed zero-minute players.",
      "กรุณาระบุนักเตะให้ครบ รวมทั้งผู้ที่ยืนยันว่าไม่ได้ลงสนาม",
    );
  const expected = new Map(roster.map((p) => [p.fantasyPlayerId, p]));
  const sides = {
    home: { goals: 0, assists: 0, sourceAssists: 0, appearances: 0 },
    away: { goals: 0, assists: 0, sourceAssists: 0, appearances: 0 },
  };
  const rows = input.players
    .map((item) => {
      const row = object(item, ["fantasyPlayerId", ...fields]);
      const fantasyPlayerId = row.fantasyPlayerId;
      const player =
        typeof fantasyPlayerId === "string"
          ? expected.get(fantasyPlayerId)
          : undefined;
      if (!player)
        throw new MatchImportError(
          `Unknown or duplicate player: ${String(fantasyPlayerId)}`,
          `ไม่พบรหัสนักเตะในแมตช์ หรือรหัสซ้ำ ${String(fantasyPlayerId)}`,
        );
      expected.delete(player.fantasyPlayerId);
      const values = {} as Required<PlayerMatchStats>;
      for (const key of fields) {
        if (key === "fantasyAssists")
          values[key] = row[key] == null ? null : integer(row[key], key);
        else {
          const required =
            key === "minutes" ||
            key === "goalsConcededWhilePlaying" ||
            (key === "saves" &&
              player.position === "goalkeeper" &&
              Number(row.minutes) > 0);
          values[key] = integer(
            row[key] === undefined && !required ? 0 : row[key],
            `${player.name} / ${key}`,
          );
        }
      }
      if (
        !["goalkeeper", "defender", "midfielder", "forward"].includes(
          player.position,
        )
      )
        throw new MatchImportError(
          `Unsupported Fantasy position: ${player.name}`,
          `กรุณาตรวจตำแหน่งแฟนตาซีของ ${player.name}`,
        );
      if (
        player.registered === false &&
        fields.some((key) => (values[key] ?? 0) > 0)
      )
        throw new MatchImportError(
          `Confirm match-day registration before assigning statistics to ${player.name}.`,
          `กรุณายืนยันทะเบียนในวันแข่งขันก่อนลงสถิติให้ ${player.name}`,
        );
      const opponent = player.side === "home" ? "away" : "home";
      const opponentGoals = player.side === "home" ? awayScore : homeScore;
      if (
        values.goalsConcededWhilePlaying > opponentGoals ||
        values.penaltySaves > values.saves
      )
        throw new MatchImportError(
          `Inconsistent conceded goals or saves: ${player.name}`,
          `กรุณาตรวจจำนวนประตูที่เสียหรือจำนวนเซฟของ ${player.name}`,
        );
      if (
        values.minutes === 0 &&
        fields.some(
          (key) =>
            !["minutes", "yellowCards", "redCards"].includes(key) &&
            (values[key] ?? 0) > 0,
        )
      )
        throw new MatchImportError(
          `On-pitch statistics on a zero-minute player: ${player.name}`,
          `${player.name} มีสถิติขณะเล่นทั้งที่ระบุว่าลงสนาม 0 นาที`,
        );
      if (values.minutes > 0) sides[player.side].appearances++;
      sides[player.side].goals += values.goals;
      sides[opponent].goals += values.ownGoals;
      sides[player.side].assists +=
        values.fantasyAssists ?? values.sourceAssists;
      sides[player.side].sourceAssists += values.sourceAssists;
      return {
        fantasyPlayerId: player.fantasyPlayerId,
        stats: values,
        points: calculatePlayerPoints(player.position, values),
      };
    })
    .sort((a, b) => a.fantasyPlayerId.localeCompare(b.fantasyPlayerId));
  for (const side of ["home", "away"] as const) {
    if (
      sides[side].appearances < 11 ||
      sides[side].goals !== (side === "home" ? homeScore : awayScore) ||
      sides[side].assists > sides[side].goals ||
      sides[side].sourceAssists > sides[side].goals
    )
      throw new MatchImportError(
        `Check ${side} appearances, goals, own goals and assists against the result.`,
        `กรุณาตรวจผู้ลงสนาม ประตู การทำเข้าประตูตัวเอง และแอสซิสต์ของ${side === "home" ? "เจ้าบ้าน" : "ทีมเยือน"} ให้ตรงกับผลการแข่งขัน`,
      );
  }
  if (
    !events.length &&
    rows.some(
      ({ stats }) =>
        stats.goals ||
        stats.ownGoals ||
        stats.yellowCards ||
        stats.redCards ||
        stats.penaltyMisses ||
        stats.penaltySaves,
    )
  )
    throw new MatchImportError(
      "Include the scoring and disciplinary events in the match report.",
      "กรุณาระบุเหตุการณ์ทำประตู จุดโทษ หรือใบเหลืองใบแดงในรายงาน",
    );
  const payload = {
    fixtureId,
    homeScore,
    awayScore,
    sources,
    events,
    uncertainties,
    players: rows.map((row) => ({
      fantasyPlayerId: row.fantasyPlayerId,
      ...row.stats,
    })),
  };
  return { rows, payload };
}
