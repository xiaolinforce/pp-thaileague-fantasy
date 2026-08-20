const NAME_PATTERN = /^[\p{Script=Thai}A-Za-z0-9 ._-]+$/u;
const RESERVED_NAMES = [
  "admin",
  "administrator",
  "moderator",
  "official",
  "support",
  "pp thai league fantasy",
  "pp thaileague fantasy",
];
const BLOCKED_TERMS = ["fuck", "shit", "ควย", "หี", "เย็ด", "เหี้ย"];

export const NAME_MIN_LENGTH = 3;
export const NAME_MAX_LENGTH = 30;

export function normalizeFantasyName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function validateFantasyName(value: string) {
  const normalized = normalizeFantasyName(value);
  if (
    normalized.length < NAME_MIN_LENGTH ||
    normalized.length > NAME_MAX_LENGTH
  ) {
    return {
      ok: false as const,
      message: `ชื่อต้องมี ${NAME_MIN_LENGTH}–${NAME_MAX_LENGTH} ตัวอักษร`,
    };
  }
  if (!NAME_PATTERN.test(normalized)) {
    return {
      ok: false as const,
      message: "ใช้ได้เฉพาะภาษาไทย อังกฤษ ตัวเลข เว้นวรรค และ . _ -",
    };
  }
  const comparable = normalized.toLocaleLowerCase("en-US");
  if (RESERVED_NAMES.some((name) => comparable.includes(name))) {
    return {
      ok: false as const,
      message: "ชื่อนี้อาจทำให้เข้าใจผิดว่าเป็นทีมงานหรือบัญชีทางการ",
    };
  }
  if (BLOCKED_TERMS.some((term) => comparable.includes(term))) {
    return { ok: false as const, message: "ชื่อนี้มีคำที่ไม่อนุญาต" };
  }
  return { ok: true as const, value: normalized };
}

const RANDOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createGuestNames() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(
    bytes,
    (value) => RANDOM_ALPHABET[value % RANDOM_ALPHABET.length],
  ).join("");
  return {
    managerName: `guest-${suffix}`,
    teamName: `guest-team-${suffix}`,
  };
}
