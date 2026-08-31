import assert from "node:assert/strict";
import test from "node:test";

import { parseInterfaceLanguage } from "./preferences.ts";

test("accepts supported interface languages", () => {
  assert.equal(parseInterfaceLanguage("th"), "th");
  assert.equal(parseInterfaceLanguage("en"), "en");
});

test("rejects unsupported or malformed language values", () => {
  assert.equal(parseInterfaceLanguage("TH"), null);
  assert.equal(parseInterfaceLanguage("english"), null);
  assert.equal(parseInterfaceLanguage(""), null);
  assert.equal(parseInterfaceLanguage(null), null);
});
