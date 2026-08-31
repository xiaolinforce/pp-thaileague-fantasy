import { validateFantasyDisplayName } from "../auth/names.ts";

export const PRIVATE_LEAGUE_NAME_MIN_LENGTH = 3;
export const PRIVATE_LEAGUE_NAME_MAX_LENGTH = 40;
export const PRIVATE_LEAGUE_OWNER_LIMIT = 10;
export const PRIVATE_LEAGUE_MEMBERSHIP_LIMIT = 20;
export const PRIVATE_LEAGUE_MEMBER_LIMIT = 100;
export const LEAGUE_STANDINGS_PAGE_SIZE = 25;
export const LEAGUE_INVITE_CODE_LENGTH = 8;
export const LEAGUE_INVITE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const LEAGUE_INVITE_PATTERN = new RegExp(
  `^[${LEAGUE_INVITE_ALPHABET}]{${LEAGUE_INVITE_CODE_LENGTH}}$`,
);

export function validatePrivateLeagueName(value: string) {
  const result = validateFantasyDisplayName(value, {
    minLength: PRIVATE_LEAGUE_NAME_MIN_LENGTH,
    maxLength: PRIVATE_LEAGUE_NAME_MAX_LENGTH,
  });
  if (
    !result.ok &&
    result.message ===
      `ชื่อต้องมี ${PRIVATE_LEAGUE_NAME_MIN_LENGTH}–${PRIVATE_LEAGUE_NAME_MAX_LENGTH} ตัวอักษร`
  ) {
    return {
      ok: false as const,
      message: `ชื่อลีกต้องมี ${PRIVATE_LEAGUE_NAME_MIN_LENGTH}–${PRIVATE_LEAGUE_NAME_MAX_LENGTH} ตัวอักษร`,
    };
  }
  return result;
}

export function normalizeLeagueInviteCode(value: string) {
  return value.trim().toLocaleUpperCase("en-US");
}

export function validateLeagueInviteCode(value: string) {
  const normalized = normalizeLeagueInviteCode(value);
  if (!LEAGUE_INVITE_PATTERN.test(normalized)) {
    return {
      ok: false as const,
      message:
        "รหัสลีกต้องมี 8 ตัว และใช้เฉพาะตัวอักษรอังกฤษหรือตัวเลขที่กำหนด",
    };
  }
  return { ok: true as const, value: normalized };
}

export function createLeagueInviteCode(
  randomValues: (bytes: Uint8Array) => Uint8Array = (bytes) =>
    crypto.getRandomValues(bytes),
) {
  const characters: string[] = [];
  const alphabetLength = LEAGUE_INVITE_ALPHABET.length;
  const rejectionLimit = 256 - (256 % alphabetLength);

  while (characters.length < LEAGUE_INVITE_CODE_LENGTH) {
    const bytes = randomValues(new Uint8Array(LEAGUE_INVITE_CODE_LENGTH));
    for (const byte of bytes) {
      if (byte >= rejectionLimit) continue;
      characters.push(LEAGUE_INVITE_ALPHABET[byte % alphabetLength]);
      if (characters.length === LEAGUE_INVITE_CODE_LENGTH) break;
    }
  }

  return characters.join("");
}
