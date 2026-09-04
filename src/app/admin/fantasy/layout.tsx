import type { ReactNode } from "react";
import { AppShell } from "@/components/fantasy/app-shell";
import { requireAdmin } from "@/lib/auth/context";
import styles from "./admin.module.css";
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();
  return (
    <AppShell>
      <main
        id="main-content"
        className={`content product-content ${styles.workspace}`}
      >
        {children}
      </main>
    </AppShell>
  );
}
