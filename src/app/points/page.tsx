"use client";

import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Info,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/fantasy/app-shell";
import { PlayerKit } from "@/components/fantasy/player-kit";
import { playerPool } from "@/lib/fantasy-data";

const scoring = [
  { label: "ลงสนาม", value: 22, color: "#f56617" },
  { label: "ประตู", value: 18, color: "#1a6954" },
  { label: "แอสซิสต์", value: 12, color: "#3974c7" },
  { label: "คลีนชีต", value: 9, color: "#8c63c7" },
  { label: "โบนัส", value: 6, color: "#eab437" },
];

export default function PointsPage() {
  const [week, setWeek] = useState(1);
  const total = playerPool
    .slice(0, 11)
    .reduce((sum, player) => sum + player.points, 0);

  return (
    <AppShell>
      <main className="content product-content">
        <PageHeader
          eyebrow="คะแนน"
          title="ผลงาน Gameweek"
          description="ดูคะแนนทุกคนในทีมและที่มาของคะแนนแบบละเอียด"
          actions={
            <div className="week-switcher">
              <button
                onClick={() => setWeek(Math.max(1, week - 1))}
                disabled={week === 1}
              >
                <ChevronLeft />
              </button>
              <span>
                GAMEWEEK <b>{String(week).padStart(2, "0")}</b>
              </span>
              <button onClick={() => setWeek(Math.min(30, week + 1))}>
                <ChevronRight />
              </button>
            </div>
          }
        />

        <div className="points-summary-grid">
          <article className="points-total-card">
            <div>
              <span>คะแนน Gameweek</span>
              <strong>{week === 1 ? 67 : total - week * 2}</strong>
              <small>
                <TrendingUp size={13} /> สูงกว่าค่าเฉลี่ย 15 คะแนน
              </small>
            </div>
            <div className="points-gauge">
              <span>TOP</span>
              <strong>12%</strong>
            </div>
          </article>
          <article className="points-mini-card">
            <span className="metric-icon orange-bg">
              <Crown />
            </span>
            <div>
              <span>กัปตัน</span>
              <strong>ชนาธิป</strong>
              <small>14 × 2 = 28 pts</small>
            </div>
          </article>
          <article className="points-mini-card">
            <span className="metric-icon green-bg">
              <Star />
            </span>
            <div>
              <span>ดาวเด่น</span>
              <strong>ธีราทร</strong>
              <small>11 คะแนน</small>
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
                <i /> อัปเดตแล้ว
              </span>
            </div>
            <div className="points-table">
              <div className="points-head">
                <span>ผู้เล่น</span>
                <span>MIN</span>
                <span>G</span>
                <span>A</span>
                <span>CS</span>
                <span>BON</span>
                <span>PTS</span>
              </div>
              {playerPool.slice(0, 11).map((player, index) => (
                <article className="points-row" key={player.id}>
                  <div className="market-player">
                    <PlayerKit
                      color={player.color}
                      accent={player.accent}
                      size="small"
                    />
                    <div>
                      <strong>{player.name}</strong>
                      <span>
                        {player.position} · {player.club}
                        {index === 0 ? " · กัปตัน" : ""}
                      </span>
                    </div>
                  </div>
                  <span>90</span>
                  <span>{[0, 0, 1, 0][index % 4]}</span>
                  <span>{[1, 0, 0, 1, 0][index % 5]}</span>
                  <span>
                    {player.position === "DEF" || player.position === "GK"
                      ? 1
                      : "—"}
                  </span>
                  <span>{index < 3 ? 3 - index : 0}</span>
                  <strong>{player.points}</strong>
                </article>
              ))}
            </div>
          </section>

          <aside className="points-aside">
            <section className="product-card score-breakdown">
              <div className="product-card-head">
                <div>
                  <span className="eyebrow">ที่มาคะแนน</span>
                  <h2>รวม 67 คะแนน</h2>
                </div>
                <Info size={17} />
              </div>
              <div className="donut-wrap">
                <div className="score-donut">
                  <span>
                    <strong>67</strong>PTS
                  </span>
                </div>
                <div className="score-legend">
                  {scoring.map((item) => (
                    <div key={item.label}>
                      <i style={{ background: item.color }} />
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <section className="captain-callout">
              <Sparkles />
              <div>
                <span className="eyebrow">กัปตันของคุณ</span>
                <h3>ชนาธิปทำ 28 คะแนน!</h3>
                <p>เลือกกัปตันได้ดีกว่า 72% ของผู้จัดการทั้งหมด</p>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
