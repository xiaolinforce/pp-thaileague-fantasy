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
    rendered.html.indexOf("อย่าลืมจัดทีมแฟนตาซีของคุณ") <
      rendered.html.indexOf("Fantasy lineup"),
  );
  assert.match(rendered.html, /THAI LEAGUE/);
  assert.match(rendered.html, /FANTASY/);
  assert.match(rendered.html, /https:\/\/fantasy\.ppfootball\.net\/logo\.png/);
  assert.match(rendered.html, /alt="PP"/);
  assert.match(rendered.html, /ศุกร์ที่ 11 ก\.ย\. 16:30 น\./);
  assert.match(rendered.html, /Fri 11 Sep 2026, 16:30 \(Bangkok time\)/);
  assert.equal(rendered.html.match(/GW02/g)?.length, 1);
  assert.match(rendered.html, />Deadline<\/p>/);
  assert.doesNotMatch(rendered.html, /Deadline จัดทีม|Lineup deadline/);
  assert.ok(
    rendered.html.indexOf("ศุกร์ที่ 11 ก.ย. 16:30 น.") <
      rendered.html.indexOf("Fri 11 Sep 2026, 16:30"),
  );
  assert.match(rendered.html, /https:\/\/fantasy\.ppfootball\.net\/team/);
  assert.match(
    rendered.html,
    /https:\/\/fantasy\.ppfootball\.net\/email\/unsubscribe\?token=preview/,
  );
  assert.match(rendered.text, /อย่าลืมจัดทีมแฟนตาซีของคุณ/);
  assert.match(rendered.text, /Don't forget to set your Fantasy lineup/i);
  assert.match(rendered.text, /ศุกร์ที่ 11 ก\.ย\. 16:30 น\./);
  assert.match(rendered.text, /Fri 11 Sep 2026, 16:30 \(Bangkok time\)/);
  assert.match(
    rendered.text,
    /ไปจัดทีม \/ Manage team https:\/\/fantasy\.ppfootball\.net\/team/,
  );
  assert.match(
    rendered.text,
    /Unsubscribe https:\/\/fantasy\.ppfootball\.net\/email\/unsubscribe\?token=preview/,
  );
});

test("omits team-specific prose and the redundant checklist in both languages", async () => {
  const rendered = await renderDeadlineReminderEmail(
    deadlineReminderPreviewProps,
  );

  assert.doesNotMatch(rendered.html, /คลองเตย ยูไนเต็ด/);
  assert.doesNotMatch(rendered.html, /ถึงเวลาตรวจทีมของคุณ/);
  assert.doesNotMatch(rendered.html, /Time to review your lineup/);
  assert.doesNotMatch(rendered.html, /ก่อนบันทึกทีม อย่าลืมตรวจ/);
  assert.doesNotMatch(rendered.html, /Before saving, check your/);
  assert.doesNotMatch(rendered.text, /ผู้เล่นตัวจริงและลำดับตัวสำรอง/);
  assert.doesNotMatch(rendered.text, /Starting eleven and bench order/);
  assert.doesNotMatch(
    rendered.html,
    /การเปลี่ยนแปลงจะมีผลเมื่อบันทึกทีมสำเร็จเท่านั้น|Changes apply only after your team is saved successfully/,
  );
  assert.doesNotMatch(
    rendered.text,
    /การเปลี่ยนแปลงจะมีผลเมื่อบันทึกทีมสำเร็จเท่านั้น|Changes apply only after your team is saved successfully/,
  );
});

test("keeps inbox preview text concise", () => {
  const previewText = deadlineReminderPreviewText(30);

  assert.ok(previewText.length <= 90);
  assert.equal(
    deadlineReminderSubject(30),
    "อย่าลืมจัดทีม GW30 • Lineup reminder",
  );
});
