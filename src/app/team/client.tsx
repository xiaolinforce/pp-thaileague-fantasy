"use client";

import {
  ArrowLeftRight,
  Check,
  LoaderCircle,
  Save,
  Shirt,
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
  transferSelected,
  showPositionBadgeOnShirt,
}: {
  player: CompetitionPlayerView;
  onSelect: (player: CompetitionPlayerView) => void;
  captain?: "C" | "V";
  transferSelected?: boolean;
  showPositionBadgeOnShirt?: boolean;
}) {
  const { language } = useLanguage();
  return (
    <Localized>
      <button
        className={`squad-token ${transferSelected ? "selected-for-transfer" : ""}`}
        onClick={() => onSelect(player)}
        aria-label={`ดูข้อมูล ${localize(player.name, language)}`}
      >
        <span className="squad-shirt">
          <Shirt
            style={{ color: player.accent, fill: player.color }}
            strokeWidth={1.6}
          />
          {showPositionBadgeOnShirt && player.position !== "GK" && (
            <span className="squad-position-badge">
              <PositionBadge position={player.position} />
            </span>
          )}
          {captain && <i>{captain}</i>}
        </span>
        <span className="squad-name">
          {localize(player.shortName, language)}
        </span>
        <span className="squad-fixture">
          {localize(player.clubShort, language)}
        </span>
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
  const { language, translate } = useLanguage();
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
  const isEditable =
    fantasy.gameweek.status === "open" &&
    (remainingMs === null || remainingMs > 0);
  const remaining = Math.max(0, remainingMs ?? 0);
  const remainingDays = Math.floor(remaining / 86_400_000);
  const remainingHours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const remainingMinutes = Math.floor((remaining % 3_600_000) / 60_000);
  const savedMembers = useMemo(
    () =>
      fantasy.selection.members.map((member) => ({
        fantasyPlayerId: member.fantasyPlayerId,
        lineupRole: member.lineupRole,
        benchOrder: member.benchOrder,
        captainRole: member.captainRole,
      })),
    [fantasy.selection.members],
  );
  const hasUnsavedChanges =
    JSON.stringify(members) !== JSON.stringify(savedMembers) ||
    activeChip !== fantasy.selection.activeChip;

  useEffect(() => {
    const deadline = new Date(fantasy.gameweek.deadlineAt).getTime();
    const updateRemaining = () =>
      setRemainingMs(Math.max(0, deadline - Date.now()));
    updateRemaining();
    const interval = window.setInterval(updateRemaining, 30_000);
    return () => window.clearInterval(interval);
  }, [fantasy.gameweek.deadlineAt]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [hasUnsavedChanges]);

  const saveTeam = () => {
    if (!isEditable) {
      toast.error("ปิดรับการจัดทีมสำหรับ Gameweek นี้แล้ว");
      return;
    }
    startTransition(async () => {
      try {
        const result = await saveFantasySelectionAction({
          members,
          activeChip,
        });
        if (result.ok) {
          toast.success(result.message);
          router.refresh();
        } else {
          toast.error(result.message, {
            description: result.violations?.join(" · "),
          });
        }
      } catch {
        toast.error("บันทึกทีมไม่สำเร็จ", {
          description:
            "การเปลี่ยนแปลงยังไม่ถูกบันทึก กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง",
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
      <main id="main-content" className="content product-content">
        <PageHeader
          title="ทีมของฉัน"
          actions={
            <button
              type="button"
              className="primary-button"
              onClick={saveTeam}
              disabled={isPending || !isEditable || !hasUnsavedChanges}
              aria-busy={isPending}
              title={
                !isEditable
                  ? "ปิดรับการจัดทีมแล้ว"
                  : !hasUnsavedChanges
                    ? "ยังไม่มีการเปลี่ยนแปลง"
                    : undefined
              }
            >
              {isPending ? (
                <LoaderCircle className="spin" size={17} aria-hidden="true" />
              ) : (
                <Save size={17} aria-hidden="true" />
              )}
              {isPending ? "กำลังบันทึกทีม…" : "บันทึกทีม"}
            </button>
          }
        />
        <section className="gameweek-banner compact-gameweek">
          <div className="gameweek-main">
            <span>GAMEWEEK</span>
            <strong>{String(fantasy.gameweek.number).padStart(2, "0")}</strong>
          </div>
          <div className="deadline">
            <span>เดดไลน์จัดทีม</span>
            <strong>
              {language === "th"
                ? (() => {
                    const parts = new Intl.DateTimeFormat("th-TH", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                      hourCycle: "h23",
                      timeZone: "Asia/Bangkok",
                    }).formatToParts(new Date(fantasy.gameweek.deadlineAt));
                    const weekday = parts.find(
                      (part) => part.type === "weekday",
                    )?.value;
                    const day = parts.find(
                      (part) => part.type === "day",
                    )?.value;
                    const month = parts.find(
                      (part) => part.type === "month",
                    )?.value;
                    const hour = parts.find(
                      (part) => part.type === "hour",
                    )?.value;
                    const minute = parts.find(
                      (part) => part.type === "minute",
                    )?.value;
                    return `${weekday}ที่ ${day} ${month} ${hour}:${minute}`;
                  })()
                : new Intl.DateTimeFormat("en-GB", {
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

        <div className="unified-team-workspace">
          <div className="product-card squad-card">
            <section
              className="squad-chip-toolbar"
              aria-labelledby="chip-title"
            >
              <div className="squad-chip-title" id="chip-title">
                <Zap size={18} aria-hidden="true" />
                <span>{translate("ตัวช่วยพิเศษ")}</span>
              </div>
              <div className="chip-options">
                {(
                  [
                    ["triple_captain", "กัปตัน ×3"],
                    ["bench_boost", "นับตัวสำรอง"],
                    ["wildcard", "เปลี่ยนตัวไม่จำกัด"],
                  ] as const
                ).map(([chip, label]) => {
                  const isActive = activeChip === chip;
                  return (
                    <button
                      type="button"
                      key={chip}
                      className={isActive ? "active" : ""}
                      disabled={!isEditable}
                      aria-pressed={isActive}
                      onClick={() =>
                        setActiveChip((current) =>
                          current === chip ? null : chip,
                        )
                      }
                    >
                      <span>{label}</span>
                      <p>
                        {translate("เหลือใช้ {count} ครั้ง").replace(
                          "{count}",
                          String(fantasy.chipsRemaining[chip]),
                        )}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
            {swapFrom && (
              <div className="squad-action-hint" role="status">
                เลือกผู้เล่นอีกคนเพื่อสลับตำแหน่ง
              </div>
            )}
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
                          transferSelected={
                            player.fantasyPlayerId === transferOutgoingId
                          }
                          showPositionBadgeOnShirt={false}
                        />
                      ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="bench-panel">
              <div className="bench-title">
                <div>
                  <h3>ม้านั่งสำรอง</h3>
                </div>
              </div>
              <div className="bench-grid">
                {bench.map((player, index) => (
                  <div className="bench-item" key={player.id}>
                    <b>{index === 0 ? "GK" : index}</b>
                    <SquadPlayer
                      player={player}
                      onSelect={selectPlayer}
                      showPositionBadgeOnShirt
                      transferSelected={
                        player.fantasyPlayerId === transferOutgoingId
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <TransfersClient
            data={data}
            fantasy={fantasy}
            isEditable={isEditable}
            members={members}
            onMembersChange={setMembers}
            selectedOutgoing={transferOutgoingId}
            onSelectedOutgoingChange={setTransferOutgoingId}
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
                  window.requestAnimationFrame(() =>
                    document
                      .getElementById("team-transfer-market")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" }),
                  );
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
              <DialogClose render={<button className="secondary-button" />}>
                <Check size={17} /> ปิด
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </AppShell>
  );
}
