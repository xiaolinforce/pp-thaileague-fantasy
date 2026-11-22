"use client";

import { ListOrdered } from "lucide-react";
import { AppShell } from "@/components/fantasy/app-shell";
import { ClubColor } from "@/components/fantasy/club-colors";
import { useLanguage } from "@/components/fantasy/i18n";
import { localize } from "@/lib/competition-types";
import {
  RELEGATION_PLACES,
  type FormResult,
} from "@/lib/fantasy/competition-standings";
import type { LeagueTableData, LeagueTableRow } from "@/data/standings";
import styles from "./standings.module.css";

type Zone = "relegation" | null;

const formCopy: Record<
  FormResult,
  { th: string; en: string; short: { th: string; en: string } }
> = {
  W: { th: "ชนะ", en: "Won", short: { th: "ช", en: "W" } },
  D: { th: "เสมอ", en: "Drawn", short: { th: "ส", en: "D" } },
  L: { th: "แพ้", en: "Lost", short: { th: "พ", en: "L" } },
};

function zoneFor(row: LeagueTableRow, total: number): Zone {
  if (total < RELEGATION_PLACES + 2) return null;
  if (row.position > total - RELEGATION_PLACES) return "relegation";
  return null;
}

function signed(value: number) {
  return value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : "0";
}

export default function StandingsClient({ data }: { data: LeagueTableData }) {
  const { language } = useLanguage();
  const text = (th: string, en: string) => (language === "th" ? th : en);
  const total = data.rows.length;
  const zoneLabel = (zone: Zone) =>
    zone === "relegation" ? text("โซนตกชั้น", "Relegation zone") : null;

  return (
    <AppShell localizeContent={false}>
      <main
        id="main-content"
        className={`content product-content ${styles.page}`}
      >
        <header className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>
              {text("ไทยลีก 1 · ฤดูกาล 2026/27", "Thai League 1 · 2026/27")}
            </span>
            <h1>{text("ตารางคะแนน", "League table")}</h1>
          </div>
        </header>

        <section
          className={`product-card ${styles.card}`}
          aria-labelledby="standings-table-title"
        >
          <h2 id="standings-table-title" className="sr-only">
            {text("ตารางคะแนนไทยลีก 1", "Thai League 1 table")}
          </h2>
          {total === 0 ? (
            <div className="inline-empty-state large" role="status">
              <ListOrdered aria-hidden="true" />
              <strong>
                {text(
                  "ยังไม่มีตารางคะแนน",
                  "The league table is not available yet",
                )}
              </strong>
              <span>
                {text(
                  "ตารางคะแนนจะแสดงที่นี่เมื่อผู้ดูแลระบบอัปเดตข้อมูลหลังจบการแข่งขัน",
                  "The table appears here once an administrator updates it after matches are played.",
                )}
              </span>
            </div>
          ) : (
            <>
              <div
                className={styles.scroll}
                tabIndex={0}
                role="region"
                aria-label={text("ตารางคะแนน", "League table")}
              >
                <table className={styles.table}>
                  <caption className="sr-only">
                    {text(
                      "อันดับ สโมสร จำนวนนัด ผลชนะ เสมอ แพ้ ประตูได้ เสีย ผลต่างประตู คะแนน และผลงาน 5 นัดล่าสุด",
                      "Position, club, played, won, drawn, lost, goals for, against, goal difference, points and last five results",
                    )}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col" className={styles.positionCell}>
                        <abbr title={text("อันดับ", "Position")}>#</abbr>
                      </th>
                      <th scope="col" className={styles.clubCell}>
                        {text("สโมสร", "Club")}
                      </th>
                      <th scope="col">
                        <abbr title={text("จำนวนนัดที่แข่ง", "Played")}>
                          {text("แข่ง", "P")}
                        </abbr>
                      </th>
                      <th scope="col" className={styles.wdl}>
                        <abbr title={text("ชนะ", "Won")}>
                          {text("ชนะ", "W")}
                        </abbr>
                      </th>
                      <th scope="col" className={styles.wdl}>
                        <abbr title={text("เสมอ", "Drawn")}>
                          {text("เสมอ", "D")}
                        </abbr>
                      </th>
                      <th scope="col" className={styles.wdl}>
                        <abbr title={text("แพ้", "Lost")}>
                          {text("แพ้", "L")}
                        </abbr>
                      </th>
                      <th scope="col" className={styles.goals}>
                        <abbr title={text("ประตูได้", "Goals for")}>
                          {text("ได้", "GF")}
                        </abbr>
                      </th>
                      <th scope="col" className={styles.goals}>
                        <abbr title={text("ประตูเสีย", "Goals against")}>
                          {text("เสีย", "GA")}
                        </abbr>
                      </th>
                      <th scope="col">
                        <abbr title={text("ผลต่างประตู", "Goal difference")}>
                          {text("+/-", "GD")}
                        </abbr>
                      </th>
                      <th scope="col" className={styles.pointsCell}>
                        {text("คะแนน", "Pts")}
                      </th>
                      <th scope="col" className={styles.formCell}>
                        {text("5 นัดล่าสุด", "Last 5")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row) => {
                      const zone = zoneFor(row, total);
                      const name = localize(row.club.name, language);
                      const shortName = localize(row.club.shortName, language);
                      return (
                        <tr
                          key={row.entryId}
                          className={zone ? styles[`zone_${zone}`] : undefined}
                        >
                          <td className={styles.positionCell}>
                            <span className={styles.position}>
                              {row.position}
                            </span>
                            {zone && (
                              <span className="sr-only">{zoneLabel(zone)}</span>
                            )}
                          </td>
                          <th scope="row" className={styles.clubCell}>
                            <span className={styles.club} title={name}>
                              <ClubColor
                                color={row.club.colors[0]}
                                secondaryColor={row.club.colors[1]}
                                size="small"
                                className={styles.clubColor}
                                label={text(
                                  `สีประจำทีม ${name}`,
                                  `${name} team colours`,
                                )}
                              />
                              <span className={styles.clubName}>{name}</span>
                              <span className={styles.clubShortName}>
                                {shortName}
                              </span>
                            </span>
                          </th>
                          <td>{row.played}</td>
                          <td className={styles.wdl}>{row.won}</td>
                          <td className={styles.wdl}>{row.drawn}</td>
                          <td className={styles.wdl}>{row.lost}</td>
                          <td className={styles.goals}>{row.goalsFor}</td>
                          <td className={styles.goals}>{row.goalsAgainst}</td>
                          <td
                            className={
                              row.goalDifference > 0
                                ? styles.positive
                                : row.goalDifference < 0
                                  ? styles.negative
                                  : undefined
                            }
                          >
                            {signed(row.goalDifference)}
                          </td>
                          <td className={styles.pointsCell}>
                            <strong>{row.points}</strong>
                            {row.pointsAdjustment !== 0 && (
                              <sup
                                className={styles.adjustmentMark}
                                title={text(
                                  `ปรับคะแนน ${signed(row.pointsAdjustment)}`,
                                  `Points adjusted ${signed(row.pointsAdjustment)}`,
                                )}
                                aria-label={text(
                                  `ปรับคะแนน ${signed(row.pointsAdjustment)}`,
                                  `Points adjusted ${signed(row.pointsAdjustment)}`,
                                )}
                              >
                                *
                              </sup>
                            )}
                          </td>
                          <td className={styles.formCell}>
                            {row.form.length ? (
                              <ol
                                className={styles.form}
                                aria-label={text(
                                  "ผลงานล่าสุด เรียงจากเก่าไปใหม่",
                                  "Recent results, oldest to newest",
                                )}
                              >
                                {[...row.form]
                                  .reverse()
                                  .map((result, index) => (
                                    <li
                                      key={index}
                                      className={styles[`form_${result}`]}
                                      title={formCopy[result][language]}
                                    >
                                      <span aria-hidden="true">
                                        {formCopy[result].short[language]}
                                      </span>
                                      <span className="sr-only">
                                        {formCopy[result][language]}
                                      </span>
                                    </li>
                                  ))}
                              </ol>
                            ) : (
                              <span className={styles.muted}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>
    </AppShell>
  );
}
