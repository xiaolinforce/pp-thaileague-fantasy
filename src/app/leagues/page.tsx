"use client";

import {
  Check,
  ChevronDown,
  Copy,
  Crown,
  Lock,
  Plus,
  Share2,
  Trophy,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/fantasy/app-shell";
import { leagueTable } from "@/lib/fantasy-data";

export default function LeaguesPage() {
  const [tab, setTab] = useState<"private" | "overall">("private");
  const [copied, setCopied] = useState(false);
  const copyCode = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <AppShell>
      <main className="content product-content">
        <PageHeader
          eyebrow="การแข่งขัน"
          title="ลีกของฉัน"
          description="วัดฝีมือกับเพื่อนและผู้จัดการทั่วประเทศตลอดฤดูกาล"
          actions={
            <>
              <button className="secondary-button">
                <Plus size={17} />
                เข้าร่วมลีก
              </button>
              <button className="primary-button">
                <Trophy size={17} />
                สร้างลีกใหม่
              </button>
            </>
          }
        />

        <div className="league-cards">
          <article className="league-feature-card active">
            <span className="league-icon">
              <Crown />
            </span>
            <div>
              <span className="eyebrow">มินิลีกส่วนตัว</span>
              <h3>Thai Fantasy Friends</h3>
              <p>
                <UsersRound size={14} /> 24 ผู้จัดการ
              </p>
            </div>
            <strong>#3</strong>
          </article>
          <article className="league-feature-card">
            <span className="league-icon dark">
              <Trophy />
            </span>
            <div>
              <span className="eyebrow">ลีกทั้งหมด</span>
              <h3>Thailand Overall</h3>
              <p>
                <UsersRound size={14} /> 124,820 ผู้จัดการ
              </p>
            </div>
            <strong>#18,420</strong>
          </article>
          <article className="league-feature-card invite">
            <span className="league-icon pale">
              <Lock />
            </span>
            <div>
              <span className="eyebrow">รหัสเชิญเพื่อน</span>
              <h3>THAI-26-FAN</h3>
              <p>ใช้ได้ถึง 31 สิงหาคม</p>
            </div>
            <button onClick={copyCode}>{copied ? <Check /> : <Copy />}</button>
          </article>
        </div>

        <section className="product-card league-table-card">
          <div className="league-table-toolbar">
            <div className="segment-tabs">
              <button
                className={tab === "private" ? "active" : ""}
                onClick={() => setTab("private")}
              >
                Thai Fantasy Friends
              </button>
              <button
                className={tab === "overall" ? "active" : ""}
                onClick={() => setTab("overall")}
              >
                Thailand Overall
              </button>
            </div>
            <div className="league-actions">
              <button>
                <Share2 size={16} />
                แชร์ลีก
              </button>
              <button>
                Gameweek 01 <ChevronDown size={14} />
              </button>
            </div>
          </div>
          <div className="league-table">
            <div className="league-head">
              <span>อันดับ</span>
              <span>ทีม / ผู้จัดการ</span>
              <span>GW</span>
              <span>รวม</span>
              <span>การเปลี่ยนแปลง</span>
            </div>
            {(tab === "private"
              ? leagueTable
              : leagueTable.map((item, index) => ({
                  ...item,
                  rank: item.mine ? 18420 : 18417 + index,
                  total: item.total + 810,
                }))
            ).map((team) => (
              <article
                className={`league-row ${team.mine ? "mine" : ""}`}
                key={team.name}
              >
                <strong className="rank-number">{team.rank}</strong>
                <div>
                  <strong>
                    {team.name}
                    {team.mine && <i>คุณ</i>}
                  </strong>
                  <span>{team.manager}</span>
                </div>
                <strong>{team.gw}</strong>
                <strong>{team.total}</strong>
                <span
                  className={
                    team.movement > 0
                      ? "positive"
                      : team.movement < 0
                        ? "negative"
                        : "neutral"
                  }
                >
                  {team.movement > 0
                    ? `▲ ${team.movement}`
                    : team.movement < 0
                      ? `▼ ${Math.abs(team.movement)}`
                      : "—"}
                </span>
              </article>
            ))}
          </div>
          <div className="table-footer">
            <span>อัปเดตล่าสุด 2 นาทีที่แล้ว</span>
            <button>
              ดูอันดับเพิ่มเติม <ChevronDown size={14} />
            </button>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
