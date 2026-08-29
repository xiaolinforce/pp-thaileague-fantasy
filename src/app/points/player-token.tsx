"use client";

import { PlayerKit } from "@/components/fantasy/player-kit";
import { PlayerMetaBadges } from "@/components/fantasy/player-meta-badges";
import { PositionBadge } from "@/components/fantasy/position-badge";
import { useLanguage } from "@/components/fantasy/i18n";
import type { FantasyPointsSquadMember } from "@/data/fantasy";
import { localize } from "@/lib/competition-types";

export function PointsLocalizedName({
  value,
}: {
  value: { th: string; en: string };
}) {
  const { language } = useLanguage();
  return <>{localize(value, language)}</>;
}

export function PointsPlayerToken({
  member,
  points,
  counted,
  multiplier = 1,
  substitution,
  showPositionBadge = false,
}: {
  member: FantasyPointsSquadMember;
  points: number;
  counted: boolean;
  multiplier?: number;
  substitution?: "in" | "out";
  showPositionBadge?: boolean;
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
  const state =
    substitution === "in"
      ? translate("Auto-sub เข้า")
      : substitution === "out"
        ? translate("Auto-sub ออก")
        : counted
          ? multiplier > 1
            ? `×${multiplier}`
            : translate("นับคะแนน")
          : translate("ไม่นับคะแนน");

  return (
    <article
      className={`points-player-token${counted ? " is-counted" : " is-uncounted"}${substitution ? ` is-sub-${substitution}` : ""}`}
      title={`${name} · ${club}`}
      aria-label={`${name}, ${position}, ${club}, ${language === "th" ? `ระดับ ${member.tier}` : `Tier ${member.tier}`}, ${points} ${translate("คะแนน")}, ${state}`}
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
      <span className="points-player-meta">
        <PlayerMetaBadges
          player={{ position, tier: member.tier, isThai: member.isThai }}
          showPosition={false}
        />
      </span>
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
      <span className="points-player-club squad-fixture">{club}</span>
      <strong className="points-player-score">
        {points}
        <small>{translate("คะแนน")}</small>
      </strong>
      <span className="points-player-state">{state}</span>
    </article>
  );
}
