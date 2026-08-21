"use client";

import { PlayerKit } from "@/components/fantasy/player-kit";
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
}: {
  member: FantasyPointsSquadMember;
  points: number;
  counted: boolean;
  multiplier?: number;
  substitution?: "in" | "out";
}) {
  const { language, translate } = useLanguage();
  const name = localize(member.name, language);
  const club = localize(member.clubShort, language);
  const captain =
    member.captainRole === "captain"
      ? "C"
      : member.captainRole === "vice_captain"
        ? "V"
        : null;

  return (
    <article
      className={`points-player-token${counted ? " is-counted" : " is-uncounted"}${substitution ? ` is-sub-${substitution}` : ""}`}
      title={`${name} · ${club}`}
    >
      <span className="points-player-kit">
        <PlayerKit color={member.color} accent={member.accent} size="medium" />
        {captain && <i>{captain}</i>}
      </span>
      <span className="points-player-name">{name.split(" ")[0]}</span>
      <strong>
        {points}
        <small>{translate(" คะแนน")}</small>
      </strong>
      <span className="points-player-state">
        {substitution === "in"
          ? translate("Auto-sub เข้า")
          : substitution === "out"
            ? translate("Auto-sub ออก")
            : counted
              ? multiplier > 1
                ? `×${multiplier}`
                : translate("นับคะแนน")
              : translate("ไม่นับคะแนน")}
      </span>
    </article>
  );
}
