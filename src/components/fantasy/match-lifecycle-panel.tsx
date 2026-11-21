"use client";

import { useActionState } from "react";
import { operateMatchGameweek } from "@/app/fantasy-actions";
import { Button } from "@/components/ui/button";
import { useLanguage } from "./i18n";

const messages: Record<string, [string, string]> = {
  INCOMPLETE: [
    "ยังมีแมตช์ที่แข่งไม่จบ หรือข้อมูลนักเตะและคะแนนยังไม่ครบ",
    "Fixtures, player statistics or scores are incomplete.",
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
}: {
  gameweekId: string;
  number: number;
  status: string;
}) {
  const { language } = useLanguage();
  const [state, action, pending] = useActionState(operateMatchGameweek, {
    outcome: "",
  });
  if (!(status === "open" || status === "provisional")) return null;
  const lock = status === "open";
  const english = language === "en";
  const label = lock
    ? english
      ? "Lock at kickoff and open next GW"
      : "ล็อกเมื่อเริ่มแข่งและเปิด GW ถัดไป"
    : english
      ? "Finalize scores"
      : "ยืนยันคะแนน Final";
  return (
    <form action={action} className="grid justify-items-start gap-2 py-2">
      <input type="hidden" name="gameweekId" value={gameweekId} />
      <input type="hidden" name="operation" value={lock ? "lock" : "final"} />
      <Button type="submit" variant="outline" disabled={pending}>
        {label} · GW {number}
      </Button>
      <div role="status">{messages[state.outcome]?.[english ? 1 : 0]}</div>
    </form>
  );
}
