import { Crown, Info, ShieldCheck, Star } from "lucide-react";

import { AppShell, PageHeader } from "@/components/fantasy/app-shell";
import { PlayerKit } from "@/components/fantasy/player-kit";
import { getCompetitionDataset } from "@/data/competition";
import { getFantasyPointsState } from "@/data/fantasy";

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

export default async function PointsPage() {
  const [data, points] = await Promise.all([
    getCompetitionDataset(),
    getFantasyPointsState(),
  ]);
  const playerByFantasyId = new Map(
    data.players.flatMap((player) =>
      player.fantasyPlayerId ? [[player.fantasyPlayerId, player] as const] : [],
    ),
  );
  const resultByPlayer = new Map(
    points.players.map((player) => [player.fantasyPlayerId, player]),
  );
  const rows = points.fantasy.selection.members
    .map((member) => ({
      member,
      player: playerByFantasyId.get(member.fantasyPlayerId),
      result: resultByPlayer.get(member.fantasyPlayerId),
    }))
    .filter((row) => row.player)
    .sort((a, b) => {
      if (a.member.lineupRole !== b.member.lineupRole)
        return a.member.lineupRole === "starter" ? -1 : 1;
      return (a.member.benchOrder ?? -1) - (b.member.benchOrder ?? -1);
    });
  const total = points.teamScore?.totalPoints ?? 0;
  const captain = rows.find((row) => row.member.captainRole === "captain");
  const best = [...rows].sort(
    (a, b) => (b.result?.totalPoints ?? 0) - (a.result?.totalPoints ?? 0),
  )[0];
  const categoryTotals = new Map<string, number>();
  for (const row of points.players) {
    for (const [key, value] of Object.entries(row.breakdown)) {
      categoryTotals.set(key, (categoryTotals.get(key) ?? 0) + value);
    }
  }

  return (
    <AppShell>
      <main className="content product-content">
        <PageHeader
          eyebrow="คะแนน"
          title={`ผลงาน Gameweek ${String(points.fantasy.gameweek.number).padStart(2, "0")}`}
          description="คะแนนคำนวณจากข้อมูลไทยลีกและคำตัดสิน Fantasy Assist ที่แก้ไขย้อนหลังได้"
        />
        <div className="points-summary-grid">
          <article className="points-total-card">
            <div>
              <span>คะแนน Gameweek</span>
              <strong>{total}</strong>
              <small>
                <ShieldCheck size={13} />{" "}
                {points.teamScore?.status === "final"
                  ? "คะแนน Final"
                  : "คะแนนชั่วคราว"}
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
              <span>กัปตัน</span>
              <strong>{captain?.player?.name.th ?? "—"}</strong>
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
              <strong>{best?.player?.name.th ?? "—"}</strong>
              <small>{best?.result?.totalPoints ?? 0} คะแนน</small>
            </div>
          </article>
        </div>

        <div className="points-layout">
          <section className="product-card points-table-card">
            <div className="product-card-head">
              <div>
                <span className="eyebrow">คะแนนรายบุคคล</span>
                <h2>ตัวจริงและตัวสำรอง</h2>
              </div>
              <span className="live-score">
                <i />{" "}
                {points.fantasy.gameweek.scoreComplete
                  ? "Final"
                  : "Provisional"}
              </span>
            </div>
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
              {rows.map(
                ({ member, player, result }) =>
                  player && (
                    <article
                      className="points-row"
                      key={member.fantasyPlayerId}
                    >
                      <div className="market-player">
                        <PlayerKit
                          color={player.color}
                          accent={player.accent}
                          size="small"
                        />
                        <div>
                          <strong>{player.name.th}</strong>
                          <span>
                            {player.position} · {player.clubShort.th}
                            {member.captainRole === "captain"
                              ? " · กัปตัน"
                              : member.captainRole === "vice_captain"
                                ? " · รองกัปตัน"
                                : ""}
                            {member.lineupRole === "bench" ? " · สำรอง" : ""}
                          </span>
                        </div>
                      </div>
                      <span>{result?.minutes ?? 0}</span>
                      <span>
                        {(result?.breakdown.goals ?? 0) /
                          { GK: 10, DEF: 6, MID: 5, FWD: 4 }[player.position]}
                      </span>
                      <span>{(result?.breakdown.assists ?? 0) / 3}</span>
                      <span>{result?.breakdown.cleanSheet ?? 0}</span>
                      <span>L{player.tier}</span>
                      <strong>{result?.totalPoints ?? 0}</strong>
                    </article>
                  ),
              )}
            </div>
          </section>

          <aside className="points-aside">
            <section className="product-card score-breakdown">
              <div className="product-card-head">
                <div>
                  <span className="eyebrow">ที่มาคะแนนผู้เล่น</span>
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
      </main>
    </AppShell>
  );
}
