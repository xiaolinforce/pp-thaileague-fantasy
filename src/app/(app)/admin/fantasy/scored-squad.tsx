import { Zap } from "lucide-react";

import { PointsPlayerToken } from "@/components/fantasy/points-player-token";
import type { FantasyPointsSquadMember, PlayerPointsRow } from "@/data/fantasy";
import {
  getDisplayedPlayerPoints,
  sortBenchMembersForDisplay,
} from "@/lib/fantasy/points-presentation";
import type { FantasyChip } from "@/lib/fantasy/rules";
import styles from "./admin.module.css";

const positionRows = [
  "goalkeeper",
  "defender",
  "midfielder",
  "forward",
] as const;

type ScoredSquadScore = {
  totalPoints: number;
  autoSubstitutions: Array<{ out: string; in: string }>;
  countedPlayerIds?: string[];
};

export function AdminScoredSquad({
  squad,
  players,
  score,
  activeChip = null,
}: {
  squad: FantasyPointsSquadMember[];
  players: PlayerPointsRow[];
  score: ScoredSquadScore | null;
  activeChip?: FantasyChip | null;
}) {
  const resultByPlayer = new Map(
    players.map((player) => [player.fantasyPlayerId, player]),
  );
  const autoSubstitutions = score?.autoSubstitutions ?? [];
  const autoSubIn = new Set(autoSubstitutions.map((item) => item.in));
  const autoSubOut = new Set(autoSubstitutions.map((item) => item.out));
  const fieldMembers = squad.filter(
    (member) =>
      (member.lineupRole === "starter" &&
        !autoSubOut.has(member.fantasyPlayerId)) ||
      autoSubIn.has(member.fantasyPlayerId),
  );
  const benchMembers = sortBenchMembersForDisplay(
    squad.filter(
      (member) =>
        (member.lineupRole === "bench" &&
          !autoSubIn.has(member.fantasyPlayerId)) ||
        autoSubOut.has(member.fantasyPlayerId),
    ),
    squad,
    autoSubstitutions,
  );
  const countedIds = new Set(
    score?.countedPlayerIds ??
      (activeChip === "bench_boost"
        ? squad.map((member) => member.fantasyPlayerId)
        : fieldMembers.map((member) => member.fantasyPlayerId)),
  );
  const captain = squad.find((member) => member.captainRole === "captain");
  const viceCaptain = squad.find(
    (member) => member.captainRole === "vice_captain",
  );
  const scoringCaptain =
    captain && (resultByPlayer.get(captain.fantasyPlayerId)?.minutes ?? 0) > 0
      ? captain
      : viceCaptain &&
          (resultByPlayer.get(viceCaptain.fantasyPlayerId)?.minutes ?? 0) > 0
        ? viceCaptain
        : undefined;
  const captainMultiplier = activeChip === "triple_captain" ? 3 : 2;
  const contribution = (fantasyPlayerId: string) =>
    getDisplayedPlayerPoints({
      rawPoints: resultByPlayer.get(fantasyPlayerId)?.totalPoints ?? 0,
      counted: countedIds.has(fantasyPlayerId),
      isScoringCaptain: scoringCaptain?.fantasyPlayerId === fantasyPlayerId,
      captainMultiplier,
    });
  const activeChipLabel =
    activeChip === "triple_captain"
      ? "กัปตัน ×3"
      : activeChip === "bench_boost"
        ? "นับตัวสำรอง"
        : activeChip === "wildcard"
          ? "ซื้อขายตัวอิสระ"
          : null;

  return (
    <>
      <section className={styles.optimalScoreCard} aria-label="สรุปคะแนน">
        <strong>{score?.totalPoints ?? "—"}</strong>
        <span>คะแนน</span>
      </section>

      <section
        className={`product-card points-pitch-card ${styles.optimalPitch}`}
      >
        {activeChipLabel ? (
          <div className="points-chip-banner">
            <span className="points-chip-banner__icon" aria-hidden="true">
              <Zap size={16} fill="currentColor" />
            </span>
            <strong className="points-chip-banner__label">
              {activeChipLabel}
            </strong>
          </div>
        ) : null}
        <div className="points-pitch">
          <div className="field-lines" aria-hidden="true">
            <span />
            <i />
            <b />
          </div>
          <div className="points-pitch-rows">
            {positionRows.map((position) => (
              <div className="points-pitch-row" key={position}>
                {fieldMembers
                  .filter((member) => member.position === position)
                  .map((member) => (
                    <PointsPlayerToken
                      key={member.fantasyPlayerId}
                      member={member}
                      points={contribution(member.fantasyPlayerId)}
                      counted={countedIds.has(member.fantasyPlayerId)}
                      substitution={
                        autoSubIn.has(member.fantasyPlayerId) ? "in" : undefined
                      }
                      result={resultByPlayer.get(member.fantasyPlayerId)}
                      multiplier={
                        scoringCaptain?.fantasyPlayerId ===
                        member.fantasyPlayerId
                          ? captainMultiplier
                          : 1
                      }
                    />
                  ))}
              </div>
            ))}
          </div>
        </div>
        <div className="points-bench-panel">
          <div className="bench-title">
            <h3>ม้านั่งสำรอง</h3>
          </div>
          <div className="points-bench-grid">
            {benchMembers.map((member, index) => (
              <div className="points-bench-item" key={member.fantasyPlayerId}>
                <b>{index === 0 ? "GK" : index}</b>
                <PointsPlayerToken
                  member={member}
                  points={contribution(member.fantasyPlayerId)}
                  counted={countedIds.has(member.fantasyPlayerId)}
                  substitution={
                    autoSubOut.has(member.fantasyPlayerId) ? "out" : undefined
                  }
                  showPositionBadge
                  result={resultByPlayer.get(member.fantasyPlayerId)}
                  multiplier={
                    scoringCaptain?.fantasyPlayerId === member.fantasyPlayerId
                      ? captainMultiplier
                      : 1
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
