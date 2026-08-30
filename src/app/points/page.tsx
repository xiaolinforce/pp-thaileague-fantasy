import { Zap } from "lucide-react";
import { redirect } from "next/navigation";

import { AppShell, PageHeader } from "@/components/fantasy/app-shell";
import { getFantasyPointsState } from "@/data/fantasy";
import { getFantasyNavigationAvailability } from "@/data/navigation";
import { parsePointsGameweek } from "@/lib/fantasy/points-gameweek";
import { getDisplayedPlayerPoints } from "@/lib/fantasy/points-presentation";
import { PointsGameweekSwitcher } from "./gameweek-switcher";
import { PointsPlayerToken } from "./player-token";

const positionRows = [
  "goalkeeper",
  "defender",
  "midfielder",
  "forward",
] as const;

export default async function PointsPage({
  searchParams,
}: {
  searchParams: Promise<{ gw?: string | string[] }>;
}) {
  const navigationAvailability = await getFantasyNavigationAvailability();
  if (!navigationAvailability.pointsEnabled) redirect("/team");

  const query = await searchParams;
  const parsedGameweek = parsePointsGameweek(query.gw);
  const points = await getFantasyPointsState(parsedGameweek.requested);
  const isCanonicalGameweek =
    parsedGameweek.canonical &&
    (!parsedGameweek.supplied ||
      points.fantasy.gameweek.number === parsedGameweek.requested);
  if (!isCanonicalGameweek) {
    redirect(`/points?gw=${points.fantasy.gameweek.number}`);
  }
  const resultByPlayer = new Map(
    points.players.map((player) => [player.fantasyPlayerId, player]),
  );
  const autoSubstitutions = points.teamScore?.autoSubstitutions ?? [];
  const autoSubIn = new Set(autoSubstitutions.map((item) => item.in));
  const autoSubOut = new Set(autoSubstitutions.map((item) => item.out));
  const fieldMembers = points.squad.filter(
    (member) =>
      (member.lineupRole === "starter" &&
        !autoSubOut.has(member.fantasyPlayerId)) ||
      autoSubIn.has(member.fantasyPlayerId),
  );
  const benchMembers = points.squad
    .filter(
      (member) =>
        (member.lineupRole === "bench" &&
          !autoSubIn.has(member.fantasyPlayerId)) ||
        autoSubOut.has(member.fantasyPlayerId),
    )
    .sort((a, b) => {
      const benchOrder = (fantasyPlayerId: string, ownOrder: number | null) => {
        if (ownOrder !== null) return ownOrder;
        const substitution = autoSubstitutions.find(
          (item) => item.out === fantasyPlayerId,
        );
        return (
          points.squad.find(
            (member) => member.fantasyPlayerId === substitution?.in,
          )?.benchOrder ?? 99
        );
      };
      return (
        benchOrder(a.fantasyPlayerId, a.benchOrder) -
        benchOrder(b.fantasyPlayerId, b.benchOrder)
      );
    });
  const countedIds = new Set(
    points.fantasy.selection.activeChip === "bench_boost"
      ? points.squad.map((member) => member.fantasyPlayerId)
      : fieldMembers.map((member) => member.fantasyPlayerId),
  );
  const captain = points.squad.find(
    (member) => member.captainRole === "captain",
  );
  const viceCaptain = points.squad.find(
    (member) => member.captainRole === "vice_captain",
  );
  const scoringCaptain =
    captain && (resultByPlayer.get(captain.fantasyPlayerId)?.minutes ?? 0) > 0
      ? captain
      : viceCaptain &&
          (resultByPlayer.get(viceCaptain.fantasyPlayerId)?.minutes ?? 0) > 0
        ? viceCaptain
        : undefined;
  const captainMultiplier =
    points.fantasy.selection.activeChip === "triple_captain" ? 3 : 2;
  const playerContribution = (fantasyPlayerId: string) => {
    const rawPoints = resultByPlayer.get(fantasyPlayerId)?.totalPoints ?? 0;
    return getDisplayedPlayerPoints({
      rawPoints,
      counted: countedIds.has(fantasyPlayerId),
      isScoringCaptain: scoringCaptain?.fantasyPlayerId === fantasyPlayerId,
      captainMultiplier,
    });
  };
  const total = points.teamScore?.totalPoints ?? 0;
  const activeChipLabel =
    points.fantasy.selection.activeChip === "triple_captain"
      ? "กัปตัน ×3"
      : points.fantasy.selection.activeChip === "bench_boost"
        ? "นับตัวสำรอง"
        : points.fantasy.selection.activeChip === "wildcard"
          ? "เปลี่ยนตัวอิสระ"
          : null;

  return (
    <AppShell>
      <main id="main-content" className="content product-content">
        <PageHeader
          title="คะแนน"
          actions={
            <PointsGameweekSwitcher
              gameweeks={points.gameweeks}
              selected={points.fantasy.gameweek.number}
              className="points-week-switcher--header"
            />
          }
        />

        <div className="points-layout points-pitch-layout">
          <PointsGameweekSwitcher
            gameweeks={points.gameweeks}
            selected={points.fantasy.gameweek.number}
            className="points-week-switcher--rail"
          />
          <section
            className="points-score-rail"
            aria-label="สรุปคะแนน Gameweek"
          >
            <article className="points-score-card points-score-card--supporting">
              <span>คะแนนเฉลี่ย</span>
              <strong>{points.gameweekSummary.averagePoints}</strong>
              <small>คะแนน</small>
            </article>
            <article className="points-score-card points-score-card--primary">
              <strong>{total}</strong>
              <span>คะแนน</span>
            </article>
            <article className="points-score-card points-score-card--supporting">
              <span>คะแนนสูงสุดของทีมอื่น</span>
              <strong>
                {points.gameweekSummary.highestOtherManagerPoints ?? "—"}
              </strong>
              <small>
                {points.gameweekSummary.highestOtherManagerPoints === null
                  ? "ยังไม่มีทีมเปรียบเทียบ"
                  : "คะแนน"}
              </small>
            </article>
          </section>

          <section className="product-card points-pitch-card">
            {activeChipLabel ? (
              <div className="points-chip-banner">
                <span className="points-chip-banner__icon" aria-hidden="true">
                  <Zap size={20} fill="currentColor" />
                </span>
                <span className="points-chip-banner__copy">
                  <small>Chip ที่ใช้ใน Gameweek นี้</small>
                  <strong>{activeChipLabel}</strong>
                </span>
              </div>
            ) : null}
            <div
              className={`points-pitch${points.squad.length === 0 ? " is-empty" : ""}`}
            >
              <div className="field-lines" aria-hidden="true">
                <span />
                <i />
                <b />
              </div>
              {points.squad.length === 0 ? (
                <div className="points-empty-squad" role="status">
                  <strong>ยังไม่ได้บันทึกทีมสำหรับ Gameweek นี้</strong>
                  <span>เลือกนักเตะให้ครบ 15 คนจากหน้าทีมของฉัน</span>
                </div>
              ) : (
                <div className="points-pitch-rows">
                  {positionRows.map((position) => (
                    <div className="points-pitch-row" key={position}>
                      {fieldMembers
                        .filter((member) => member.position === position)
                        .map((member) => (
                          <PointsPlayerToken
                            key={member.fantasyPlayerId}
                            member={member}
                            points={playerContribution(member.fantasyPlayerId)}
                            counted
                            substitution={
                              autoSubIn.has(member.fantasyPlayerId)
                                ? "in"
                                : undefined
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
              )}
            </div>

            {points.squad.length > 0 && (
              <div className="points-bench-panel">
                <div className="bench-title">
                  <h3>ม้านั่งสำรอง</h3>
                </div>
                <div className="points-bench-grid">
                  {benchMembers.map((member, index) => (
                    <div
                      className="points-bench-item"
                      key={member.fantasyPlayerId}
                    >
                      <b>{index === 0 ? "GK" : index}</b>
                      <PointsPlayerToken
                        member={member}
                        points={playerContribution(member.fantasyPlayerId)}
                        counted={countedIds.has(member.fantasyPlayerId)}
                        substitution={
                          autoSubOut.has(member.fantasyPlayerId)
                            ? "out"
                            : undefined
                        }
                        showPositionBadge
                        result={resultByPlayer.get(member.fantasyPlayerId)}
                        multiplier={
                          scoringCaptain?.fantasyPlayerId ===
                          member.fantasyPlayerId
                            ? captainMultiplier
                            : 1
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </AppShell>
  );
}
