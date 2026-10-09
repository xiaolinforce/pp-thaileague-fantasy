import assert from "node:assert/strict";
import * as nodeModule from "node:module";
import test from "node:test";
import { renderToString } from "react-dom/server";
import {
  LanguageProvider,
  TranslationNamespace,
} from "../../src/components/fantasy/i18n";
import { adminTranslations } from "../../src/lib/admin-copy";
import type { AdminActionButton } from "../../src/app/(app)/admin/fantasy/admin-action-button";

// These render-only checks do not need Next's CSS-module compilation.
// The pinned Node 24 runtime provides sync hooks; this repo's Node 20 types do not.
const { registerHooks } = nodeModule as typeof nodeModule & {
  registerHooks(hooks: {
    load(
      url: string,
      context: unknown,
      nextLoad: (url: string, context: unknown) => unknown,
    ): unknown;
  }): unknown;
};
registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith(".module.css")) {
      return {
        format: "module",
        source: "export default { pendingButton: 'pendingButton' };",
        shortCircuit: true,
      };
    }
    return nextLoad(url, context);
  },
});
async function renderButton(
  language: "th" | "en",
  props: Parameters<typeof AdminActionButton>[0],
  filterPending = false,
) {
  const { AdminActionButton, AdminPendingContext } =
    await import("../../src/app/(app)/admin/fantasy/admin-action-button");
  return renderToString(
    <LanguageProvider initialLanguage={language}>
      <TranslationNamespace dictionary={adminTranslations}>
        <AdminPendingContext.Provider value={filterPending}>
          <AdminActionButton {...props} />
        </AdminPendingContext.Provider>
      </TranslationNamespace>
    </LanguageProvider>,
  );
}

test("idle admin buttons retain their action, type, and disabled eligibility", async () => {
  const idle = await renderButton("th", { children: "ส่ง 5 รายถัดไป" });
  assert.match(idle, /type="submit"/);
  assert.match(idle, /aria-busy="false"/);
  assert.match(idle, /ส่ง 5 รายถัดไป/);
  assert.doesNotMatch(idle, /disabled=""|class="spin"/);
  const unavailable = await renderButton("th", {
    children: "สร้างชุดผู้รับ",
    disabled: true,
    type: "button",
  });
  assert.match(unavailable, /disabled=""/);
  assert.match(unavailable, /type="button"/);
});

for (const language of ["th", "en"] as const) {
  test(`pending admin buttons expose disabled progress and a decorative spinner (${language})`, async () => {
    const html = await renderButton(language, {
      children: "ส่ง 5 รายถัดไป",
      pending: true,
      pendingLabel: "กำลังส่ง…",
    });
    assert.match(html, /disabled=""/);
    assert.match(html, /aria-busy="true"/);
    assert.match(html, /class="spin" aria-hidden="true"/);
    assert.match(html, /role="status"/);
    assert.ok(html.includes(language === "th" ? "กำลังส่ง…" : "Sending…"));
    assert.doesNotMatch(html, /ส่ง 5 รายถัดไป/);
  });
}

test("filter transition context disables its submit button with translated progress", async () => {
  const html = await renderButton(
    "en",
    { children: "ค้นหา", pendingLabel: "กำลังค้นหา…" },
    true,
  );
  assert.match(html, /disabled=""/);
  assert.match(html, /Searching…/);
});
