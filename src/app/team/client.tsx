"use client";

import {
  ArrowLeftRight,
  CalendarDays,
  LoaderCircle,
  History,
  Save,
  Search,
  Shirt,
  TriangleAlert,
  Trash2,
  Undo2,
  UserRound,
  WandSparkles,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppShell, PageHeader } from "@/components/fantasy/app-shell";
import { useNavigationBlocker } from "@/components/fantasy/navigation-blocker";
import { PlayerKit } from "@/components/fantasy/player-kit";
import { PlayerMetaBadges } from "@/components/fantasy/player-meta-badges";
import {
  getLocalizedPositionLabel,
  Localized,
  useLanguage,
  type Language,
} from "@/components/fantasy/i18n";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import type { FantasyState } from "@/data/fantasy";
import {
  saveFantasySelectionAction,
  suggestFantasyAutoFillAction,
} from "@/app/fantasy-actions";
import {
  getCountedTransfers,
  THAI_LEAGUE_FANTASY_RULES,
  validateLineup,
  validateTransferLimit,
  type FantasyChip,
  type FantasyPosition,
  type LineupPlayer,
  type RuleViolation,
} from "@/lib/fantasy/rules";
import { getChipOptionState } from "@/lib/fantasy/chip-state";
import {
  createEmptySquadDraft,
  getCompleteSelectionMembers,
  getValidDraftSwapTargetSlotIds,
  pruneRemovedDraftPlayers,
  removePlayerFromDraft,
  restoreRemovedPlayerToDraft,
  swapDraftLineupMembers,
  type DraftLineupMember,
  type RemovedDraftPlayersBySlot,
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

function getShortPositionLabel(position: CompetitionPosition) {
  switch (position) {
    case "GK":
      return "GK";
    case "DEF":
      return "DEF";
    case "MID":
      return "MID";
    case "FWD":
      return "FWD";
    default:
      return position;
  }
}

type PlayerSwapState = "source" | "available" | "unavailable";

type TeamWorkspaceView = "squad" | "market";

type GameweekDetailsProps = {
  deadlineAt: string;
  gameweekNumber: number;
  isEditable: boolean;
  seasonFinished: boolean;
  language: Language;
  translate: (text: string) => string;
  remainingDays: number;
  remainingHours: number;
  remainingMinutes: number;
  remainingMs: number | null;
  showGameweek?: boolean;
};

function GameweekDetails({
  deadlineAt,
  gameweekNumber,
  isEditable,
  seasonFinished,
  language,
  translate,
  remainingDays,
  remainingHours,
  remainingMinutes,
  remainingMs,
  showGameweek = true,
}: GameweekDetailsProps) {
  return (
    <>
      {showGameweek ? (
        <div className="gameweek-main">
          <span>GAMEWEEK</span>
          <strong>{gameweekNumber}</strong>
        </div>
      ) : null}
      <div className="deadline">
        <span>{translate("เดดไลน์จัดทีม")}</span>
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
                }).formatToParts(new Date(deadlineAt));
                const weekday = parts.find(
                  (part) => part.type === "weekday",
                )?.value;
                const day = parts.find((part) => part.type === "day")?.value;
                const month = parts.find(
                  (part) => part.type === "month",
                )?.value;
                const hour = parts.find((part) => part.type === "hour")?.value;
                const minute = parts.find(
                  (part) => part.type === "minute",
                )?.value;
                return `${weekday}ที่ ${day} ${month} ${hour}:${minute}`;
              })()
            : (() => {
                const parts = new Intl.DateTimeFormat("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hourCycle: "h23",
                  timeZone: "Asia/Bangkok",
                }).formatToParts(new Date(deadlineAt));
                const value = (type: Intl.DateTimeFormatPartTypes) =>
                  parts.find((part) => part.type === type)?.value ?? "";
                return `${value("day")} ${value("month").slice(0, 3)} ${value("year")}, ${value("hour")}:${value("minute")}`;
              })()}
        </strong>
      </div>
      <div className="countdown">
        {isEditable ? (
          <>
            <span>
              <b>{remainingMs === null ? "--" : remainingDays}</b>
              <small>{translate("วัน")}</small>
            </span>
            <i>:</i>
            <span>
              <b>
                {remainingMs === null
                  ? "--"
                  : String(remainingHours).padStart(2, "0")}
              </b>
              <small>{translate("ชม.")}</small>
            </span>
            <i>:</i>
            <span>
              <b>
                {remainingMs === null
                  ? "--"
                  : String(remainingMinutes).padStart(2, "0")}
              </b>
              <small>{translate("นาที")}</small>
            </span>
          </>
        ) : (
          <strong className="deadline-closed">
            {translate(
              seasonFinished ? "ฤดูกาลสิ้นสุดแล้ว" : "ปิดรับการจัดทีมแล้ว",
            )}
          </strong>
        )}
      </div>
    </>
  );
}

function ChipToolbarTitle({ label }: { label: string }) {
  return (
    <span className="squad-chip-title">
      <Zap size={18} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

type ChipOptionsProps = {
  activeChip: FantasyChip | null;
  chipsRemaining: FantasyState["chipsRemaining"];
  gameweekNumber: number;
  interactionsDisabled: boolean;
  onChipSelect: (chip: FantasyChip) => void;
  translate: (text: string) => string;
};

function ChipOptions({
  activeChip,
  chipsRemaining,
  gameweekNumber,
  interactionsDisabled,
  onChipSelect,
  translate,
}: ChipOptionsProps) {
  return (
    <div className="chip-options">
      {(
        [
          ["triple_captain", "กัปตัน ×3"],
          ["bench_boost", "นับตัวสำรอง"],
          ["wildcard", "เปลี่ยนตัวอิสระ"],
        ] as const
      ).map(([chip, label]) => {
        const isActive = activeChip === chip;
        const optionState = getChipOptionState({
          chip,
          gameweekNumber,
          remaining: chipsRemaining[chip],
        });
        const isExhausted = optionState.reason === "exhausted";
        const isUnavailable = optionState.reason === "not_started";
        return (
          <button
            type="button"
            key={chip}
            className={isActive ? "active" : ""}
            disabled={interactionsDisabled || optionState.disabled}
            aria-pressed={isActive}
            onClick={() => onChipSelect(chip)}
          >
            <span>{translate(label)}</span>
            <p>
              {isExhausted
                ? translate("ใช้ครบแล้ว")
                : isUnavailable
                  ? translate("ใช้ได้ตั้งแต่ GW2")
                  : translate("เหลือใช้ {count} ครั้ง").replace(
                      "{count}",
                      String(chipsRemaining[chip]),
                    )}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function SquadCaptainBadge({ captain }: { captain: "C" | "V" }) {
  const { language } = useLanguage();
  return (
    <span className="squad-captain-role">
      <i
        className={`captain-badge ${
          captain === "C"
            ? "captain-badge--captain"
            : "captain-badge--vice-captain"
        }`}
        aria-label={
          language === "th"
            ? captain === "C"
              ? "กัปตัน"
              : "รองกัปตัน"
            : captain === "C"
              ? "Captain"
              : "Vice-captain"
        }
      >
        {captain}
      </i>
    </span>
  );
}

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
    case "tier_quota": {
      const level = violation.details?.level;
      return format(
        level === 1
          ? "ผู้เล่นระดับ 1 รวมกันได้ไม่เกิน {count} คน"
          : "ผู้เล่นระดับ 1–{level} รวมกันได้ไม่เกิน {count} คน",
        {
          level,
          count: violation.details?.limit,
        },
      );
    }
    case "transfer_limit":
      return format(
        "เปลี่ยนนักเตะเกินโควต้าติดลบได้สูงสุด {count} คน (-{points} คะแนน)",
        {
          count: violation.details?.limit,
          points: violation.details?.maximumTransferPoints,
        },
      );
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
        onClick={swapState === "source" ? () => onSelect(player) : undefined}
      >
        {captain && <SquadCaptainBadge captain={captain} />}
        <span className="squad-player-tier">
          <PlayerMetaBadges
            player={player}
            showPosition={false}
            showNationality
          />
        </span>
        <button
          className="squad-token"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(player);
          }}
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
          </span>
          <span
            className={`squad-name squad-name--${player.isThai ? "thai" : "foreign"}`}
            title={
              language === "th"
                ? player.isThai
                  ? "นักเตะไทย"
                  : "นักเตะต่างชาติ"
                : player.isThai
                  ? "Thai player"
                  : "Foreign player"
            }
          >
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
  onSelect,
  onSwap,
  actionsDisabled,
  hideAction,
  swapDisabled,
  swapState,
  captain,
  undoPlayerName,
  onUndo,
}: {
  position: CompetitionPosition;
  onSelect: () => void;
  onSwap: () => void;
  actionsDisabled: boolean;
  hideAction: boolean;
  swapDisabled: boolean;
  swapState?: PlayerSwapState;
  captain?: "C" | "V";
  undoPlayerName?: string;
  onUndo?: () => void;
}) {
  const { language } = useLanguage();
  const isSource = swapState === "source";
  const localizedPosition = getLocalizedPositionLabel(position, language);
  const shortPosition = getShortPositionLabel(position);
  const canSelectSlot = !swapState || swapState === "available";
  const slotContent = (
    <>
      <span className="vacant-squad-icon">
        <UserRound size={23} aria-hidden="true" />
      </span>
      <span className="squad-name">{shortPosition}</span>
      <span className="squad-fixture">
        {language === "th" ? "ว่าง" : "Vacant"}
      </span>
    </>
  );
  return (
    <div
      className={`squad-token-shell vacant-squad-token-shell${swapState ? ` swap-${swapState}` : ""}`}
      onClick={isSource ? onSelect : undefined}
    >
      {captain && <SquadCaptainBadge captain={captain} />}
      {canSelectSlot ? (
        <button
          type="button"
          className="vacant-squad-slot"
          onClick={onSelect}
          aria-label={
            language === "th"
              ? swapState === "available"
                ? `สลับกับช่องว่าง ${localizedPosition}`
                : `เลือกนักเตะตำแหน่ง ${localizedPosition}`
              : swapState === "available"
                ? `Swap with vacant ${localizedPosition} slot`
                : `Choose a ${localizedPosition}`
          }
        >
          {slotContent}
        </button>
      ) : (
        <div className="vacant-squad-slot">{slotContent}</div>
      )}
      {(!hideAction || isSource) && (
        <button
          type="button"
          className="squad-token-action squad-swap-action"
          onClick={(event) => {
            event.stopPropagation();
            onSwap();
          }}
          disabled={actionsDisabled || swapDisabled}
          aria-pressed={isSource}
          aria-label={
            language === "th"
              ? isSource
                ? `ยกเลิกการสลับช่องว่าง ${localizedPosition}`
                : `สลับช่องว่าง ${localizedPosition}`
              : isSource
                ? `Cancel swap for vacant ${localizedPosition} slot`
                : `Swap vacant ${localizedPosition} slot`
          }
          title={language === "th" ? "สลับตัว" : "Swap"}
        >
          <ArrowLeftRight size={13} aria-hidden="true" />
        </button>
      )}
      {!hideAction && undoPlayerName && onUndo && (
        <button
          type="button"
          className="squad-token-action squad-undo-action"
          onClick={onUndo}
          disabled={actionsDisabled}
          aria-label={
            language === "th"
              ? `เลิกทำการลบ ${undoPlayerName}`
              : `Undo removing ${undoPlayerName}`
          }
          title={language === "th" ? "เลิกทำ" : "Undo"}
        >
          <Undo2 size={13} aria-hidden="true" />
        </button>
      )}
    </div>
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
  const { setNavigationBlocked } = useNavigationBlocker();
  const [selected, setSelected] = useState<CompetitionPlayerView | null>(null);
  const [swapFrom, setSwapFrom] = useState<string | null>(null);
  const [activeChip, setActiveChip] = useState<FantasyChip | null>(
    fantasy.gameweek.number < THAI_LEAGUE_FANTASY_RULES.wildcardStartGameweek &&
      fantasy.selection.activeChip === "wildcard"
      ? null
      : fantasy.selection.activeChip,
  );
  const [members, setMembers] = useState<DraftLineupMember[]>(() =>
    fantasy.selection.members.length === 0
      ? createEmptySquadDraft()
      : fantasy.selection.members.map((member, index) => ({
          slotId: `selection-slot-${index}`,
          fantasyPlayerId: member.fantasyPlayerId,
          vacancyPosition: null,
          lineupRole: member.lineupRole,
          benchOrder: member.benchOrder,
          captainRole: member.captainRole,
        })),
  );
  const [removedPlayersBySlot, setRemovedPlayersBySlot] =
    useState<RemovedDraftPlayersBySlot>({});
  const [isPending, startTransition] = useTransition();
  const [, startAutoFillTransition] = useTransition();
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [workspaceView, setWorkspaceView] =
    useState<TeamWorkspaceView>("squad");
  const [marketPositionFilterRequest, setMarketPositionFilterRequest] =
    useState<{ position: CompetitionPosition; requestId: number } | null>(null);
  const router = useRouter();

  const changeWorkspaceView = (nextView: TeamWorkspaceView) => {
    if (nextView === workspaceView) {
      return;
    }

    const tabs = document.querySelector<HTMLElement>(
      ".team-workspace-tabs-sticky",
    );
    const topbar = document.querySelector<HTMLElement>(".compact-topbar");
    const tabsArePinned =
      tabs &&
      topbar &&
      Math.abs(
        tabs.getBoundingClientRect().top -
          topbar.getBoundingClientRect().bottom,
      ) <= 1;

    setWorkspaceView(nextView);
    if (window.matchMedia("(width < 48rem)").matches && tabsArePinned) {
      window.requestAnimationFrame(() => {
        document
          .querySelector(".unified-team-workspace")
          ?.scrollIntoView({ block: "start" });
      });
    }
  };

  const replaceDraftMembers = (nextMembers: DraftLineupMember[]) => {
    setMembers(nextMembers);
    setRemovedPlayersBySlot((current) =>
      pruneRemovedDraftPlayers(current, nextMembers),
    );
  };
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
  const vacancies = useMemo(
    () =>
      members.filter(
        (member) =>
          member.fantasyPlayerId === null && member.vacancyPosition !== null,
      ),
    [members],
  );
  const playerPositionsById = useMemo(
    () =>
      new Map(
        [...playersByFantasyId].map(([fantasyPlayerId, player]) => [
          fantasyPlayerId,
          fantasyPositions[player.position],
        ]),
      ),
    [playersByFantasyId],
  );
  const validSwapTargetSlotIds = useMemo(() => {
    if (!swapFrom) return new Set<string>();
    return getValidDraftSwapTargetSlotIds(
      members,
      swapFrom,
      playerPositionsById,
    );
  }, [members, playerPositionsById, swapFrom]);
  const swappableSlotIds = useMemo(() => {
    return new Set(
      members.flatMap((member) =>
        getValidDraftSwapTargetSlotIds(
          members,
          member.slotId,
          playerPositionsById,
        ).size > 0
          ? [member.slotId]
          : [],
      ),
    );
  }, [members, playerPositionsById]);
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
  const interactionsDisabled = !isEditable || isAutoFilling;
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
  const transferCount = useMemo(
    () =>
      getCountedTransfers(
        fantasy.selection.baselineSquadIds,
        members.flatMap((member) =>
          member.fantasyPlayerId ? [member.fantasyPlayerId] : [],
        ),
      ),
    [fantasy.selection.baselineSquadIds, members],
  );
  const transferLimitViolations = useMemo(
    () =>
      hasVacancies
        ? []
        : validateTransferLimit({
            freeTransfersBefore: fantasy.team.freeTransfers,
            transferCount,
            wildcard: activeChip === "wildcard",
            openingGameweek: fantasy.gameweek.number === 1,
          }),
    [
      activeChip,
      fantasy.gameweek.number,
      fantasy.team.freeTransfers,
      hasVacancies,
      transferCount,
    ],
  );
  const lineupValidationViolations = useMemo(() => {
    const violations = validateLineup(lineupAssignments);
    return hasVacancies
      ? violations.filter((violation) =>
          [
            "club_quota",
            "foreign_quota",
            "tier_quota",
            "unknown_tier",
            "unavailable_player",
          ].includes(violation.code),
        )
      : violations;
  }, [hasVacancies, lineupAssignments]);
  const clientValidationMessages = useMemo(() => {
    return [
      ...new Set(
        [...lineupValidationViolations, ...transferLimitViolations].flatMap(
          (violation) => {
            const message = formatClientViolation(
              violation,
              translate,
              clubNameById,
            );
            return message ? [message] : [];
          },
        ),
      ),
    ];
  }, [
    clubNameById,
    lineupValidationViolations,
    transferLimitViolations,
    translate,
  ]);
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
  const draftSelectionMembers = useMemo(
    () =>
      members.flatMap((member) =>
        member.fantasyPlayerId
          ? [
              {
                fantasyPlayerId: member.fantasyPlayerId,
                lineupRole: member.lineupRole,
                benchOrder: member.benchOrder,
                captainRole: member.captainRole,
              },
            ]
          : [],
      ),
    [members],
  );
  const hasUnsavedChanges =
    JSON.stringify(draftSelectionMembers) !== JSON.stringify(savedMembers) ||
    activeChip !== fantasy.selection.activeChip;

  const getSwapState = (slotId: string): PlayerSwapState | undefined => {
    if (!swapFrom) return undefined;
    if (slotId === swapFrom) return "source";
    return validSwapTargetSlotIds.has(slotId) ? "available" : "unavailable";
  };

  const getVacancySwapState = (slotId: string): PlayerSwapState | undefined =>
    getSwapState(slotId);

  useEffect(() => {
    const deadline = new Date(fantasy.gameweek.deadlineAt).getTime();
    const updateRemaining = () =>
      setRemainingMs(Math.max(0, deadline - Date.now()));
    updateRemaining();
    const interval = window.setInterval(updateRemaining, 30_000);
    return () => window.clearInterval(interval);
  }, [fantasy.gameweek.deadlineAt]);

  useEffect(() => {
    setNavigationBlocked(hasUnsavedChanges);
    return () => setNavigationBlocked(false);
  }, [hasUnsavedChanges, setNavigationBlocked]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [hasUnsavedChanges]);

  const saveTeam = () => {
    if (!isEditable) {
      toast.error(translate("ปิดรับการจัดทีมสำหรับ Gameweek นี้แล้ว"));
      return;
    }
    if (!completeSelectionMembers) return;
    if (captaincyValidationMessages.length > 0) {
      toast.error(translate("บันทึกทีมไม่ได้"), {
        description: captaincyValidationMessages.map(translate).join(" · "),
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
          setRemovedPlayersBySlot({});
          toast.success(translate(result.message));
          router.refresh();
        } else {
          toast.error(translate(result.message), {
            description: result.violations?.map(translate).join(" · "),
          });
        }
      } catch {
        toast.error(translate("บันทึกทีมไม่สำเร็จ"), {
          description: translate(
            "การเปลี่ยนแปลงยังไม่ถูกบันทึก กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง",
          ),
        });
      }
    });
  };

  const autoFillVacancies = () => {
    if (!isEditable || isAutoFilling || vacancies.length === 0) return;
    setIsAutoFilling(true);
    startAutoFillTransition(async () => {
      try {
        const result = await suggestFantasyAutoFillAction({ members });
        if (!result.ok) {
          toast.error(translate("เติมทีมอัตโนมัติไม่สำเร็จ"), {
            description: translate(result.message),
          });
          return;
        }
        replaceDraftMembers(result.members);
        setSwapFrom(null);
        setSelected(null);
        toast.success(translate("เติมนักเตะอัตโนมัติแล้ว"), {
          description: translate(
            "เติมนักเตะ {count} คน พร้อมเลือกกัปตันและรองกัปตันแล้ว",
          ).replace("{count}", String(result.addedCount)),
        });
      } catch {
        toast.error(translate("เติมทีมอัตโนมัติไม่สำเร็จ"), {
          description: translate(
            "กรุณาตรวจสอบการเชื่อมต่อแล้วลองเติมทีมอีกครั้ง",
          ),
        });
      } finally {
        setIsAutoFilling(false);
      }
    });
  };

  const saveButton = (
    <button
      type="button"
      className="primary-button compact-auto-fill-button squad-pitch-action squad-save-button"
      onClick={saveTeam}
      disabled={
        isPending ||
        isAutoFilling ||
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
        <LoaderCircle className="spin" size={15} aria-hidden="true" />
      ) : (
        <Save size={15} aria-hidden="true" />
      )}
      {isPending ? "กำลังบันทึกทีม…" : "บันทึกทีม"}
    </button>
  );

  const startSwap = (player: CompetitionPlayerView) => {
    if (interactionsDisabled || !player.fantasyPlayerId) return;
    const member = members.find(
      (item) => item.fantasyPlayerId === player.fantasyPlayerId,
    );
    if (!member || !swappableSlotIds.has(member.slotId)) return;
    setSwapFrom(member.slotId);
    setSelected(null);
  };

  const startVacancySwap = (slotId: string) => {
    if (interactionsDisabled) return;
    if (swapFrom === slotId) {
      setSwapFrom(null);
      return;
    }
    if (!swappableSlotIds.has(slotId)) return;
    setSwapFrom(slotId);
    setSelected(null);
  };

  const removePlayer = (player: CompetitionPlayerView) => {
    if (interactionsDisabled || !player.fantasyPlayerId) return;
    const member = members.find(
      (item) => item.fantasyPlayerId === player.fantasyPlayerId,
    );
    if (!member) return;
    const nextMembers = removePlayerFromDraft(
      members,
      player.fantasyPlayerId,
      fantasyPositions[player.position],
    );
    setMembers(nextMembers);
    setRemovedPlayersBySlot((current) => ({
      ...pruneRemovedDraftPlayers(current, nextMembers),
      [member.slotId]: {
        fantasyPlayerId: player.fantasyPlayerId!,
        captainRole: member.captainRole,
      },
    }));
    setSwapFrom(null);
    setSelected(null);
  };

  const undoPlayerRemoval = (slotId: string) => {
    if (interactionsDisabled) return;
    const removedPlayer = removedPlayersBySlot[slotId];
    if (!removedPlayer) return;
    const restoredMembers = restoreRemovedPlayerToDraft(
      members,
      slotId,
      removedPlayer,
    );
    if (!restoredMembers) {
      setRemovedPlayersBySlot((current) => {
        const remaining = { ...current };
        delete remaining[slotId];
        return remaining;
      });
      return;
    }
    setMembers(restoredMembers);
    setRemovedPlayersBySlot((current) => {
      const remaining = { ...current };
      delete remaining[slotId];
      return pruneRemovedDraftPlayers(remaining, restoredMembers);
    });
    setSwapFrom(null);
    setSelected(null);
  };

  const getUndoPlayerName = (slotId: string) => {
    const removedPlayer = removedPlayersBySlot[slotId];
    if (!removedPlayer) return undefined;
    const player = playersByFantasyId.get(removedPlayer.fantasyPlayerId);
    return player ? localize(player.name, language) : undefined;
  };

  const selectPlayer = (player: CompetitionPlayerView) => {
    if (!player.fantasyPlayerId) return;
    if (!swapFrom) {
      setSelected(player);
      return;
    }
    const target = members.find(
      (member) => member.fantasyPlayerId === player.fantasyPlayerId,
    );
    if (!target) return;
    if (swapFrom === target.slotId) {
      setSwapFrom(null);
      return;
    }
    if (!validSwapTargetSlotIds.has(target.slotId)) return;
    setMembers(
      (current) =>
        swapDraftLineupMembers(current, swapFrom, target.slotId) ?? current,
    );
    setSwapFrom(null);
  };

  const selectVacancy = (slotId: string, position: CompetitionPosition) => {
    if (!swapFrom) {
      setMarketPositionFilterRequest((current) => ({
        position,
        requestId: (current?.requestId ?? 0) + 1,
      }));
      if (window.matchMedia("(width < 48rem)").matches) {
        changeWorkspaceView("market");
      }
      return;
    }
    if (swapFrom === slotId) {
      setSwapFrom(null);
      return;
    }
    if (!validSwapTargetSlotIds.has(slotId)) return;
    setMembers(
      (current) => swapDraftLineupMembers(current, swapFrom, slotId) ?? current,
    );
    setSwapFrom(null);
  };

  return (
    <AppShell>
      <main id="main-content" className="content product-content">
        <PageHeader title="ทีมของฉัน" />
        <section className="gameweek-banner compact-gameweek">
          <div className="compact-gameweek__desktop">
            <GameweekDetails
              deadlineAt={fantasy.gameweek.deadlineAt}
              gameweekNumber={fantasy.gameweek.number}
              isEditable={isEditable}
              seasonFinished={fantasy.seasonFinished}
              language={language}
              translate={translate}
              remainingDays={remainingDays}
              remainingHours={remainingHours}
              remainingMinutes={remainingMinutes}
              remainingMs={remainingMs}
            />
          </div>
          <Accordion className="compact-gameweek__mobile" defaultValue={[]}>
            <AccordionItem value="gameweek">
              <AccordionTrigger className="compact-gameweek__trigger">
                <span className="compact-gameweek__title">
                  <span>GAMEWEEK</span>
                  <strong>{fantasy.gameweek.number}</strong>
                  {!isEditable ? (
                    <small>
                      {translate(
                        fantasy.seasonFinished
                          ? "ฤดูกาลสิ้นสุดแล้ว"
                          : "ปิดรับการจัดทีมแล้ว",
                      )}
                    </small>
                  ) : null}
                </span>
              </AccordionTrigger>
              <AccordionContent className="compact-gameweek__content">
                <GameweekDetails
                  deadlineAt={fantasy.gameweek.deadlineAt}
                  gameweekNumber={fantasy.gameweek.number}
                  isEditable={isEditable}
                  seasonFinished={fantasy.seasonFinished}
                  language={language}
                  translate={translate}
                  remainingDays={remainingDays}
                  remainingHours={remainingHours}
                  remainingMinutes={remainingMinutes}
                  remainingMs={remainingMs}
                  showGameweek={false}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
        <p className="team-squad-guidance">
          {translate(
            "ซื้อนักเตะจากตลาดนักเตะให้ครบ 15 คนแล้วจัด 11 ตัวจริงลงสนามกันเลย",
          )}
        </p>

        <Tabs
          className={`team-workspace-tabs-sticky team-workspace-tabs-sticky--${workspaceView}`}
          value={workspaceView}
          onValueChange={(value) => {
            if (value === "squad" || value === "market") {
              changeWorkspaceView(value);
            }
          }}
        >
          <TabsList
            className="segment-tabs team-workspace-tabs"
            aria-label={translate("สลับมุมมองทีม")}
          >
            <TabsTrigger value="squad">
              <Shirt size={17} aria-hidden="true" />
              นักเตะในทีม
            </TabsTrigger>
            <TabsTrigger value="market">
              <Search size={17} aria-hidden="true" />
              ตลาดนักเตะ
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div
          className={`unified-team-workspace team-workspace--${workspaceView}`}
        >
          <div className="product-card squad-card">
            <section
              className="squad-chip-toolbar"
              aria-label={translate("ตัวช่วยพิเศษ")}
            >
              <div className="squad-chip-toolbar__desktop">
                <ChipToolbarTitle label={translate("ตัวช่วยพิเศษ")} />
                <ChipOptions
                  activeChip={activeChip}
                  chipsRemaining={fantasy.chipsRemaining}
                  gameweekNumber={fantasy.gameweek.number}
                  interactionsDisabled={interactionsDisabled}
                  onChipSelect={(chip) =>
                    setActiveChip((current) => (current === chip ? null : chip))
                  }
                  translate={translate}
                />
              </div>
              <Accordion
                className="squad-chip-toolbar__mobile"
                defaultValue={[]}
              >
                <AccordionItem value="chips">
                  <AccordionTrigger className="squad-chip-toolbar__trigger">
                    <ChipToolbarTitle label={translate("ตัวช่วยพิเศษ")} />
                  </AccordionTrigger>
                  <AccordionContent className="squad-chip-toolbar__content">
                    <ChipOptions
                      activeChip={activeChip}
                      chipsRemaining={fantasy.chipsRemaining}
                      gameweekNumber={fantasy.gameweek.number}
                      interactionsDisabled={interactionsDisabled}
                      onChipSelect={(chip) =>
                        setActiveChip((current) =>
                          current === chip ? null : chip,
                        )
                      }
                      translate={translate}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
              <div className="squad-pitch-actions">
                {saveButton}
                {vacancies.length > 0 && (
                  <button
                    type="button"
                    className="secondary-button compact-auto-fill-button squad-pitch-action squad-auto-fill-button"
                    disabled={!isEditable || isAutoFilling}
                    onClick={autoFillVacancies}
                    aria-busy={isAutoFilling}
                    title={
                      !isEditable ? translate("ปิดรับการจัดทีมแล้ว") : undefined
                    }
                  >
                    {isAutoFilling ? (
                      <LoaderCircle
                        className="spin"
                        size={15}
                        aria-hidden="true"
                      />
                    ) : (
                      <WandSparkles size={15} aria-hidden="true" />
                    )}
                    {isAutoFilling
                      ? translate("กำลังเติม…")
                      : translate("จัดตัวอัตโนมัติ")}
                  </button>
                )}
              </div>
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
                            actionsDisabled={interactionsDisabled}
                            hideActions={Boolean(swapFrom)}
                            swapDisabled={
                              !swappableSlotIds.has(slot.member.slotId)
                            }
                            swapState={getSwapState(slot.member.slotId)}
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
                            onSelect={() =>
                              selectVacancy(slot.member.slotId, slot.position)
                            }
                            onSwap={() => startVacancySwap(slot.member.slotId)}
                            actionsDisabled={interactionsDisabled}
                            hideAction={Boolean(swapFrom)}
                            swapDisabled={
                              !swappableSlotIds.has(slot.member.slotId)
                            }
                            swapState={getVacancySwapState(slot.member.slotId)}
                            captain={
                              slot.member.captainRole === "captain"
                                ? "C"
                                : slot.member.captainRole === "vice_captain"
                                  ? "V"
                                  : undefined
                            }
                            undoPlayerName={getUndoPlayerName(
                              slot.member.slotId,
                            )}
                            onUndo={() => undoPlayerRemoval(slot.member.slotId)}
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
                        actionsDisabled={interactionsDisabled}
                        hideActions={Boolean(swapFrom)}
                        swapDisabled={!swappableSlotIds.has(slot.member.slotId)}
                        swapState={getSwapState(slot.member.slotId)}
                        showPositionBadgeOnShirt
                      />
                    ) : (
                      <VacantSquadSlot
                        position={slot.position}
                        onSelect={() =>
                          selectVacancy(slot.member.slotId, slot.position)
                        }
                        onSwap={() => startVacancySwap(slot.member.slotId)}
                        actionsDisabled={interactionsDisabled}
                        hideAction={Boolean(swapFrom)}
                        swapDisabled={!swappableSlotIds.has(slot.member.slotId)}
                        swapState={getVacancySwapState(slot.member.slotId)}
                        captain={
                          slot.member.captainRole === "captain"
                            ? "C"
                            : slot.member.captainRole === "vice_captain"
                              ? "V"
                              : undefined
                        }
                        undoPlayerName={getUndoPlayerName(slot.member.slotId)}
                        onUndo={() => undoPlayerRemoval(slot.member.slotId)}
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
            activeChip={activeChip}
            isEditable={isEditable}
            members={members}
            onMembersChange={replaceDraftMembers}
            onPlayerSelect={setSelected}
            onPlayerRemove={removePlayer}
            isAutoFilling={isAutoFilling}
            marketPositionFilterRequest={marketPositionFilterRequest}
          />
        </div>
      </main>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        {selected && (
          <DialogContent
            className="product-dialog accessible-player-modal"
            closeLabel={translate("ปิด")}
          >
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
                    disabled={interactionsDisabled}
                    onClick={() => removePlayer(selected)}
                  >
                    <Trash2 size={17} aria-hidden="true" /> ลบ
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={
                      interactionsDisabled ||
                      !selectedMember ||
                      !swappableSlotIds.has(selectedMember.slotId)
                    }
                    onClick={() => startSwap(selected)}
                  >
                    <ArrowLeftRight size={17} aria-hidden="true" /> สลับตัว
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={
                      interactionsDisabled ||
                      selectedMember.lineupRole !== "starter"
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
                      interactionsDisabled ||
                      selectedMember.lineupRole !== "starter"
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
