"use client";

import {
  ArrowLeftRight,
  CalendarDays,
  LoaderCircle,
  History,
  Save,
  TriangleAlert,
  Trash2,
  UserRound,
  WandSparkles,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppShell, PageHeader } from "@/components/fantasy/app-shell";
import { PlayerKit } from "@/components/fantasy/player-kit";
import { PlayerMetaBadges } from "@/components/fantasy/player-meta-badges";
import {
  getLocalizedPositionLabel,
  Localized,
  useLanguage,
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
import { toast } from "@/components/ui/sonner";
import type { FantasyState } from "@/data/fantasy";
import {
  saveFantasySelectionAction,
  suggestFantasyAutoFillAction,
} from "@/app/fantasy-actions";
import {
  THAI_LEAGUE_FANTASY_RULES,
  validateLineup,
  type FantasyChip,
  type FantasyPosition,
  type LineupPlayer,
  type RuleViolation,
} from "@/lib/fantasy/rules";
import {
  createEmptySquadDraft,
  getCompleteSelectionMembers,
  getValidDraftSwapTargetSlotIds,
  removePlayerFromDraft,
  swapDraftLineupMembers,
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
    case "tier_quota":
      return format("ผู้เล่นระดับ 1–{level} รวมกันได้ไม่เกิน {count} คน", {
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
        {captain && <SquadCaptainBadge captain={captain} />}
        <span className="squad-player-tier">
          <PlayerMetaBadges
            player={player}
            showPosition={false}
            showNationality={false}
          />
        </span>
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
}: {
  position: CompetitionPosition;
  onSelect: () => void;
  onSwap: () => void;
  actionsDisabled: boolean;
  hideAction: boolean;
  swapDisabled: boolean;
  swapState?: PlayerSwapState;
  captain?: "C" | "V";
}) {
  const { language } = useLanguage();
  const isSource = swapState === "source";
  const localizedPosition = getLocalizedPositionLabel(position, language);
  const slotContent = (
    <>
      <span className="vacant-squad-icon">
        <UserRound size={23} aria-hidden="true" />
      </span>
      <span className="squad-name">{localizedPosition}</span>
      <span className="squad-fixture">
        {language === "th" ? "ว่าง" : "Vacant"}
      </span>
    </>
  );
  return (
    <div
      className={`squad-token-shell vacant-squad-token-shell${swapState ? ` swap-${swapState}` : ""}`}
    >
      {captain && <SquadCaptainBadge captain={captain} />}
      {swapState && !isSource ? (
        <button
          type="button"
          className="vacant-squad-slot"
          onClick={onSelect}
          disabled={swapState === "unavailable"}
          aria-label={
            language === "th"
              ? swapState === "available"
                ? `สลับกับช่องว่าง ${localizedPosition}`
                : `ไม่สามารถสลับกับช่องว่าง ${localizedPosition}`
              : swapState === "available"
                ? `Swap with vacant ${localizedPosition} slot`
                : `Cannot swap with vacant ${localizedPosition} slot`
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
          onClick={onSwap}
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
  const [isPending, startTransition] = useTransition();
  const [, startAutoFillTransition] = useTransition();
  const [isAutoFilling, setIsAutoFilling] = useState(false);
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
        setMembers(result.members);
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
    setMembers((current) =>
      removePlayerFromDraft(
        current,
        player.fantasyPlayerId!,
        fantasyPositions[player.position],
      ),
    );
    setSwapFrom(null);
    setSelected(null);
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

  const selectVacancy = (slotId: string) => {
    if (!swapFrom) return;
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
        <PageHeader
          title="ทีมของฉัน"
          actions={
            <button
              type="button"
              className="primary-button"
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
                  const isUnavailable =
                    chip === "wildcard" &&
                    fantasy.gameweek.number <
                      THAI_LEAGUE_FANTASY_RULES.wildcardStartGameweek;
                  return (
                    <button
                      type="button"
                      key={chip}
                      className={isActive ? "active" : ""}
                      disabled={interactionsDisabled || isUnavailable}
                      aria-pressed={isActive}
                      onClick={() =>
                        setActiveChip((current) =>
                          current === chip ? null : chip,
                        )
                      }
                    >
                      <span>{label}</span>
                      <p>
                        {isUnavailable
                          ? translate("ใช้ได้ตั้งแต่ GW2")
                          : translate("เหลือใช้ {count} ครั้ง").replace(
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
              {vacancies.length > 0 && (
                <button
                  type="button"
                  className="secondary-button compact-auto-fill-button squad-auto-fill-button"
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
                            onSelect={() => selectVacancy(slot.member.slotId)}
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
                        onSelect={() => selectVacancy(slot.member.slotId)}
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
            isAutoFilling={isAutoFilling}
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
