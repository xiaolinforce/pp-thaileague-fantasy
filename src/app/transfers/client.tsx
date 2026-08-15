"use client";

import {
  ArrowDownUp,
  ArrowRight,
  Check,
  Filter,
  Flame,
  Plus,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/fantasy/app-shell";
import { useLanguage } from "@/components/fantasy/i18n";
import { PlayerIdentity } from "@/components/fantasy/player-identity";
import { localize, type CompetitionDataset } from "@/lib/competition-types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

export default function TransfersClient({ data }: { data: CompetitionDataset }) {
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("ALL");
  const [sort, setSort] = useState("points");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [onlyWatchlist, setOnlyWatchlist] = useState(false);
  const [maxPrice, setMaxPrice] = useState("all");
  const { language } = useLanguage();
  const hotPlayer = [...data.players].sort((a, b) => b.selected - a.selected)[0];

  const players = useMemo(() => {
    return data.players
      .filter((player) => position === "ALL" || player.position === position)
      .filter((player) => !onlyWatchlist || watchlist.includes(player.id))
      .filter((player) => maxPrice === "all" || player.price <= Number(maxPrice))
      .filter((player) =>
        `${player.name.th} ${player.name.en} ${player.club.th} ${player.club.en}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
      .sort((a, b) =>
        sort === "price"
          ? b.price - a.price
          : sort === "form"
            ? b.form - a.form
            : b.points - a.points,
      );
  }, [data.players, maxPrice, onlyWatchlist, position, query, sort, watchlist]);
  const pageSize = 40;
  const pageCount = Math.max(1, Math.ceil(players.length / pageSize));
  const visiblePlayers = players.slice((page - 1) * pageSize, page * pageSize);

  const toggleWatchlist = (id: string) =>
    setWatchlist((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );

  return (
    <AppShell>
      <main className="content product-content">
        <PageHeader
          eyebrow="ตลาดนักเตะ"
          title="ซื้อขายนักเตะ"
          description="ค้นหา เปรียบเทียบ และปรับทีมให้พร้อมก่อนเดดไลน์"
          actions={
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogTrigger render={<button className="primary-button" />}>
                ยืนยันการซื้อขาย <ArrowRight size={17} />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>ยืนยันการซื้อขาย?</AlertDialogTitle>
                  <AlertDialogDescription>ตรวจสอบรายชื่อนักเตะและงบประมาณให้เรียบร้อยก่อนยืนยัน รายการนี้ยังเป็นข้อมูลเกมจำลอง</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>กลับไปตรวจสอบ</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { setConfirmOpen(false); toast.success(language === "th" ? "ยืนยันการซื้อขายแล้ว" : "Transfers confirmed"); }}>ยืนยัน</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          }
        />
        <div className="transfer-overview">
          <article>
            <span>งบคงเหลือ</span>
            <strong>฿3.5m</strong>
            <small>จาก ฿100.0m</small>
          </article>
          <article>
            <span>ฟรีทรานส์เฟอร์</span>
            <strong>1</strong>
            <small>ครั้งใน Gameweek นี้</small>
          </article>
          <article>
            <span>นักเตะในทีม</span>
            <strong>15/15</strong>
            <small>ครบทุกตำแหน่ง</small>
          </article>
          <article>
            <span>รายการที่สนใจ</span>
            <strong>{watchlist.length}</strong>
            <small>นักเตะที่บันทึกไว้</small>
          </article>
        </div>

        <section className="market-insight">
          <div>
            <span className="insight-icon">
              <Flame />
            </span>
            <div>
              <span className="eyebrow">ตลาดกำลังร้อน</span>
              <h3>{hotPlayer ? localize(hotPlayer.name, language) : "-"} ถูกซื้อเข้ามากที่สุด</h3>
              <p>ผู้จัดการ 18,421 คนซื้อเข้าภายใน 24 ชั่วโมง</p>
            </div>
          </div>
          <div className="price-alert">
            <TrendingUp size={17} />
            <span>คาดว่าราคาจะขึ้นคืนนี้</span>
            <strong>+฿0.1m</strong>
          </div>
        </section>

        <section className="product-card transfer-table-card">
          <div className="transfer-toolbar">
            <label className="search-field">
              <Search size={17} />
              <Input
                className="market-search-input"
                value={query}
                onChange={(event) => { setQuery(event.target.value); setPage(1); }}
                placeholder="ค้นหาชื่อนักเตะหรือสโมสร"
              />
              {query && (
                <button onClick={() => { setQuery(""); setPage(1); }} aria-label="ล้างคำค้น">
                  <X size={15} />
                </button>
              )}
            </label>
            <ToggleGroup
              className="position-filter"
              value={[position]}
                onValueChange={(values) => { if (values[0]) { setPosition(String(values[0])); setPage(1); } }}
            >
              {["ALL", "GK", "DEF", "MID", "FWD"].map((item) => (
                <ToggleGroupItem value={item} key={item}>
                  {item === "ALL" ? "ทั้งหมด" : item}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <div className="sort-select">
              <ArrowDownUp size={15} />
              <Select value={sort} onValueChange={(value) => { if (value) { setSort(String(value)); setPage(1); } }}>
                <SelectTrigger aria-label="เรียงลำดับนักเตะ"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">คะแนนสูงสุด</SelectItem>
                  <SelectItem value="form">ฟอร์มดีที่สุด</SelectItem>
                  <SelectItem value="price">ราคาสูงสุด</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Popover>
              <PopoverTrigger render={<button className={`filter-button ${onlyWatchlist || maxPrice !== "all" ? "active" : ""}`} />}>
                <Filter size={16} /> ตัวกรอง
              </PopoverTrigger>
              <PopoverContent align="end" className="market-filter-popover">
                <PopoverHeader>
                  <PopoverTitle>ตัวกรองเพิ่มเติม</PopoverTitle>
                  <PopoverDescription>จำกัดผลลัพธ์ตามรายการที่สนใจและงบประมาณ</PopoverDescription>
                </PopoverHeader>
                <div className="market-filter-row">
                  <span><strong>เฉพาะรายการที่สนใจ</strong><small>{watchlist.length} นักเตะ</small></span>
                  <Switch checked={onlyWatchlist} onCheckedChange={(checked) => { setOnlyWatchlist(checked); setPage(1); }} />
                </div>
                <div className="market-filter-row vertical">
                  <strong>ราคาสูงสุด</strong>
                  <Select value={maxPrice} onValueChange={(value) => { if (value) { setMaxPrice(String(value)); setPage(1); } }}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ไม่จำกัด</SelectItem>
                      <SelectItem value="6">฿6.0m</SelectItem>
                      <SelectItem value="8">฿8.0m</SelectItem>
                      <SelectItem value="10">฿10.0m</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="market-table">
            <div className="market-head">
              <span>นักเตะ</span>
              <span>นัดถัดไป</span>
              <span>ฟอร์ม</span>
              <span>เลือกโดย</span>
              <span>ราคา</span>
              <span>คะแนน</span>
              <span />
            </div>
            {visiblePlayers.map((player) => {
              const selected = watchlist.includes(player.id);
              return (
                <article className="market-row" key={player.id}>
                  <PlayerIdentity player={player} />
                  <span>{localize(player.next, language)}</span>
                  <strong className="form-value">{player.form}</strong>
                  <span>{player.selected}%</span>
                  <strong>฿{player.price.toFixed(1)}</strong>
                  <strong className="orange-text">{player.points}</strong>
                  <Tooltip>
                    <TooltipTrigger
                      className={selected ? "watching" : ""}
                      onClick={() => toggleWatchlist(player.id)}
                      aria-label={selected ? "นำออกจากรายการ" : "เพิ่มในรายการ"}
                    >
                      {selected ? <Check size={16} /> : <Plus size={16} />}
                    </TooltipTrigger>
                    <TooltipContent>{selected ? "นำออกจากรายการ" : "เพิ่มในรายการ"}</TooltipContent>
                  </Tooltip>
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
              แสดง {visiblePlayers.length} จาก {players.length} นักเตะ
            </span>
            {pageCount > 1 && (
              <Pagination className="market-pagination">
                <PaginationContent>
                  <PaginationItem><PaginationPrevious href="#" text="ก่อนหน้า" aria-disabled={page === 1} onClick={(event) => { event.preventDefault(); setPage((value) => Math.max(1, value - 1)); }} /></PaginationItem>
                  {[...new Set([1, page, pageCount])].sort((a, b) => a - b).map((item) => (
                    <PaginationItem key={item}><PaginationLink href="#" isActive={item === page} onClick={(event) => { event.preventDefault(); setPage(item); }}>{item}</PaginationLink></PaginationItem>
                  ))}
                  <PaginationItem><PaginationNext href="#" text="ถัดไป" aria-disabled={page === pageCount} onClick={(event) => { event.preventDefault(); setPage((value) => Math.min(pageCount, value + 1)); }} /></PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
