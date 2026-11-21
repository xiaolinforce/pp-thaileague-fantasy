"use client";

import { useActionState } from "react";
import {
  issueOperatorFinalCode,
  operateMatchGameweek,
} from "@/app/fantasy-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "./i18n";

const messages: Record<string, [string, string]> = {
  GRANTED: [
    "ส่งรหัสนี้ให้ Nene พร้อมคำสั่ง Final รหัสหมดอายุใน 48 ชั่วโมง และต้องออกใหม่หากแก้ข้อมูลแมตช์",
    "Include this code in your Final instruction to Nene. It expires in 48 hours or when match data changes.",
  ],
  INCOMPLETE: [
    "ยังมีแมตช์ที่แข่งไม่จบ หรือข้อมูลนักเตะและคะแนนยังไม่ครบ",
    "Fixtures, player statistics or scores are incomplete.",
  ],
  APPROVAL: [
    "ต้องใช้รหัสล่าสุดจากเจ้าของสำหรับข้อมูลชุดนี้",
    "Enter the owner's latest authorization code for these results.",
  ],
  PERMISSION: [
    "บัญชีนี้ไม่มีสิทธิ์ดำเนินการ",
    "This account cannot perform this action.",
  ],
  KICKOFF: [
    "ยังไม่ถึงเวลาเริ่มการแข่งขันของ GW นี้",
    "The first fixture in this Gameweek has not started.",
  ],
  STATUS: ["ตรวจสถานะ Gameweek อีกครั้ง", "Check the current Gameweek status."],
  LOCKED: [
    "ล็อกทีมและปรับคะแนนเป็น Provisional แล้ว",
    "Selections locked and scores are provisional.",
  ],
  FINAL: ["ยืนยันคะแนน Final แล้ว", "Scores are final."],
};

export function MatchLifecyclePanel({
  gameweekId,
  number,
  status,
  grant = false,
}: {
  gameweekId: string;
  number: number;
  status: string;
  grant?: boolean;
}) {
  const { language } = useLanguage();
  const [state, action, pending] = useActionState(
    grant ? issueOperatorFinalCode : operateMatchGameweek,
    { outcome: "" },
  );
  if (!(status === "open" || status === "provisional")) return null;
  const lock = status === "open";
  const english = language === "en";
  const label = grant
    ? english
      ? "Issue Final code for Nene"
      : "ออกรหัสสั่ง Nene ให้ Final"
    : lock
      ? english
        ? "Lock at kickoff and open next GW"
        : "ล็อกเมื่อเริ่มแข่งและเปิด GW ถัดไป"
      : english
        ? "Finalize with owner's code"
        : "ยืนยัน Final ด้วยรหัสของเจ้าของ";
  return (
    <form action={action} className="grid justify-items-start gap-2 py-2">
      <input type="hidden" name="gameweekId" value={gameweekId} />
      <input type="hidden" name="operation" value={lock ? "lock" : "final"} />
      {!grant && !lock && (
        <label className="grid gap-1">
          {english ? "Owner authorization code" : "รหัสอนุมัติจากเจ้าของ"} · GW{" "}
          {number}
          <Input
            type="password"
            name="code"
            required
            autoComplete="off"
            maxLength={32}
          />
        </label>
      )}
      <Button type="submit" variant="outline" disabled={pending}>
        {label} · GW {number}
      </Button>
      <div role="status">
        {messages[state.outcome]?.[english ? 1 : 0]}
        {state.code && (
          <p>
            <code className="break-all select-all">{state.code}</code>
          </p>
        )}
      </div>
    </form>
  );
}
