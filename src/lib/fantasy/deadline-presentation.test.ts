import assert from "node:assert/strict";
import test from "node:test";
import {
  getDeadlineLabels,
  getReminderDeadlineLabels,
} from "./deadline-presentation.ts";

test("deadline labels preserve the Bangkok date across UTC day/year boundaries", () => {
  const labels = getDeadlineLabels("2026-12-31T18:05:00.000Z");
  assert.equal(labels.en, "1 Jan 2027, 1:05");
  assert.match(labels.th, /1 ม\.ค\. 1:05$/);
});

test("the page can serialize both labels without formatting again on the client", () => {
  const labels = getDeadlineLabels("2026-09-04T10:30:00.000Z");
  assert.equal(labels.en, "4 Sep 2026, 17:30");
  assert.match(labels.th, /4 ก\.ย\. 17:30$/);
  assert.deepEqual(JSON.parse(JSON.stringify(labels)), labels);
});

test("reminder labels show both weekdays and the Bangkok time on separate lines", () => {
  const labels = getReminderDeadlineLabels("2026-09-16T15:44:00.000Z");
  assert.equal(labels.th, "พุธที่ 16 ก.ย. 22:44 น.");
  assert.equal(labels.en, "Wed 16 Sep 2026, 22:44 (Bangkok time)");
});

test("reminder labels use the Bangkok day across a UTC year boundary", () => {
  const labels = getReminderDeadlineLabels("2026-12-31T18:05:00.000Z");
  assert.equal(labels.th, "ศุกร์ที่ 1 ม.ค. 1:05 น.");
  assert.equal(labels.en, "Fri 1 Jan 2027, 1:05 (Bangkok time)");
});
