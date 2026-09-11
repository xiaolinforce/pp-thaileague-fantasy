import assert from "node:assert/strict";
import test from "node:test";

import {
  deadlineAudienceOptions,
  maskRecipientEmail,
  parseDeadlineAudience,
  redactDeadlineRecipient,
} from "./deadline-audience.ts";

test("defaults unknown deadline audiences to the narrow recommended group", () => {
  assert.equal(parseDeadlineAudience(""), "previous-complete");
  assert.equal(parseDeadlineAudience("unexpected"), "previous-complete");
  assert.equal(parseDeadlineAudience("all-members"), "all-members");
  assert.deepEqual(
    deadlineAudienceOptions.map((option) => option.id),
    ["previous-complete", "ever-complete", "all-members"],
  );
});

test("masks recipient addresses while retaining a recognizable domain", () => {
  assert.equal(maskRecipientEmail("player@example.com"), "p••••@example.com");
  assert.equal(maskRecipientEmail("a@example.com"), "a••@example.com");
  assert.equal(maskRecipientEmail("invalid"), "•••");
});

test("removes the full address from recipient data before rendering", () => {
  const recipient = redactDeadlineRecipient({
    team_id: "team-1",
    team_name: "ทีมทดสอบ",
    email: "owner@example.com",
  });

  assert.deepEqual(recipient, {
    team_id: "team-1",
    team_name: "ทีมทดสอบ",
    maskedEmail: "o••••@example.com",
  });
  assert.equal("email" in recipient, false);
});
