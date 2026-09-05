"use client";

import { useMemo } from "react";

import { useLanguage } from "@/components/fantasy/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { FantasyPointsSquadMember, PlayerPointsRow } from "@/data/fantasy";
import { getDisplayedPlayerPoints } from "@/lib/fantasy/points-presentation";
import { PointsPlayerToken } from "./player-token";

const positionRows = [
  "goalkeeper",
  "defender",
  "midfielder",
  "forward",
] as const;

type HighestScoringTeam = {
  name: string;
  totalPoints: number;
  activeChip: "triple_captain" | "bench_boost" | "wildcard" | null;
  autoSubstitutions: Array<{ out: string; in: string }>;
  squad: FantasyPointsSquadMember[];
};

export function HighestScoreDialog({
  team,
  players,
}: {
  team: HighestScoringTeam | null;
  players: PlayerPointsRow[];
}) {
  const { translate } = useLanguage();
  const teamView = useMemo(() => {
    if (!team) return null;
    const resultsByPlayer = new Map(
      players.map((player) => [player.fantasyPlayerId, player]),
    );
    const autoSubIn = new Set(team.autoSubstitutions.map((item) => item.in));
    const autoSubOut = new Set(team.autoSubstitutions.map((item) => item.out));
    const fieldMembers = team.squad.filter(
      (member) =>
        (member.lineupRole === "starter" &&
          !autoSubOut.has(member.fantasyPlayerId)) ||
        autoSubIn.has(member.fantasyPlayerId),
    );
    const benchMembers = team.squad
      .filter(
        (member) =>
          (member.lineupRole === "bench" &&
            !autoSubIn.has(member.fantasyPlayerId)) ||
          autoSubOut.has(member.fantasyPlayerId),
      )
      .sort((a, b) => (a.benchOrder ?? 99) - (b.benchOrder ?? 99));
    const countedIds = new Set(
      team.activeChip === "bench_boost"
        ? team.squad.map((member) => member.fantasyPlayerId)
        : fieldMembers.map((member) => member.fantasyPlayerId),
    );
    const captain = team.squad.find(
      (member) => member.captainRole === "captain",
    );
    const viceCaptain = team.squad.find(
      (member) => member.captainRole === "vice_captain",
    );
    const scoringCaptain =
      captain &&
      (resultsByPlayer.get(captain.fantasyPlayerId)?.minutes ?? 0) > 0
        ? captain
        : viceCaptain &&
            (resultsByPlayer.get(viceCaptain.fantasyPlayerId)?.minutes ?? 0) > 0
          ? viceCaptain
          : undefined;
    const captainMultiplier = team.activeChip === "triple_captain" ? 3 : 2;
    const playerContribution = (fantasyPlayerId: string) =>
      getDisplayedPlayerPoints({
        rawPoints: resultsByPlayer.get(fantasyPlayerId)?.totalPoints ?? 0,
        counted: countedIds.has(fantasyPlayerId),
        isScoringCaptain: scoringCaptain?.fantasyPlayerId === fantasyPlayerId,
        captainMultiplier,
      });
    return {
      resultsByPlayer,
      autoSubIn,
      autoSubOut,
      benchMembers,
      countedIds,
      fieldMembers,
      playerContribution,
      scoringCaptain,
      captainMultiplier,
    };
  }, [players, team]);

  if (!team || !teamView) {
    return (
      <article className="points-score-card points-score-card--supporting">
        <span>{translate("คะแนนสูงสุด")}</span>
        <strong>0</strong>
        <small>{translate("คะแนน")}</small>
      </article>
    );
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="points-score-card points-score-card--supporting points-score-card--interactive"
            aria-label={`${translate("ดูทีมคะแนนสูงสุด")} ${team.name}`}
          />
        }
      >
        <span>{translate("คะแนนสูงสุด")}</span>
        <strong>{team.totalPoints}</strong>
        <small>{translate("คะแนน")}</small>
      </DialogTrigger>
      <DialogContent
        className="product-dialog points-highest-team-dialog"
        showCloseButton
        closeLabel={translate("ปิด")}
      >
        <DialogHeader>
          <DialogTitle>{team.name}</DialogTitle>
        </DialogHeader>
        <div className="points-pitch">
          <div className="field-lines" aria-hidden="true">
            <span />
            <i />
            <b />
          </div>
          <div className="points-pitch-rows">
            {positionRows.map((position) => (
              <div className="points-pitch-row" key={position}>
                {teamView.fieldMembers
                  .filter((member) => member.position === position)
                  .map((member) => (
                    <PointsPlayerToken
                      key={member.fantasyPlayerId}
                      member={member}
                      points={teamView.playerContribution(
                        member.fantasyPlayerId,
                      )}
                      counted
                      substitution={
                        teamView.autoSubIn.has(member.fantasyPlayerId)
                          ? "in"
                          : undefined
                      }
                      result={teamView.resultsByPlayer.get(
                        member.fantasyPlayerId,
                      )}
                      multiplier={
                        teamView.scoringCaptain?.fantasyPlayerId ===
                        member.fantasyPlayerId
                          ? teamView.captainMultiplier
                          : 1
                      }
                      readOnly
                    />
                  ))}
              </div>
            ))}
          </div>
        </div>
        <div className="points-bench-panel">
          <div className="bench-title">
            <h3>{translate("ม้านั่งสำรอง")}</h3>
          </div>
          <div className="points-bench-grid">
            {teamView.benchMembers.map((member, index) => (
              <div className="points-bench-item" key={member.fantasyPlayerId}>
                <b>{index === 0 ? "GK" : index}</b>
                <PointsPlayerToken
                  member={member}
                  points={teamView.playerContribution(member.fantasyPlayerId)}
                  counted={teamView.countedIds.has(member.fantasyPlayerId)}
                  substitution={
                    teamView.autoSubOut.has(member.fantasyPlayerId)
                      ? "out"
                      : undefined
                  }
                  showPositionBadge
                  result={teamView.resultsByPlayer.get(member.fantasyPlayerId)}
                  multiplier={
                    teamView.scoringCaptain?.fantasyPlayerId ===
                    member.fantasyPlayerId
                      ? teamView.captainMultiplier
                      : 1
                  }
                  readOnly
                />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
