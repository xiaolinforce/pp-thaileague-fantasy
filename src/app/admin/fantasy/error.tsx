"use client";

import { useLanguage } from "@/components/fantasy/i18n";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const { translate: t } = useLanguage();
  return (
    <section role="alert">
      <h1>{t("โหลดเครื่องมือผู้ดูแลไม่สำเร็จ")}</h1>
      <p>
        {t(
          "ตรวจสอบสิทธิ์และการเชื่อมต่อข้อมูล แล้วลองเปิดเครื่องมือผู้ดูแลอีกครั้ง",
        )}
      </p>
      <button className="primary-button" onClick={reset}>
        {t("ลองอีกครั้ง")}
      </button>
    </section>
  );
}
