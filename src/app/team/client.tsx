"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Info,
  LayoutGrid,
  List,
  Save,
  Shirt,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/fantasy/app-shell";
import { PlayerKit } from "@/components/fantasy/player-kit";
import { Localized, useLanguage } from "@/components/fantasy/i18n";
import { localize, type CompetitionDataset, type CompetitionPlayerView } from "@/lib/competition-types";
import { PositionBadge } from "@/components/fantasy/position-badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const rows = ["GK", "DEF", "MID", "FWD"] as const;

function SquadPlayer({
  player,
  onSelect,
  captain,
}: {
  player: CompetitionPlayerView;
  onSelect: (player: CompetitionPlayerView) => void;
  captain?: "C" | "V";
}) {
  const { language } = useLanguage();
  return (
    <Localized>
      <button
        className="squad-token"
        onClick={() => onSelect(player)}
        aria-label={`ดูข้อมูล ${localize(player.name, language)}`}
      >
        <span className="squad-shirt">
          <Shirt
            style={{ color: player.accent, fill: player.color }}
            strokeWidth={1.6}
          />
          {captain && <i>{captain}</i>}
        </span>
        <span className="squad-name">{localize(player.name, language).split(" ")[0]}</span>
        <span className="squad-fixture">{localize(player.next, language)}</span>
      </button>
    </Localized>
  );
}

export default function TeamClient({ data }: { data: CompetitionDataset }) {
  const [view, setView] = useState<"pitch" | "list">("pitch");
  const [week, setWeek] = useState(1);
  const [selected, setSelected] = useState<CompetitionPlayerView | null>(null);
  const { language } = useLanguage();
  const byPosition = (position: CompetitionPlayerView["position"]) =>
    data.players.filter((player) => player.position === position).sort((a, b) => b.points - a.points);
  const goalkeepers = byPosition("GK");
  const defenders = byPosition("DEF");
  const midfielders = byPosition("MID");
  const forwards = byPosition("FWD");
  const starters = [goalkeepers[0], ...defenders.slice(0, 4), ...midfielders.slice(0, 4), ...forwards.slice(0, 2)].filter(Boolean);
  const bench = [goalkeepers[1], defenders[4], midfielders[4], forwards[2]].filter(Boolean);
  const captainId = midfielders[0]?.id;
  const viceCaptainId = forwards[0]?.id;
  const firstFixture = data.fixtures[0];

  const saveTeam = () => {
    toast.success(language === "th" ? "บันทึกการจัดทีมแล้ว" : "Team saved");
  };

  return (
    <AppShell>
      <main className="content product-content">
        <PageHeader
          eyebrow="ทีมของฉัน"
          title="จัดทีมลุยไทยลีก"
          description="เลือก 11 ตัวจริง วางกัปตัน แล้วพาทีมของคุณขึ้นจ่าฝูง"
          actions={
            <>
              <button
                className="secondary-button"
                onClick={() => setView(view === "pitch" ? "list" : "pitch")}
              >
                {view === "pitch" ? (
                  <List size={17} />
                ) : (
                  <LayoutGrid size={17} />
                )}
                {view === "pitch" ? "มุมมองรายชื่อ" : "มุมมองสนาม"}
              </button>
              <button className="primary-button" onClick={saveTeam}>
                <Save size={17} />
                บันทึกทีม
              </button>
            </>
          }
        />
        <section className="gameweek-banner compact-gameweek">
          <button
            className="week-arrow"
            onClick={() => setWeek(Math.max(1, week - 1))}
            disabled={week === 1}
          >
            <ChevronLeft />
          </button>
          <div className="gameweek-main">
            <span>GAMEWEEK</span>
            <strong>{String(week).padStart(2, "0")}</strong>
          </div>
          <div className="deadline">
            <span>
              <Clock3 size={16} /> เดดไลน์จัดทีม
            </span>
            <strong>{firstFixture ? `${localize(firstFixture.dateLabel, language)} · ${localize(firstFixture.timeLabel, language)}` : "รอยืนยัน"}</strong>
          </div>
          <div className="countdown">
            <span>
              <b>05</b>
              <small>วัน</small>
            </span>
            <i>:</i>
            <span>
              <b>14</b>
              <small>ชม.</small>
            </span>
            <i>:</i>
            <span>
              <b>28</b>
              <small>นาที</small>
            </span>
          </div>
          <button
            className="week-arrow"
            onClick={() => setWeek(Math.min(data.matchweeks.at(-1) ?? 30, week + 1))}
          >
            <ChevronRight />
          </button>
        </section>

        <div className="team-layout">
          <section className="product-card squad-card">
            <div className="product-card-head">
              <div>
                <span className="eyebrow">แผนการเล่น 4 · 4 · 2</span>
                <h2>PIYA FC</h2>
              </div>
              <ToggleGroup className="view-toggle" value={[view]} onValueChange={(values) => values[0] && setView(values[0] as "pitch" | "list")}>
                <Tooltip>
                  <TooltipTrigger render={<ToggleGroupItem value="pitch" aria-label="มุมมองสนาม" />}>
                    <LayoutGrid size={17} />
                  </TooltipTrigger>
                  <TooltipContent>มุมมองสนาม</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger render={<ToggleGroupItem value="list" aria-label="มุมมองรายชื่อ" />}>
                    <List size={17} />
                  </TooltipTrigger>
                  <TooltipContent>มุมมองรายชื่อ</TooltipContent>
                </Tooltip>
              </ToggleGroup>
            </div>
            {view === "pitch" ? (
              <>
                <div className="squad-pitch">
                  <div className="field-lines">
                    <span />
                    <i />
                    <b />
                  </div>
                  <div className="squad-rows">
                    {rows.map((position) => (
                      <div
                        className={`squad-row squad-${position.toLowerCase()}`}
                        key={position}
                      >
                        {starters
                          .filter((player) => player.position === position)
                          .map((player) => (
                            <SquadPlayer
                              key={player.id}
                              player={player}
                              onSelect={setSelected}
                              captain={
                                player.id === captainId
                                  ? "C"
                                  : player.id === viceCaptainId
                                    ? "V"
                                    : undefined
                              }
                            />
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bench-panel">
                  <div className="bench-title">
                    <div>
                      <span className="eyebrow">ตัวสำรอง</span>
                      <h3>ม้านั่งสำรอง</h3>
                    </div>
                    <span>เรียงลำดับการลงสนาม</span>
                  </div>
                  <div className="bench-grid">
                    {bench.map((player, index) => (
                      <div className="bench-item" key={player.id}>
                        <b>{index === 0 ? "GK" : index}</b>
                        <SquadPlayer player={player} onSelect={setSelected} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="roster-table">
                <div className="roster-head">
                  <span>ผู้เล่น</span>
                  <span>นัดถัดไป</span>
                  <span>ราคา</span>
                  <span>คะแนน</span>
                </div>
                {[...starters, ...bench].map((player, index) => (
                  <button
                    className="roster-row"
                    key={player.id}
                    onClick={() => setSelected(player)}
                  >
                    <span className="roster-identity">
                      <PlayerKit
                        color={player.color}
                        accent={player.accent}
                        size="small"
                      />
                      <span>
                        <strong>{localize(player.name, language)}</strong>
                        <small>
                          {localize(player.club, language)} · {player.position}
                          {index > 10 ? " · สำรอง" : ""}
                        </small>
                      </span>
                    </span>
                    <span>{localize(player.next, language)}</span>
                    <span>฿{player.price.toFixed(1)}</span>
                    <b>{player.points}</b>
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className="team-summary">
            <section className="summary-card accent-card">
              <div className="card-title">
                <span>
                  <Sparkles size={18} /> ภาพรวมทีม
                </span>
                <Info size={17} />
              </div>
              <div className="points-hero">
                <strong>67</strong>
                <small>คะแนน</small>
              </div>
              <div className="rank-row">
                <span>อันดับรวม</span>
                <strong>
                  <i>▲</i> 18,420
                </strong>
              </div>
              <div className="mini-stats">
                <div>
                  <span>เฉลี่ย</span>
                  <strong>52</strong>
                </div>
                <div>
                  <span>สูงสุด</span>
                  <strong>89</strong>
                </div>
                <div>
                  <span>อันดับ GW</span>
                  <strong>2,841</strong>
                </div>
              </div>
            </section>
            <section className="summary-card">
              <div className="card-title">
                <span>
                  <Wallet size={18} /> งบประมาณ
                </span>
              </div>
              <div className="budget-number">
                <strong>฿100.0</strong>
                <span>ล้าน</span>
              </div>
              <div className="budget-bar">
                <span />
              </div>
              <div className="budget-split">
                <span>
                  ใช้ไป <b>฿96.5</b>
                </span>
                <span>
                  คงเหลือ <b className="orange-text">฿3.5</b>
                </span>
              </div>
            </section>
            <button className="auto-pick" onClick={saveTeam}>
              <Sparkles size={18} />
              จัดทีมอัตโนมัติ <ChevronRight size={17} />
            </button>
          </aside>
        </div>
      </main>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="player-modal accessible-player-modal">
            <div className="modal-player-top">
              <PlayerKit
                color={selected.color}
                accent={selected.accent}
                size="large"
              />
              <div>
                <PositionBadge position={selected.position} />
                <DialogHeader>
                  <DialogTitle>{localize(selected.name, language)}</DialogTitle>
                  <DialogDescription>{localize(selected.club, language)}</DialogDescription>
                </DialogHeader>
              </div>
            </div>
            <div className="player-detail-grid">
              <div>
                <span>ราคา</span>
                <strong>฿{selected.price.toFixed(1)}</strong>
              </div>
              <div>
                <span>คะแนนล่าสุด</span>
                <strong>{selected.points}</strong>
              </div>
              <div>
                <span>นัดถัดไป</span>
                <strong>{localize(selected.next, language)}</strong>
              </div>
            </div>
            <DialogFooter className="modal-actions">
              <button className="secondary-button">ดูสถิติ</button>
              <DialogClose render={<button className="primary-button" />}>
                <Check size={17} /> เลือกผู้เล่นนี้
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </AppShell>
  );
}
