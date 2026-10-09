"use client";

import { useLanguage } from "@/components/fantasy/i18n";
import { useTransition } from "react";
import { AdminActionButton } from "./admin-action-button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const { translate: t } = useLanguage();
  const [pending, startTransition] = useTransition();
  return (
    <section role="alert">
      <h1>{t("โหลดเครื่องมือผู้ดูแลไม่สำเร็จ")}</h1>
      <p>
        {t(
          "ตรวจสอบสิทธิ์และการเชื่อมต่อข้อมูล แล้วลองเปิดเครื่องมือผู้ดูแลอีกครั้ง",
        )}
      </p>
      <AdminActionButton
        type="button"
        pending={pending}
        pendingLabel="กำลังโหลด…"
        onClick={() => startTransition(reset)}
      >
        {t("ลองอีกครั้ง")}
      </AdminActionButton>
    </section>
  );
}
