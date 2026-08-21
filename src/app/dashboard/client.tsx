"use client";

import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Crown,
  Flame,
  Goal,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { AppShell, PageHeader } from "@/components/fantasy/app-shell";
import { useLanguage } from "@/components/fantasy/i18n";
import { PlayerKit } from "@/components/fantasy/player-kit";
import { localize, type CompetitionDataset } from "@/lib/competition-types";
import type { FantasyState } from "@/data/fantasy";

export default function DashboardClient({
  data,
  fantasy,
}: {
  data: CompetitionDataset;
  fantasy: FantasyState;
}) {
  const { language } = useLanguage();
  const owned = new Set(
    fantasy.selection.members.map((member) => member.fantasyPlayerId),
  );
  const squadPlayers = data.players.filter(
    (player) => player.fantasyPlayerId && owned.has(player.fantasyPlayerId),
  );
  const featuredPlayers = [...squadPlayers]
    .sort((a, b) => b.form - a.form)
    .slice(0, 4);
  const nextFixtures = data.fixtures
    .filter((fixture) => fixture.matchweek === fantasy.gameweek.number)
    .slice(0, 2);
  const firstFixture = nextFixtures[0];
  const overall = fantasy.leagues.find((league) => league.type === "overall");
  const mine = overall?.standings.find((standing) => standing.mine);
  const privateLeague = fantasy.leagues.find(
    (league) => league.type === "private",
  );
  const privateStanding = privateLeague?.standings.find(
    (standing) => standing.mine,
  );
  const overallAverage = overall?.standings.length
    ? Math.round(
        overall.standings.reduce(
          (total, standing) => total + standing.totalPoints,
          0,
        ) / overall.standings.length,
      )
    : 0;
  const overallBest = overall?.standings.length
    ? Math.max(...overall.standings.map((standing) => standing.totalPoints))
    : 0;
  const levelOne = squadPlayers.filter((player) => player.tier === 1).length;
  const numberFormat = new Intl.NumberFormat(
    language === "th" ? "th-TH" : "en-GB",
  );
  const isOpeningGameweek = fantasy.gameweek.number === 1;
  return (
    <AppShell>
      <main id="main-content" className="content product-content">
        <PageHeader
          eyebrow="ภาพรวม"
          title={
            language === "th"
              ? `สวัสดี ผู้จัดการ ${fantasy.team.name}`
              : `Welcome, ${fantasy.team.name} Manager`
          }
          description={
            language === "th"
              ? `ทีมพร้อมสำหรับ Gameweek ${fantasy.gameweek.number} — ตรวจรายชื่อก่อนเดดไลน์`
              : `Your squad is ready for Gameweek ${fantasy.gameweek.number} — review it before the deadline`
          }
          actions={
            <Link href="/team" className="primary-button">
              จัดทีมตอนนี้ <ArrowRight size={17} />
            </Link>
          }
        />
        <section className="dashboard-hero">
          <div className="hero-copy">
            <span className="hero-kicker">
              <Flame size={14} /> GAMEWEEK{" "}
              {String(fantasy.gameweek.number).padStart(2, "0")}
            </span>
            <h2>
              {isOpeningGameweek
                ? "เริ่มฤดูกาล"
                : `วางแผน Gameweek ${fantasy.gameweek.number}`}
              <br />
              {isOpeningGameweek ? "ให้เหนือคู่แข่ง" : "ก่อนเดดไลน์"}
            </h2>
            <p>
              {language === "th"
                ? `ทีมของคุณมี ${squadPlayers.length}/15 คน และแก้ไขได้จนถึง 90 นาทีก่อนคู่แรก`
                : `Your squad has ${squadPlayers.length}/15 players and remains editable until 90 minutes before the first kickoff`}
            </p>
            <div className="hero-actions">
              <Link href="/team" className="hero-button">
                ดูทีมของฉัน <ChevronRight size={17} />
              </Link>
              <span className="hero-deadline">
                <Clock3 size={15} />{" "}
                {new Intl.DateTimeFormat(
                  language === "th" ? "th-TH" : "en-GB",
                  {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Asia/Bangkok",
                  },
                ).format(new Date(fantasy.gameweek.deadlineAt))}
              </span>
            </div>
          </div>
          <div className="hero-score-orbit">
            <div className="score-ring">
              <span>คะแนน</span>
              <strong>{mine?.gameweekPoints ?? 0}</strong>
              <small>
                GW {String(fantasy.gameweek.number).padStart(2, "0")}
              </small>
            </div>
            <span className="orbit-label orbit-top">
              อันดับ <b>{mine?.rank ?? "—"}</b>
            </span>
            <span className="orbit-label orbit-bottom">
              <TrendingUp size={13} />{" "}
              {fantasy.gameweek.scoreComplete ? "FINAL" : "PROVISIONAL"}
            </span>
          </div>
        </section>

        <div className="metric-grid">
          <article className="metric-card">
            <span className="metric-icon orange-bg">
              <Trophy />
            </span>
            <div>
              <span>อันดับรวม</span>
              <strong>{mine?.rank ?? "—"}</strong>
              <small>
                {language === "th" ? "จาก" : "of"}{" "}
                {numberFormat.format(overall?.standings.length ?? 0)}{" "}
                {language === "th" ? "ทีม" : "teams"}
              </small>
            </div>
          </article>
          <article className="metric-card">
            <span className="metric-icon green-bg">
              <Goal />
            </span>
            <div>
              <span>คะแนนรวม</span>
              <strong>{mine?.totalPoints ?? 0}</strong>
              <small>
                {language === "th" ? "เฉลี่ย" : "Average"}{" "}
                {numberFormat.format(overallAverage)}{" "}
                {language === "th" ? "คะแนน" : "points"} ·{" "}
                {language === "th" ? "สูงสุด" : "best"}{" "}
                {numberFormat.format(overallBest)}
              </small>
            </div>
          </article>
          <article className="metric-card">
            <span className="metric-icon blue-bg">
              <CircleDollarSign />
            </span>
            <div>
              <span>นักเตะระดับ 1</span>
              <strong>{levelOne}/3</strong>
              <small>โควตาสูงสุด 3 คน</small>
            </div>
          </article>
          <article className="metric-card">
            <span className="metric-icon purple-bg">
              <Crown />
            </span>
            <div>
              <span>อันดับมินิลีก</span>
              <strong>{privateStanding?.rank ?? "—"}</strong>
              <small>
                {language === "th" ? "จาก" : "of"}{" "}
                {numberFormat.format(privateLeague?.standings.length ?? 0)}{" "}
                {language === "th" ? "ทีม" : "teams"}
              </small>
            </div>
          </article>
        </div>

        <div className="overview-grid">
          <section className="product-card dashboard-team-preview">
            <div className="product-card-head">
              <div>
                <span className="eyebrow">ดาวเด่นในทีม</span>
                <h2>ผู้เล่นฟอร์มร้อน</h2>
              </div>
              <Link href="/points">
                ดูคะแนนทั้งหมด <ChevronRight size={15} />
              </Link>
            </div>
            <div className="top-player-list">
              {featuredPlayers.map((player, index) => (
                <article className="top-player" key={player.id}>
                  <span className="player-rank">0{index + 1}</span>
                  <PlayerKit color={player.color} accent={player.accent} />
                  <div className="top-player-name">
                    <strong>{localize(player.name, language)}</strong>
                    <span>
                      {localize(player.club, language)} · {player.position}
                    </span>
                  </div>
                  <span className="form-chip">
                    <Sparkles size={12} /> {player.form}
                  </span>
                  <strong className="top-player-points">
                    {player.points}
                    <small>PTS</small>
                  </strong>
                </article>
              ))}
              {featuredPlayers.length === 0 && (
                <p className="inline-empty-state">
                  ยังไม่มีนักเตะในทีมสำหรับแสดงฟอร์ม
                </p>
              )}
            </div>
          </section>

          <section className="product-card next-fixture-card">
            <div className="product-card-head">
              <div>
                <span className="eyebrow">นัดถัดไป</span>
                <h2>
                  {firstFixture
                    ? localize(firstFixture.dateLabel, language)
                    : "ยังไม่มีโปรแกรม"}
                </h2>
              </div>
              <CalendarDays size={19} />
            </div>
            {nextFixtures.map((fixture) => (
              <article className="compact-fixture" key={fixture.id}>
                <span className="fixture-time">
                  {localize(fixture.timeLabel, language)}
                </span>
                <div>
                  <strong>{localize(fixture.home.name, language)}</strong>
                  <span>{localize(fixture.home.shortName, language)}</span>
                </div>
                <b>VS</b>
                <div>
                  <strong>{localize(fixture.away.name, language)}</strong>
                  <span>{localize(fixture.away.shortName, language)}</span>
                </div>
              </article>
            ))}
            {nextFixtures.length === 0 && (
              <p className="inline-empty-state">
                ยังไม่มีโปรแกรมที่ยืนยันสำหรับ Gameweek นี้
              </p>
            )}
            <Link href="/fixtures" className="full-card-link">
              ดูโปรแกรมทั้งหมด <ArrowRight size={15} />
            </Link>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
