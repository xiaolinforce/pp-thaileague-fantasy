import { AdminLocalized } from "../components";
import { AdminDate } from "../server-components";
import Link from "next/link";
import { getAdminParticipants, type AdminParams } from "@/data/admin";
import { AdminHeading, Pagination, Status } from "../components";
import { Empty, WeekSelect } from "../server-components";
import styles from "../admin.module.css";

export default async function Participants({
  searchParams,
}: {
  searchParams: Promise<AdminParams>;
}) {
  const { week, weeks, rows, total, page, query, kind, state } =
    await getAdminParticipants(await searchParams);
  return (
    <AdminLocalized>
      <AdminHeading
        title="ผู้เล่นและทีม"
        description="ค้นหาทีมและดูการมีส่วนร่วม แยกสมาชิก Guest และ Bot"
      />
      <section className={styles.panel}>
        <form className={styles.toolbar}>
          <label>
            <span>ค้นหาชื่อทีม</span>
            <input
              data-localize="off"
              name="q"
              defaultValue={query}
              maxLength={100}
            />
          </label>
          <label>
            <span>ประเภททีม</span>
            <select name="kind" defaultValue={kind}>
              <option value="">ทุกประเภท</option>
              <option value="member">สมาชิก</option>
              <option value="guest">Guest</option>
              <option value="bot">Bot</option>
              <option value="abandoned">Guest เก็บประวัติ</option>
            </select>
          </label>
          <label>
            <span>การจัดทีม</span>
            <select name="state" defaultValue={state}>
              <option value="">ทั้งหมด</option>
              <option value="recent">มีการจัดทีมใน 7 วัน</option>
              <option value="complete">จัดครบ 15 คน</option>
              <option value="incomplete">ยังไม่ครบ / ทีมไม่ใช้งาน</option>
            </select>
          </label>
          <WeekSelect weeks={weeks} selected={week?.number} />
          <button className="secondary-button">ค้นหา</button>
          <Link
            className={styles.link}
            href="/admin/fantasy/participants"
            prefetch={false}
          >
            ล้างตัวกรอง
          </Link>
        </form>
        <p className={styles.hint}>
          กิจกรรมล่าสุดนับการบันทึกและย้อนการจัดทีม ไม่ใช่การเข้าชมเว็บ
          จำนวนทีมไม่ใช่จำนวนคนไม่ซ้ำ
        </p>
        {rows.length ? (
          <div
            className={styles.scroll}
            tabIndex={0}
            role="region"
            aria-label="รายชื่อทีม"
          >
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ชื่อทีม</th>
                  <th>ประเภททีม</th>
                  <th>นักเตะในทีม</th>
                  <th>คะแนน GW</th>
                  <th>บันทึกทีมล่าสุด</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((team) => (
                  <tr key={team.id}>
                    <td>
                      <Link
                        data-localize="off"
                        className={styles.link}
                        href={`/admin/fantasy/participants/${team.id}?gw=${week?.number}`}
                        prefetch={false}
                      >
                        {team.name}
                      </Link>
                      {!team.active && <p>ทีมไม่ใช้งาน</p>}
                    </td>
                    <td>
                      <Status value={team.kind} />
                    </td>
                    <td>{team.members} / 15</td>
                    <td>{team.points ?? "—"}</td>
                    <td>
                      <AdminDate value={team.last_save} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty />
        )}
        <Pagination
          page={page}
          total={total}
          base="/admin/fantasy/participants"
          params={{ q: query, kind, state, gw: String(week?.number ?? "") }}
        />
      </section>
    </AdminLocalized>
  );
}
