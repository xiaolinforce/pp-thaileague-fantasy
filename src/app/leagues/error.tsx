"use client";

import { CompetitionError } from "@/components/fantasy/data-state";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <CompetitionError
      reset={reset}
      title="โหลดตารางอันดับไม่สำเร็จ"
      description="ลองโหลดลีกและอันดับล่าสุดอีกครั้ง โดยคะแนนที่บันทึกไว้จะไม่สูญหาย"
    />
  );
}
