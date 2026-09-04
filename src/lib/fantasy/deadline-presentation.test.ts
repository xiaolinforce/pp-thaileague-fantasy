import assert from "node:assert/strict";
import test from "node:test";
import { getDeadlineLabels } from "./deadline-presentation.ts";

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
