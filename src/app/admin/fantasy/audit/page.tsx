import { AdminLocalized } from "../components";
import { AdminDate } from "../server-components";
import { getAdminAudit, type AdminParams } from "@/data/admin";
import { AdminHeading, AdminName, Pagination } from "../components";
import { AuditChanges, Empty } from "../server-components";
import styles from "../admin.module.css";

const actions: Record<string, string> = {
  apply_manual_tier_changes: "ปรับระดับนักเตะตามรายการ",
  apply_player_sheet_edits: "นำเข้าการแก้ไขจากเอกสารนักเตะ",
  publish_player_ranking: "เผยแพร่ชุดจัดอันดับนักเตะ",
  import_match_stats: "บันทึกสถิติใหม่",
  correct_match_stats: "แก้ไขสถิติ",
  update_player_classification: "ปรับระดับและสถานะ",
  lock_gameweek: "ล็อก Gameweek",
  finalize_gameweek: "ยืนยันคะแนน Final",
  create_bot_team: "สร้างทีม Bot",
};
export default async function Audit({
  searchParams,
}: {
  searchParams: Promise<AdminParams>;
}) {
  const { rows, total, page, action } = await getAdminAudit(await searchParams);
  return (
    <AdminLocalized>
      <AdminHeading
        title="ประวัติการแก้ไข"
        description="ตรวจรายการที่บันทึกไว้ ผู้ดำเนินการ เหตุผล และค่าก่อน–หลัง"
      />
      <section className={styles.panel}>
        <form className={styles.toolbar}>
          <label>
            <span>การดำเนินการ</span>
            <select name="action" defaultValue={action}>
              <option value="">ทั้งหมด</option>
              {Object.entries(actions).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button className="secondary-button">แสดงข้อมูล</button>
        </form>
        <p className={styles.hint}>
          แสดงเฉพาะประวัติที่ระบบบันทึกไว้ การล็อกและ Final
          ก่อนเริ่มเก็บประวัติจะไม่ปรากฏ
        </p>
        {rows.length ? (
          rows.map((row) => (
            <details key={row.id} className={styles.detail}>
              <summary>
                <span>{actions[row.action] ?? row.action}</span> ·{" "}
                <AdminName th={row.name.th} en={row.name.en} /> ·{" "}
                <AdminDate value={row.createdAt.toISOString()} />
                <p className={styles.hint} data-localize="off">
                  {row.reason || "—"}
                </p>
              </summary>
              <dl>
                <dt>ผู้ดำเนินการ</dt>
                <dd data-localize="off">{row.changedBy}</dd>
                <dt>รายการที่แก้ไข</dt>
                <dd data-localize="off">
                  {row.entityType} · {row.entityId ?? "—"}
                </dd>
              </dl>
              <AuditChanges before={row.before} after={row.after} />
            </details>
          ))
        ) : (
          <Empty>ยังไม่มีประวัติในตัวกรองนี้</Empty>
        )}
        <Pagination
          page={page}
          total={total}
          base="/admin/fantasy/audit"
          params={{ action }}
        />
      </section>
    </AdminLocalized>
  );
}
