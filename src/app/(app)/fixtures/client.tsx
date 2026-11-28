"use client";

import { AppShell } from "@/components/fantasy/app-shell";
import {
  FixturesBrowser,
  type FixturesPageData,
} from "@/components/fantasy/fixtures-browser";

export default function FixturesClient({ data }: { data: FixturesPageData }) {
  return (
    <AppShell localizeContent={false}>
      <main id="main-content" className="content product-content fixtures-page">
        <FixturesBrowser data={data} />
      </main>
    </AppShell>
  );
}
