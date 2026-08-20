"use client";

import {
  ArrowDownUp,
  ArrowRight,
  Check,
  LoaderCircle,
  RotateCcw,
  Search,
  ShieldCheck,
  UserRoundMinus,
  UserRoundPlus,
  X,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  cancelFantasyChangesAction,
  saveFantasySelectionAction,
  type FantasySelectionInput,
} from "@/app/fantasy-actions";
import { AppShell, PageHeader } from "@/components/fantasy/app-shell";
import { useLanguage } from "@/components/fantasy/i18n";
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
  type CompetitionDataset,
  type CompetitionPlayerView,
} from "@/lib/competition-types";

type PendingMember = FantasySelectionInput["members"][number];

export default function TransfersClient({
  data,
  fantasy,
}: {
  data: CompetitionDataset;
  fantasy: FantasyState;
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("ALL");
  const [tier, setTier] = useState("all");
  const [sort, setSort] = useState("points");
  const [onlySquad, setOnlySquad] = useState(false);
  const [selectedOutgoing, setSelectedOutgoing] = useState<string | null>(null);
  const [members, setMembers] = useState<PendingMember[]>(
    fantasy.selection.members.map((member) => ({
      fantasyPlayerId: member.fantasyPlayerId,
      lineupRole: member.lineupRole,
      benchOrder: member.benchOrder,
      captainRole: member.captainRole,
    })),
  );
  const [isPending, startTransition] = useTransition();
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
    () => new Set(members.map((member) => member.fantasyPlayerId)),
    [members],
  );
  const originalIds = useMemo(
    () =>
      new Set(
        fantasy.selection.members.map((member) => member.fantasyPlayerId),
      ),
    [fantasy.selection.members],
  );
  const localTransferCount = [...ownedIds].filter(
    (id) => !originalIds.has(id),
  ).length;
  const selectedOutgoingPlayer = selectedOutgoing
    ? playersByFantasyId.get(selectedOutgoing)
    : null;

  const players = useMemo(() => {
    return data.players
      .filter((player) => player.fantasyPlayerId)
      .filter((player) => position === "ALL" || player.position === position)
      .filter((player) => tier === "all" || player.tier === Number(tier))
      .filter(
        (player) =>
          !onlySquad ||
          (player.fantasyPlayerId && ownedIds.has(player.fantasyPlayerId)),
      )
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
      );
  }, [data.players, onlySquad, ownedIds, position, query, sort, tier]);

  const squadPlayers = members.flatMap((member) => {
    const player = playersByFantasyId.get(member.fantasyPlayerId);
    return player ? [player] : [];
  });
  const levelOne = squadPlayers.filter((player) => player.tier === 1).length;
  const premiumSlots = squadPlayers.filter((player) => player.tier <= 2).length;
  const foreignPlayers = squadPlayers.filter((player) => !player.isThai).length;
  const clubCounts = new Map<string, number>();
  for (const player of squadPlayers) {
    clubCounts.set(player.clubId, (clubCounts.get(player.clubId) ?? 0) + 1);
  }
  const invalidClub = [...clubCounts.values()].some((count) => count > 3);
  const quotaValid =
    levelOne <= 3 && premiumSlots <= 10 && foreignPlayers <= 7 && !invalidClub;

  function choosePlayer(player: CompetitionPlayerView) {
    if (!player.fantasyPlayerId) return;
    if (ownedIds.has(player.fantasyPlayerId)) {
      setSelectedOutgoing(
        selectedOutgoing === player.fantasyPlayerId
          ? null
          : player.fantasyPlayerId,
      );
      return;
    }
    if (!selectedOutgoing || !selectedOutgoingPlayer) {
      toast.info("เลือกนักเตะในทีมที่ต้องการขายก่อน");
      return;
    }
    if (player.position !== selectedOutgoingPlayer.position) {
      toast.error("นักเตะที่ซื้อเข้าต้องอยู่ตำแหน่งเดียวกับนักเตะที่ขาย");
      return;
    }
    setMembers((current) =>
      current.map((member) =>
        member.fantasyPlayerId === selectedOutgoing
          ? { ...member, fantasyPlayerId: player.fantasyPlayerId! }
          : member,
      ),
    );
    toast.success(
      `${localize(selectedOutgoingPlayer.name, language)} → ${localize(player.name, language)}`,
    );
    setSelectedOutgoing(null);
  }

  function confirmTransfers() {
    if (!quotaValid) {
      toast.error("ทีมยังเกินโควต้า กรุณาแก้ให้ถูกต้องก่อนยืนยัน");
      return;
    }
    startTransition(async () => {
      const result = await saveFantasySelectionAction({
        members,
        activeChip: fantasy.selection.activeChip,
      });
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message, {
          description: result.violations?.join(" · "),
        });
      }
    });
  }

  function cancelChanges() {
    startTransition(async () => {
      const result = await cancelFantasyChangesAction();
      if (result.ok) {
        toast.success(result.message);
        setMembers(
          fantasy.selection.members.map((member) => ({
            fantasyPlayerId: member.fantasyPlayerId,
            lineupRole: member.lineupRole,
            benchOrder: member.benchOrder,
            captainRole: member.captainRole,
          })),
        );
        setSelectedOutgoing(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <AppShell>
      <main className="content product-content">
        <PageHeader
          eyebrow="ตลาดนักเตะ"
          title="ซื้อขายนักเตะ"
          description={`Gameweek ${String(fantasy.gameweek.number).padStart(2, "0")} · Deadline ${new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(fantasy.gameweek.deadlineAt))}`}
          actions={
            <>
              {(localTransferCount > 0 ||
                fantasy.selection.netTransferCount > 0 ||
                fantasy.selection.hasPendingChanges) && (
                <button
                  className="secondary-button"
                  onClick={cancelChanges}
                  disabled={isPending}
                >
                  <RotateCcw size={17} /> ยกเลิกการเปลี่ยนแปลง
                </button>
              )}
              <button
                className="primary-button"
                onClick={confirmTransfers}
                disabled={isPending}
              >
                {isPending ? (
                  <LoaderCircle className="spin" size={17} />
                ) : (
                  <Check size={17} />
                )}
                ยืนยันทีม
              </button>
            </>
          }
        />

        <div className="transfer-overview">
          <article>
            <span>ฟรีทรานส์เฟอร์</span>
            <strong>{fantasy.team.freeTransfers}</strong>
            <small>สะสมสูงสุด 4 ครั้ง</small>
          </article>
          <article>
            <span>รายการรอยืนยัน</span>
            <strong>{localTransferCount}</strong>
            <small>เกินโควต้า -4 คะแนน/ครั้ง</small>
          </article>
          <article>
            <span>ระดับ 1 / ช่องพรีเมียม</span>
            <strong>
              {levelOne}/3 · {premiumSlots}/10
            </strong>
            <small>ระดับต่ำกว่าใช้ช่องสูงกว่าได้</small>
          </article>
          <article>
            <span>นักเตะต่างชาติ</span>
            <strong>{foreignPlayers}/7</strong>
            <small>
              {quotaValid ? "ทีมผ่านโควต้า" : "ต้องแก้โควต้าก่อนยืนยัน"}
            </small>
          </article>
        </div>

        <section
          className={`market-insight ${quotaValid ? "" : "quota-warning"}`}
        >
          <div>
            <span className="insight-icon">
              <ShieldCheck />
            </span>
            <div>
              <span className="eyebrow">สถานะทีม</span>
              <h3>
                {quotaValid ? "ทีมอยู่ภายในทุกโควต้า" : "ทีมยังเกินโควต้า"}
              </h3>
              <p>
                {selectedOutgoingPlayer
                  ? `กำลังเลือกผู้เล่นตำแหน่ง ${selectedOutgoingPlayer.position} แทน ${localize(selectedOutgoingPlayer.name, language)}`
                  : "เลือกนักเตะในทีมที่ต้องการขาย แล้วเลือกนักเตะตำแหน่งเดียวกันเข้ามาแทน"}
              </p>
            </div>
          </div>
          {selectedOutgoingPlayer && (
            <button
              className="filter-button active"
              onClick={() => setSelectedOutgoing(null)}
            >
              <X size={16} /> ยกเลิกเลือกขาย
            </button>
          )}
        </section>

        <section className="product-card transfer-table-card">
          <div className="transfer-toolbar">
            <label className="search-field">
              <Search size={17} />
              <Input
                className="market-search-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ค้นหาชื่อนักเตะหรือสโมสร"
              />
              {query && (
                <button onClick={() => setQuery("")} aria-label="ล้างคำค้น">
                  <X size={15} />
                </button>
              )}
            </label>
            <ToggleGroup
              className="position-filter"
              value={[position]}
              onValueChange={(values) =>
                values[0] && setPosition(String(values[0]))
              }
            >
              {(["ALL", "GK", "DEF", "MID", "FWD"] as const).map((item) => (
                <ToggleGroupItem value={item} key={item}>
                  {item === "ALL" ? "ทั้งหมด" : item}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <div className="sort-select">
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
            </div>
            <div className="sort-select">
              <ArrowDownUp size={15} />
              <Select
                value={sort}
                onValueChange={(value) => value && setSort(String(value))}
              >
                <SelectTrigger aria-label="เรียงลำดับ">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">คะแนนสูงสุด</SelectItem>
                  <SelectItem value="form">ฟอร์มดีที่สุด</SelectItem>
                  <SelectItem value="tier">ระดับสูงสุด</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button
              className={`filter-button ${onlySquad ? "active" : ""}`}
              onClick={() => setOnlySquad((value) => !value)}
            >
              <ShieldCheck size={16} /> ทีมของฉัน
            </button>
          </div>

          <div className="market-table">
            <div className="market-head">
              <span>นักเตะ</span>
              <span>นัดถัดไป</span>
              <span>ฟอร์ม</span>
              <span>สัญชาติ</span>
              <span>ระดับ</span>
              <span>คะแนน</span>
              <span />
            </div>
            {players.map((player) => {
              const owned = Boolean(
                player.fantasyPlayerId && ownedIds.has(player.fantasyPlayerId),
              );
              const selling = player.fantasyPlayerId === selectedOutgoing;
              const compatible =
                !selectedOutgoingPlayer ||
                player.position === selectedOutgoingPlayer.position;
              return (
                <article
                  className={`market-row ${selling ? "selected-transfer-player" : ""}`}
                  key={player.id}
                >
                  <PlayerIdentity player={player} />
                  <span>{localize(player.next, language)}</span>
                  <strong className="form-value">{player.form}</strong>
                  <span>{player.isThai ? "ไทย" : "ต่างชาติ"}</span>
                  <strong className={`tier-pill tier-${player.tier}`}>
                    L{player.tier}
                  </strong>
                  <strong className="orange-text">{player.points}</strong>
                  <button
                    className={`transfer-player-action ${owned ? "owned" : ""}`}
                    disabled={!owned && !compatible}
                    onClick={() => choosePlayer(player)}
                    aria-label={
                      owned ? "เลือกนักเตะที่จะขาย" : "ซื้อนักเตะเข้าทีม"
                    }
                  >
                    {owned ? (
                      <UserRoundMinus size={17} />
                    ) : selectedOutgoing ? (
                      <ArrowRight size={17} />
                    ) : (
                      <UserRoundPlus size={17} />
                    )}
                  </button>
                </article>
              );
            })}
          </div>
          {players.length === 0 && (
            <div className="empty-state">
              <Search size={25} />
              <h3>ไม่พบนักเตะ</h3>
              <p>ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
            </div>
          )}
          <div className="table-footer">
            <span>
              แสดง {players.length} นักเตะ · ทีมปัจจุบัน {ownedIds.size}/15
            </span>
            <span>{quotaValid ? "พร้อมยืนยัน" : "ยังไม่ผ่านกติกา"}</span>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
