"use client";

import { ArrowDownUp, Search, Plus, X } from "lucide-react";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { FantasyState } from "@/data/fantasy";
import {
  localize,
  type CompetitionPosition,
  type CompetitionDataset,
  type CompetitionPlayerView,
} from "@/lib/competition-types";
import {
  fillDraftVacancy,
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
  selectedVacancySlotId,
  onSelectedVacancySlotChange,
}: {
  data: CompetitionDataset;
  fantasy: FantasyState;
  isEditable: boolean;
  members: DraftLineupMember[];
  onMembersChange: (members: DraftLineupMember[]) => void;
  onPlayerSelect: (player: CompetitionPlayerView) => void;
  selectedVacancySlotId: string | null;
  onSelectedVacancySlotChange: (slotId: string | null) => void;
}) {
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("ALL");
  const [tier, setTier] = useState("all");
  const [sort, setSort] = useState("points");
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
  const selectedVacancy = selectedVacancySlotId
    ? members.find(
        (member) =>
          member.slotId === selectedVacancySlotId &&
          member.fantasyPlayerId === null,
      )
    : null;
  const vacancies = members.filter(
    (member) =>
      member.fantasyPlayerId === null && member.vacancyPosition !== null,
  );
  const vacantPositions = new Set(
    vacancies.map((member) => competitionPositions[member.vacancyPosition!]),
  );
  const vacancyPosition = selectedVacancy?.vacancyPosition
    ? competitionPositions[selectedVacancy.vacancyPosition]
    : null;
  const effectivePosition = vacancyPosition ?? position;

  const players = data.players
    .filter(
      (player) =>
        player.fantasyPlayerId && !ownedIds.has(player.fantasyPlayerId),
    )
    .filter(
      (player) =>
        effectivePosition === "ALL" || player.position === effectivePosition,
    )
    .filter((player) => tier === "all" || player.tier === Number(tier))
    .filter((player) =>
      `${player.name.th} ${player.name.en} ${player.club.th} ${player.club.en}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "tier"
        ? a.tier - b.tier
        : sort === "form"
          ? b.form - a.form
          : b.points - a.points,
    )
    .slice(0, 18);

  const squadPlayers = members.flatMap((member) => {
    const player = member.fantasyPlayerId
      ? playersByFantasyId.get(member.fantasyPlayerId)
      : null;
    return player ? [player] : [];
  });
  const levelOne = squadPlayers.filter((player) => player.tier === 1).length;
  const levelTwo = squadPlayers.filter((player) => player.tier === 2).length;
  const foreignPlayers = squadPlayers.filter((player) => !player.isThai).length;

  function choosePlayer(player: CompetitionPlayerView) {
    if (!isEditable) {
      toast.error("ปิดรับการจัดทีมสำหรับ Gameweek นี้แล้ว");
      return;
    }
    if (!player.fantasyPlayerId) return;
    if (ownedIds.has(player.fantasyPlayerId)) return;
    const nextMembers =
      selectedVacancy && vacancyPosition
        ? player.position === vacancyPosition
          ? fillDraftVacancy(
              members,
              selectedVacancy.slotId,
              player.fantasyPlayerId,
            )
          : null
        : fillFirstMatchingDraftVacancy(
            members,
            fantasyPositions[player.position],
            player.fantasyPlayerId,
          );
    if (!nextMembers) return;
    onMembersChange(nextMembers);
    onSelectedVacancySlotChange(null);
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
            <span>เปลี่ยนตัวได้อีก</span>
            <strong>{fantasy.team.freeTransfers}</strong>
          </div>
          <div>
            <span>ผู้เล่นระดับ 1</span>
            <strong>{levelOne}/3</strong>
          </div>
          <div>
            <span>ผู้เล่นระดับ 2</span>
            <strong>
              {levelTwo}/{10 - levelOne}
            </strong>
          </div>
          <div>
            <span>ต่างชาติ</span>
            <strong>{foreignPlayers}/7</strong>
          </div>
        </div>

        {selectedVacancy && (
          <div className="compact-transfer-guide active" aria-live="polite">
            <div>
              <strong>
                {vacancyPosition
                  ? language === "th"
                    ? `เลือก ${vacancyPosition} เพื่อเติมช่องว่าง`
                    : `Choose a ${vacancyPosition} for the vacant slot`
                  : null}
              </strong>
              <span>
                {language === "th"
                  ? selectedVacancy.lineupRole === "starter"
                    ? "กำลังเติมช่องตัวจริง"
                    : `กำลังเติมม้านั่งลำดับ ${selectedVacancy.benchOrder}`
                  : selectedVacancy.lineupRole === "starter"
                    ? "Filling a starting-XI slot"
                    : `Filling bench slot ${selectedVacancy.benchOrder}`}
              </span>
            </div>
            <button
              type="button"
              className="compact-clear-player"
              onClick={() => onSelectedVacancySlotChange(null)}
            >
              <X size={15} /> ยกเลิก
            </button>
          </div>
        )}

        <div className="compact-market-toolbar">
          <label className="search-field compact-market-search">
            <Search size={17} aria-hidden="true" />
            <Input
              className="market-search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหานักเตะหรือสโมสร"
              aria-label="ค้นหานักเตะหรือสโมสร"
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
          <ToggleGroup
            className="position-filter compact-position-filter"
            value={[effectivePosition]}
            onValueChange={(values) => {
              if (!selectedVacancy && values[0]) setPosition(String(values[0]));
            }}
          >
            {(["ALL", "GK", "DEF", "MID", "FWD"] as const).map((item) => (
              <ToggleGroupItem
                value={item}
                key={item}
                disabled={Boolean(vacancyPosition) && item !== vacancyPosition}
              >
                {item === "ALL" ? "ทั้งหมด" : item}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
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

        <div className="compact-market-list">
          {players.map((player) => {
            const compatible =
              vacancyPosition !== null
                ? player.position === vacancyPosition
                : vacantPositions.has(player.position);
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
                  />
                </button>
                <div className="compact-market-meta">
                  <strong>
                    L{player.tier} · {player.points}{" "}
                    {language === "th" ? "คะแนน" : "points"}
                  </strong>
                </div>
                <button
                  type="button"
                  className="transfer-player-action"
                  disabled={!isEditable || !compatible}
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
        <div className="compact-market-footer">
          {language === "th"
            ? `แสดง ${players.length} คน · ทีมปัจจุบัน ${ownedIds.size}/15 · กดบันทึกทีมด้านบนเมื่อพร้อม`
            : `Showing ${players.length} players · Current squad ${ownedIds.size}/15 · Save your team above when ready`}
        </div>
      </aside>
    </Localized>
  );
}
