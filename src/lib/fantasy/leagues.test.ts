import assert from "node:assert/strict";
import test from "node:test";

import {
  createLeagueInviteCode,
  LEAGUE_INVITE_ALPHABET,
  normalizeLeagueInviteCode,
  validateLeagueInviteCode,
  validatePrivateLeagueName,
} from "./leagues.ts";

test("normalizes invite codes without accepting ambiguous characters", () => {
  assert.equal(normalizeLeagueInviteCode("  abcd2345 "), "ABCD2345");
  assert.deepEqual(validateLeagueInviteCode("abcd2345"), {
    ok: true,
    value: "ABCD2345",
  });
  for (const code of ["ABCD234", "ABCD23456", "ABCDO345", "ABCD0345"]) {
    assert.equal(validateLeagueInviteCode(code).ok, false);
  }
});

test("generates an eight-character code from the approved alphabet", () => {
  let offset = 0;
  const code = createLeagueInviteCode((bytes) => {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = offset++;
    }
    return bytes;
  });

  assert.equal(code.length, 8);
  assert.match(code, /^[A-HJ-KM-NP-Z2-9]{8}$/);
  assert.ok(
    [...code].every((character) => LEAGUE_INVITE_ALPHABET.includes(character)),
  );
});

test("validates private league names with the shared name policy", () => {
  assert.deepEqual(validatePrivateLeagueName("  เพื่อน ไทยลีก  "), {
    ok: true,
    value: "เพื่อน ไทยลีก",
  });
  assert.deepEqual(validatePrivateLeagueName("ab"), {
    ok: false,
    message: "ชื่อลีกต้องมี 3–40 ตัวอักษร",
  });
  assert.deepEqual(validatePrivateLeagueName("a".repeat(41)), {
    ok: false,
    message: "ชื่อลีกต้องมี 3–40 ตัวอักษร",
  });
  assert.equal(validatePrivateLeagueName("Official Friends").ok, false);
  assert.equal(validatePrivateLeagueName("League 🏆").ok, false);
});
