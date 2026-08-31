"use client";

import {
  BarChart3,
  CalendarDays,
  Clock3,
  ExternalLink,
  Info,
  Search,
  Trophy,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/fantasy/app-shell";
import { ClubColor } from "@/components/fantasy/club-colors";
import { GameweekSelector } from "@/components/fantasy/gameweek-selector";
import {
  getLocalizedPositionLabel,
  useLanguage,
} from "@/components/fantasy/i18n";
import { PlayerIdentity } from "@/components/fantasy/player-identity";
import {
  localize,
  type CompetitionDataset,
  type CompetitionFootballStatView,
  type CompetitionPlayerView,
  type CompetitionPosition,
} from "@/lib/competition-types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MainView = "fixtures" | "stats";
type StatsView = "fantasy" | "football";
type PositionFilter = "ALL" | CompetitionPosition;
type FantasySort = "points" | "form" | "selected";
type FootballSort =
  "goals" | "assists" | "cleanSheets" | "appearances" | "minutes";

function formatMatchDate(kickoffAt: string | null, language: "th" | "en") {
  if (!kickoffAt) return language === "th" ? "วันแข่งขันรอยืนยัน" : "Date TBC";
  return new Intl.DateTimeFormat(language === "th" ? "th-TH" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Bangkok",
  }).format(new Date(kickoffAt));
}

function formatUpdatedAt(value: string | null, language: "th" | "en") {
  if (!value) return null;
  return new Intl.DateTimeFormat(language === "th" ? "th-TH" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

function rankingNumber<T>(
  rows: T[],
  index: number,
  getValue: (row: T) => number,
): number {
  if (index === 0) return 1;
  return getValue(rows[index - 1]) === getValue(rows[index])
    ? rankingNumber(rows, index - 1, getValue)
    : index + 1;
}

export default function FixturesClient({ data }: { data: CompetitionDataset }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const [visibleCount, setVisibleCount] = useState(25);
  const text = (th: string, en: string) => (language === "th" ? th : en);
  const requestedView: MainView =
    searchParams.get("view") === "stats" ? "stats" : "fixtures";
  const statisticsEnabled = (data.currentGameweek ?? 1) > 1;
  const view: MainView =
    statisticsEnabled && requestedView === "stats" ? "stats" : "fixtures";
  const statsView: StatsView =
    searchParams.get("stats") === "football" ? "football" : "fantasy";
  const requestedWeek = Number(searchParams.get("week"));
  const week = data.matchweeks.includes(requestedWeek)
    ? requestedWeek
    : (data.matchweeks[0] ?? 1);
  const requestedPosition = searchParams.get("position");
  const position: PositionFilter = ["GK", "DEF", "MID", "FWD"].includes(
    requestedPosition ?? "",
  )
    ? (requestedPosition as CompetitionPosition)
    : "ALL";
  const clubId = searchParams.get("club") ?? "ALL";
  const query = searchParams.get("q")?.trim() ?? "";
  const fantasySort: FantasySort = ["form", "selected"].includes(
    searchParams.get("sort") ?? "",
  )
    ? (searchParams.get("sort") as FantasySort)
    : "points";
  const footballSort: FootballSort = [
    "assists",
    "cleanSheets",
    "appearances",
    "minutes",
  ].includes(searchParams.get("sort") ?? "")
    ? (searchParams.get("sort") as FootballSort)
    : "goals";

  function updateUrl(values: Record<string, string | number | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(values)) {
      if (value === null || value === "" || value === "ALL") next.delete(key);
      else next.set(key, String(value));
    }
    router.replace(next.size ? `${pathname}?${next}` : pathname, {
      scroll: false,
    });
  }

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
  const playerById = useMemo(
    () => new Map(data.players.map((player) => [player.id, player])),
    [data.players],
  );
  const normalizedQuery = query.toLocaleLowerCase(
    language === "th" ? "th" : "en",
  );
  const matchesFilters = (player: CompetitionPlayerView) =>
    (position === "ALL" || player.position === position) &&
    (clubId === "ALL" || player.clubId === clubId) &&
    (!normalizedQuery ||
      `${localize(player.name, language)} ${localize(player.club, language)}`
        .toLocaleLowerCase(language === "th" ? "th" : "en")
        .includes(normalizedQuery));
  const fantasyRows = data.players
    .filter((player) => player.fantasyAppearances > 0)
    .filter(matchesFilters)
    .sort((a, b) =>
      fantasySort === "form"
        ? b.form - a.form || b.points - a.points
        : fantasySort === "selected"
          ? b.selected - a.selected || b.points - a.points
          : b.points - a.points || b.form - a.form,
    );
  const footballRows = data.statistics.football.players
    .flatMap((stats) => {
      const player = playerById.get(stats.playerId);
      return player && matchesFilters(player) ? [{ player, stats }] : [];
    })
    .sort(
      (a, b) =>
        b.stats[footballSort] - a.stats[footballSort] ||
        b.stats.appearances - a.stats.appearances ||
        localize(a.player.name, language).localeCompare(
          localize(b.player.name, language),
          language,
        ),
    );
  const activeRows = statsView === "fantasy" ? fantasyRows : footballRows;
  const statsAvailable =
    statsView === "fantasy"
      ? data.statistics.fantasy.available
      : data.statistics.football.available;
  const lastUpdatedAt = formatUpdatedAt(
    statsView === "fantasy"
      ? data.statistics.fantasy.lastUpdatedAt
      : data.statistics.football.lastUpdatedAt,
    language,
  );
  const footballLeaders = (
    [
      ["goals", text("ประตู", "Goals")],
      ["assists", text("แอสซิสต์", "Assists")],
      ["cleanSheets", text("คลีนชีต", "Clean sheets")],
    ] as const
  ).flatMap(([metric, label]) => {
    const maximum = Math.max(
      0,
      ...data.statistics.football.players.map((row) => row[metric]),
    );
    if (maximum === 0) return [];
    const leaders = data.statistics.football.players.filter(
      (row) => row[metric] === maximum,
    );
    return [{ metric, label, maximum, leaders }];
  });

  return (
    <AppShell>
      <main id="main-content" className="content product-content fixtures-page">
        <h1 className="sr-only">โปรแกรมและสถิติ</h1>
        <Tabs
          value={view}
          onValueChange={(value) =>
            updateUrl({ view: value === "stats" ? "stats" : null })
          }
        >
          <TabsList className="segment-tabs page-tabs fixtures-view-tabs">
            <TabsTrigger value="fixtures">
              <CalendarDays size={16} aria-hidden="true" />
              โปรแกรม
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              disabled={!statisticsEnabled}
              aria-describedby={
                !statisticsEnabled ? "stats-unavailable-hint" : undefined
              }
              title={
                !statisticsEnabled
                  ? text(
                      "สถิติจะเปิดหลัง Gameweek แรกสิ้นสุดลง",
                      "Statistics unlock after Gameweek 1 ends",
                    )
                  : undefined
              }
            >
              <BarChart3 size={16} aria-hidden="true" />
              สถิติ
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {!statisticsEnabled ? (
          <p id="stats-unavailable-hint" className="sr-only">
            สถิติจะเปิดหลัง Gameweek แรกสิ้นสุดลง
          </p>
        ) : null}

        {view === "fixtures" ? (
          <>
            <GameweekSelector
              week={week}
              max={data.matchweeks.at(-1) ?? 30}
              onChange={(nextWeek) => updateUrl({ week: nextWeek })}
            />
            <div className="fixtures-layout">
              <section
                className="product-card fixture-list-card"
                aria-live="polite"
              >
                {[...fixturesByDate.entries()].map(([date, fixtures]) => (
                  <div className="fixture-day-group" key={date}>
                    <div className="match-day">
                      <span>{date}</span>
                    </div>
                    {fixtures.map((fixture) => (
                      <article className="fixture-row" key={fixture.id}>
                        <time dateTime={fixture.kickoffAt ?? undefined}>
                          {localize(fixture.timeLabel, language)}
                        </time>
                        <div className="fixture-club home">
                          <strong>
                            {localize(fixture.home.name, language)}
                          </strong>
                        </div>
                        <ClubColor
                          color={fixture.home.colors[0]}
                          secondaryColor={fixture.home.colors[1]}
                          label={text(
                            `สีประจำทีม ${localize(fixture.home.name, language)}`,
                            `${localize(fixture.home.name, language)} team colours`,
                          )}
                        />
                        <b className="fixture-vs">VS</b>
                        <ClubColor
                          color={fixture.away.colors[0]}
                          secondaryColor={fixture.away.colors[1]}
                          label={text(
                            `สีประจำทีม ${localize(fixture.away.name, language)}`,
                            `${localize(fixture.away.name, language)} team colours`,
                          )}
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
          <section
            className="statistics-workspace"
            aria-labelledby="stats-heading"
          >
            <div className="stats-workspace-head">
              <div>
                <h2 id="stats-heading">สถิติผู้เล่น</h2>
                <p>แยกตัวเลขฟุตบอลทางการออกจากคะแนนที่คำนวณตามกติกาแฟนตาซี</p>
              </div>
              <Tabs
                value={statsView}
                onValueChange={(value) =>
                  updateUrl({
                    stats: value === "football" ? "football" : null,
                    sort: null,
                  })
                }
              >
                <TabsList className="segment-tabs stats-source-tabs">
                  <TabsTrigger value="fantasy">แฟนตาซี</TabsTrigger>
                  <TabsTrigger value="football">สถิติการแข่งขัน</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="stats-source-note" role="note">
              <Info aria-hidden="true" />
              <div>
                <strong>
                  {statsView === "fantasy"
                    ? text(
                        "คะแนนตามกติกา PP Fantasy",
                        "PP Fantasy rule-based points",
                      )
                    : text(
                        "สถิติรวมจาก Thai League",
                        "Season totals from Thai League",
                      )}
                </strong>
                <span>
                  {statsView === "fantasy"
                    ? text(
                        "ฟอร์มคือคะแนนเฉลี่ยจาก 5 นัดล่าสุดของสโมสร โดยนัดที่ไม่ได้ลงสนามนับเป็น 0",
                        "Form is the average points from the club’s last five fixtures; a DNP counts as 0.",
                      )
                    : text(
                        "แสดงเฉพาะข้อมูลฤดูกาลปัจจุบันที่นำเข้าจาก API ทางการ ไม่ใช้ข้อมูลฤดูกาลก่อนหรือค่าจำลอง",
                        "Only current-season data imported from the official API is shown; no prior-season fallback or simulated values.",
                      )}
                </span>
              </div>
              {statsView === "football" &&
                data.statistics.football.sourceUrl && (
                  <a
                    href={data.statistics.football.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {text("ดูแหล่งข้อมูล", "View source")}
                    <ExternalLink aria-hidden="true" />
                  </a>
                )}
            </div>

            {!statsAvailable ? (
              <div className="stats-empty-state" role="status">
                <span>
                  <Clock3 aria-hidden="true" />
                </span>
                <div>
                  <h3>ฤดูกาลนี้ยังไม่มีสถิติ</h3>
                  <p>
                    {statsView === "fantasy"
                      ? text(
                          "คะแนนและฟอร์มจะปรากฏหลังสถิติรายนัดแรกผ่านการตรวจสอบและคำนวณคะแนนแล้ว",
                          "Points and form will appear after the first match statistics are reviewed and scored.",
                        )
                      : text(
                          "สถิติการแข่งขันจะปรากฏเมื่อ Thai League เผยแพร่ข้อมูลฤดูกาลนี้และระบบนำเข้าสำเร็จ",
                          "Match statistics will appear after Thai League publishes current-season data and the import completes.",
                        )}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {statsView === "football" && footballLeaders.length > 0 && (
                  <div
                    className="stats-leaders"
                    aria-label={text("ผู้นำสถิติ", "Stat leaders")}
                  >
                    {footballLeaders.map(
                      ({ metric, label, maximum, leaders }) => {
                        const firstPlayer = playerById.get(leaders[0].playerId);
                        if (!firstPlayer) return null;
                        return (
                          <article key={metric}>
                            <span>
                              <Trophy aria-hidden="true" />
                            </span>
                            <div>
                              <small>{label}</small>
                              <strong>{maximum}</strong>
                              <p>
                                {localize(firstPlayer.shortName, language)}
                                {leaders.length > 1 &&
                                  ` ${text(
                                    `และอีก ${leaders.length - 1} คน`,
                                    `and ${leaders.length - 1} more`,
                                  )}`}
                              </p>
                            </div>
                          </article>
                        );
                      },
                    )}
                  </div>
                )}

                <div className="stats-toolbar">
                  <form
                    className="stats-search"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const nextQuery = String(
                        new FormData(event.currentTarget).get("q") ?? "",
                      ).trim();
                      updateUrl({ q: nextQuery || null });
                    }}
                  >
                    <input
                      key={query}
                      type="search"
                      name="q"
                      autoComplete="off"
                      aria-label={text(
                        "ค้นหานักเตะหรือสโมสร",
                        "Search player or club",
                      )}
                      defaultValue={query}
                      placeholder={text(
                        "ค้นหานักเตะหรือสโมสร…",
                        "Search player or club…",
                      )}
                    />
                    <button type="submit" aria-label={text("ค้นหา", "Search")}>
                      <Search aria-hidden="true" />
                    </button>
                  </form>
                  <Select
                    value={position}
                    onValueChange={(value) =>
                      value && updateUrl({ position: value })
                    }
                  >
                    <SelectTrigger aria-label="กรองตำแหน่งผู้เล่น">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">ทุกตำแหน่ง</SelectItem>
                      {(["GK", "DEF", "MID", "FWD"] as const).map((value) => (
                        <SelectItem value={value} key={value}>
                          {getLocalizedPositionLabel(value, language)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={clubId}
                    onValueChange={(value) =>
                      value && updateUrl({ club: value })
                    }
                  >
                    <SelectTrigger
                      aria-label={text("กรองสโมสร", "Filter by club")}
                    >
                      <SelectValue
                        placeholder={text("ทุกสโมสร", "All clubs")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">
                        {text("ทุกสโมสร", "All clubs")}
                      </SelectItem>
                      {data.clubs.map((club) => (
                        <SelectItem value={club.id} key={club.id}>
                          {localize(club.shortName, language)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={statsView === "fantasy" ? fantasySort : footballSort}
                    onValueChange={(value) =>
                      value && updateUrl({ sort: value })
                    }
                  >
                    <SelectTrigger aria-label={text("เรียงตาม", "Sort by")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statsView === "fantasy" ? (
                        <>
                          <SelectItem value="points">
                            {text("คะแนนรวม", "Total points")}
                          </SelectItem>
                          <SelectItem value="form">
                            {text("ฟอร์ม", "Form")}
                          </SelectItem>
                          <SelectItem value="selected">
                            {text("เลือกโดย", "Selected by")}
                          </SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="goals">
                            {text("ประตู", "Goals")}
                          </SelectItem>
                          <SelectItem value="assists">
                            {text("แอสซิสต์", "Assists")}
                          </SelectItem>
                          <SelectItem value="cleanSheets">
                            {text("คลีนชีต", "Clean sheets")}
                          </SelectItem>
                          <SelectItem value="appearances">
                            {text("ลงสนาม", "Appearances")}
                          </SelectItem>
                          <SelectItem value="minutes">
                            {text("นาที", "Minutes")}
                          </SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="stats-table-card">
                  <div className="stats-table-summary">
                    <strong>
                      {text(
                        `${activeRows.length} คน`,
                        `${activeRows.length} players`,
                      )}
                    </strong>
                    {lastUpdatedAt && (
                      <span>
                        {text(
                          `อัปเดต ${lastUpdatedAt}`,
                          `Updated ${lastUpdatedAt}`,
                        )}
                      </span>
                    )}
                  </div>
                  {activeRows.length === 0 ? (
                    <div className="inline-empty-state large" role="status">
                      <Search aria-hidden="true" />
                      <strong>ไม่พบนักเตะตามตัวกรอง</strong>
                      <span>ลองล้างคำค้นหาหรือเลือกตัวกรองอื่น</span>
                    </div>
                  ) : statsView === "fantasy" ? (
                    <FantasyStatsTable
                      rows={fantasyRows.slice(0, visibleCount)}
                      sort={fantasySort}
                      language={language}
                    />
                  ) : (
                    <FootballStatsTable
                      rows={footballRows.slice(0, visibleCount)}
                      sort={footballSort}
                      language={language}
                    />
                  )}
                  {activeRows.length > visibleCount && (
                    <button
                      type="button"
                      className="stats-load-more secondary-button"
                      onClick={() => setVisibleCount((count) => count + 25)}
                    >
                      {text("แสดงเพิ่ม 25 คน", "Show 25 more")}
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </AppShell>
  );
}

function FantasyStatsTable({
  rows,
  sort,
  language,
}: {
  rows: CompetitionPlayerView[];
  sort: FantasySort;
  language: "th" | "en";
}) {
  const value = (player: CompetitionPlayerView) => player[sort];
  return (
    <div className="stats-table-scroll">
      <table className="stats-table">
        <caption className="sr-only">
          {language === "th" ? "อันดับสถิติแฟนตาซี" : "Fantasy rankings"}
        </caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">{language === "th" ? "ผู้เล่น" : "Player"}</th>
            <th scope="col">{language === "th" ? "คะแนน" : "Points"}</th>
            <th scope="col">{language === "th" ? "ฟอร์ม" : "Form"}</th>
            <th scope="col">{language === "th" ? "ลงสนาม" : "Apps"}</th>
            <th scope="col">{language === "th" ? "เลือกโดย" : "Selected"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((player, index) => (
            <tr key={player.id}>
              <td data-label="#">{rankingNumber(rows, index, value)}</td>
              <td data-label={language === "th" ? "ผู้เล่น" : "Player"}>
                <PlayerIdentity player={player} showPositionBadge />
              </td>
              <td data-label={language === "th" ? "คะแนน" : "Points"}>
                <strong>{player.points}</strong>
              </td>
              <td data-label={language === "th" ? "ฟอร์ม" : "Form"}>
                {player.form.toFixed(1)}
              </td>
              <td data-label={language === "th" ? "ลงสนาม" : "Apps"}>
                {player.fantasyAppearances}
              </td>
              <td data-label={language === "th" ? "เลือกโดย" : "Selected"}>
                {player.selected.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FootballStatsTable({
  rows,
  sort,
  language,
}: {
  rows: Array<{
    player: CompetitionPlayerView;
    stats: CompetitionFootballStatView;
  }>;
  sort: FootballSort;
  language: "th" | "en";
}) {
  const value = (row: (typeof rows)[number]) => row.stats[sort];
  return (
    <div className="stats-table-scroll">
      <table className="stats-table">
        <caption className="sr-only">
          {language === "th" ? "อันดับสถิติการแข่งขัน" : "Match-stat rankings"}
        </caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">{language === "th" ? "ผู้เล่น" : "Player"}</th>
            <th scope="col">{language === "th" ? "ลงสนาม" : "Apps"}</th>
            <th scope="col">{language === "th" ? "นาที" : "Minutes"}</th>
            <th scope="col">{language === "th" ? "ประตู" : "Goals"}</th>
            <th scope="col">{language === "th" ? "แอสซิสต์" : "Assists"}</th>
            <th scope="col">
              {language === "th" ? "คลีนชีต" : "Clean sheets"}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ player, stats }, index) => (
            <tr key={player.id}>
              <td data-label="#">{rankingNumber(rows, index, value)}</td>
              <td data-label={language === "th" ? "ผู้เล่น" : "Player"}>
                <PlayerIdentity player={player} showPositionBadge />
              </td>
              <td data-label={language === "th" ? "ลงสนาม" : "Apps"}>
                {stats.appearances}
              </td>
              <td data-label={language === "th" ? "นาที" : "Minutes"}>
                {stats.minutes.toLocaleString(language)}
              </td>
              <td data-label={language === "th" ? "ประตู" : "Goals"}>
                <strong>{stats.goals}</strong>
              </td>
              <td data-label={language === "th" ? "แอสซิสต์" : "Assists"}>
                {stats.assists}
              </td>
              <td data-label={language === "th" ? "คลีนชีต" : "Clean sheets"}>
                {stats.cleanSheets}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
