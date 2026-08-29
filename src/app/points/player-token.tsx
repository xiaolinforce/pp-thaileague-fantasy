"use client";

import { X } from "lucide-react";

import { PlayerKit } from "@/components/fantasy/player-kit";
import { PositionBadge } from "@/components/fantasy/position-badge";
import { useLanguage } from "@/components/fantasy/i18n";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { FantasyPointsSquadMember, PlayerPointsRow } from "@/data/fantasy";
import { localize } from "@/lib/competition-types";

const breakdownLabels: Record<string, { th: string; en: string }> = {
  appearance: { th: "ลงสนาม", en: "Appearance" },
  goals: { th: "ประตู", en: "Goals" },
  assists: { th: "แอสซิสต์", en: "Assists" },
  cleanSheet: { th: "คลีนชีต", en: "Clean sheets" },
  saves: { th: "เซฟ", en: "Saves" },
  penaltySaves: { th: "เซฟจุดโทษ", en: "Penalty saves" },
  penaltyMisses: { th: "พลาดจุดโทษ", en: "Penalty misses" },
  goalsConceded: { th: "เสียประตู", en: "Goals conceded" },
  yellowCards: { th: "ใบเหลือง", en: "Yellow cards" },
  redCards: { th: "ใบแดง", en: "Red cards" },
  ownGoals: { th: "เข้าประตูตัวเอง", en: "Own goals" },
};

export function PointsPlayerToken({
  member,
  points,
  counted,
  substitution,
  showPositionBadge = false,
  result,
  multiplier = 1,
}: {
  member: FantasyPointsSquadMember;
  points: number;
  counted: boolean;
  substitution?: "in" | "out";
  showPositionBadge?: boolean;
  result?: PlayerPointsRow;
  multiplier?: number;
}) {
  const { language, translate } = useLanguage();
  const name = localize(member.name, language);
  const shortName = localize(member.shortName, language);
  const club = localize(member.clubShort, language);
  const position = {
    goalkeeper: "GK",
    defender: "DEF",
    midfielder: "MID",
    forward: "FWD",
  }[member.position] as "GK" | "DEF" | "MID" | "FWD";
  const captain =
    member.captainRole === "captain"
      ? "C"
      : member.captainRole === "vice_captain"
        ? "V"
        : null;
  const detailRows = Object.entries(result?.breakdown ?? {}).filter(
    ([, value]) => value !== 0,
  );
  const positionName = {
    th: {
      GK: "ผู้รักษาประตู",
      DEF: "กองหลัง",
      MID: "กองกลาง",
      FWD: "กองหน้า",
    },
    en: {
      GK: "Goalkeeper",
      DEF: "Defender",
      MID: "Midfielder",
      FWD: "Forward",
    },
  }[language][position];
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className={`points-player-token${counted ? " is-counted" : " is-uncounted"}${substitution ? ` is-sub-${substitution}` : ""}`}
            title={`${name} · ${club}`}
            aria-label={
              language === "th"
                ? `ดูรายละเอียดคะแนนของ ${name}`
                : `View points details for ${name}`
            }
          />
        }
      >
        {captain && (
          <span className="points-captain-role">
            <i
              className={`captain-badge ${
                captain === "C"
                  ? "captain-badge--captain"
                  : "captain-badge--vice-captain"
              }`}
              aria-label={
                captain === "C" ? translate("กัปตัน") : translate("รองกัปตัน")
              }
            >
              {captain}
            </i>
          </span>
        )}
        <span className="points-player-kit">
          <PlayerKit
            color={member.color}
            accent={member.accent}
            size="medium"
          />
          {showPositionBadge && position !== "GK" && (
            <span className="points-player-position">
              <PositionBadge position={position} />
            </span>
          )}
        </span>
        <span
          className={`points-player-name squad-name squad-name--${member.isThai ? "thai" : "foreign"}`}
        >
          {shortName}
        </span>
        <strong className="points-player-score squad-fixture">{points}</strong>
      </DialogTrigger>

      <DialogContent
        className="product-dialog accessible-player-modal points-player-dialog"
        showCloseButton={false}
      >
        <DialogClose render={<button type="button" className="modal-close" />}>
          <X size={18} aria-hidden="true" />
          <span className="sr-only">
            {language === "th" ? "ปิดรายละเอียดคะแนน" : "Close points details"}
          </span>
        </DialogClose>
        <div className="modal-player-top">
          <PlayerKit color={member.color} accent={member.accent} size="large" />
          <div className="modal-player-identity">
            <DialogHeader className="modal-player-heading">
              <DialogTitle>{name}</DialogTitle>
              <DialogDescription>{club}</DialogDescription>
            </DialogHeader>
            <PositionBadge position={position} />
          </div>
        </div>

        <div className="points-player-dialog-score">
          <strong>{points}</strong>
          <span>{translate("คะแนน")}</span>
        </div>

        <div className="points-player-breakdown">
          <div>
            <span>{language === "th" ? "ตำแหน่ง" : "Position"}</span>
            <strong>{positionName}</strong>
          </div>
          <div>
            <span>
              {language === "th" ? "นาทีที่ลงสนาม" : "Minutes played"}
            </span>
            <strong>{result?.minutes ?? 0}</strong>
          </div>
          {detailRows.map(([key, value]) => (
            <div key={key}>
              <span>{breakdownLabels[key]?.[language] ?? key}</span>
              <strong>{value > 0 ? `+${value}` : value}</strong>
            </div>
          ))}
          {multiplier > 1 && (
            <div>
              <span>
                {language === "th" ? "ตัวคูณกัปตัน" : "Captain multiplier"}
              </span>
              <strong>×{multiplier}</strong>
            </div>
          )}
        </div>
        {detailRows.length === 0 && (
          <p className="points-player-dialog-empty">
            {language === "th"
              ? "ยังไม่มีรายละเอียดคะแนนใน Gameweek นี้"
              : "No scoring details are available for this Gameweek yet."}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
