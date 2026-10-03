"use client";

import { AppShell } from "@/components/fantasy/app-shell";
import {
  FixturesBrowser,
  type FixturesPageData,
} from "@/components/fantasy/fixtures-browser";
import { PublicLinks } from "./public-links";

export default function PublicFixtures({ data }: { data: FixturesPageData }) {
  return (
    <AppShell localizeContent={false}>
      <main id="main-content" className="content product-content fixtures-page">
        <FixturesBrowser data={data} />
        <PublicLinks />
      </main>
    </AppShell>
  );
}
