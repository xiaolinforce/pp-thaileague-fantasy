"use client";

import { Info } from "lucide-react";
import { useLanguage } from "./i18n";

export function TierReliefNotice({
  count,
  pending,
  incomplete,
}: {
  count: number;
  pending: boolean;
  incomplete: boolean;
}) {
  const { translate } = useLanguage();
  return (
    <div className="tier-relief-notice" role="status" aria-live="polite">
      <Info size={18} aria-hidden="true" />
      <div>
        <strong>
          {translate("ระดับ 1: {count}/5 คน · ผ่อนผันจากการปรับระดับ").replace(
            "{count}",
            String(count),
          )}
        </strong>
        <p>
          {count > 5
            ? translate(
                "จัดทีมและบันทึกได้โดยคงระดับ 1 เดิมไว้ แต่ซื้อระดับ 1 คนใหม่ไม่ได้ขณะยังเกินโควตา ลดอีก {count} คนเพื่อกลับสู่กติกาปกติ",
              ).replace("{count}", String(count - 5))
            : translate(
                "เมื่อบันทึกทีมครบ 15 คนโดยมีระดับ 1 ไม่เกิน 5 คน สิทธิ์ผ่อนผันจะสิ้นสุด และซื้อขายตามกติกาปกติ",
              )}
        </p>
        {pending && (
          <small>{translate("ตัวเลขนี้รวมรายการที่ยังไม่ได้บันทึก")}</small>
        )}
        {incomplete && (
          <small>{translate("เลือกนักเตะให้ครบ 15 คนก่อนบันทึก")}</small>
        )}
        <details>
          <summary>{translate("เงื่อนไขสิทธิ์ผ่อนผัน")}</summary>
          <p>
            {translate(
              "สิทธิ์ใช้ต่อเนื่องข้ามเกมวีคได้ เมื่อขายระดับ 1 แล้วบันทึก จะซื้อคนนั้นกลับขณะยังเกินโควตาไม่ได้ การยกเลิกรายการที่ยังไม่บันทึกทำได้ และกติกาการโอนกับการหักคะแนนยังเหมือนเดิม",
            )}
          </p>
        </details>
      </div>
    </div>
  );
}
