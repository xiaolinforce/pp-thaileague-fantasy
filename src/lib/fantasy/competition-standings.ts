/**
 * Deterministic Thai League table rules shared by the public standings page,
 * the admin editor, and the server action that persists manual corrections.
 */

export type StandingCounts = {
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  pointsAdjustment: number;
};

export type StandingEntryInput = StandingCounts & { entryId: string };

export type StandingsSubmission = {
  throughMatchweek: number | null;
  /** Ordered from first to last place; the order is the stored position. */
  rows: StandingEntryInput[];
};

export type MatchResult = {
  homeEntryId: string;
  awayEntryId: string;
  homeScore: number;
  awayScore: number;
};

export type FormResult = "W" | "D" | "L";

export const STANDING_LIMITS = {
  matches: 99,
  goals: 999,
  adjustment: 99,
  matchweek: 99,
} as const;

/** Bottom places shown as the relegation zone for a 16-club Thai League 1. */
export const RELEGATION_PLACES = 3;

export const EMPTY_STANDING_COUNTS: StandingCounts = {
  won: 0,
  drawn: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  pointsAdjustment: 0,
};

export function deriveStanding(counts: StandingCounts) {
  return {
    played: counts.won + counts.drawn + counts.lost,
    points: counts.won * 3 + counts.drawn + counts.pointsAdjustment,
    goalDifference: counts.goalsFor - counts.goalsAgainst,
  };
}

/**
 * Suggested order: points, goal difference, then goals scored. Thai League
 * breaks remaining ties on head-to-head records, so admins may still reorder.
 */
export function compareStandings(a: StandingCounts, b: StandingCounts) {
  const left = deriveStanding(a);
  const right = deriveStanding(b);
  return (
    right.points - left.points ||
    right.goalDifference - left.goalDifference ||
    b.goalsFor - a.goalsFor
  );
}

/** Builds counts for each entry from completed fixture scores. */
export function standingsFromResults(
  entryIds: readonly string[],
  results: readonly MatchResult[],
) {
  const table = new Map<string, StandingCounts>(
    entryIds.map((id) => [id, { ...EMPTY_STANDING_COUNTS }]),
  );
  for (const result of results) {
    const home = table.get(result.homeEntryId);
    const away = table.get(result.awayEntryId);
    if (!home || !away) continue;
    home.goalsFor += result.homeScore;
    home.goalsAgainst += result.awayScore;
    away.goalsFor += result.awayScore;
    away.goalsAgainst += result.homeScore;
    if (result.homeScore > result.awayScore) {
      home.won += 1;
      away.lost += 1;
    } else if (result.homeScore < result.awayScore) {
      away.won += 1;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
    }
  }
  return table;
}

/** Latest results first, at most `limit`; `results` must be chronological. */
export function recentForm(
  entryId: string,
  results: readonly MatchResult[],
  limit = 5,
): FormResult[] {
  const form: FormResult[] = [];
  for (let index = results.length - 1; index >= 0; index -= 1) {
    const result = results[index];
    const isHome = result.homeEntryId === entryId;
    if (!isHome && result.awayEntryId !== entryId) continue;
    const scored = isHome ? result.homeScore : result.awayScore;
    const conceded = isHome ? result.awayScore : result.homeScore;
    form.push(scored > conceded ? "W" : scored < conceded ? "L" : "D");
    if (form.length === limit) break;
  }
  return form;
}

export type StandingsValidationError = { th: string; en: string };

function isWholeNumber(value: unknown, min: number, max: number) {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  );
}

/**
 * Validates a submitted table against the season's active entries read from
 * fresh database state. Returns the first problem, or null when valid.
 */
export function validateStandingsSubmission(
  submission: StandingsSubmission,
  activeEntryIds: readonly string[],
): StandingsValidationError | null {
  if (
    submission.throughMatchweek !== null &&
    !isWholeNumber(submission.throughMatchweek, 1, STANDING_LIMITS.matchweek)
  )
    return {
      th: `นัดล่าสุดต้องเป็นจำนวนเต็ม 1–${STANDING_LIMITS.matchweek} หรือเว้นว่าง`,
      en: `The latest matchweek must be a whole number from 1 to ${STANDING_LIMITS.matchweek}, or blank.`,
    };
  const active = new Set(activeEntryIds);
  const seen = new Set<string>();
  for (const row of submission.rows) {
    if (!active.has(row.entryId))
      return {
        th: "พบทีมที่ไม่ได้อยู่ในฤดูกาลนี้ กรุณาโหลดหน้าใหม่",
        en: "A club is not part of this season. Reload the page.",
      };
    if (seen.has(row.entryId))
      return {
        th: "มีทีมซ้ำในตาราง กรุณาโหลดหน้าใหม่",
        en: "A club appears more than once. Reload the page.",
      };
    seen.add(row.entryId);
    const counts = [row.won, row.drawn, row.lost];
    if (!counts.every((v) => isWholeNumber(v, 0, STANDING_LIMITS.matches)))
      return {
        th: `ชนะ เสมอ แพ้ ต้องเป็นจำนวนเต็ม 0–${STANDING_LIMITS.matches}`,
        en: `Won, drawn and lost must be whole numbers from 0 to ${STANDING_LIMITS.matches}.`,
      };
    if (row.won + row.drawn + row.lost > STANDING_LIMITS.matches)
      return {
        th: `จำนวนนัดที่แข่งต้องไม่เกิน ${STANDING_LIMITS.matches}`,
        en: `Matches played cannot exceed ${STANDING_LIMITS.matches}.`,
      };
    if (
      !isWholeNumber(row.goalsFor, 0, STANDING_LIMITS.goals) ||
      !isWholeNumber(row.goalsAgainst, 0, STANDING_LIMITS.goals)
    )
      return {
        th: `ประตูได้และประตูเสียต้องเป็นจำนวนเต็ม 0–${STANDING_LIMITS.goals}`,
        en: `Goals for and against must be whole numbers from 0 to ${STANDING_LIMITS.goals}.`,
      };
    if (
      !isWholeNumber(
        row.pointsAdjustment,
        -STANDING_LIMITS.adjustment,
        STANDING_LIMITS.adjustment,
      )
    )
      return {
        th: `คะแนนปรับต้องเป็นจำนวนเต็ม −${STANDING_LIMITS.adjustment} ถึง ${STANDING_LIMITS.adjustment}`,
        en: `Point adjustments must be whole numbers from −${STANDING_LIMITS.adjustment} to ${STANDING_LIMITS.adjustment}.`,
      };
  }
  if (seen.size !== active.size)
    return {
      th: "ตารางต้องมีครบทุกทีมในฤดูกาล กรุณาโหลดหน้าใหม่",
      en: "The table must include every club in the season. Reload the page.",
    };
  return null;
}
