"use client";

import { CompetitionError } from "@/components/fantasy/data-state";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <CompetitionError
      reset={reset}
      title="โหลดโปรไฟล์ไม่สำเร็จ"
      description="ลองโหลดข้อมูลบัญชีและทีมของคุณอีกครั้ง"
    />
  );
}
