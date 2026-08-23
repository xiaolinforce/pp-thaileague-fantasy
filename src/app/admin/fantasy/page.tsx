import { Database, Lock, RefreshCw, ShieldCheck } from "lucide-react";

import {
  finalizeFantasyGameweekAction,
  lockFantasyGameweekAction,
  savePlayerMatchStatsAction,
  updateFantasyPlayerClassificationAction,
} from "@/app/fantasy-actions";
import { AppShell, PageHeader } from "@/components/fantasy/app-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCompetitionDataset } from "@/data/competition";
import { getFantasyState, getFantasyAdminGameweeks } from "@/data/fantasy";
import { requireAdmin } from "@/lib/auth/context";

const statFields = [
  ["minutes", "นาที"],
  ["goals", "ประตู"],
  ["sourceAssists", "Assist จากไทยลีก"],
  ["fantasyAssists", "Fantasy Assist (เว้นว่างเพื่อใช้ต้นทาง)"],
  ["goalsConcededWhilePlaying", "เสียประตูขณะอยู่ในสนาม"],
  ["saves", "เซฟ"],
  ["penaltySaves", "เซฟจุดโทษ"],
  ["penaltyMisses", "ยิงจุดโทษพลาด"],
  ["yellowCards", "ใบเหลือง"],
  ["redCards", "ใบแดง"],
  ["ownGoals", "ทำเข้าประตูตัวเอง"],
] as const;

export default async function FantasyAdminPage() {
  await requireAdmin();
  const [data, fantasy, gameweeks] = await Promise.all([
    getCompetitionDataset(),
    getFantasyState(),
    getFantasyAdminGameweeks(),
  ]);
  const players = data.players
    .filter((player) => player.fantasyPlayerId)
    .sort((a, b) => a.name.th.localeCompare(b.name.th, "th"));

  return (
    <AppShell>
      <main id="main-content" className="content product-content">
        <PageHeader title="Fantasy Admin" />

        <section className="market-insight admin-notice">
          <div>
            <span className="insight-icon">
              <ShieldCheck aria-hidden="true" />
            </span>
            <div>
              <span className="eyebrow">Admin only</span>
              <h2>เฉพาะบัญชีที่มีสิทธิ์ผู้ดูแลระบบ</h2>
              <p>
                Server Action ทุกตัวตรวจ session และ role
                จากฐานข้อมูลใหม่ก่อนเขียนข้อมูล อย่างตั้งใจ
              </p>
            </div>
          </div>
        </section>

        <div className="admin-fantasy-grid">
          <div className="admin-main-stack">
            <section className="product-card admin-stat-card">
              <div className="product-card-head">
                <div>
                  <span className="eyebrow">มีผลเป็นราย Gameweek</span>
                  <h2>ระดับและสถานะนักเตะไทย</h2>
                </div>
                <ShieldCheck size={20} />
              </div>
              <form
                action={updateFantasyPlayerClassificationAction}
                className="admin-stat-form"
              >
                <label>
                  <span>นักเตะ</span>
                  <Select
                    name="fantasyPlayerId"
                    required
                    defaultValue={players[0]?.fantasyPlayerId}
                  >
                    <SelectTrigger aria-label="นักเตะ">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem
                          value={player.fantasyPlayerId!}
                          key={player.id}
                        >
                          {player.name.th} · {player.clubShort.th} · ปัจจุบัน L
                          {player.tier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <div className="admin-stat-fields">
                  <label>
                    <span>มีผลตั้งแต่ Gameweek</span>
                    <Select
                      name="effectiveGameweekId"
                      defaultValue={fantasy.gameweek.id}
                    >
                      <SelectTrigger aria-label="มีผลตั้งแต่ Gameweek">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {gameweeks.map((gameweek) => (
                          <SelectItem value={gameweek.id} key={gameweek.id}>
                            GW {gameweek.number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                  <label>
                    <span>ระดับ</span>
                    <Select name="level" defaultValue="3">
                      <SelectTrigger aria-label="ระดับ">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">ระดับ 1</SelectItem>
                        <SelectItem value="2">ระดับ 2</SelectItem>
                        <SelectItem value="3">ระดับ 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                  <label>
                    <span>สถานะสัญชาติ</span>
                    <Select name="isThai" defaultValue="true">
                      <SelectTrigger aria-label="สถานะสัญชาติ">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">ไทย/ลูกครึ่งไทย</SelectItem>
                        <SelectItem value="false">ต่างชาติ</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                </div>
                <label>
                  <span>เหตุผล</span>
                  <input
                    name="reason"
                    required
                    defaultValue="ปรับตามฟอร์มประจำสัปดาห์"
                  />
                </label>
                <button className="secondary-button" type="submit">
                  <RefreshCw size={17} /> บันทึกระดับและสถานะ
                </button>
              </form>
            </section>
            <section className="product-card admin-stat-card">
              <div className="product-card-head">
                <div>
                  <span className="eyebrow">Thai League source + override</span>
                  <h2>บันทึกสถิติรายนัด</h2>
                </div>
                <Database size={20} />
              </div>
              <form
                action={savePlayerMatchStatsAction}
                className="admin-stat-form"
              >
                <label>
                  <span>การแข่งขัน</span>
                  <Select
                    name="fixtureId"
                    required
                    defaultValue={data.fixtures[0]?.id}
                  >
                    <SelectTrigger aria-label="การแข่งขัน">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {data.fixtures.map((fixture) => (
                        <SelectItem value={fixture.id} key={fixture.id}>
                          GW{fixture.matchweek} · {fixture.home.name.th} พบ{" "}
                          {fixture.away.name.th}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label>
                  <span>นักเตะ</span>
                  <Select
                    name="fantasyPlayerId"
                    required
                    defaultValue={players[0]?.fantasyPlayerId}
                  >
                    <SelectTrigger aria-label="นักเตะ">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem
                          value={player.fantasyPlayerId!}
                          key={player.id}
                        >
                          {player.name.th} · {player.clubShort.th} · L
                          {player.tier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <div className="admin-stat-fields">
                  {statFields.map(([name, label]) => (
                    <label key={name}>
                      <span>{label}</span>
                      <input
                        type="number"
                        min="0"
                        defaultValue={name === "fantasyAssists" ? undefined : 0}
                        name={name}
                      />
                    </label>
                  ))}
                </div>
                <label>
                  <span>เหตุผล/แหล่งอ้างอิง</span>
                  <input
                    name="reason"
                    required
                    defaultValue="ข้อมูลจากไทยลีกสำหรับการทดสอบ"
                  />
                </label>
                <button className="primary-button" type="submit">
                  <RefreshCw size={17} /> บันทึกและคำนวณคะแนนใหม่
                </button>
              </form>
            </section>
          </div>

          <aside className="admin-gameweek-stack">
            <section className="product-card summary-card">
              <div className="card-title">
                <span>
                  <Lock size={18} /> Gameweek {fantasy.gameweek.number}
                </span>
              </div>
              <dl className="admin-gameweek-meta">
                <div>
                  <dt>สถานะ</dt>
                  <dd>{fantasy.gameweek.status}</dd>
                </div>
                <div>
                  <dt>Deadline</dt>
                  <dd>
                    {new Intl.DateTimeFormat("th-TH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Bangkok",
                    }).format(new Date(fantasy.gameweek.deadlineAt))}
                  </dd>
                </div>
                <div>
                  <dt>คะแนน</dt>
                  <dd>
                    {fantasy.gameweek.scoreComplete ? "Final" : "Provisional"}
                  </dd>
                </div>
              </dl>
              {fantasy.selection.status === "draft" && (
                <form action={lockFantasyGameweekAction}>
                  <input
                    type="hidden"
                    name="gameweekId"
                    value={fantasy.gameweek.id}
                  />
                  <button className="primary-button" type="submit">
                    <Lock size={16} /> ล็อกทีมและเปิด GW ถัดไป
                  </button>
                </form>
              )}
              {!fantasy.gameweek.scoreComplete &&
                fantasy.selection.status === "locked" && (
                  <form action={finalizeFantasyGameweekAction}>
                    <input
                      type="hidden"
                      name="gameweekId"
                      value={fantasy.gameweek.id}
                    />
                    <button className="secondary-button" type="submit">
                      <CheckIcon /> ยืนยันคะแนน Final
                    </button>
                  </form>
                )}
            </section>
            <section className="product-card summary-card">
              <div className="card-title">
                <span>กติกาคะแนนที่เปิดใช้</span>
              </div>
              <p className="admin-rule-copy">
                นาที, ประตู, Assist, Clean Sheet, Saves, Penalty, ใบเหลือง,
                ใบแดง และ Own Goal โดยไม่มี Defensive Contributions และ
                Bonus/BPS
              </p>
            </section>
            <section className="product-card summary-card">
              <div className="card-title">
                <span>Gameweek รอ Final</span>
              </div>
              <div className="admin-finalize-list">
                {gameweeks
                  .filter((gameweek) => gameweek.status === "provisional")
                  .map((gameweek) => (
                    <form
                      action={finalizeFantasyGameweekAction}
                      key={gameweek.id}
                    >
                      <input
                        type="hidden"
                        name="gameweekId"
                        value={gameweek.id}
                      />
                      <span>GW {gameweek.number}</span>
                      <button className="secondary-button" type="submit">
                        <ShieldCheck size={15} /> Final
                      </button>
                    </form>
                  ))}
                {gameweeks.every(
                  (gameweek) => gameweek.status !== "provisional",
                ) && (
                  <p className="admin-rule-copy">
                    ยังไม่มี Gameweek ที่รอตรวจคะแนน
                  </p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}

function CheckIcon() {
  return <ShieldCheck size={16} />;
}
