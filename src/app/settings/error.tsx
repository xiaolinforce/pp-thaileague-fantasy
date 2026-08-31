"use client";

import { CompetitionError } from "@/components/fantasy/data-state";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <CompetitionError
      reset={reset}
      title="โหลดการตั้งค่าไม่สำเร็จ"
      description="ลองโหลดการตั้งค่าบัญชีและภาษาอีกครั้ง"
    />
  );
}
