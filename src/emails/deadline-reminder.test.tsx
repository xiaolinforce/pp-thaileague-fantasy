import assert from "node:assert/strict";
import test from "node:test";

import {
  deadlineReminderPreviewProps,
  deadlineReminderPreviewText,
  deadlineReminderSubject,
} from "./deadline-reminder";
import { renderDeadlineReminderEmail } from "./render-deadline-reminder";

test("renders aligned Thai-first and English reminder content", async () => {
  const rendered = await renderDeadlineReminderEmail(
    deadlineReminderPreviewProps,
  );

  assert.equal(rendered.subject, "อย่าลืมจัดทีม GW2 • Lineup reminder");
  assert.match(rendered.html, /<html[^>]+lang="th"/);
  assert.match(rendered.html, /<body[^>]+lang="th"/);
  assert.ok(
    rendered.html.indexOf("ถึงเวลาตรวจทีมของคุณ") <
      rendered.html.indexOf("Time to review your lineup"),
  );
  assert.match(rendered.html, /คลองเตย ยูไนเต็ด/);
  assert.match(rendered.html, /ศ\.ที่ 11 ก\.ย\. 16:30 น\. \(เวลาไทย\)/);
  assert.match(rendered.html, /11 Sep 2026, 16:30 \(Bangkok time\)/);
  assert.match(rendered.html, /https:\/\/fantasy\.ppfootball\.net\/team/);
  assert.match(
    rendered.html,
    /https:\/\/fantasy\.ppfootball\.net\/email\/unsubscribe\?token=preview/,
  );
  assert.match(rendered.text, /กัปตันและรองกัปตัน/);
  assert.match(rendered.text, /Captain and vice-captain/);
  assert.match(
    rendered.text,
    /ไปจัดทีม \/ Manage team https:\/\/fantasy\.ppfootball\.net\/team/,
  );
  assert.match(
    rendered.text,
    /Unsubscribe https:\/\/fantasy\.ppfootball\.net\/email\/unsubscribe\?token=preview/,
  );
});

test("escapes private team names in rendered HTML", async () => {
  const rendered = await renderDeadlineReminderEmail({
    ...deadlineReminderPreviewProps,
    teamName: '<script>alert("team")</script>',
  });

  assert.doesNotMatch(rendered.html, /<script>alert/);
  assert.match(rendered.html, /&lt;script&gt;/);
});

test("keeps inbox preview text concise", () => {
  const previewText = deadlineReminderPreviewText(30);

  assert.ok(previewText.length <= 90);
  assert.equal(
    deadlineReminderSubject(30),
    "อย่าลืมจัดทีม GW30 • Lineup reminder",
  );
});
