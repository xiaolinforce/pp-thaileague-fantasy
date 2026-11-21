import Link from "next/link";
import {
  getMatchOperation,
  type MatchOperationParams,
} from "@/data/match-operations";
import { MatchLifecyclePanel } from "@/components/fantasy/match-lifecycle-panel";
import {
  AdminHeading,
  AdminFilters,
  AdminName,
  NameOption,
  Status,
} from "../components";
import { AdminDate } from "../server-components";
import styles from "../admin.module.css";
import { MatchImportEditor } from "./editor";

export default async function MatchOperations({
  searchParams,
}: {
  searchParams: Promise<MatchOperationParams>;
}) {
  const { week, weeks, fixture, fixtures, editor } = await getMatchOperation(
    await searchParams,
  );
  return (
    <>
      <AdminHeading
        title="นำเข้าผลและคะแนน"
        description="บันทึกผลการแข่งขัน เหตุการณ์ และคะแนนทั้งแมตช์"
      >
        <Link
          className={styles.link}
          href={`/admin/fantasy/match-operations/report?gw=${week.number}`}
        >
          <AdminName th="รายงานประจำ Gameweek" en="Gameweek report" />
        </Link>
      </AdminHeading>
      <section className={styles.panel}>
        <AdminFilters
          key={`${week.id}:${fixture?.id}`}
          dependencies={{ gw: ["fixture"] }}
        >
          <label>
            <span>Gameweek</span>
            <select name="gw" defaultValue={week.number}>
              {weeks.map((w) => (
                <option key={w.id} value={w.number}>
                  GW {w.number}
                </option>
              ))}
            </select>
          </label>
          {fixture && (
            <label className={styles.searchField}>
              <AdminName th="การแข่งขัน" en="Fixture" />
              <select name="fixture" defaultValue={fixture.id}>
                {fixtures.map((f) => (
                  <NameOption key={f.id} value={f.id} th={f.th} en={f.en} />
                ))}
              </select>
            </label>
          )}
        </AdminFilters>
        {fixture ? (
          <div className={styles.matchMeta}>
            <Status value={fixture.status} />
            <AdminDate value={fixture.kickoff} />
            {fixture.home !== null && fixture.away !== null && (
              <strong>
                {fixture.home} – {fixture.away}
              </strong>
            )}
          </div>
        ) : (
          <p>
            <AdminName
              th="ยังไม่มีการแข่งขันใน Gameweek นี้"
              en="No fixtures in this Gameweek."
            />
          </p>
        )}
      </section>
      <MatchLifecyclePanel
        key={week.id}
        gameweekId={week.id}
        number={week.number}
        status={week.status}
      />
      {editor && fixture ? (
        <MatchImportEditor
          key={fixture.id}
          fixtureId={fixture.id}
          roster={editor.roster}
          latest={editor.latest}
        />
      ) : (
        fixture && (
          <p>
            <AdminName
              th="เปิดให้นำเข้าคะแนนเมื่อ Gameweek อยู่ในสถานะ Provisional"
              en="Match imports are available when this Gameweek is provisional."
            />
          </p>
        )
      )}
    </>
  );
}
