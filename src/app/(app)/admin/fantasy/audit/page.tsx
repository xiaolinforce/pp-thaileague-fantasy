import { getAdminAudit, type AdminParams } from "@/data/admin";
import {
  AdminHeading,
  AdminLocalized,
  AdminName,
  AdminUrlSelect,
  Pagination,
} from "../components";
import { AdminDate, AuditChanges, Empty } from "../server-components";
import styles from "../admin.module.css";

const actions: Record<string, string> = {
  apply_manual_tier_changes: "ปรับระดับนักเตะตามรายการ",
  apply_player_sheet_edits: "นำเข้าการแก้ไขจากเอกสารนักเตะ",
  publish_player_ranking: "เผยแพร่ชุดจัดอันดับนักเตะ",
  import_match_stats: "บันทึกสถิติใหม่",
  correct_match_stats: "แก้ไขสถิติ",
  update_player_classification: "ปรับระดับและสถานะ",
  lock_gameweek: "ล็อก Gameweek",
  adopt_two_tier_rules: "เริ่มใช้กติกานักเตะสองระดับ",
  refresh_deadline_player_tier: "ปรับระดับตามกติกาก่อนล็อกทีม",
  backfill_gameweek_player_pool: "สร้าง snapshot รายชื่อนักเตะย้อนหลัง",
  finalize_gameweek: "ยืนยันคะแนน Final",
  create_bot_team: "สร้างทีม Bot",
  correct_fixture_schedule: "แก้ไขเวลาแข่งขัน",
  verify_fixture_schedule_correction: "ตรวจการแก้ไขเวลาแข่งขัน",
  reschedule_fixture: "เลื่อนเวลาแข่งขัน",
  complete_fixture_reschedule: "ปรับตารางแข่งขันเสร็จสิ้น",
  reschedule_gameweek_deadline: "ปรับ Deadline ของ Gameweek",
  finish_fixture: "บันทึกจบการแข่งขัน",
  update_fixture_result: "แก้ไขผลการแข่งขัน",
  import_match_batch: "นำเข้าสถิติทั้ง Gameweek",
  complete_match_import: "นำเข้าสถิติแมตช์เสร็จสิ้น",
  correct_player_thai_name: "แก้ไขชื่อภาษาไทยของนักเตะ",
  activate_fantasy_player: "เปิดให้เลือกนักเตะ",
  apply_qa_scenario: "ใช้สถานการณ์ทดสอบ (QA)",
  simulate_dev_transfer_deduction: "จำลองการหักคะแนน Transfer (ทดสอบ)",
  reconcile_migration_checksum: "ปรับข้อมูลตรวจสอบ migration",
  create_competition_standings: "สร้างตารางคะแนนไทยลีก",
  update_competition_standings: "แก้ไขตารางคะแนนไทยลีก",
};

const entityLabels: Record<string, string> = {
  fixture: "การแข่งขัน",
  player: "นักเตะ",
  fantasy_player: "นักเตะ",
  fantasy_player_match_stats: "สถิตินักเตะ",
  fantasy_gameweek: "Gameweek",
  fantasy_team: "ทีม",
  fantasy_season: "ฤดูกาล Fantasy",
  fantasy_team_selection: "การจัดทีม",
  migration_metadata: "ระบบภายใน",
  competition_standings: "ตารางคะแนนไทยลีก",
};

type AuditRow = Awaited<ReturnType<typeof getAdminAudit>>["rows"][number];

/** Consecutive entries from one operation share an action, actor and reason. */
function groupRows(rows: AuditRow[]) {
  const groups: AuditRow[][] = [];
  for (const row of rows) {
    const last = groups.at(-1)?.[0];
    if (
      last &&
      last.action === row.action &&
      last.changedBy === row.changedBy &&
      (last.reason ?? "") === (row.reason ?? "")
    )
      groups.at(-1)!.push(row);
    else groups.push([row]);
  }
  return groups;
}

function EntryDetail({ row }: { row: AuditRow }) {
  return (
    <>
      <dl className={styles.auditMeta}>
        <dt>รายการที่แก้ไข</dt>
        <dd>
          {entityLabels[row.entityType] ?? row.entityType}
          {row.name ? (
            <>
              {" · "}
              <AdminName th={row.name.th} en={row.name.en} />
            </>
          ) : null}
          {row.entityId ? (
            <span className={styles.cellMeta} data-localize="off">
              {row.entityId}
            </span>
          ) : null}
        </dd>
        <dt>ผู้ดำเนินการ</dt>
        <dd data-localize="off">{row.changedBy}</dd>
      </dl>
      <AuditChanges changes={row.changes} />
    </>
  );
}

export default async function Audit({
  searchParams,
}: {
  searchParams: Promise<AdminParams>;
}) {
  const data = await getAdminAudit(await searchParams);
  const groups = groupRows(data.rows);

  return (
    <AdminLocalized>
      <AdminHeading
        title="ประวัติการแก้ไข"
        description="ตรวจรายการที่บันทึกไว้ ผู้ดำเนินการ เหตุผล และค่าก่อน–หลัง"
      />
      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <AdminUrlSelect
            name="action"
            label="การดำเนินการ"
            value={data.action}
            options={[
              { value: "", label: "ทั้งหมด" },
              ...data.actions.map((value) => ({
                value,
                label: actions[value] ?? value,
              })),
            ]}
            reset={["page"]}
          />
        </div>
        <p className={styles.footnote}>
          แสดงเฉพาะประวัติที่ระบบบันทึกไว้ การล็อกและ Final
          ก่อนเริ่มเก็บประวัติจะไม่ปรากฏ ·
          รายการต่อเนื่องจากการทำงานชุดเดียวกันจะรวมเป็นกลุ่ม
        </p>
        {groups.length ? (
          <ol className={styles.auditList}>
            {groups.map((group) => {
              const first = group[0];
              const label = actions[first.action] ?? first.action;
              return (
                <li key={first.id}>
                  <details className={styles.detail}>
                    <summary>
                      <span className={styles.auditSummary}>
                        <strong>{label}</strong>
                        <span className={styles.auditSubject}>
                          {group.length > 1 ? (
                            <AdminName
                              th={`${group.length} รายการ`}
                              en={`${group.length} entries`}
                            />
                          ) : first.name ? (
                            <AdminName th={first.name.th} en={first.name.en} />
                          ) : (
                            (entityLabels[first.entityType] ?? first.entityType)
                          )}
                        </span>
                        <span className={styles.auditDate}>
                          <AdminDate value={first.createdAt.toISOString()} />
                        </span>
                      </span>
                      <span className={styles.auditReason} data-localize="off">
                        {first.reason || "—"}
                      </span>
                    </summary>
                    {group.length > 1 ? (
                      <ol className={styles.auditGroup}>
                        {group.map((row) => (
                          <li key={row.id}>
                            <EntryDetail row={row} />
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <EntryDetail row={first} />
                    )}
                  </details>
                </li>
              );
            })}
          </ol>
        ) : (
          <Empty>ยังไม่มีประวัติในตัวกรองนี้</Empty>
        )}
        <Pagination
          page={data.page}
          total={data.total}
          base="/admin/fantasy/audit"
          params={{ action: data.action }}
        />
      </section>
    </AdminLocalized>
  );
}
