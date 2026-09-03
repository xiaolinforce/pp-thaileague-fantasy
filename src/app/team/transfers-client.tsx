"use client";

import {
  ArrowDownUp,
  CircleHelp,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ClubColor } from "@/components/fantasy/club-colors";
import {
  getLocalizedPositionLabel,
  Localized,
  useLanguage,
} from "@/components/fantasy/i18n";
import { PlayerIdentity } from "@/components/fantasy/player-identity";
import { PositionBadge } from "@/components/fantasy/position-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FantasyState } from "@/data/fantasy";
import {
  localize,
  type CompetitionPosition,
  type CompetitionDataset,
  type CompetitionPlayerView,
} from "@/lib/competition-types";
import {
  fillFirstMatchingDraftVacancy,
  type DraftLineupMember,
} from "@/lib/fantasy/team-draft";
import { buildTierQuotaMeter } from "@/lib/fantasy/tier-quota-meter";
import {
  getCountedTransfers,
  getTransferUsage,
  type FantasyChip,
  type FantasyPosition,
} from "@/lib/fantasy/rules";

const competitionPositions: Record<FantasyPosition, CompetitionPosition> = {
  goalkeeper: "GK",
  defender: "DEF",
  midfielder: "MID",
  forward: "FWD",
};
const fantasyPositions: Record<CompetitionPosition, FantasyPosition> = {
  GK: "goalkeeper",
  DEF: "defender",
  MID: "midfielder",
  FWD: "forward",
};

export default function TransfersClient({
  data,
  fantasy,
  activeChip,
  isEditable,
  members,
  onMembersChange,
  onPlayerSelect,
  onPlayerRemove,
  isAutoFilling,
}: {
  data: CompetitionDataset;
  fantasy: FantasyState;
  activeChip: FantasyChip | null;
  isEditable: boolean;
  members: DraftLineupMember[];
  onMembersChange: (members: DraftLineupMember[]) => void;
  onPlayerSelect: (player: CompetitionPlayerView) => void;
  onPlayerRemove: (player: CompetitionPlayerView) => void;
  isAutoFilling: boolean;
}) {
  const { language, translate } = useLanguage();
  const [query, setQuery] = useState("");
  const [clubId, setClubId] = useState("all");
  const [position, setPosition] = useState("ALL");
  const [tier, setTier] = useState("all");
  const [nationality, setNationality] = useState("all");
  const [sort, setSort] = useState("points");
  const [filterAccordionValue, setFilterAccordionValue] = useState<string[]>(
    [],
  );

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 48rem)");
    const syncFilterVisibility = () => {
      setFilterAccordionValue(desktopQuery.matches ? ["filters"] : []);
    };

    syncFilterVisibility();
    desktopQuery.addEventListener("change", syncFilterVisibility);
    return () =>
      desktopQuery.removeEventListener("change", syncFilterVisibility);
  }, []);

  const clubs = useMemo(
    () =>
      [...data.clubs].sort((clubA, clubB) =>
        localize(clubA.shortName, language).localeCompare(
          localize(clubB.shortName, language),
          language === "th" ? "th-TH" : "en",
        ),
      ),
    [data.clubs, language],
  );
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
  const ownedIds = useMemo(
    () =>
      new Set(
        members.flatMap((member) =>
          member.fantasyPlayerId ? [member.fantasyPlayerId] : [],
        ),
      ),
    [members],
  );
  const currentSquadIds = members.flatMap((member) =>
    member.fantasyPlayerId ? [member.fantasyPlayerId] : [],
  );
  const netTransferCount = getCountedTransfers(
    fantasy.selection.baselineSquadIds,
    currentSquadIds,
  );
  const hasUnlimitedOpeningTransfers = fantasy.gameweek.number === 1;
  const hasActiveWildcard = activeChip === "wildcard";
  const transferUsage = getTransferUsage({
    freeTransfersBefore: fantasy.team.freeTransfers,
    transferCount: netTransferCount,
    wildcard: hasActiveWildcard,
    openingGameweek: hasUnlimitedOpeningTransfers,
  });
  const { freeTransfersRemaining, hasUnlimitedTransfers, transferPoints } =
    transferUsage;
  const isOverFreeTransferLimit = transferPoints > 0;
  const unlimitedTransfersLabel = hasActiveWildcard
    ? translate("Wildcard ทำงานอยู่ · ไม่หักคะแนน และเก็บสิทธิ์ฟรีไว้")
    : translate("Gameweek 1 เปลี่ยนได้ไม่จำกัด");
  const vacancies = members.filter(
    (member) =>
      member.fantasyPlayerId === null && member.vacancyPosition !== null,
  );
  const vacantPositions = new Set(
    vacancies.map((member) => competitionPositions[member.vacancyPosition!]),
  );
  const players = data.players
    .filter((player) => player.fantasyPlayerId)
    .filter((player) => clubId === "all" || player.clubId === clubId)
    .filter((player) => position === "ALL" || player.position === position)
    .filter((player) => tier === "all" || player.tier === Number(tier))
    .filter(
      (player) =>
        nationality === "all" ||
        (nationality === "thai" ? player.isThai : !player.isThai),
    )
    .filter((player) =>
      `${player.name.th} ${player.name.en} ${player.shortName.th} ${player.shortName.en}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === "tier") return a.tier - b.tier || b.points - a.points;
      return sort === "form" ? b.form - a.form : b.points - a.points;
    })
    .slice(0, 50);

  const squadPlayers = members.flatMap((member) => {
    const player = member.fantasyPlayerId
      ? playersByFantasyId.get(member.fantasyPlayerId)
      : null;
    return player ? [player] : [];
  });
  const levelOne = squadPlayers.filter((player) => player.tier === 1).length;
  const levelTwo = squadPlayers.filter((player) => player.tier === 2).length;
  const levelThree = squadPlayers.filter((player) => player.tier === 3).length;
  const topTwoLevels = squadPlayers.filter((player) => player.tier <= 2).length;
  const topThreeLevels = squadPlayers.filter(
    (player) => player.tier <= 3,
  ).length;
  const foreignPlayers = squadPlayers.filter((player) => !player.isThai).length;
  const tierQuotaDots = buildTierQuotaMeter({
    1: levelOne,
    2: levelTwo,
    3: levelThree,
  });
  const isTierQuotaOver =
    levelOne > 3 || topTwoLevels > 6 || topThreeLevels > 9;
  const tierQuotaSummary = translate(
    "ใช้ระดับ 1 {level1} คน ระดับ 2 {level2} คน และระดับ 3 {level3} คน",
  )
    .replace("{level1}", String(levelOne))
    .replace("{level2}", String(levelTwo))
    .replace("{level3}", String(levelThree));
  function choosePlayer(player: CompetitionPlayerView) {
    if (isAutoFilling) return;
    if (!isEditable) {
      toast.error("ปิดรับการจัดทีมสำหรับ Gameweek นี้แล้ว");
      return;
    }
    if (!player.fantasyPlayerId) return;
    if (ownedIds.has(player.fantasyPlayerId)) return;
    const nextMembers = fillFirstMatchingDraftVacancy(
      members,
      fantasyPositions[player.position],
      player.fantasyPlayerId,
    );
    if (!nextMembers) return;
    onMembersChange(nextMembers);
  }

  return (
    <Localized>
      <aside
        className="product-card compact-transfer-market"
        id="team-transfer-market"
        aria-label="ตลาดนักเตะ"
      >
        <div className="compact-market-head">
          <h2>ตลาดนักเตะ</h2>
        </div>
        <div className="compact-transfer-stats">
          <div>
            <span>
              {isOverFreeTransferLimit
                ? translate("เปลี่ยนเกิน")
                : translate("เปลี่ยนฟรีคงเหลือ")}
            </span>
            <strong
              className={
                hasUnlimitedTransfers
                  ? "compact-transfer-unlimited"
                  : isOverFreeTransferLimit
                    ? "compact-transfer-overage"
                    : undefined
              }
              aria-label={
                hasUnlimitedTransfers ? unlimitedTransfersLabel : undefined
              }
              title={
                hasUnlimitedTransfers ? unlimitedTransfersLabel : undefined
              }
            >
              {hasUnlimitedTransfers
                ? "∞"
                : isOverFreeTransferLimit
                  ? translate("-{points} คะแนน").replace(
                      "{points}",
                      String(transferPoints),
                    )
                  : freeTransfersRemaining}
            </strong>
          </div>
          <div>
            <span>ต่างชาติ</span>
            <strong>{foreignPlayers}/7</strong>
          </div>
        </div>
        <div
          className={`compact-tier-quota-strip${isTierQuotaOver ? " compact-tier-quota-strip--over" : ""}`}
        >
          <div className="compact-tier-quota-heading">
            <span>{translate("โควต้านักเตะระดับ 1-3")}</span>
            <Popover>
              <PopoverTrigger
                className="compact-tier-quota-info"
                aria-label="ดูวิธีนับโควต้าระดับ"
              >
                <CircleHelp size={16} aria-hidden="true" />
              </PopoverTrigger>
              <PopoverContent
                className="compact-tier-quota-popover"
                align="start"
                side="bottom"
                sideOffset={7}
              >
                <PopoverHeader>
                  <PopoverTitle>
                    {translate("โควต้านักเตะระดับ 1-3")}
                  </PopoverTitle>
                  <PopoverDescription>
                    <span>{translate("นักเตะระดับ 1 มีได้สูงสุด 3 คน")}</span>
                    <br />
                    <span>{translate("นักเตะระดับ 1-2 มีได้สูงสุด 6 คน")}</span>
                    <br />
                    <span>
                      {translate("นักเตะระดับ 1-3 มีรวมได้สูงสุด 9 คน")}
                    </span>
                  </PopoverDescription>
                </PopoverHeader>
              </PopoverContent>
            </Popover>
            {isTierQuotaOver && (
              <strong className="compact-tier-quota-warning">เกินโควต้า</strong>
            )}
          </div>
          <div
            className="compact-tier-quota-dots"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="sr-only">
              {tierQuotaSummary}
              {isTierQuotaOver ? `, ${translate("เกินโควต้า")}` : ""}
            </span>
            <span className="compact-tier-quota-dot-track" aria-hidden="true">
              {tierQuotaDots.map((tierLevel, index) => (
                <span
                  className={`compact-tier-quota-dot${tierLevel ? ` compact-tier-quota-dot--${tierLevel}` : ""}`}
                  key={index}
                />
              ))}
            </span>
          </div>
        </div>

        <Accordion
          className="compact-market-filter-accordion"
          value={filterAccordionValue}
          onValueChange={setFilterAccordionValue}
        >
          <AccordionItem value="filters">
            <AccordionTrigger className="compact-market-filter-trigger">
              Filter
            </AccordionTrigger>
            <AccordionContent className="compact-market-filter-content">
              <div className="compact-market-toolbar">
                <div className="compact-market-primary-filters">
                  <label className="search-field compact-market-search">
                    <Search size={17} aria-hidden="true" />
                    <Input
                      className="market-search-input"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="ค้นหาชื่อนักเตะ"
                      aria-label="ค้นหาชื่อนักเตะ"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        aria-label="ล้างคำค้น"
                      >
                        <X size={15} aria-hidden="true" />
                      </button>
                    )}
                  </label>
                  <Select
                    value={clubId}
                    onValueChange={(value) => value && setClubId(String(value))}
                  >
                    <SelectTrigger aria-label="กรองสโมสร">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <span className="market-select-item">
                          <span className="market-select-dot market-select-dot--all" />
                          ทุกสโมสร
                        </span>
                      </SelectItem>
                      {clubs.map((club) => (
                        <SelectItem value={club.id} key={club.id}>
                          <span className="market-select-item">
                            <ClubColor
                              color={club.colors[0]}
                              secondaryColor={club.colors[1]}
                              label={localize(club.shortName, language)}
                              size="medium"
                            />
                            {localize(club.shortName, language)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="compact-position-nationality-filters">
                  <Select
                    value={position}
                    onValueChange={(value) =>
                      value && setPosition(String(value))
                    }
                  >
                    <SelectTrigger aria-label="กรองตำแหน่งผู้เล่น">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">
                        <span className="market-select-item">
                          <span className="market-select-dot market-select-dot--all" />
                          ทุกตำแหน่ง
                        </span>
                      </SelectItem>
                      <SelectItem value="GK">
                        <span className="market-select-item">
                          <PositionBadge
                            position="GK"
                            className="market-select-position-badge"
                          />
                          {getLocalizedPositionLabel("GK", language)}
                        </span>
                      </SelectItem>
                      <SelectItem value="DEF">
                        <span className="market-select-item">
                          <PositionBadge
                            position="DEF"
                            className="market-select-position-badge"
                          />
                          {getLocalizedPositionLabel("DEF", language)}
                        </span>
                      </SelectItem>
                      <SelectItem value="MID">
                        <span className="market-select-item">
                          <PositionBadge
                            position="MID"
                            className="market-select-position-badge"
                          />
                          {getLocalizedPositionLabel("MID", language)}
                        </span>
                      </SelectItem>
                      <SelectItem value="FWD">
                        <span className="market-select-item">
                          <PositionBadge
                            position="FWD"
                            className="market-select-position-badge"
                          />
                          {getLocalizedPositionLabel("FWD", language)}
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={nationality}
                    onValueChange={(value) =>
                      value && setNationality(String(value))
                    }
                  >
                    <SelectTrigger aria-label="กรองสัญชาติ">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <span className="market-select-item">
                          <span className="market-select-dot market-select-dot--all" />
                          ทุกสัญชาติ
                        </span>
                      </SelectItem>
                      <SelectItem value="thai">
                        <span className="market-select-item">
                          <span className="market-select-nationality-badge market-select-nationality-badge--thai" />
                          นักเตะไทย
                        </span>
                      </SelectItem>
                      <SelectItem value="foreign">
                        <span className="market-select-item">
                          <span className="market-select-nationality-badge market-select-nationality-badge--foreign">
                            F
                          </span>
                          นักเตะต่างชาติ
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="compact-market-selects">
                  <Select
                    value={tier}
                    onValueChange={(value) => value && setTier(String(value))}
                  >
                    <SelectTrigger aria-label="กรองระดับ">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <span className="market-select-item">
                          <span className="market-select-dot market-select-dot--all" />
                          ทุกระดับ
                        </span>
                      </SelectItem>
                      <SelectItem value="1">
                        <span className="market-select-item">
                          <span className="market-select-tier-badge market-select-tier-badge--1">
                            1
                          </span>
                          ระดับ 1
                        </span>
                      </SelectItem>
                      <SelectItem value="2">
                        <span className="market-select-item">
                          <span className="market-select-tier-badge market-select-tier-badge--2">
                            2
                          </span>
                          ระดับ 2
                        </span>
                      </SelectItem>
                      <SelectItem value="3">
                        <span className="market-select-item">
                          <span className="market-select-tier-badge market-select-tier-badge--3">
                            3
                          </span>
                          ระดับ 3
                        </span>
                      </SelectItem>
                      <SelectItem value="4">
                        <span className="market-select-item">
                          <span className="market-select-tier-badge market-select-tier-badge--4">
                            4
                          </span>
                          ระดับ 4
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={sort}
                    onValueChange={(value) => value && setSort(String(value))}
                  >
                    <SelectTrigger aria-label="เรียงลำดับ">
                      <ArrowDownUp size={15} />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="points">คะแนนสูงสุด</SelectItem>
                      <SelectItem value="form">ฟอร์มดีที่สุด</SelectItem>
                      <SelectItem value="tier">ระดับสูงสุด</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="compact-market-list">
          {players.map((player) => {
            const compatible = vacantPositions.has(player.position);
            const isOwned =
              player.fantasyPlayerId !== null &&
              ownedIds.has(player.fantasyPlayerId);
            const metricValue =
              sort === "form"
                ? player.form.toFixed(1)
                : sort === "tier"
                  ? String(player.tier)
                  : String(player.points);
            const metricLabel =
              sort === "form"
                ? language === "th"
                  ? `ฟอร์ม ${metricValue}`
                  : `Form ${metricValue}`
                : sort === "tier"
                  ? language === "th"
                    ? `ระดับ ${metricValue}`
                    : `Tier ${metricValue}`
                  : language === "th"
                    ? `${metricValue} คะแนน`
                    : `${metricValue} points`;
            return (
              <article className="compact-market-row" key={player.id}>
                <button
                  type="button"
                  className="compact-market-player-button"
                  onClick={() => onPlayerSelect(player)}
                  aria-label={
                    language === "th"
                      ? `ดูข้อมูล ${localize(player.name, language)}`
                      : `View details for ${localize(player.name, language)}`
                  }
                >
                  <PlayerIdentity
                    player={player}
                    useShortName
                    showMarketCompact
                    showPositionBadge
                    showTierBadge
                    showNationalityBadge
                  />
                </button>
                <div className="compact-market-meta" aria-label={metricLabel}>
                  <span className="market-player-points">
                    <strong>{metricValue}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  className={
                    isOwned
                      ? "transfer-player-action transfer-player-action--owned"
                      : "transfer-player-action"
                  }
                  disabled={
                    !isEditable || isAutoFilling || (!isOwned && !compatible)
                  }
                  onClick={() =>
                    isOwned ? onPlayerRemove(player) : choosePlayer(player)
                  }
                  aria-label={
                    isOwned
                      ? language === "th"
                        ? `ลบ ${localize(player.name, language)} ออกจากทีม`
                        : `Remove ${localize(player.name, language)} from the squad`
                      : language === "th"
                        ? `ซื้อ ${localize(player.name, language)} เข้าทีม`
                        : `Transfer ${localize(player.name, language)} into the squad`
                  }
                  title={
                    isOwned
                      ? language === "th"
                        ? `ลบ ${localize(player.name, language)} ออกจากทีม`
                        : `Remove ${localize(player.name, language)} from the squad`
                      : undefined
                  }
                >
                  {isOwned ? (
                    <UserRound size={18} aria-hidden="true" />
                  ) : (
                    <Plus size={13} aria-hidden="true" />
                  )}
                </button>
              </article>
            );
          })}
          {players.length === 0 && (
            <div className="empty-state compact-market-empty">
              <Search size={24} />
              <h3>ไม่พบนักเตะ</h3>
              <p>ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
            </div>
          )}
        </div>
      </aside>
    </Localized>
  );
}
