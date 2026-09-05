import assert from "node:assert/strict";
import test from "node:test";
import { lazy, Suspense, type ReactNode } from "react";
import { renderToReadableStream, renderToString } from "react-dom/server";
import {
  LanguageProvider,
  Localized,
  useLanguage,
  type Language,
} from "../../src/components/fantasy/i18n";

async function renderSource(children: ReactNode, language: Language) {
  const stream = await renderToReadableStream(
    <LanguageProvider initialLanguage={language}>
      <Localized>
        <Suspense fallback={null}>{children}</Suspense>
      </Localized>
    </LanguageProvider>,
  );
  await stream.allReady;
  return new Response(stream).text();
}

for (const language of ["th", "en"] as const) {
  test(`keeps identical source HTML for opaque and resolved children (${language})`, async () => {
    // RSC children may be opaque during SSR and resolved before hydration.
    // The outer Localized cannot walk the lazy child's rendered text on the
    // server. Both shapes must keep Thai until the boundary hydrates.
    const bench = <h3 title="ม้านั่งสำรอง">ม้านั่งสำรอง</h3>;
    const LazyBench = lazy(async () => ({ default: () => bench }));
    const opaque = await renderSource(<LazyBench />, language);
    const resolved = await renderSource(bench, language);
    assert.equal(resolved, opaque);
    assert.match(resolved, /<h3 title="ม้านั่งสำรอง">ม้านั่งสำรอง<\/h3>/);
  });
}

function LanguageConsumer() {
  const { language, translate } = useLanguage();
  return <p lang={language}>{translate("ม้านั่งสำรอง")}</p>;
}

test("direct client consumers keep the server-supplied member language", () => {
  assert.equal(
    renderToString(
      <LanguageProvider initialLanguage="en">
        <LanguageConsumer />
      </LanguageProvider>,
    ),
    '<p lang="en">Bench</p>',
  );
});

test("a missing provider remains an explicit programming error", () => {
  assert.throws(
    () => renderToString(<LanguageConsumer />),
    /useLanguage must be used inside LanguageProvider/,
  );
});
