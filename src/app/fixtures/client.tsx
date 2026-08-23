"use client";

import {
  BarChart3,
  CalendarDays,
  Goal,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/fantasy/app-shell";
import { useLanguage } from "@/components/fantasy/i18n";
import { PlayerKit } from "@/components/fantasy/player-kit";
import { ClubColor } from "@/components/fantasy/club-colors";
import { PlayerIdentity } from "@/components/fantasy/player-identity";
import { GameweekSelector } from "@/components/fantasy/gameweek-selector";
import { localize, type CompetitionDataset } from "@/lib/competition-types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatMatchDate(kickoffAt: string | null, language: "th" | "en") {
  if (!kickoffAt) return language === "th" ? "วันแข่งขันรอยืนยัน" : "Date TBC";

  const date = new Date(kickoffAt);
  if (language === "en") {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Asia/Bangkok",
    }).format(date);
  }

  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
  const thaiWeekdays: Record<string, string> = {
    Mon: "จันทร์",
    Tue: "อังคาร",
    Wed: "พุธ",
    Thu: "พฤหัสบดี",
    Fri: "ศุกร์",
    Sat: "เสาร์",
    Sun: "อาทิตย์",
  };
  const parts = new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    timeZone: "Asia/Bangkok",
  }).formatToParts(date);
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  return `${thaiWeekdays[weekday]}ที่ ${day} ${month}`;
}

export default function FixturesClient({ data }: { data: CompetitionDataset }) {
  const [view, setView] = useState<"fixtures" | "stats">("fixtures");
  const [week, setWeek] = useState(data.matchweeks[0] ?? 1);
  const [position, setPosition] = useState<
    "ALL" | "GK" | "DEF" | "MID" | "FWD"
  >("ALL");
  const { language } = useLanguage();
  const weekFixtures = data.fixtures.filter(
    (fixture) => fixture.matchweek === week,
  );
  const fixturesByDate = weekFixtures.reduce<Map<string, typeof weekFixtures>>(
    (groups, fixture) => {
      const label = formatMatchDate(fixture.kickoffAt, language);
      groups.set(label, [...(groups.get(label) ?? []), fixture]);
      return groups;
    },
    new Map(),
  );
  const rankedPlayers = [...data.players].sort((a, b) => b.form - a.form);
  const filteredRankedPlayers = rankedPlayers.filter(
    (player) => position === "ALL" || player.position === position,
  );
  const leaders = [
    rankedPlayers[0],
    rankedPlayers[1],
    rankedPlayers.find((player) => player.position === "GK"),
  ].filter(Boolean);
  return (
    <AppShell>
      <main id="main-content" className="content product-content">
        <PageHeader
          title="โปรแกรมและสถิติ"
          actions={
            <Tabs
              value={view}
              onValueChange={(value) => setView(value as "fixtures" | "stats")}
            >
              <TabsList className="segment-tabs page-tabs">
                <TabsTrigger value="fixtures">
                  <CalendarDays size={16} />
                  โปรแกรม
                </TabsTrigger>
                <TabsTrigger value="stats">
                  <BarChart3 size={16} />
                  สถิติ
                </TabsTrigger>
              </TabsList>
            </Tabs>
          }
        />
        {view === "fixtures" ? (
          <>
            <GameweekSelector
              week={week}
              max={data.matchweeks.at(-1) ?? 30}
              onChange={setWeek}
            />
            <div className="fixtures-layout">
              <section className="product-card fixture-list-card">
                {[...fixturesByDate.entries()].map(([date, fixtures]) => (
                  <div className="fixture-day-group" key={date}>
                    <div className="match-day">
                      <span>{date}</span>
                    </div>
                    {fixtures.map((fixture) => (
                      <article className="fixture-row" key={fixture.id}>
                        <time>{localize(fixture.timeLabel, language)}</time>
                        <div className="fixture-club home">
                          <strong>
                            {localize(fixture.home.name, language)}
                          </strong>
                        </div>
                        <ClubColor
                          color={fixture.home.colors[0]}
                          secondaryColor={fixture.home.colors[1]}
                          label={
                            language === "th"
                              ? `สีประจำทีม ${localize(fixture.home.name, language)}`
                              : `${localize(fixture.home.name, language)} team colours`
                          }
                        />
                        <b className="fixture-vs">VS</b>
                        <ClubColor
                          color={fixture.away.colors[0]}
                          secondaryColor={fixture.away.colors[1]}
                          label={
                            language === "th"
                              ? `สีประจำทีม ${localize(fixture.away.name, language)}`
                              : `${localize(fixture.away.name, language)} team colours`
                          }
                        />
                        <div className="fixture-club">
                          <strong>
                            {localize(fixture.away.name, language)}
                          </strong>
                        </div>
                      </article>
                    ))}
                  </div>
                ))}
                {fixturesByDate.size === 0 && (
                  <div className="inline-empty-state large" role="status">
                    <CalendarDays aria-hidden="true" />
                    <strong>ยังไม่มีโปรแกรมใน Gameweek นี้</strong>
                    <span>ลองเลือก Gameweek อื่นเพื่อตรวจสอบโปรแกรม</span>
                  </div>
                )}
              </section>
            </div>
          </>
        ) : (
          <>
            <div className="stat-leaders-grid">
              {[
                {
                  title: "ดาวซัลโว",
                  icon: Goal,
                  color: "orange",
                  value: "8 ประตู",
                  player: leaders[0],
                },
                {
                  title: "แอสซิสต์สูงสุด",
                  icon: Sparkles,
                  color: "purple",
                  value: "6 แอสซิสต์",
                  player: leaders[1],
                },
                {
                  title: "คลีนชีตสูงสุด",
                  icon: ShieldCheck,
                  color: "green",
                  value: "5 คลีนชีต",
                  player: leaders[2],
                },
              ]
                .filter((item) => item.player)
                .map(({ title, icon: Icon, color, value, player }) => (
                  <article className="product-card leader-card" key={title}>
                    <div className={`leader-icon ${color}`}>
                      <Icon />
                    </div>
                    <span className="eyebrow">{title}</span>
                    <div className="leader-player">
                      <PlayerKit
                        color={player!.color}
                        accent={player!.accent}
                        size="large"
                      />
                      <div>
                        <h3>{localize(player!.name, language)}</h3>
                        <p>{localize(player!.club, language)}</p>
                        <strong>{value}</strong>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
            <section className="product-card stats-ranking-card">
              <div className="product-card-head">
                <div>
                  <span className="eyebrow">อันดับผู้เล่น</span>
                  <h2>ฟอร์มดีที่สุด</h2>
                </div>
                <div className="stats-position-filter">
                  <span className="sr-only">กรองตำแหน่งผู้เล่น</span>
                  <Select
                    value={position}
                    onValueChange={(value) => {
                      if (!value) return;
                      setPosition(
                        value as "ALL" | "GK" | "DEF" | "MID" | "FWD",
                      );
                    }}
                  >
                    <SelectTrigger
                      className="filter-button"
                      aria-label="กรองตำแหน่งผู้เล่น"
                    >
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
                </div>
              </div>
              <div className="stats-ranking">
                {filteredRankedPlayers.slice(0, 8).map((player, index) => (
                  <article key={player.id}>
                    <span className="player-rank">0{index + 1}</span>
                    <PlayerIdentity player={player} />
                    <div className="form-bar">
                      <span style={{ width: `${player.form * 10}%` }} />
                    </div>
                    <strong>{player.form}</strong>
                    <span>{player.points} pts</span>
                    <span>ระดับ {player.tier}</span>
                  </article>
                ))}
                {filteredRankedPlayers.length === 0 && (
                  <div className="inline-empty-state large" role="status">
                    <strong>ไม่พบนักเตะในตำแหน่งนี้</strong>
                    <span>เลือกตำแหน่งอื่นเพื่อดูอันดับผู้เล่น</span>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </AppShell>
  );
}
