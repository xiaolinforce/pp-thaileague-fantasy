"use client";

import { CompetitionError } from "@/components/fantasy/data-state";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <CompetitionError
      reset={reset}
      title="โหลดเครื่องมือผู้ดูแลไม่สำเร็จ"
      description="ตรวจสอบสิทธิ์และการเชื่อมต่อข้อมูล แล้วลองเปิดเครื่องมือผู้ดูแลอีกครั้ง"
    />
  );
}
