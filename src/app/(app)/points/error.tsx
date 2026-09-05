"use client";

import { CompetitionError } from "@/components/fantasy/data-state";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <CompetitionError
      reset={reset}
      title="โหลดคะแนนไม่สำเร็จ"
      description="ลองโหลดคะแนน Gameweek นี้อีกครั้ง หากปัญหายังอยู่ให้กลับมาตรวจสอบภายหลัง"
    />
  );
}
