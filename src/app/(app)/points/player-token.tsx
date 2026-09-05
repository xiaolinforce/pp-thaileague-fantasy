"use client";

import { X } from "lucide-react";

import { PlayerKit } from "@/components/fantasy/player-kit";
import { PlayerMetaBadges } from "@/components/fantasy/player-meta-badges";
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
import { getBreakdownLabel } from "@/lib/fantasy/points-presentation";

export function PointsPlayerToken({
  member,
  points,
  counted,
  substitution,
  showPositionBadge = false,
  result,
  multiplier = 1,
  readOnly = false,
}: {
  member: FantasyPointsSquadMember;
  points: number;
  counted: boolean;
  substitution?: "in" | "out";
  showPositionBadge?: boolean;
  result?: PlayerPointsRow;
  multiplier?: number;
  readOnly?: boolean;
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
  const hasResult = result !== undefined;
  const hasPlayed = (result?.minutes ?? 0) > 0;
  const scoreDisplay = hasResult ? points : "-";
  const captainPoints = result?.totalPoints ?? points;
  const captainPointsDisplay = !hasPlayed
    ? "-"
    : captainPoints > 0
      ? `+${captainPoints}`
      : `${captainPoints}`;
  const detailRows = Object.entries(result?.breakdown ?? {}).filter(
    ([, value]) => value !== 0,
  );
  const token = (
    <>
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
        <PlayerKit color={member.color} accent={member.accent} size="medium" />
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
      <strong className="points-player-score squad-fixture">
        {scoreDisplay}
      </strong>
    </>
  );

  if (readOnly) {
    return (
      <div
        className={`points-player-token is-read-only${counted ? " is-counted" : " is-uncounted"}${substitution ? ` is-sub-${substitution}` : ""}`}
        title={`${name} · ${club}`}
      >
        {token}
      </div>
    );
  }

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
        {token}
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
            <div className="modal-player-position-badge">
              <PlayerMetaBadges
                player={{
                  position,
                  tier: member.tier,
                  isThai: member.isThai,
                }}
              />
            </div>
          </div>
        </div>

        <div className="points-player-dialog-score">
          <strong>{scoreDisplay}</strong>
          <span>{translate("คะแนน")}</span>
        </div>

        <div className="points-player-breakdown">
          {detailRows.map(([key, value]) => (
            <div key={key}>
              <span>{getBreakdownLabel(key, language)}</span>
              <strong>{value > 0 ? `+${value}` : value}</strong>
            </div>
          ))}
          {multiplier > 1 && hasPlayed && (
            <div>
              <span>
                {language === "th" ? "ตัวคูณกัปตัน" : "Captain multiplier"}
              </span>
              <strong>{captainPointsDisplay}</strong>
            </div>
          )}
        </div>
        {hasResult && !hasPlayed && (
          <p className="points-player-dialog-empty">
            {language === "th"
              ? "ไม่ได้ลงสนามใน Gameweek นี้"
              : "Did not play in this Gameweek."}
          </p>
        )}
        {!hasResult && (
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
