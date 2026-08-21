"use client";

import {
  ArrowLeftRight,
  Check,
  Clock3,
  Info,
  LayoutGrid,
  List,
  Save,
  Shirt,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppShell, PageHeader } from "@/components/fantasy/app-shell";
import { PlayerKit } from "@/components/fantasy/player-kit";
import { Localized, useLanguage } from "@/components/fantasy/i18n";
import {
  localize,
  type CompetitionDataset,
  type CompetitionPlayerView,
} from "@/lib/competition-types";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { FantasyState } from "@/data/fantasy";
import {
  saveFantasySelectionAction,
  type FantasySelectionInput,
} from "@/app/fantasy-actions";
import type { FantasyChip } from "@/lib/fantasy/rules";
import TransfersClient from "@/app/team/transfers-client";

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
        <span className="squad-name">
          {localize(player.name, language).split(" ")[0]}
        </span>
        <span className="squad-fixture">{localize(player.next, language)}</span>
      </button>
    </Localized>
  );
}

export default function TeamClient({
  data,
  fantasy,
}: {
  data: CompetitionDataset;
  fantasy: FantasyState;
}) {
  const [view, setView] = useState<"pitch" | "list">("pitch");
  const [mode, setMode] = useState<"lineup" | "transfers">("lineup");
  const [transferOutgoingId, setTransferOutgoingId] = useState<string | null>(
    null,
  );
  const [selected, setSelected] = useState<CompetitionPlayerView | null>(null);
  const [swapFrom, setSwapFrom] = useState<string | null>(null);
  const [activeChip, setActiveChip] = useState<FantasyChip | null>(
    fantasy.selection.activeChip,
  );
  const [members, setMembers] = useState<FantasySelectionInput["members"]>(
    fantasy.selection.members.map((member) => ({
      fantasyPlayerId: member.fantasyPlayerId,
      lineupRole: member.lineupRole,
      benchOrder: member.benchOrder,
      captainRole: member.captainRole,
    })),
  );
  const [isPending, startTransition] = useTransition();
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const router = useRouter();
  const { language } = useLanguage();
  const playersByFantasyId = useMemo(
    () =>
      new Map(
        data.players.flatMap((player) =>
          player.fantasyPlayerId
            ? [[player.fantasyPlayerId, player] as const]
            : [],
        ),
      ),
    [data.players],
  );
  const squad = members.flatMap((member) => {
    const player = playersByFantasyId.get(member.fantasyPlayerId);
    return player ? [{ player, member }] : [];
  });
  const starters = squad
    .filter((item) => item.member.lineupRole === "starter")
    .map((item) => item.player);
  const bench = squad
    .filter((item) => item.member.lineupRole === "bench")
    .sort((a, b) => (a.member.benchOrder ?? 99) - (b.member.benchOrder ?? 99))
    .map((item) => item.player);
  const captainId = members.find(
    (member) => member.captainRole === "captain",
  )?.fantasyPlayerId;
  const viceCaptainId = members.find(
    (member) => member.captainRole === "vice_captain",
  )?.fantasyPlayerId;
  const selectedMember = selected?.fantasyPlayerId
    ? members.find(
        (member) => member.fantasyPlayerId === selected.fantasyPlayerId,
      )
    : null;
  const levelOne = squad.filter((item) => item.player.tier === 1).length;
  const premiumSlots = squad.filter((item) => item.player.tier <= 2).length;
  const foreignPlayers = squad.filter((item) => !item.player.isThai).length;
  const formation = (["DEF", "MID", "FWD"] as const)
    .map(
      (position) =>
        starters.filter((player) => player.position === position).length,
    )
    .join(" · ");
  const isEditable =
    fantasy.gameweek.status === "open" &&
    (remainingMs === null || remainingMs > 0);
  const remaining = Math.max(0, remainingMs ?? 0);
  const remainingDays = Math.floor(remaining / 86_400_000);
  const remainingHours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const remainingMinutes = Math.floor((remaining % 3_600_000) / 60_000);

  useEffect(() => {
    const deadline = new Date(fantasy.gameweek.deadlineAt).getTime();
    const updateRemaining = () =>
      setRemainingMs(Math.max(0, deadline - Date.now()));
    updateRemaining();
    const interval = window.setInterval(updateRemaining, 30_000);
    return () => window.clearInterval(interval);
  }, [fantasy.gameweek.deadlineAt]);

  const saveTeam = () => {
    if (!isEditable) {
      toast.error("ปิดรับการจัดทีมสำหรับ Gameweek นี้แล้ว");
      return;
    }
    startTransition(async () => {
      const result = await saveFantasySelectionAction({ members, activeChip });
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message, {
          description: result.violations?.join(" · "),
        });
      }
    });
  };

  const selectPlayer = (player: CompetitionPlayerView) => {
    if (!player.fantasyPlayerId) return;
    if (!swapFrom) {
      setSelected(player);
      return;
    }
    if (swapFrom === player.fantasyPlayerId) {
      setSwapFrom(null);
      return;
    }
    setMembers((current) => {
      const from = current.find(
        (member) => member.fantasyPlayerId === swapFrom,
      );
      const to = current.find(
        (member) => member.fantasyPlayerId === player.fantasyPlayerId,
      );
      if (!from || !to) return current;
      return current.map((member) => {
        if (member.fantasyPlayerId === from.fantasyPlayerId) {
          return {
            ...member,
            lineupRole: to.lineupRole,
            benchOrder: to.benchOrder,
            captainRole:
              to.lineupRole === "starter" ? member.captainRole : "none",
          };
        }
        if (member.fantasyPlayerId === to.fantasyPlayerId) {
          return {
            ...member,
            lineupRole: from.lineupRole,
            benchOrder: from.benchOrder,
            captainRole:
              from.lineupRole === "starter" ? member.captainRole : "none",
          };
        }
        return member;
      });
    });
    setSwapFrom(null);
    toast.success("สลับตำแหน่งในทีมแล้ว");
  };

  return (
    <AppShell>
      <main className="content product-content">
        <PageHeader
          eyebrow="ทีมของฉัน"
          title="จัดทีมและซื้อขาย"
          description="จัดตัวจริง เลือกกัปตัน และปรับนักเตะให้พร้อมก่อนเดดไลน์"
          actions={
            mode === "lineup" ? (
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
                <button
                  className="primary-button"
                  onClick={saveTeam}
                  disabled={isPending || !isEditable}
                >
                  <Save size={17} />
                  บันทึกทีม
                </button>
              </>
            ) : undefined
          }
        />
        <section className="gameweek-banner compact-gameweek">
          <div className="gameweek-main">
            <span>GAMEWEEK สำหรับจัดทีม</span>
            <strong>{String(fantasy.gameweek.number).padStart(2, "0")}</strong>
          </div>
          <div className="deadline">
            <span>
              <Clock3 size={16} /> เดดไลน์จัดทีม
            </span>
            <strong>
              {new Intl.DateTimeFormat(language === "th" ? "th-TH" : "en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Asia/Bangkok",
              }).format(new Date(fantasy.gameweek.deadlineAt))}
            </strong>
          </div>
          <div className="countdown">
            {isEditable ? (
              <>
                <span>
                  <b>{remainingMs === null ? "--" : remainingDays}</b>
                  <small>วัน</small>
                </span>
                <i>:</i>
                <span>
                  <b>
                    {remainingMs === null
                      ? "--"
                      : String(remainingHours).padStart(2, "0")}
                  </b>
                  <small>ชม.</small>
                </span>
                <i>:</i>
                <span>
                  <b>
                    {remainingMs === null
                      ? "--"
                      : String(remainingMinutes).padStart(2, "0")}
                  </b>
                  <small>นาที</small>
                </span>
              </>
            ) : (
              <strong className="deadline-closed">ปิดรับการจัดทีมแล้ว</strong>
            )}
          </div>
        </section>

        <div className="team-hub-tabs" role="tablist" aria-label="จัดการทีม">
          <button
            id="lineup-mode-tab"
            role="tab"
            aria-selected={mode === "lineup"}
            aria-controls="lineup-mode-panel"
            className={mode === "lineup" ? "active" : ""}
            onClick={() => setMode("lineup")}
          >
            <Shirt size={18} /> จัดตัวจริง
          </button>
          <button
            id="transfer-mode-tab"
            role="tab"
            aria-selected={mode === "transfers"}
            aria-controls="team-transfer-panel"
            className={mode === "transfers" ? "active" : ""}
            onClick={() => setMode("transfers")}
          >
            <ArrowLeftRight size={18} /> ซื้อขายนักเตะ
          </button>
        </div>

        <div
          className="team-layout team-mode-panel"
          id="lineup-mode-panel"
          role="tabpanel"
          aria-labelledby="lineup-mode-tab"
          hidden={mode !== "lineup"}
        >
          <section className="product-card squad-card">
            <div className="product-card-head">
              <div>
                <span className="eyebrow">แผนการเล่น {formation}</span>
                <h2>{fantasy.team.name}</h2>
                {swapFrom && (
                  <small className="swap-hint">
                    เลือกผู้เล่นอีกคนเพื่อสลับตำแหน่ง
                  </small>
                )}
              </div>
              <ToggleGroup
                className="view-toggle"
                value={[view]}
                onValueChange={(values) =>
                  values[0] && setView(values[0] as "pitch" | "list")
                }
              >
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <ToggleGroupItem value="pitch" aria-label="มุมมองสนาม" />
                    }
                  >
                    <LayoutGrid size={17} />
                  </TooltipTrigger>
                  <TooltipContent>มุมมองสนาม</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <ToggleGroupItem
                        value="list"
                        aria-label="มุมมองรายชื่อ"
                      />
                    }
                  >
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
                              onSelect={selectPlayer}
                              captain={
                                player.fantasyPlayerId === captainId
                                  ? "C"
                                  : player.fantasyPlayerId === viceCaptainId
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
                        <SquadPlayer player={player} onSelect={selectPlayer} />
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
                  <span>ระดับ</span>
                  <span>คะแนน</span>
                </div>
                {[...starters, ...bench].map((player, index) => (
                  <button
                    className="roster-row"
                    key={player.id}
                    onClick={() => selectPlayer(player)}
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
                    <span>ระดับ {player.tier}</span>
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
                  <Wallet size={18} /> โควต้าระดับ
                </span>
              </div>
              <div className="budget-number">
                <strong>{levelOne}/3</strong>
                <span>ระดับ 1</span>
              </div>
              <div className="budget-bar">
                <span
                  style={{ width: `${Math.min(100, (levelOne / 3) * 100)}%` }}
                />
              </div>
              <div className="budget-split">
                <span>
                  L1 + L2 <b>{premiumSlots}/10</b>
                </span>
                <span>
                  ต่างชาติ <b className="orange-text">{foreignPlayers}/7</b>
                </span>
              </div>
            </section>
            <section className="summary-card chip-card">
              <div className="card-title">
                <span>
                  <Zap size={18} /> Chips
                </span>
              </div>
              <div className="chip-options">
                {(
                  [
                    ["triple_captain", "กัปตัน ×3"],
                    ["bench_boost", "นับตัวสำรอง"],
                    ["wildcard", "Wildcard"],
                  ] as const
                ).map(([chip, label]) => (
                  <button
                    key={chip}
                    className={activeChip === chip ? "active" : ""}
                    disabled={!isEditable}
                    onClick={() =>
                      setActiveChip((current) =>
                        current === chip ? null : chip,
                      )
                    }
                  >
                    <span>{label}</span>
                    <b>{fantasy.chipsRemaining[chip]} ครั้ง</b>
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
        <div
          className="team-mode-panel"
          id="team-transfer-panel"
          role="tabpanel"
          aria-labelledby="transfer-mode-tab"
          hidden={mode !== "transfers"}
        >
          <TransfersClient
            key={transferOutgoingId ?? "market"}
            data={data}
            fantasy={fantasy}
            isEditable={isEditable}
            initialOutgoingId={transferOutgoingId}
            onSelectionChange={setMembers}
          />
        </div>
      </main>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
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
                  <DialogDescription>
                    {localize(selected.club, language)}
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>
            <div className="player-detail-grid">
              <div>
                <span>ระดับ</span>
                <strong>{selected.tier}</strong>
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
              <button
                className="primary-button"
                disabled={!isEditable}
                onClick={() => {
                  setTransferOutgoingId(selected.fantasyPlayerId ?? null);
                  setSelected(null);
                  setMode("transfers");
                }}
              >
                <ArrowLeftRight size={17} /> เปลี่ยนนักเตะ
              </button>
              <button
                className="secondary-button"
                disabled={!isEditable}
                onClick={() => {
                  if (selected.fantasyPlayerId)
                    setSwapFrom(selected.fantasyPlayerId);
                  setSelected(null);
                }}
              >
                สลับตัว
              </button>
              <button
                className="secondary-button"
                disabled={
                  !isEditable || selectedMember?.lineupRole !== "starter"
                }
                onClick={() => {
                  if (!selected.fantasyPlayerId) return;
                  setMembers((current) => {
                    const oldCaptain = current.find(
                      (member) => member.captainRole === "captain",
                    );
                    const wasVice =
                      current.find(
                        (member) => member.captainRole === "vice_captain",
                      )?.fantasyPlayerId === selected.fantasyPlayerId;
                    return current.map((member) => ({
                      ...member,
                      captainRole:
                        member.fantasyPlayerId === selected.fantasyPlayerId
                          ? "captain"
                          : wasVice &&
                              member.fantasyPlayerId ===
                                oldCaptain?.fantasyPlayerId
                            ? "vice_captain"
                            : member.captainRole === "captain"
                              ? "none"
                              : member.captainRole,
                    }));
                  });
                  setSelected(null);
                }}
              >
                กัปตัน
              </button>
              <button
                className="secondary-button"
                disabled={
                  !isEditable || selectedMember?.lineupRole !== "starter"
                }
                onClick={() => {
                  if (!selected.fantasyPlayerId) return;
                  setMembers((current) => {
                    const oldVice = current.find(
                      (member) => member.captainRole === "vice_captain",
                    );
                    const wasCaptain =
                      current.find((member) => member.captainRole === "captain")
                        ?.fantasyPlayerId === selected.fantasyPlayerId;
                    return current.map((member) => ({
                      ...member,
                      captainRole:
                        member.fantasyPlayerId === selected.fantasyPlayerId
                          ? "vice_captain"
                          : wasCaptain &&
                              member.fantasyPlayerId ===
                                oldVice?.fantasyPlayerId
                            ? "captain"
                            : member.captainRole === "vice_captain"
                              ? "none"
                              : member.captainRole,
                    }));
                  });
                  setSelected(null);
                }}
              >
                รองกัปตัน
              </button>
              <DialogClose render={<button className="primary-button" />}>
                <Check size={17} /> ปิด
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </AppShell>
  );
}
