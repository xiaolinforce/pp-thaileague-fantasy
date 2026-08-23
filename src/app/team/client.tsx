"use client";

import {
  ArrowLeftRight,
  CalendarDays,
  History,
  LoaderCircle,
  Save,
  TriangleAlert,
  Trash2,
  UserRoundPlus,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppShell, PageHeader } from "@/components/fantasy/app-shell";
import { PlayerKit } from "@/components/fantasy/player-kit";
import { PlayerMetaBadges } from "@/components/fantasy/player-meta-badges";
import { Localized, useLanguage } from "@/components/fantasy/i18n";
import {
  localize,
  type CompetitionPosition,
  type CompetitionDataset,
  type CompetitionPlayerView,
} from "@/lib/competition-types";
import { PositionBadge } from "@/components/fantasy/position-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import type { FantasyState } from "@/data/fantasy";
import { saveFantasySelectionAction } from "@/app/fantasy-actions";
import {
  getValidLineupSwapTargetIds,
  swapLineupAssignments,
  validateLineup,
  validateLineupAssignment,
  type FantasyChip,
  type FantasyPosition,
  type LineupPlayer,
  type RuleViolation,
} from "@/lib/fantasy/rules";
import {
  getCompleteSelectionMembers,
  removePlayerFromDraft,
  type DraftLineupMember,
} from "@/lib/fantasy/team-draft";
import TransfersClient from "@/app/team/transfers-client";

const rows = ["GK", "DEF", "MID", "FWD"] as const;
const fantasyPositions: Record<
  CompetitionPlayerView["position"],
  FantasyPosition
> = {
  GK: "goalkeeper",
  DEF: "defender",
  MID: "midfielder",
  FWD: "forward",
};
const competitionPositions: Record<FantasyPosition, CompetitionPosition> = {
  goalkeeper: "GK",
  defender: "DEF",
  midfielder: "MID",
  forward: "FWD",
};

type PlayerSwapState = "source" | "available" | "unavailable";

function formatClientViolation(
  violation: RuleViolation,
  translate: (text: string) => string,
  clubNameById: ReadonlyMap<string, string>,
) {
  const format = (
    template: string,
    values: Record<string, string | number | boolean | undefined>,
  ) =>
    Object.entries(values).reduce(
      (message, [key, value]) =>
        message.replaceAll(
          `{${key}}`,
          value === undefined ? "" : String(value),
        ),
      translate(template),
    );

  switch (violation.code) {
    case "squad_size":
    case "position_quota":
    case "unknown_tier":
    case "unavailable_player":
      return translate("เกิดข้อผิดพลาด โปรด Refresh หน้านี้");
    case "duplicate_player":
    case "starter_count":
    case "formation":
    case "bench_order":
    case "captain":
    case "vice_captain":
      return null;
    case "club_quota": {
      const clubId = violation.details?.clubId;
      const clubName =
        typeof clubId === "string"
          ? (clubNameById.get(clubId) ?? translate("สโมสรนี้"))
          : translate("สโมสรนี้");
      return format("คุณเลือกผู้เล่นจากสโมสร {club} เกิน {count} คน", {
        club: clubName,
        count: violation.details?.limit,
      });
    }
    case "foreign_quota":
      return format("คุณเลือกผู้เล่นต่างชาติเกิน {count} คน", {
        count: violation.details?.limit,
      });
    case "tier_quota":
      return format("ผู้เล่นระดับ {level} ขึ้นไปใช้ได้ไม่เกิน {count} ช่อง", {
        level: violation.details?.level,
        count: violation.details?.limit,
      });
    default:
      return translate(violation.message);
  }
}

function SquadPlayer({
  player,
  onSelect,
  onSwap,
  onRemove,
  actionsDisabled,
  hideActions,
  swapDisabled,
  captain,
  swapState,
  showPositionBadgeOnShirt,
}: {
  player: CompetitionPlayerView;
  onSelect: (player: CompetitionPlayerView) => void;
  onSwap: (player: CompetitionPlayerView) => void;
  onRemove: (player: CompetitionPlayerView) => void;
  actionsDisabled: boolean;
  hideActions: boolean;
  swapDisabled: boolean;
  captain?: "C" | "V";
  swapState?: PlayerSwapState;
  showPositionBadgeOnShirt?: boolean;
}) {
  const { language } = useLanguage();
  const playerName = localize(player.name, language);
  const ariaLabel =
    swapState === "source"
      ? `ยกเลิกการสลับ ${playerName}`
      : swapState === "available"
        ? `สลับกับ ${playerName}`
        : swapState === "unavailable"
          ? `ไม่สามารถสลับกับ ${playerName}`
          : `ดูข้อมูล ${playerName}`;
  return (
    <Localized>
      <div
        className={`squad-token-shell${swapState ? ` swap-${swapState}` : ""}`}
      >
        <button
          className="squad-token"
          onClick={() => onSelect(player)}
          aria-label={ariaLabel}
          aria-pressed={swapState === "source" ? true : undefined}
          disabled={swapState === "unavailable"}
        >
          <span className="squad-shirt">
            <PlayerKit color={player.color} accent={player.accent} />
            {showPositionBadgeOnShirt && player.position !== "GK" && (
              <span className="squad-position-badge">
                <PositionBadge position={player.position} />
              </span>
            )}
            {captain && (
              <i
                className={`captain-badge ${
                  captain === "C"
                    ? "captain-badge--captain"
                    : "captain-badge--vice-captain"
                }`}
              >
                {captain}
              </i>
            )}
          </span>
          <span className="squad-name">
            {localize(player.shortName, language)}
          </span>
          <span className="squad-fixture">
            {localize(player.clubShort, language)}
          </span>
        </button>
        {!hideActions && (
          <>
            <button
              type="button"
              className="squad-token-action squad-swap-action"
              onClick={() => onSwap(player)}
              disabled={actionsDisabled || swapDisabled}
              aria-label={`${translateAction(language, "สลับตัว", "Swap")} ${playerName}`}
              title={language === "th" ? "สลับตัว" : "Swap"}
            >
              <ArrowLeftRight size={13} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="squad-token-action squad-remove-action"
              onClick={() => onRemove(player)}
              disabled={actionsDisabled}
              aria-label={`${translateAction(language, "ลบ", "Remove")} ${playerName}`}
              title={language === "th" ? "ลบ" : "Remove"}
            >
              <Trash2 size={13} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </Localized>
  );
}

function translateAction(language: "th" | "en", thai: string, english: string) {
  return language === "th" ? thai : english;
}

function VacantSquadSlot({
  position,
  selected,
  disabled,
  onSelect,
}: {
  position: CompetitionPosition;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const { language } = useLanguage();
  return (
    <button
      type="button"
      className={`vacant-squad-slot${selected ? " selected" : ""}`}
      disabled={disabled}
      onClick={onSelect}
      aria-label={
        language === "th"
          ? `เลือกช่องว่าง ${position} เพื่อเพิ่มนักเตะ`
          : `Select vacant ${position} slot to add a player`
      }
    >
      <span className="vacant-squad-icon">
        <UserRoundPlus size={23} aria-hidden="true" />
      </span>
      <span className="squad-name">{position}</span>
      <span className="squad-fixture">
        {language === "th" ? "ว่าง" : "Vacant"}
      </span>
    </button>
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
  const [selectedVacancySlotId, setSelectedVacancySlotId] = useState<
    string | null
  >(null);
  const [selected, setSelected] = useState<CompetitionPlayerView | null>(null);
  const [swapFrom, setSwapFrom] = useState<string | null>(null);
  const [activeChip, setActiveChip] = useState<FantasyChip | null>(
    fantasy.selection.activeChip,
  );
  const [members, setMembers] = useState<DraftLineupMember[]>(
    fantasy.selection.members.map((member, index) => ({
      slotId: `selection-slot-${index}`,
      fantasyPlayerId: member.fantasyPlayerId,
      vacancyPosition: null,
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
  const clubNameById = useMemo(
    () =>
      new Map(
        data.players.map((player) => [
          player.clubId,
          translate(localize(player.club, language)),
        ]),
      ),
    [data.players, language, translate],
  );
  const lineupAssignments = useMemo<LineupPlayer[]>(
    () =>
      members.flatMap((member) => {
        const fantasyPlayerId = member.fantasyPlayerId;
        const squadPlayer = fantasyPlayerId
          ? playersByFantasyId.get(fantasyPlayerId)
          : null;
        return squadPlayer && fantasyPlayerId
          ? [
              {
                id: fantasyPlayerId,
                clubId: squadPlayer.clubId,
                position: fantasyPositions[squadPlayer.position],
                tier: squadPlayer.tier,
                isThai: squadPlayer.isThai,
                isAvailable: true,
                lineupRole: member.lineupRole,
                benchOrder: member.benchOrder,
                captainRole: member.captainRole,
              },
            ]
          : [];
      }),
    [members, playersByFantasyId],
  );
  const validSwapTargetIds = useMemo(
    () =>
      swapFrom && lineupAssignments.length === members.length
        ? getValidLineupSwapTargetIds(lineupAssignments, swapFrom)
        : new Set<string>(),
    [lineupAssignments, members.length, swapFrom],
  );
  const swappableSourceIds = useMemo(() => {
    if (lineupAssignments.length !== members.length) return new Set<string>();
    return new Set(
      lineupAssignments.flatMap((member) =>
        getValidLineupSwapTargetIds(lineupAssignments, member.id).size > 0
          ? [member.id]
          : [],
      ),
    );
  }, [lineupAssignments, members.length]);
  const squadSlots = members.flatMap((member) => {
    const player = member.fantasyPlayerId
      ? (playersByFantasyId.get(member.fantasyPlayerId) ?? null)
      : null;
    const position =
      player?.position ??
      (member.vacancyPosition
        ? competitionPositions[member.vacancyPosition]
        : null);
    return position ? [{ player, member, position }] : [];
  });
  const starterSlots = squadSlots.filter(
    (item) => item.member.lineupRole === "starter",
  );
  const benchSlots = squadSlots
    .filter((item) => item.member.lineupRole === "bench")
    .sort((a, b) => (a.member.benchOrder ?? 99) - (b.member.benchOrder ?? 99));
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
  const selectedFixtures = useMemo(() => {
    if (!selected) return [];

    return data.fixtures
      .filter(
        (fixture) =>
          fixture.status !== "finished" &&
          fixture.status !== "cancelled" &&
          (fixture.home.id === selected.clubId ||
            fixture.away.id === selected.clubId),
      )
      .sort((fixtureA, fixtureB) => {
        const kickoffA = fixtureA.kickoffAt
          ? new Date(fixtureA.kickoffAt).getTime()
          : Number.POSITIVE_INFINITY;
        const kickoffB = fixtureB.kickoffAt
          ? new Date(fixtureB.kickoffAt).getTime()
          : Number.POSITIVE_INFINITY;
        return kickoffA - kickoffB || fixtureA.matchweek - fixtureB.matchweek;
      })
      .slice(0, 5);
  }, [data.fixtures, selected]);
  const selectedRecentMatches = useMemo(() => {
    if (!selected) return [];
    const fixturesById = new Map(
      data.fixtures.map((fixture) => [fixture.id, fixture]),
    );

    return selected.recentMatches.flatMap((match) => {
      const fixture = fixturesById.get(match.fixtureId);
      if (!fixture) return [];
      const isHome = fixture.home.id === selected.clubId;
      return [
        {
          ...match,
          opponent: isHome ? fixture.away : fixture.home,
        },
      ];
    });
  }, [data.fixtures, selected]);
  const selectedPlayerName = selected
    ? translate(localize(selected.name, language))
    : "";
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
  const completeSelectionMembers = useMemo(
    () => getCompleteSelectionMembers(members),
    [members],
  );
  const hasVacancies = completeSelectionMembers === null;
  const lineupValidationViolations = useMemo(
    () => (hasVacancies ? [] : validateLineup(lineupAssignments)),
    [hasVacancies, lineupAssignments],
  );
  const clientValidationMessages = useMemo(() => {
    return [
      ...new Set(
        lineupValidationViolations.flatMap((violation) => {
          const message = formatClientViolation(
            violation,
            translate,
            clubNameById,
          );
          return message ? [message] : [];
        }),
      ),
    ];
  }, [clubNameById, lineupValidationViolations, translate]);
  const captaincyValidationMessages = useMemo(
    () =>
      lineupValidationViolations
        .filter(
          (violation) =>
            violation.code === "captain" || violation.code === "vice_captain",
        )
        .map((violation) => translate(violation.message)),
    [lineupValidationViolations, translate],
  );
  const hasClientValidationErrors = clientValidationMessages.length > 0;
  const hasUnsavedChanges =
    hasVacancies ||
    JSON.stringify(completeSelectionMembers) !== JSON.stringify(savedMembers) ||
    activeChip !== fantasy.selection.activeChip;

  const getSwapState = (
    fantasyPlayerId: string | null,
  ): PlayerSwapState | undefined => {
    if (!swapFrom || !fantasyPlayerId) return undefined;
    if (fantasyPlayerId === swapFrom) return "source";
    return validSwapTargetIds.has(fantasyPlayerId)
      ? "available"
      : "unavailable";
  };

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
    if (!completeSelectionMembers) return;
    if (captaincyValidationMessages.length > 0) {
      toast.error("บันทึกทีมไม่ได้", {
        description: captaincyValidationMessages.join(" · "),
      });
      return;
    }
    startTransition(async () => {
      try {
        const result = await saveFantasySelectionAction({
          members: completeSelectionMembers,
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

  const scrollToMarket = () => {
    window.requestAnimationFrame(() =>
      document
        .getElementById("team-transfer-market")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const startSwap = (player: CompetitionPlayerView) => {
    if (!isEditable || !player.fantasyPlayerId) return;
    if (!swappableSourceIds.has(player.fantasyPlayerId)) return;
    setSelectedVacancySlotId(null);
    setSwapFrom(player.fantasyPlayerId);
    setSelected(null);
  };

  const selectVacancy = (slotId: string) => {
    if (!isEditable) return;
    setSwapFrom(null);
    setSelectedVacancySlotId(slotId);
    scrollToMarket();
  };

  const removePlayer = (player: CompetitionPlayerView) => {
    if (!isEditable || !player.fantasyPlayerId) return;
    const member = members.find(
      (item) => item.fantasyPlayerId === player.fantasyPlayerId,
    );
    if (!member) return;
    setMembers((current) =>
      removePlayerFromDraft(
        current,
        player.fantasyPlayerId!,
        fantasyPositions[player.position],
      ),
    );
    setSwapFrom(null);
    setSelectedVacancySlotId(null);
    setSelected(null);
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
    if (!validSwapTargetIds.has(player.fantasyPlayerId)) return;
    const swapped = swapLineupAssignments(
      lineupAssignments,
      swapFrom,
      player.fantasyPlayerId,
    );
    if (!swapped) return;
    const violations = validateLineupAssignment(swapped);
    if (violations.length > 0) return;
    const swappedById = new Map(swapped.map((member) => [member.id, member]));
    setMembers((current) =>
      current.map((member) => {
        const swappedMember = member.fantasyPlayerId
          ? swappedById.get(member.fantasyPlayerId)
          : null;
        return swappedMember
          ? {
              ...member,
              lineupRole: swappedMember.lineupRole,
              benchOrder: swappedMember.benchOrder,
              captainRole: swappedMember.captainRole,
            }
          : member;
      }),
    );
    setSwapFrom(null);
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
              disabled={
                isPending ||
                !isEditable ||
                !hasUnsavedChanges ||
                hasVacancies ||
                hasClientValidationErrors
              }
              aria-busy={isPending}
              title={
                !isEditable
                  ? "ปิดรับการจัดทีมแล้ว"
                  : hasClientValidationErrors
                    ? clientValidationMessages[0]
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
                    ["wildcard", "เปลี่ยนตัวอิสระ"],
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
            {hasClientValidationErrors && (
              <>
                {clientValidationMessages.map((message) => (
                  <div
                    className="squad-validation-alert"
                    key={message}
                    role="alert"
                  >
                    <TriangleAlert size={18} aria-hidden="true" />
                    <span>{message}</span>
                  </div>
                ))}
              </>
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
                    {starterSlots
                      .filter((slot) => slot.position === position)
                      .map((slot) =>
                        slot.player ? (
                          <SquadPlayer
                            key={slot.member.slotId}
                            player={slot.player}
                            onSelect={selectPlayer}
                            onSwap={startSwap}
                            onRemove={removePlayer}
                            actionsDisabled={!isEditable}
                            hideActions={Boolean(swapFrom)}
                            swapDisabled={
                              !slot.player.fantasyPlayerId ||
                              !swappableSourceIds.has(
                                slot.player.fantasyPlayerId,
                              )
                            }
                            swapState={getSwapState(
                              slot.player.fantasyPlayerId,
                            )}
                            captain={
                              slot.player.fantasyPlayerId === captainId
                                ? "C"
                                : slot.player.fantasyPlayerId === viceCaptainId
                                  ? "V"
                                  : undefined
                            }
                            showPositionBadgeOnShirt={false}
                          />
                        ) : (
                          <VacantSquadSlot
                            key={slot.member.slotId}
                            position={slot.position}
                            selected={
                              selectedVacancySlotId === slot.member.slotId
                            }
                            disabled={!isEditable}
                            onSelect={() => selectVacancy(slot.member.slotId)}
                          />
                        ),
                      )}
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
                {benchSlots.map((slot, index) => (
                  <div className="bench-item" key={slot.member.slotId}>
                    <b>{index === 0 ? "GK" : index}</b>
                    {slot.player ? (
                      <SquadPlayer
                        player={slot.player}
                        onSelect={selectPlayer}
                        onSwap={startSwap}
                        onRemove={removePlayer}
                        actionsDisabled={!isEditable}
                        hideActions={Boolean(swapFrom)}
                        swapDisabled={
                          !slot.player.fantasyPlayerId ||
                          !swappableSourceIds.has(slot.player.fantasyPlayerId)
                        }
                        swapState={getSwapState(slot.player.fantasyPlayerId)}
                        showPositionBadgeOnShirt
                      />
                    ) : (
                      <VacantSquadSlot
                        position={slot.position}
                        selected={selectedVacancySlotId === slot.member.slotId}
                        disabled={!isEditable}
                        onSelect={() => selectVacancy(slot.member.slotId)}
                      />
                    )}
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
            onPlayerSelect={setSelected}
            selectedVacancySlotId={selectedVacancySlotId}
            onSelectedVacancySlotChange={setSelectedVacancySlotId}
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
              <div className="modal-player-identity">
                <DialogHeader className="modal-player-heading">
                  <DialogTitle>{selectedPlayerName}</DialogTitle>
                  <DialogDescription>
                    {localize(selected.club, language)}
                  </DialogDescription>
                </DialogHeader>
                <div className="modal-player-position-badge">
                  <PlayerMetaBadges player={selected} />
                </div>
              </div>
            </div>
            <div className="player-detail-grid">
              <div>
                <span>คะแนนล่าสุด</span>
                <strong>{selected.points}</strong>
              </div>
              <div>
                <span>ฟอร์ม</span>
                <strong>{selected.form}</strong>
              </div>
            </div>
            <div className="player-match-sections">
              <section
                className="player-match-section"
                aria-labelledby="player-recent-matches-title"
              >
                <div className="player-match-section-heading">
                  <History size={18} aria-hidden="true" />
                  <h3 id="player-recent-matches-title">5 นัดล่าสุด</h3>
                </div>
                {selectedRecentMatches.length > 0 ? (
                  <div className="player-match-strip">
                    {selectedRecentMatches.map((match) => (
                      <article
                        className="player-match-card"
                        key={match.fixtureId}
                      >
                        <span className="player-match-gameweek">
                          GW <strong>{match.matchweek}</strong>
                        </span>
                        <strong
                          className="player-match-opponent"
                          title={localize(match.opponent.name, language)}
                        >
                          {localize(match.opponent.shortName, language)}
                        </strong>
                        <span className="player-match-points">
                          <strong>{match.points}</strong> <span>คะแนน</span>
                        </span>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="player-fixtures-empty">ยังไม่มีผลการแข่งขัน</p>
                )}
              </section>
              <section
                className="player-match-section"
                aria-labelledby="player-upcoming-fixtures-title"
              >
                <div className="player-match-section-heading">
                  <CalendarDays size={18} aria-hidden="true" />
                  <h3 id="player-upcoming-fixtures-title">5 โปรแกรมถัดไป</h3>
                </div>
                {selectedFixtures.length > 0 ? (
                  <div className="player-match-strip">
                    {selectedFixtures.map((fixture) => {
                      const isHome = fixture.home.id === selected.clubId;
                      const opponent = isHome ? fixture.away : fixture.home;
                      return (
                        <article
                          className="player-match-card player-match-card--upcoming"
                          key={fixture.id}
                        >
                          <span className="player-match-gameweek">
                            GW <strong>{fixture.matchweek}</strong>
                          </span>
                          <strong
                            className="player-match-opponent"
                            title={localize(opponent.name, language)}
                          >
                            {localize(opponent.shortName, language)}
                          </strong>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="player-fixtures-empty">ยังไม่มีโปรแกรมถัดไป</p>
                )}
              </section>
            </div>
            <DialogFooter className="modal-actions border-t-0">
              {selectedMember && (
                <>
                  <button
                    type="button"
                    className="secondary-button danger-button"
                    disabled={!isEditable}
                    onClick={() => removePlayer(selected)}
                  >
                    <Trash2 size={17} aria-hidden="true" /> ลบ
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={
                      !isEditable ||
                      !selected.fantasyPlayerId ||
                      !swappableSourceIds.has(selected.fantasyPlayerId)
                    }
                    onClick={() => startSwap(selected)}
                  >
                    <ArrowLeftRight size={17} aria-hidden="true" /> สลับตัว
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={
                      !isEditable || selectedMember.lineupRole !== "starter"
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
                    <i
                      className="captain-badge captain-badge--captain dialog-captain-icon"
                      aria-hidden="true"
                    >
                      C
                    </i>
                    กัปตัน
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={
                      !isEditable || selectedMember.lineupRole !== "starter"
                    }
                    onClick={() => {
                      if (!selected.fantasyPlayerId) return;
                      setMembers((current) => {
                        const oldVice = current.find(
                          (member) => member.captainRole === "vice_captain",
                        );
                        const wasCaptain =
                          current.find(
                            (member) => member.captainRole === "captain",
                          )?.fantasyPlayerId === selected.fantasyPlayerId;
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
                    <i
                      className="captain-badge captain-badge--vice-captain dialog-captain-icon"
                      aria-hidden="true"
                    >
                      V
                    </i>
                    รองกัปตัน
                  </button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </AppShell>
  );
}
