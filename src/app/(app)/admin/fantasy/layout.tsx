import type { ReactNode } from "react";
import { signOutAdminWithPassword } from "@/app/admin-password-actions";
import { AppShell } from "@/components/fantasy/app-shell";
import { requireAdmin } from "@/lib/auth/context";
import { TranslationNamespace } from "@/components/fantasy/i18n";
import { adminTranslations } from "@/lib/admin-copy";
import styles from "./admin.module.css";
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { accessMode } = await requireAdmin();
  return (
    <TranslationNamespace dictionary={adminTranslations}>
      <AppShell
        adminAccess={
          accessMode === "password"
            ? { mode: "password", signOut: signOutAdminWithPassword }
            : { mode: "account" }
        }
      >
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
