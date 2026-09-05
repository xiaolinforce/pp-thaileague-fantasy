import { AdminLocalized } from "./components";
import { AdminDate } from "./server-components";
import Link from "next/link";
import { getAdminParticipants, type AdminParams } from "@/data/admin";
import { AdminHeading, Status } from "./components";
import { WeekSelect } from "./server-components";
import styles from "./admin.module.css";

export default async function AdminOverview({
  searchParams,
}: {
  searchParams: Promise<AdminParams>;
}) {
  const { week, weeks, totals } = await getAdminParticipants(
    await searchParams,
    true,
  );
  const metrics = [
    ["ทีมทั้งหมด", totals.total, ""],
    ["ทีมสมาชิก", totals.member, "kind=member"],
    ["ทีม Guest", totals.guest, "kind=guest"],
    ["ทีม Bot", totals.bot, "kind=bot"],
    ["มีการจัดทีมใน 7 วัน", totals.recent, "state=recent"],
    ["จัดครบ 15 คน", totals.complete, "state=complete"],
    ["ยังไม่ครบ / ทีมไม่ใช้งาน", totals.incomplete, "state=incomplete"],
    ["Guest เก็บประวัติ", totals.abandoned, "kind=abandoned"],
  ] as const;
  return (
    <AdminLocalized>
      <AdminHeading
        title="ภาพรวม"
        description="ติดตามผู้เล่นและงานที่ต้องจัดการในฤดูกาล 2026/27"
      />
      <form className={styles.toolbar}>
        <WeekSelect weeks={weeks} selected={week?.number} />
        <button className="secondary-button">แสดงข้อมูล</button>
      </form>
      <div className={styles.metrics}>
        {metrics.map(([label, count, filter]) => (
          <Link
            prefetch={false}
            className={styles.metric}
            key={label}
            href={`/admin/fantasy/participants?gw=${week?.number ?? ""}&${filter}`}
          >
            <span>{label}</span>
            <strong>{count.toLocaleString()}</strong>
          </Link>
        ))}
      </div>
      <p className={styles.hint}>
        นับเป็นทีมในฤดูกาล ไม่ใช่จำนวนคนไม่ซ้ำ กิจกรรม 7
        วันนับการบันทึกหรือย้อนการจัดทีมของสมาชิกและ Guest ไม่รวม Bot
        และการยกทีมอัตโนมัติ
      </p>
      <p className={styles.hint}>
        จัดครบ 15 คนนับรวมทีมที่ยกมาจาก GW ก่อนหน้า
        ไม่ได้หมายถึงเข้ามาเล่นล่าสุดหรือผ่านการตรวจทุกกติกา
      </p>
      <div className={styles.split}>
        <section className={styles.panel}>
          <h2>งานรอดำเนินการ</h2>
          <div className={styles.list}>
            {weeks
              .filter((w) => w.status === "open" || w.status === "provisional")
              .map((w) => (
                <div className={styles.row} key={w.id}>
                  <div>
                    <strong>GW {w.number}</strong> <Status value={w.status} />
                    <p className={styles.hint}>
                      <AdminDate value={w.deadlineAt.toISOString()} />
                    </p>
                  </div>
                  <Link
                    className={styles.link}
                    href={`/admin/fantasy/gameweeks?gw=${w.number}`}
                    prefetch={false}
                  >
                    จัดการ Gameweek
                  </Link>
                </div>
              ))}
            {weeks.every(
              (w) => w.status !== "open" && w.status !== "provisional",
            ) && <p>ไม่มี Gameweek ที่รอดำเนินการ</p>}
          </div>
        </section>
        <section className={styles.panel}>
          <h2>ตรวจข้อมูลการแข่งขัน</h2>
          <p className={styles.hint}>
            เลือกคู่แข่งขันเพื่อตรวจสถิติและแก้ไขคะแนน
            หรือทบทวนประวัติการเปลี่ยนแปลง
          </p>
          <div className={styles.list}>
            <Link
              className={styles.link}
              href={`/admin/fantasy/matches?gw=${week?.number ?? ""}`}
              prefetch={false}
            >
              ผลการแข่งขันและสถิติ
            </Link>
            <Link
              className={styles.link}
              href="/admin/fantasy/audit"
              prefetch={false}
            >
              ประวัติการแก้ไข
            </Link>
          </div>
        </section>
      </div>
    </AdminLocalized>
  );
}
