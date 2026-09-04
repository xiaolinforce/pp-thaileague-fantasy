"use client";

import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/fantasy/app-shell";
import { ClubColor } from "@/components/fantasy/club-colors";
import { GameweekSelector } from "@/components/fantasy/gameweek-selector";
import { useLanguage } from "@/components/fantasy/i18n";
import { localize, type CompetitionFixtureView } from "@/lib/competition-types";

type FixturesPageData = {
  fixtures: CompetitionFixtureView[];
  matchweeks: number[];
  currentGameweek: number | null;
};

function formatMatchDate(kickoffAt: string | null, language: "th" | "en") {
  if (!kickoffAt) return language === "th" ? "วันแข่งขันรอยืนยัน" : "Date TBC";
  return new Intl.DateTimeFormat(language === "th" ? "th-TH" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Bangkok",
  }).format(new Date(kickoffAt));
}

function getFixtureState(
  fixture: CompetitionFixtureView,
  language: "th" | "en",
) {
  const hasScore = fixture.homeScore !== null && fixture.awayScore !== null;
  if (hasScore) {
    const score = `${fixture.homeScore}–${fixture.awayScore}`;
    return {
      label: score,
      accessibleLabel:
        language === "th" ? `ผลการแข่งขัน ${score}` : `Result ${score}`,
    };
  }

  const timeLabel = localize(fixture.timeLabel, language);
  return {
    label: timeLabel,
    accessibleLabel:
      language === "th" ? `เวลาแข่งขัน ${timeLabel}` : `Kickoff ${timeLabel}`,
  };
}

export default function FixturesClient({ data }: { data: FixturesPageData }) {
  const { language } = useLanguage();
  const [week, setWeek] = useState(() =>
    data.currentGameweek !== null &&
    data.matchweeks.includes(data.currentGameweek)
      ? data.currentGameweek
      : (data.matchweeks[0] ?? 1),
  );
  const text = (th: string, en: string) => (language === "th" ? th : en);
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

  return (
    <AppShell>
      <main id="main-content" className="content product-content fixtures-page">
        <h1 className="sr-only">โปรแกรม</h1>
        <GameweekSelector
          week={week}
          max={data.matchweeks.at(-1) ?? 30}
          onChange={setWeek}
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
                {fixtures.map((fixture) => {
                  const fixtureState = getFixtureState(fixture, language);
                  return (
                    <article className="fixture-row" key={fixture.id}>
                      <time
                        className="fixture-row-mobile-state"
                        dateTime={fixture.kickoffAt ?? undefined}
                        aria-label={fixtureState.accessibleLabel}
                      >
                        {fixtureState.label}
                      </time>
                      <div className="fixture-club home">
                        <strong>{localize(fixture.home.name, language)}</strong>
                      </div>
                      <ClubColor
                        color={fixture.home.colors[0]}
                        secondaryColor={fixture.home.colors[1]}
                        className="fixture-club-color fixture-club-color--home"
                        label={text(
                          `สีประจำทีม ${localize(fixture.home.name, language)}`,
                          `${localize(fixture.home.name, language)} team colours`,
                        )}
                      />
                      <b
                        className="fixture-match-state"
                        aria-label={fixtureState.accessibleLabel}
                      >
                        {fixtureState.label}
                      </b>
                      <ClubColor
                        color={fixture.away.colors[0]}
                        secondaryColor={fixture.away.colors[1]}
                        className="fixture-club-color fixture-club-color--away"
                        label={text(
                          `สีประจำทีม ${localize(fixture.away.name, language)}`,
                          `${localize(fixture.away.name, language)} team colours`,
                        )}
                      />
                      <div className="fixture-club">
                        <strong>{localize(fixture.away.name, language)}</strong>
                      </div>
                    </article>
                  );
                })}
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
      </main>
    </AppShell>
  );
}
