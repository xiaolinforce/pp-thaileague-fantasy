"use client";
import { CompetitionError } from "@/components/fantasy/data-state";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <CompetitionError
      reset={reset}
      title="โหลดตารางคะแนนไม่สำเร็จ"
      description="กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง"
    />
  );
}
