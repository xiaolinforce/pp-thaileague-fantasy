import Link from "next/link";
import { getAdminParticipants, type AdminParams } from "@/data/admin";
import { AdminActionButton } from "../admin-action-button";
import {
  AdminFilters,
  AdminHeading,
  AdminLocalized,
  Pagination,
  Status,
} from "../components";
import { AdminDate, Empty } from "../server-components";
import styles from "../admin.module.css";

export default async function Participants({
  searchParams,
}: {
  searchParams: Promise<AdminParams>;
}) {
  const { week, weeks, rows, total, page, query, kind, state, sort } =
    await getAdminParticipants(await searchParams);
  const scored = week && week.status !== "planned" && week.status !== "open";
  const filtered = Boolean(query || kind || state || sort !== "kind");
  return (
    <AdminLocalized>
      <AdminHeading
        title="ผู้เล่นและทีม"
        description="ค้นหาทีมและดูการมีส่วนร่วม แยกสมาชิก Guest และ Bot"
      />
      <section className={styles.panel}>
        <AdminFilters key={`${query}:${kind}:${state}:${sort}:${week?.number}`}>
          <label className={styles.searchField}>
            <span>ค้นหาชื่อทีม</span>
            <input
              data-localize="off"
              type="search"
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
          <label className={styles.narrowField}>
            <span>Gameweek</span>
            <select name="gw" defaultValue={week?.number}>
              {weeks.map((w) => (
                <option key={w.number} value={w.number}>
                  GW {w.number}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>เรียงตาม</span>
            <select name="sort" defaultValue={sort}>
              <option value="kind">ประเภท (สมาชิกก่อน)</option>
              <option value="name">ชื่อทีม</option>
              <option value="points">คะแนนรวมสูงสุด</option>
              <option value="recent">บันทึกทีมล่าสุด</option>
            </select>
          </label>
          <AdminActionButton
            className="secondary-button"
            pendingLabel="กำลังค้นหา…"
          >
            ค้นหา
          </AdminActionButton>
          {filtered ? (
            <Link
              className={styles.link}
              href={`/admin/fantasy/participants?gw=${week?.number ?? ""}`}
              prefetch={false}
            >
              ล้างตัวกรอง
            </Link>
          ) : null}
        </AdminFilters>
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
                  <th className={styles.num}>นักเตะในทีม</th>
                  {scored ? (
                    <th className={styles.num}>คะแนน GW {week.number}</th>
                  ) : null}
                  <th className={styles.num}>คะแนนรวมฤดูกาล</th>
                  <th>บันทึกทีมล่าสุด</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((team) => (
                  <tr key={team.id}>
                    <td>
                      <Link
                        data-localize="off"
                        className={`${styles.link} ${styles.rowLink}`}
                        href={`/admin/fantasy/participants/${team.id}?gw=${week?.number ?? ""}`}
                        prefetch={false}
                      >
                        {team.name}
                      </Link>
                    </td>
                    <td>
                      <span className={styles.badgeRow}>
                        <Status value={team.kind} />
                        {!team.active ? <Status value="inactive" /> : null}
                      </span>
                    </td>
                    <td className={styles.num}>
                      <span
                        className={
                          team.members < 15 ? styles.incomplete : undefined
                        }
                      >
                        {team.members} / 15
                      </span>
                    </td>
                    {scored ? (
                      <td className={styles.num}>{team.points ?? "—"}</td>
                    ) : null}
                    <td className={styles.num}>{team.total_points}</td>
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
          params={{
            q: query,
            kind,
            state,
            sort: sort === "kind" ? "" : sort,
            gw: String(week?.number ?? ""),
          }}
        />
        <p className={styles.footnote}>
          กิจกรรมล่าสุดนับการบันทึกและย้อนการจัดทีม ไม่ใช่การเข้าชมเว็บ ·
          จำนวนทีมไม่ใช่จำนวนคนไม่ซ้ำ
        </p>
      </section>
    </AdminLocalized>
  );
}
