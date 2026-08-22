import { Crown, Info, ShieldCheck, Star } from "lucide-react";

import { AppShell, PageHeader } from "@/components/fantasy/app-shell";
import { PlayerKit } from "@/components/fantasy/player-kit";
import { getFantasyPointsState } from "@/data/fantasy";
import { PointsGameweekSwitcher } from "./gameweek-switcher";
import { PointsLocalizedName, PointsPlayerToken } from "./player-token";

const breakdownLabels: Record<string, string> = {
  appearance: "ลงสนาม",
  goals: "ประตู",
  assists: "แอสซิสต์",
  cleanSheet: "คลีนชีต",
  saves: "เซฟ",
  penaltySaves: "เซฟจุดโทษ",
  penaltyMisses: "พลาดจุดโทษ",
  goalsConceded: "เสียประตู",
  yellowCards: "ใบเหลือง",
  redCards: "ใบแดง",
  ownGoals: "เข้าประตูตัวเอง",
};

const positionRows = [
  "goalkeeper",
  "defender",
  "midfielder",
  "forward",
] as const;

const positionLabels = {
  goalkeeper: "GK",
  defender: "DEF",
  midfielder: "MID",
  forward: "FWD",
} as const;

const goalPoints = {
  goalkeeper: 10,
  defender: 6,
  midfielder: 5,
  forward: 4,
} as const;

export default async function PointsPage({
  searchParams,
}: {
  searchParams: Promise<{ gw?: string | string[] }>;
}) {
  const query = await searchParams;
  const rawGameweek = Array.isArray(query.gw) ? query.gw[0] : query.gw;
  const requestedGameweek = rawGameweek ? Number(rawGameweek) : undefined;
  const points = await getFantasyPointsState(requestedGameweek);
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
    return countedIds.has(fantasyPlayerId) &&
      scoringCaptain?.fantasyPlayerId === fantasyPlayerId
      ? rawPoints * captainMultiplier
      : rawPoints;
  };
  const best = [...points.squad]
    .filter((member) => countedIds.has(member.fantasyPlayerId))
    .sort(
      (a, b) =>
        playerContribution(b.fantasyPlayerId) -
        playerContribution(a.fantasyPlayerId),
    )[0];
  const categoryTotals = new Map<string, number>();
  for (const member of points.squad) {
    const result = resultByPlayer.get(member.fantasyPlayerId);
    if (!result) continue;
    for (const [key, value] of Object.entries(result.breakdown)) {
      categoryTotals.set(key, (categoryTotals.get(key) ?? 0) + value);
    }
  }
  const total = points.teamScore?.totalPoints ?? 0;
  const formation = (["defender", "midfielder", "forward"] as const)
    .map(
      (position) =>
        fieldMembers.filter((member) => member.position === position).length,
    )
    .join(" · ");
  const scoreStatus = points.fantasy.gameweek.scoreComplete
    ? "Final"
    : points.teamScore
      ? "Provisional"
      : "ยังไม่มีคะแนน";

  return (
    <AppShell>
      <main id="main-content" className="content product-content">
        <PageHeader
          title="คะแนน"
          actions={
            <PointsGameweekSwitcher
              gameweeks={points.gameweeks}
              selected={points.fantasy.gameweek.number}
            />
          }
        />

        <div className="points-summary-grid">
          <article className="points-total-card">
            <div>
              <span>คะแนน Gameweek</span>
              <strong>{total}</strong>
              <small>
                <ShieldCheck size={13} /> {scoreStatus}
              </small>
            </div>
            <div className="points-gauge">
              <span>TRANSFERS</span>
              <strong>-{points.teamScore?.transferPoints ?? 0}</strong>
            </div>
          </article>
          <article className="points-mini-card">
            <span className="metric-icon orange-bg">
              <Crown />
            </span>
            <div>
              <span>กัปตันที่ได้คะแนน</span>
              <strong>
                {scoringCaptain ? (
                  <PointsLocalizedName value={scoringCaptain.name} />
                ) : (
                  "—"
                )}
              </strong>
              <small>
                {points.teamScore?.captainBonus ?? 0} คะแนนเพิ่มจากกัปตัน
              </small>
            </div>
          </article>
          <article className="points-mini-card">
            <span className="metric-icon green-bg">
              <Star />
            </span>
            <div>
              <span>ดาวเด่น</span>
              <strong>
                {best ? <PointsLocalizedName value={best.name} /> : "—"}
              </strong>
              <small>
                {best ? playerContribution(best.fantasyPlayerId) : 0} คะแนน
              </small>
            </div>
          </article>
        </div>

        <div className="points-layout points-pitch-layout">
          <section className="product-card points-pitch-card">
            <div className="product-card-head">
              <div>
                <span className="eyebrow">แผนการเล่น {formation}</span>
                <h2>{points.fantasy.team.name}</h2>
              </div>
              <span
                className={`live-score${points.teamScore ? "" : " pending"}`}
              >
                <i /> {scoreStatus}
              </span>
            </div>
            <div className="points-pitch">
              <div className="field-lines">
                <span />
                <i />
                <b />
              </div>
              <div className="points-pitch-rows">
                {positionRows.map((position) => (
                  <div className="points-pitch-row" key={position}>
                    {fieldMembers
                      .filter((member) => member.position === position)
                      .map((member) => {
                        const multiplier =
                          scoringCaptain?.fantasyPlayerId ===
                          member.fantasyPlayerId
                            ? captainMultiplier
                            : 1;
                        return (
                          <PointsPlayerToken
                            key={member.fantasyPlayerId}
                            member={member}
                            points={playerContribution(member.fantasyPlayerId)}
                            counted
                            multiplier={multiplier}
                            substitution={
                              autoSubIn.has(member.fantasyPlayerId)
                                ? "in"
                                : undefined
                            }
                          />
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>

            <div className="points-bench-panel">
              <div className="bench-title">
                <div>
                  <span className="eyebrow">ตัวสำรอง</span>
                  <h3>
                    {points.fantasy.selection.activeChip === "bench_boost"
                      ? "Bench Boost — นับคะแนนทุกคน"
                      : "ม้านั่งสำรองหลัง Auto-sub"}
                  </h3>
                </div>
                <span>ผู้เล่นสำรอง {benchMembers.length}</span>
              </div>
              <div className="points-bench-grid">
                {benchMembers.map((member) => (
                  <PointsPlayerToken
                    key={member.fantasyPlayerId}
                    member={member}
                    points={playerContribution(member.fantasyPlayerId)}
                    counted={countedIds.has(member.fantasyPlayerId)}
                    multiplier={
                      scoringCaptain?.fantasyPlayerId === member.fantasyPlayerId
                        ? captainMultiplier
                        : 1
                    }
                    substitution={
                      autoSubOut.has(member.fantasyPlayerId) ? "out" : undefined
                    }
                  />
                ))}
              </div>
            </div>

            {autoSubstitutions.length > 0 && (
              <div className="auto-sub-summary">
                <ShieldCheck size={17} />
                <span>
                  Auto-sub {autoSubstitutions.length} —
                  สนามแสดงผู้เล่นที่ถูกนับคะแนนจริงแล้ว
                </span>
              </div>
            )}
          </section>

          <aside className="points-aside">
            <section className="product-card score-breakdown">
              <div className="product-card-head">
                <div>
                  <span className="eyebrow">ที่มาคะแนนผู้เล่นในทีม</span>
                  <h2>ไม่มี DC และ Bonus</h2>
                </div>
                <Info size={17} />
              </div>
              <div className="score-legend standalone-score-legend">
                {[...categoryTotals.entries()].map(([key, value]) => (
                  <div key={key}>
                    <i />
                    <span>{breakdownLabels[key] ?? key}</span>
                    <strong>{value > 0 ? `+${value}` : value}</strong>
                  </div>
                ))}
                {categoryTotals.size === 0 && (
                  <p>ยังไม่มีข้อมูลสถิติสำหรับ Gameweek นี้</p>
                )}
              </div>
            </section>
            <section className="captain-callout">
              <ShieldCheck />
              <div>
                <span className="eyebrow">แมตช์ตกค้าง</span>
                <h3>ระบบคำนวณย้อนหลังอัตโนมัติ</h3>
                <p>
                  Auto-sub, กัปตัน, Chips
                  และอันดับจะถูกคำนวณใหม่เมื่อข้อมูลนัดตกค้างเข้ามา
                </p>
              </div>
            </section>
          </aside>
        </div>

        <details className="product-card points-detail-card">
          <summary>ดูรายละเอียดคะแนนรายบุคคล</summary>
          <div className="points-table">
            <div className="points-head">
              <span>ผู้เล่น</span>
              <span>MIN</span>
              <span>G</span>
              <span>A</span>
              <span>CS</span>
              <span>LV</span>
              <span>PTS</span>
            </div>
            {points.squad.map((member) => {
              const result = resultByPlayer.get(member.fantasyPlayerId);
              return (
                <article className="points-row" key={member.fantasyPlayerId}>
                  <div className="market-player">
                    <PlayerKit
                      color={member.color}
                      accent={member.accent}
                      size="small"
                    />
                    <div>
                      <strong>
                        <PointsLocalizedName value={member.name} />
                      </strong>
                      <span>
                        {positionLabels[member.position]} ·{" "}
                        <PointsLocalizedName value={member.clubShort} />
                        {member.captainRole === "captain"
                          ? " · กัปตัน"
                          : member.captainRole === "vice_captain"
                            ? " · รองกัปตัน"
                            : ""}
                        {!countedIds.has(member.fantasyPlayerId)
                          ? " · ไม่นับคะแนน"
                          : ""}
                      </span>
                    </div>
                  </div>
                  <span>{result?.minutes ?? 0}</span>
                  <span>
                    {(result?.breakdown.goals ?? 0) /
                      goalPoints[member.position]}
                  </span>
                  <span>{(result?.breakdown.assists ?? 0) / 3}</span>
                  <span>{result?.breakdown.cleanSheet ?? 0}</span>
                  <span>L{member.tier}</span>
                  <strong>{result?.totalPoints ?? 0}</strong>
                </article>
              );
            })}
          </div>
        </details>
      </main>
    </AppShell>
  );
}
