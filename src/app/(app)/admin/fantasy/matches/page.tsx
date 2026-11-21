import Link from "next/link";
import { savePlayerMatchStatsAction } from "@/app/fantasy-actions";
import { getAdminMatchOptions, type AdminParams } from "@/data/admin";
import {
  AdminFilters,
  AdminForm,
  AdminHeading,
  AdminLocalized,
  AdminName,
  AdminNotice,
  LinkPendingHint,
  NameOption,
  Status,
} from "../components";
import { AdminDate, Empty } from "../server-components";
import { positionShort } from "../time";
import styles from "../admin.module.css";

type StatField = readonly [name: string, label: string, note?: string];

const fieldGroups: Array<{ legend: string; fields: StatField[] }> = [
  {
    legend: "การลงเล่นและเกมรุก",
    fields: [
      ["minutes", "นาที"],
      ["goals", "ประตู"],
      ["sourceAssists", "Assist จากไทยลีก"],
      ["fantasyAssists", "Fantasy Assist", "เว้นว่างเพื่อใช้ค่าจากไทยลีก"],
    ],
  },
  {
    legend: "เกมรับ",
    fields: [
      ["goalsConcededWhilePlaying", "เสียประตูขณะอยู่ในสนาม"],
      ["saves", "เซฟ", "นับคะแนนเฉพาะผู้รักษาประตู"],
      ["penaltySaves", "เซฟจุดโทษ"],
    ],
  },
  {
    legend: "วินัยและอื่นๆ",
    fields: [
      ["penaltyMisses", "ยิงจุดโทษพลาด"],
      ["yellowCards", "ใบเหลือง"],
      ["redCards", "ใบแดง"],
      ["ownGoals", "ทำเข้าประตูตัวเอง"],
    ],
  },
];

export default async function Matches({
  searchParams,
}: {
  searchParams: Promise<AdminParams>;
}) {
  const data = await getAdminMatchOptions(await searchParams);
  const fixture = data.fixture;
  const player = data.player;
  const entered = data.players.filter((p) => p.has_stats).length;
  const scoreKnown =
    fixture && fixture.home_score !== null && fixture.away_score !== null;
  const playerHref = (id: string) =>
    `/admin/fantasy/matches?${new URLSearchParams({
      gw: String(data.gw),
      fixture: fixture?.id ?? "",
      player: id,
    })}`;
  const sides = (["home", "away"] as const).map((side) => ({
    side,
    th: side === "home" ? fixture?.home_th : fixture?.away_th,
    en: side === "home" ? fixture?.home_en : fixture?.away_en,
    rows: data.players.filter((p) => p.side === side),
  }));
  const initialValues = player
    ? Object.fromEntries(
        fieldGroups
          .flatMap((group) => group.fields)
          .map(([name]) => [
            name,
            data.stats
              ? String(data.stats[name as keyof typeof data.stats] ?? "")
              : "",
          ]),
      )
    : undefined;

  return (
    <AdminLocalized>
      <AdminHeading
        title="ผลการแข่งขันและสถิติ"
        description="เลือกคู่แข่งขัน แล้วเลือกนักเตะจากรายชื่อเพื่อตรวจและแก้ไขสถิติ"
      >
        <Link
          className={styles.link}
          href={`/match-operations?gw=${data.gw}${fixture ? "&fixture=" + fixture.id : ""}`}
        >
          <AdminName th="นำเข้าทั้งแมตช์" en="Import whole match" />
          <LinkPendingHint />
        </Link>
      </AdminHeading>
      <section className={styles.panel} aria-label="เลือกการแข่งขัน">
        <AdminFilters
          key={`${fixture?.id}:${data.gw}`}
          dependencies={{ gw: ["fixture", "player"], fixture: ["player"] }}
        >
          <label className={styles.narrowField}>
            <span>Gameweek</span>
            <select name="gw" defaultValue={data.gw}>
              {data.weeks.map((w) => (
                <option value={w.number} key={w.id}>
                  GW {w.number}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.searchField}>
            <span>การแข่งขัน</span>
            <select name="fixture" defaultValue={fixture?.id}>
              {data.fixtures.map((f) => (
                <NameOption
                  value={f.id}
                  key={f.id}
                  th={`${f.home_th} พบ ${f.away_th}${f.stat_rows ? "" : " · ยังไม่มีสถิติ"}`}
                  en={`${f.home_en} vs ${f.away_en}${f.stat_rows ? "" : " · no stats yet"}`}
                />
              ))}
            </select>
          </label>
        </AdminFilters>

        {fixture ? (
          <div className={styles.matchHeader}>
            <span className={styles.matchTeam}>
              <AdminName th={fixture.home_th} en={fixture.home_en} />
            </span>
            <span className={styles.matchScore}>
              {scoreKnown
                ? `${fixture.home_score} – ${fixture.away_score}`
                : "vs"}
            </span>
            <span className={`${styles.matchTeam} ${styles.matchAway}`}>
              <AdminName th={fixture.away_th} en={fixture.away_en} />
            </span>
            <span className={styles.matchMeta}>
              <Status value={fixture.status} />
              <AdminDate value={fixture.kickoff_at} />
              <span>
                <AdminName
                  th={`บันทึกสถิติแล้ว ${entered}/${data.players.length} คน`}
                  en={`Stats saved for ${entered}/${data.players.length} players`}
                />
              </span>
            </span>
          </div>
        ) : null}
      </section>

      {fixture ? (
        <div className={styles.workbench}>
          <section className={styles.panel} aria-labelledby="roster-heading">
            <h2 id="roster-heading">นักเตะในคู่แข่งขัน</h2>
            {data.players.length ? (
              <div
                className={styles.scroll}
                tabIndex={0}
                role="region"
                aria-label="นักเตะในคู่แข่งขัน"
              >
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>นักเตะ</th>
                      <th>ตำแหน่ง</th>
                      <th className={styles.num}>นาที</th>
                      <th className={styles.num}>ประตู</th>
                      <th className={styles.num}>Assist</th>
                      <th className={styles.num}>คะแนน</th>
                    </tr>
                  </thead>
                  {sides.map((group) => (
                    <tbody key={group.side}>
                      <tr className={styles.groupRow}>
                        <th colSpan={6} scope="colgroup">
                          <AdminName th={group.th ?? ""} en={group.en ?? ""} />
                        </th>
                      </tr>
                      {group.rows.map((p) => (
                        <tr
                          key={p.id}
                          aria-current={
                            p.id === player?.id ? "true" : undefined
                          }
                        >
                          <td>
                            <Link
                              prefetch={false}
                              scroll={false}
                              className={styles.link}
                              href={playerHref(p.id)}
                            >
                              <AdminName th={p.th} en={p.en} />
                              <LinkPendingHint />
                            </Link>
                            {!p.has_stats ? (
                              <span className={styles.cellMeta}>
                                ยังไม่มีสถิติ
                              </span>
                            ) : null}
                          </td>
                          <td>{positionShort[p.position] ?? p.position}</td>
                          <td className={styles.num}>{p.minutes ?? "—"}</td>
                          <td className={styles.num}>{p.goals ?? "—"}</td>
                          <td className={styles.num}>{p.assists ?? "—"}</td>
                          <td className={styles.num}>
                            <strong>{p.points ?? "—"}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  ))}
                </table>
              </div>
            ) : (
              <Empty>ไม่พบนักเตะที่ลงทะเบียนกับสองสโมสรนี้</Empty>
            )}
          </section>

          <section
            className={`${styles.panel} ${styles.stickyPanel} ${player ? styles.editorFirst : ""}`}
            aria-labelledby="stats-editor"
          >
            {player ? (
              <>
                <div className={styles.panelHeader}>
                  <div>
                    <h2 id="stats-editor">
                      <AdminName th={player.th} en={player.en} />
                    </h2>
                    <p className={styles.hint}>
                      <AdminName th={player.club_th} en={player.club_en} /> ·{" "}
                      {positionShort[player.position] ?? player.position}
                    </p>
                  </div>
                  {data.stats ? (
                    <span className={styles.hint}>
                      แก้ไขล่าสุด <AdminDate value={data.stats.updatedAt} />
                    </span>
                  ) : null}
                </div>
                {fixture.status !== "finished" ? (
                  <AdminNotice tone="warning" title="การแข่งขันนี้ยังไม่จบ">
                    ตรวจสถานะการแข่งขันก่อนบันทึกสถิติ คะแนนจะถูกคำนวณใหม่ทันที
                  </AdminNotice>
                ) : null}
                {!data.stats ? (
                  <AdminNotice tone="info" title="ยังไม่มีสถิติที่บันทึกไว้">
                    ระบบจะสร้างรายการใหม่เมื่อบันทึก
                  </AdminNotice>
                ) : null}
                <AdminForm
                  key={`${fixture.id}:${player.id}`}
                  action={savePlayerMatchStatsAction}
                  label="บันทึกและคำนวณคะแนนใหม่"
                  initialValues={initialValues}
                  confirmation={{
                    th: `บันทึกสถิติของ ${player.th} (${fixture.home_th} พบ ${fixture.away_th}) ใน GW ${data.gw} และคำนวณคะแนนของทุกทีมใน Gameweek นี้ใหม่`,
                    en: `Save stats for ${player.en} (${fixture.home_en} vs ${fixture.away_en}) in GW ${data.gw} and recalculate every team’s score for this Gameweek.`,
                  }}
                >
                  <input type="hidden" name="fixtureId" value={fixture.id} />
                  <input
                    type="hidden"
                    name="fantasyPlayerId"
                    value={player.id}
                  />
                  {fieldGroups.map((group) => (
                    <fieldset key={group.legend} className={styles.fieldGroup}>
                      <legend>{group.legend}</legend>
                      <div className={styles.compactFields}>
                        {group.fields.map(([name, label, note]) => (
                          <label key={name}>
                            <span>{label}</span>
                            <input
                              type="number"
                              inputMode="numeric"
                              min="0"
                              name={name}
                              defaultValue={
                                data.stats?.[name as keyof typeof data.stats] ??
                                (name === "fantasyAssists" ? "" : 0)
                              }
                              required={name !== "fantasyAssists"}
                            />
                            {note ? (
                              <span className={styles.fieldNote}>{note}</span>
                            ) : null}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                  <label>
                    <span>เหตุผล/แหล่งอ้างอิง</span>
                    <textarea
                      name="reason"
                      required
                      maxLength={1000}
                      placeholder="URL เอกสารต้นทาง หรือเหตุผลการแก้ไข"
                    />
                  </label>
                </AdminForm>
              </>
            ) : (
              <>
                <h2 id="stats-editor">แก้ไขสถิติ</h2>
                <p className={styles.selectPrompt}>
                  เลือกนักเตะจากรายชื่อเพื่อตรวจและแก้ไขสถิติของแมตช์นี้
                </p>
              </>
            )}
          </section>
        </div>
      ) : (
        <section className={styles.panel}>
          <p className={styles.empty}>ยังไม่มีการแข่งขันใน Gameweek นี้</p>
        </section>
      )}
    </AdminLocalized>
  );
}
