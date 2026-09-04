import { AdminLocalized } from "../components";
import { AdminDate } from "../server-components";
import {
  finalizeFantasyGameweekAction,
  lockFantasyGameweekAction,
} from "@/app/fantasy-actions";
import { getAdminContext, param, type AdminParams } from "@/data/admin";
import { AdminForm, AdminHeading, Status } from "../components";
import { WeekSelect } from "../server-components";
import styles from "../admin.module.css";

export default async function Gameweeks({
  searchParams,
}: {
  searchParams: Promise<AdminParams>;
}) {
  const { weeks, current } = await getAdminContext();
  const query = await searchParams;
  const week =
    weeks.find((w) => String(w.number) === param(query, "gw")) ?? current;
  const next = weeks.find((w) => w.number === (week?.number ?? 0) + 1);
  const canLock =
    week?.status === "open" &&
    (next?.status === "planned" || week.number === weeks.at(-1)?.number);
  return (
    <AdminLocalized>
      <AdminHeading
        title="Gameweek"
        description="ตรวจสถานะและ Deadline ก่อนล็อกทีม หรือยืนยันคะแนน Final"
      />
      <form className={styles.toolbar}>
        <WeekSelect weeks={weeks} selected={week?.number} />
        <button className="secondary-button">แสดงข้อมูล</button>
      </form>
      {week && (
        <section className={styles.panel}>
          <div className={styles.row}>
            <h2>GW {week.number}</h2>
            <Status value={week.status} />
          </div>
          <dl className={styles.summary}>
            <div>
              <dt>Deadline (เวลาไทย)</dt>
              <dd>
                <AdminDate value={week.deadlineAt.toISOString()} />
              </dd>
            </div>
            <div>
              <dt>คะแนนเฉลี่ย</dt>
              <dd>
                {week.status === "planned" || week.status === "open"
                  ? "—"
                  : week.averagePoints}
              </dd>
            </div>
            <div>
              <dt>คะแนนสูงสุด</dt>
              <dd>
                {week.status === "planned" || week.status === "open"
                  ? "—"
                  : week.highestPoints}
              </dd>
            </div>
          </dl>
          {canLock ? (
            <AdminForm
              action={lockFantasyGameweekAction}
              label="ล็อกทีมและปิดรับจัดทีม"
              confirmation={{
                th: `GW ${week.number} · ล็อกทีมทั้งหมด คำนวณคะแนน และ${next ? `เปิด GW ${next.number}` : "ปิดฤดูกาล"} ผู้เล่นจะแก้ทีมใน GW นี้ไม่ได้อีก`,
                en: `Lock all squads for GW ${week.number}, recalculate scores and ${next ? `open GW ${next.number}` : "close the season"}. Managers will no longer be able to edit this Gameweek.`,
              }}
              trackChanges={false}
            >
              <input type="hidden" name="gameweekId" value={week.id} />
              <p className={styles.hint}>
                การล็อกมีผลกับทุกทีม และเปิด Gameweek ถัดไปหากยังไม่จบฤดูกาล
              </p>
            </AdminForm>
          ) : week.status === "provisional" ? (
            <AdminForm
              action={finalizeFantasyGameweekAction}
              label="ยืนยันคะแนน Final"
              confirmation={{
                th: `GW ${week.number} · คำนวณคะแนนใหม่และยืนยันเป็น Final สำหรับทุกทีม ตรวจสถิติการแข่งขันให้ครบก่อนดำเนินการ`,
                en: `Recalculate GW ${week.number} and finalize scores for all teams. Review all match statistics before continuing.`,
              }}
              trackChanges={false}
            >
              <input type="hidden" name="gameweekId" value={week.id} />
              <p className={styles.hint}>
                ตรวจสถิติและการแก้ไขทั้งหมดก่อนยืนยันคะแนน
              </p>
            </AdminForm>
          ) : (
            <p className={styles.hint}>
              {week.status === "final"
                ? "Gameweek นี้ยืนยันคะแนนแล้ว"
                : "ยังไม่มีการดำเนินการที่พร้อมสำหรับ Gameweek นี้"}
            </p>
          )}
        </section>
      )}
      <section className={styles.panel}>
        <h2>Gameweek ทั้งฤดูกาล</h2>
        <div
          className={styles.scroll}
          tabIndex={0}
          role="region"
          aria-label="Gameweek ทั้งฤดูกาล"
        >
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Gameweek</th>
                <th>สถานะ</th>
                <th>Deadline (เวลาไทย)</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => (
                <tr key={w.id}>
                  <td>
                    <a className={styles.link} href={`?gw=${w.number}`}>
                      GW {w.number}
                    </a>
                  </td>
                  <td>
                    <Status value={w.status} />
                  </td>
                  <td>
                    <AdminDate value={w.deadlineAt.toISOString()} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLocalized>
  );
}
