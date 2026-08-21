"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/fantasy/app-shell";

export function CompetitionLoading() {
  return (
    <AppShell>
      <main
        id="main-content"
        className="competition-state"
        aria-label="กำลังโหลดข้อมูล"
        aria-busy="true"
        aria-live="polite"
      >
        <span className="sr-only">กำลังโหลดข้อมูล…</span>
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
        <div className="competition-skeleton-grid" aria-hidden="true">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton className="h-32 rounded-2xl" key={item} />
          ))}
        </div>
      </main>
    </AppShell>
  );
}

export function CompetitionError({ reset }: { reset: () => void }) {
  return (
    <AppShell>
      <main
        id="main-content"
        className="competition-state error-state"
        role="alert"
      >
        <span aria-hidden="true">
          <AlertTriangle />
        </span>
        <h1>โหลดข้อมูลการแข่งขันไม่สำเร็จ</h1>
        <p>กรุณาตรวจสอบการเชื่อมต่อฐานข้อมูลแล้วลองอีกครั้ง</p>
        <button className="primary-button" onClick={reset}>
          <RefreshCw size={16} aria-hidden="true" /> ลองอีกครั้ง
        </button>
      </main>
    </AppShell>
  );
}
