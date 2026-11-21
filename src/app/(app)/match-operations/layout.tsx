import type { ReactNode } from "react";
import { AppShell } from "@/components/fantasy/app-shell";
import { TranslationNamespace } from "@/components/fantasy/i18n";
import { requireMatchOperator } from "@/lib/auth/context";
import { adminTranslations } from "@/lib/admin-copy";
import styles from "../admin/fantasy/admin.module.css";

export default async function MatchOperationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireMatchOperator();
  return (
    <TranslationNamespace dictionary={adminTranslations}>
      <AppShell>
        <main
          id="main-content"
          className={`content product-content ${styles.workspace}`}
        >
          {children}
        </main>
      </AppShell>
    </TranslationNamespace>
  );
}
