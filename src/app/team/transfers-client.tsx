"use client";

import {
  ArrowDownUp,
  ArrowRight,
  Search,
  UserRoundMinus,
  UserRoundPlus,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Localized, useLanguage } from "@/components/fantasy/i18n";
import { PlayerIdentity } from "@/components/fantasy/player-identity";
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
  type DraftLineupMember,
} from "@/lib/fantasy/team-draft";
import type { FantasyPosition } from "@/lib/fantasy/rules";

const competitionPositions: Record<FantasyPosition, CompetitionPosition> = {
  goalkeeper: "GK",
  defender: "DEF",
  midfielder: "MID",
  forward: "FWD",
};

export default function TransfersClient({
  data,
  fantasy,
  isEditable,
  members,
  onMembersChange,
  selectedOutgoing,
  onSelectedOutgoingChange,
  selectedVacancySlotId,
  onSelectedVacancySlotChange,
}: {
  data: CompetitionDataset;
  fantasy: FantasyState;
  isEditable: boolean;
  members: DraftLineupMember[];
  onMembersChange: (members: DraftLineupMember[]) => void;
  selectedOutgoing: string | null;
  onSelectedOutgoingChange: (fantasyPlayerId: string | null) => void;
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
  const selectedOutgoingPlayer = selectedOutgoing
    ? playersByFantasyId.get(selectedOutgoing)
    : null;
  const selectedVacancy = selectedVacancySlotId
    ? members.find(
        (member) =>
          member.slotId === selectedVacancySlotId &&
          member.fantasyPlayerId === null,
      )
    : null;
  const vacancyPosition = selectedVacancy?.vacancyPosition
    ? competitionPositions[selectedVacancy.vacancyPosition]
    : null;
  const targetPosition = vacancyPosition ?? selectedOutgoingPlayer?.position;
  const effectivePosition = targetPosition ?? position;

  const players = data.players
    .filter((player) => player.fantasyPlayerId)
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
    .sort((a, b) => {
      const ownedDifference =
        Number(Boolean(b.fantasyPlayerId && ownedIds.has(b.fantasyPlayerId))) -
        Number(Boolean(a.fantasyPlayerId && ownedIds.has(a.fantasyPlayerId)));
      if (ownedDifference !== 0 && !targetPosition) {
        return ownedDifference;
      }
      return sort === "tier"
        ? a.tier - b.tier
        : sort === "form"
          ? b.form - a.form
          : b.points - a.points;
    })
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
    if (ownedIds.has(player.fantasyPlayerId)) {
      onSelectedVacancySlotChange(null);
      onSelectedOutgoingChange(
        selectedOutgoing === player.fantasyPlayerId
          ? null
          : player.fantasyPlayerId,
      );
      return;
    }
    if (selectedVacancy && vacancyPosition) {
      if (player.position !== vacancyPosition) return;
      onMembersChange(
        fillDraftVacancy(
          members,
          selectedVacancy.slotId,
          player.fantasyPlayerId,
        ),
      );
      toast.success(
        language === "th"
          ? `เพิ่ม ${localize(player.name, language)} เข้าทีมแล้ว`
          : `${localize(player.name, language)} added to the squad`,
        {
          description:
            language === "th"
              ? "ตรวจสอบทีมและกดบันทึกเมื่อพร้อม"
              : "Review your squad and save when ready",
        },
      );
      onSelectedVacancySlotChange(null);
      return;
    }
    if (!selectedOutgoing || !selectedOutgoingPlayer) {
      toast.info(
        language === "th"
          ? "เลือกนักเตะในทีมที่ต้องการขายหรือเลือกช่องว่างก่อน"
          : "Choose a squad player to sell or select a vacant slot first",
      );
      return;
    }
    if (player.position !== selectedOutgoingPlayer.position) {
      toast.error("นักเตะที่ซื้อเข้าต้องอยู่ตำแหน่งเดียวกับนักเตะที่ขาย");
      return;
    }
    onMembersChange(
      members.map((member) =>
        member.fantasyPlayerId === selectedOutgoing
          ? {
              ...member,
              fantasyPlayerId: player.fantasyPlayerId,
              vacancyPosition: null,
            }
          : member,
      ),
    );
    toast.success(
      `${localize(selectedOutgoingPlayer.name, language)} → ${localize(player.name, language)}`,
      {
        description:
          language === "th"
            ? "กดบันทึกทีมเพื่อยืนยันการเปลี่ยนแปลง"
            : "Save your team to confirm the change",
      },
    );
    onSelectedOutgoingChange(null);
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

        {(selectedOutgoingPlayer || selectedVacancy) && (
          <div className="compact-transfer-guide active" aria-live="polite">
            <div>
              <strong>
                {selectedVacancy && vacancyPosition
                  ? language === "th"
                    ? `เลือก ${vacancyPosition} เพื่อเติมช่องว่าง`
                    : `Choose a ${vacancyPosition} for the vacant slot`
                  : language === "th"
                    ? `เลือก ${selectedOutgoingPlayer?.position} คนใหม่`
                    : `Choose a new ${selectedOutgoingPlayer?.position}`}
              </strong>
              <span>
                {selectedVacancy
                  ? language === "th"
                    ? selectedVacancy.lineupRole === "starter"
                      ? "กำลังเติมช่องตัวจริง"
                      : `กำลังเติมม้านั่งลำดับ ${selectedVacancy.benchOrder}`
                    : selectedVacancy.lineupRole === "starter"
                      ? "Filling a starting-XI slot"
                      : `Filling bench slot ${selectedVacancy.benchOrder}`
                  : language === "th"
                    ? `กำลังเปลี่ยน ${localize(selectedOutgoingPlayer!.name, language)}`
                    : `Replacing ${localize(selectedOutgoingPlayer!.name, language)}`}
              </span>
            </div>
            <button
              type="button"
              className="compact-clear-player"
              onClick={() => {
                onSelectedOutgoingChange(null);
                onSelectedVacancySlotChange(null);
              }}
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
              if (!selectedOutgoingPlayer && values[0]) {
                if (selectedVacancy) return;
                setPosition(String(values[0]));
              }
            }}
          >
            {(["ALL", "GK", "DEF", "MID", "FWD"] as const).map((item) => (
              <ToggleGroupItem
                value={item}
                key={item}
                disabled={Boolean(targetPosition) && item !== targetPosition}
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
            const owned = Boolean(
              player.fantasyPlayerId && ownedIds.has(player.fantasyPlayerId),
            );
            const selling = player.fantasyPlayerId === selectedOutgoing;
            const compatible =
              !targetPosition || player.position === targetPosition;
            return (
              <article
                className={`compact-market-row ${selling ? "selected-transfer-player" : ""}`}
                key={player.id}
              >
                <PlayerIdentity player={player} />
                <div className="compact-market-meta">
                  <span>{localize(player.next, language)}</span>
                  <strong>
                    L{player.tier} · {player.points}{" "}
                    {language === "th" ? "คะแนน" : "points"}
                  </strong>
                </div>
                <button
                  type="button"
                  className={`transfer-player-action ${owned ? "owned" : ""}`}
                  disabled={!isEditable || (!owned && !compatible)}
                  onClick={() => choosePlayer(player)}
                  aria-label={
                    owned
                      ? language === "th"
                        ? `เลือก ${localize(player.name, language)} ที่จะขาย`
                        : `Select ${localize(player.name, language)} to sell`
                      : language === "th"
                        ? `ซื้อ ${localize(player.name, language)} เข้าทีม`
                        : `Transfer ${localize(player.name, language)} into the squad`
                  }
                >
                  {owned ? (
                    <UserRoundMinus size={17} />
                  ) : selectedOutgoing || selectedVacancy ? (
                    <ArrowRight size={17} />
                  ) : (
                    <UserRoundPlus size={17} />
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
        <div className="compact-market-footer">
          {language === "th"
            ? `แสดง ${players.length} คน · ทีมปัจจุบัน ${ownedIds.size}/15 · กดบันทึกทีมด้านบนเมื่อพร้อม`
            : `Showing ${players.length} players · Current squad ${ownedIds.size}/15 · Save your team above when ready`}
        </div>
      </aside>
    </Localized>
  );
}
