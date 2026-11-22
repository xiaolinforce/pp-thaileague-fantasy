"use client";

import {
  CalendarDays,
  CircleAlert,
  Clock3,
  Goal,
  MapPin,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { ClubColor } from "@/components/fantasy/club-colors";
import { useLanguage } from "@/components/fantasy/i18n";
import { PositionBadge } from "@/components/fantasy/position-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { localize, type CompetitionFixtureView } from "@/lib/competition-types";
import {
  summarizeMatchDetails,
  type FixtureMatchDetails,
  type MatchEventEntry,
  type MatchSide,
} from "@/lib/fantasy/match-details";

const SIDES = ["home", "away"] as const satisfies readonly MatchSide[];

// Finished match details do not change between dialog openings in a visit.
const detailsCache = new Map<string, FixtureMatchDetails>();

type LoadState =
  | { status: "idle" | "loading" | "error" }
  | { status: "ready"; details: FixtureMatchDetails };

export function isFixtureDetailAvailable(fixture: CompetitionFixtureView) {
  return (
    fixture.status === "finished" &&
    fixture.homeScore !== null &&
    fixture.awayScore !== null
  );
}

export function FixtureMatchDialog({
  fixture,
  triggerClassName,
  children,
}: {
  fixture: CompetitionFixtureView;
  triggerClassName: string;
  children: ReactNode;
}) {
  const { language } = useLanguage();
  const text = (th: string, en: string) => (language === "th" ? th : en);
  const [state, setState] = useState<LoadState>(() => {
    const cached = detailsCache.get(fixture.id);
    return cached ? { status: "ready", details: cached } : { status: "idle" };
  });

  const homeName = localize(fixture.home.name, language);
  const awayName = localize(fixture.away.name, language);
  const score = `${fixture.homeScore}–${fixture.awayScore}`;
  const clubName = (side: MatchSide) => (side === "home" ? homeName : awayName);
  const assistNames = (entries: MatchEventEntry[]) =>
    entries
      .map(
        (entry) =>
          `${localize(entry.name, language)}${
            entry.count > 1 ? ` ×${entry.count}` : ""
          }`,
      )
      .join(", ");

  async function load() {
    setState({ status: "loading" });
    try {
      const response = await fetch(`/api/fixtures/${fixture.id}/details`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const details = (await response.json()) as FixtureMatchDetails;
      detailsCache.set(fixture.id, details);
      setState({ status: "ready", details });
    } catch {
      setState({ status: "error" });
    }
  }

  function handleOpenChange(open: boolean) {
    if (open && (state.status === "idle" || state.status === "error")) {
      void load();
    }
  }

  const details = state.status === "ready" ? state.details : null;
  const summary = useMemo(
    () => (details ? summarizeMatchDetails(details) : null),
    [details],
  );
  const penalties =
    details?.homePenaltyScore != null && details.awayPenaltyScore != null
      ? `${details.homePenaltyScore}–${details.awayPenaltyScore}`
      : null;
  const totalGoals = (fixture.homeScore ?? 0) + (fixture.awayScore ?? 0);

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <button
            type="button"
            className={triggerClassName}
            aria-label={text(
              `ดูรายละเอียดการแข่งขัน ${homeName} ${score} ${awayName}`,
              `View match details: ${homeName} ${score} ${awayName}`,
            )}
          />
        }
      >
        {children}
      </DialogTrigger>
      <DialogContent
        className="product-dialog fixture-match-dialog"
        showCloseButton={false}
      >
        <DialogClose render={<button type="button" className="modal-close" />}>
          <X size={18} aria-hidden="true" />
          <span className="sr-only">
            {text("ปิดรายละเอียดการแข่งขัน", "Close match details")}
          </span>
        </DialogClose>

        <DialogHeader className="fixture-match-heading">
          <span className="fixture-match-eyebrow">
            Gameweek {fixture.matchweek} · {text("จบการแข่งขัน", "Full time")}
          </span>
          <DialogTitle className="sr-only">
            {`${homeName} ${score} ${awayName}`}
            {penalties
              ? text(` (ดวลจุดโทษ ${penalties})`, ` (penalties ${penalties})`)
              : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="fixture-match-scoreboard" aria-hidden="true">
          {SIDES.map((side) => {
            const club = fixture[side];
            return (
              <div className={`fixture-match-team is-${side}`} key={side}>
                <ClubColor
                  color={club.colors[0]}
                  secondaryColor={club.colors[1]}
                  size="large"
                  label=""
                />
                <strong>{localize(club.name, language)}</strong>
                <small>
                  {side === "home"
                    ? text("เจ้าบ้าน", "Home")
                    : text("ทีมเยือน", "Away")}
                </small>
              </div>
            );
          })}
          <div className="fixture-match-score">
            <strong>
              <span>{fixture.homeScore}</span>
              <i>–</i>
              <span>{fixture.awayScore}</span>
            </strong>
            {penalties ? (
              <small>{text(`จุดโทษ ${penalties}`, `Pens ${penalties}`)}</small>
            ) : null}
          </div>
        </div>

        <DialogDescription className="fixture-match-meta">
          <span>
            <CalendarDays size={15} aria-hidden="true" />
            {localize(fixture.dateLabel, language)}
          </span>
          <span>
            <Clock3 size={15} aria-hidden="true" />
            {localize(fixture.timeLabel, language)}
            {language === "th" ? " น." : ""}
          </span>
          {fixture.venue ? (
            <span>
              <MapPin size={15} aria-hidden="true" />
              {localize(fixture.venue, language)}
            </span>
          ) : null}
          {details?.attendance ? (
            <span>
              <Users size={15} aria-hidden="true" />
              {text(
                `ผู้ชม ${details.attendance.toLocaleString("th-TH")} คน`,
                `Attendance ${details.attendance.toLocaleString("en-GB")}`,
              )}
            </span>
          ) : null}
        </DialogDescription>

        {state.status === "loading" || state.status === "idle" ? (
          <div className="fixture-match-loading" role="status">
            <span className="sr-only">
              {text("กำลังโหลดรายละเอียดการแข่งขัน", "Loading match details")}
            </span>
            {[0, 1, 2].map((index) => (
              <div className="fixture-match-section" key={index}>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : null}

        {state.status === "error" ? (
          <div className="fixture-match-error" role="alert">
            <CircleAlert size={20} aria-hidden="true" />
            <p>
              {text(
                "โหลดรายละเอียดการแข่งขันไม่สำเร็จ",
                "Match details could not be loaded.",
              )}
            </p>
            <Button type="button" variant="outline" onClick={() => void load()}>
              {text("ลองอีกครั้ง", "Try again")}
            </Button>
          </div>
        ) : null}

        {summary && !summary.hasPlayerStats ? (
          <p className="fixture-match-empty">
            {text(
              "ยังไม่มีสถิติรายผู้เล่นของแมตช์นี้",
              "Player statistics for this match are not available yet.",
            )}
          </p>
        ) : null}

        {summary?.hasPlayerStats ? (
          <>
            <section className="fixture-match-section">
              <h3>{text("ผู้ทำประตู", "Goals")}</h3>
              {totalGoals === 0 ? (
                <p className="fixture-match-empty">
                  {text("ไม่มีการทำประตูในแมตช์นี้", "No goals in this match.")}
                </p>
              ) : (
                <div className="fixture-match-columns">
                  {SIDES.map((side) => (
                    <ul
                      className={`fixture-match-events is-${side}`}
                      key={side}
                      aria-label={text(
                        `ประตูของ ${clubName(side)}`,
                        `${clubName(side)} goals`,
                      )}
                    >
                      {summary.goals[side].map((entry) => (
                        <li key={`${entry.fantasyPlayerId}-${entry.ownGoal}`}>
                          <Goal size={15} aria-hidden="true" />
                          <span>
                            {localize(entry.name, language)}
                            {entry.count > 1 ? <b> ×{entry.count}</b> : null}
                            {entry.ownGoal ? (
                              <small>
                                {text(" (เข้าประตูตัวเอง)", " (own goal)")}
                              </small>
                            ) : null}
                            {entry.assists.length > 0 ? (
                              <small className="fixture-match-assist">
                                {text("แอสซิสต์", "Assist")}{" "}
                                {assistNames(entry.assists)}
                              </small>
                            ) : null}
                          </span>
                        </li>
                      ))}
                      {summary.goals[side].length === 0 ? (
                        <li className="is-empty">—</li>
                      ) : null}
                    </ul>
                  ))}
                </div>
              )}
              {summary.unattributedAssists.home.length +
                summary.unattributedAssists.away.length >
              0 ? (
                <div className="fixture-match-columns fixture-match-assists">
                  {SIDES.map((side) => (
                    <p className={`is-${side}`} key={side}>
                      {summary.unattributedAssists[side].length > 0 ? (
                        <>
                          <span>{text("แอสซิสต์", "Assists")}</span>{" "}
                          {assistNames(summary.unattributedAssists[side])}
                        </>
                      ) : null}
                    </p>
                  ))}
                </div>
              ) : null}
              {totalGoals > 0 && !summary.goalsComplete ? (
                <p className="fixture-match-note">
                  {text(
                    "รายชื่อผู้ทำประตูที่บันทึกไว้ยังไม่ครบตามสกอร์",
                    "Recorded scorers do not yet account for the full scoreline.",
                  )}
                </p>
              ) : null}
            </section>

            <section className="fixture-match-section">
              <h3>{text("ใบเหลือง / ใบแดง", "Cards")}</h3>
              {summary.cards.home.length + summary.cards.away.length === 0 ? (
                <p className="fixture-match-empty">
                  {text(
                    "ไม่มีใบเหลืองหรือใบแดงในแมตช์นี้",
                    "No cards in this match.",
                  )}
                </p>
              ) : (
                <div className="fixture-match-columns">
                  {SIDES.map((side) => (
                    <ul
                      className={`fixture-match-events is-${side}`}
                      key={side}
                      aria-label={text(
                        `ใบเหลืองและใบแดงของ ${clubName(side)}`,
                        `${clubName(side)} cards`,
                      )}
                    >
                      {summary.cards[side].map((entry) => (
                        <li key={entry.fantasyPlayerId}>
                          <span className="fixture-match-cards">
                            {Array.from({ length: entry.yellowCards }).map(
                              (_, index) => (
                                <i
                                  className="match-card is-yellow"
                                  key={`y${index}`}
                                  role="img"
                                  aria-label={text("ใบเหลือง", "Yellow card")}
                                />
                              ),
                            )}
                            {Array.from({ length: entry.redCards }).map(
                              (_, index) => (
                                <i
                                  className="match-card is-red"
                                  key={`r${index}`}
                                  role="img"
                                  aria-label={text("ใบแดง", "Red card")}
                                />
                              ),
                            )}
                          </span>
                          <span>{localize(entry.name, language)}</span>
                        </li>
                      ))}
                      {summary.cards[side].length === 0 ? (
                        <li className="is-empty">—</li>
                      ) : null}
                    </ul>
                  ))}
                </div>
              )}
            </section>

            {summary.topPerformers.length > 0 ? (
              <section className="fixture-match-section">
                <h3>
                  {text("คะแนน Fantasy สูงสุดในแมตช์", "Top Fantasy scorers")}
                </h3>
                <ol className="fixture-match-performers">
                  {summary.topPerformers.map((player) => {
                    const club = fixture[player.side];
                    return (
                      <li key={player.fantasyPlayerId}>
                        <ClubColor
                          color={club.colors[0]}
                          secondaryColor={club.colors[1]}
                          size="small"
                          label={clubName(player.side)}
                        />
                        <span className="fixture-match-performer-name">
                          {localize(player.name, language)}
                        </span>
                        {player.position ? (
                          <PositionBadge position={player.position} />
                        ) : null}
                        <strong>
                          {player.points}
                          <small>{text(" คะแนน", " pts")}</small>
                        </strong>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
