"use client";

import { ArrowDownUp, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Localized, useLanguage } from "@/components/fantasy/i18n";
import { PlayerIdentity } from "@/components/fantasy/player-identity";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
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
import type { FantasyPosition } from "@/lib/fantasy/rules";

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
  isEditable,
  members,
  onMembersChange,
  onPlayerSelect,
  isAutoFilling,
}: {
  data: CompetitionDataset;
  fantasy: FantasyState;
  isEditable: boolean;
  members: DraftLineupMember[];
  onMembersChange: (members: DraftLineupMember[]) => void;
  onPlayerSelect: (player: CompetitionPlayerView) => void;
  isAutoFilling: boolean;
}) {
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const [clubId, setClubId] = useState("all");
  const [position, setPosition] = useState("ALL");
  const [tier, setTier] = useState("all");
  const [nationality, setNationality] = useState("all");
  const [sort, setSort] = useState("points");
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
  const vacancies = members.filter(
    (member) =>
      member.fantasyPlayerId === null && member.vacancyPosition !== null,
  );
  const vacantPositions = new Set(
    vacancies.map((member) => competitionPositions[member.vacancyPosition!]),
  );
  const players = data.players
    .filter(
      (player) =>
        player.fantasyPlayerId && !ownedIds.has(player.fantasyPlayerId),
    )
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
    .sort((a, b) => (sort === "form" ? b.form - a.form : b.points - a.points))
    .slice(0, 50);

  const squadPlayers = members.flatMap((member) => {
    const player = member.fantasyPlayerId
      ? playersByFantasyId.get(member.fantasyPlayerId)
      : null;
    return player ? [player] : [];
  });
  const levelOne = squadPlayers.filter((player) => player.tier === 1).length;
  const topTwoLevels = squadPlayers.filter((player) => player.tier <= 2).length;
  const topThreeLevels = squadPlayers.filter(
    (player) => player.tier <= 3,
  ).length;
  const foreignPlayers = squadPlayers.filter((player) => !player.isThai).length;

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
            <span>เปลี่ยนฟรีได้อีก</span>
            <strong>{fantasy.team.freeTransfers}</strong>
          </div>
          <div>
            <span>ระดับ 1</span>
            <strong>{levelOne}/3</strong>
          </div>
          <div>
            <span>ระดับ 1–2</span>
            <strong>{topTwoLevels}/6</strong>
          </div>
          <div>
            <span>ระดับ 1–3</span>
            <strong>{topThreeLevels}/9</strong>
          </div>
          <div>
            <span>ต่างชาติ</span>
            <strong>{foreignPlayers}/7</strong>
          </div>
        </div>

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
                <SelectItem value="all">ทุกสโมสร</SelectItem>
                {clubs.map((club) => (
                  <SelectItem value={club.id} key={club.id}>
                    {localize(club.shortName, language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="compact-position-nationality-filters">
            <Select
              value={position}
              onValueChange={(value) => value && setPosition(String(value))}
            >
              <SelectTrigger aria-label="กรองตำแหน่งผู้เล่น">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทุกตำแหน่ง</SelectItem>
                <SelectItem value="GK">GK</SelectItem>
                <SelectItem value="DEF">DEF</SelectItem>
                <SelectItem value="MID">MID</SelectItem>
                <SelectItem value="FWD">FWD</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={nationality}
              onValueChange={(value) => value && setNationality(String(value))}
            >
              <SelectTrigger aria-label="กรองสัญชาติ">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสัญชาติ</SelectItem>
                <SelectItem value="thai">นักเตะไทย</SelectItem>
                <SelectItem value="foreign">นักเตะต่างชาติ</SelectItem>
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
                <SelectItem value="all">ทุกระดับ</SelectItem>
                <SelectItem value="1">ระดับ 1</SelectItem>
                <SelectItem value="2">ระดับ 2</SelectItem>
                <SelectItem value="3">ระดับ 3</SelectItem>
                <SelectItem value="4">ระดับ 4</SelectItem>
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
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="compact-market-list">
          {players.map((player) => {
            const compatible = vacantPositions.has(player.position);
            const metricValue =
              sort === "form" ? player.form.toFixed(1) : String(player.points);
            const metricLabel =
              sort === "form"
                ? language === "th"
                  ? `ฟอร์ม ${metricValue}`
                  : `Form ${metricValue}`
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
                  className="transfer-player-action"
                  disabled={!isEditable || isAutoFilling || !compatible}
                  onClick={() => choosePlayer(player)}
                  aria-label={
                    language === "th"
                      ? `ซื้อ ${localize(player.name, language)} เข้าทีม`
                      : `Transfer ${localize(player.name, language)} into the squad`
                  }
                >
                  <Plus size={13} />
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
