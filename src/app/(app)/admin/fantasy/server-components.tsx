import { AdminDateLabel, AdminName } from "./components";
import styles from "./admin.module.css";
import { adminFieldLabels, statusLabels } from "@/lib/admin-copy";

export function Empty({
  children = "ไม่พบข้อมูลที่ตรงกับตัวกรอง",
}: {
  children?: string;
}) {
  return <p className={styles.empty}>{children}</p>;
}
export function TeamSummary({
  team,
}: {
  team: {
    kind: string;
    members: number;
    total_points: number;
    points: number | null;
    last_save: string | null;
  };
}) {
  return (
    <dl className={styles.summary}>
      <div>
        <dt>นักเตะในทีม</dt>
        <dd>{team.members} / 15</dd>
      </div>
      <div>
        <dt>คะแนนรวมฤดูกาล</dt>
        <dd>{team.total_points}</dd>
      </div>
      <div>
        <dt>คะแนน GW</dt>
        <dd>{team.points ?? "—"}</dd>
      </div>
      <div>
        <dt>บันทึกทีมล่าสุด</dt>
        <dd>
          <AdminDate value={team.last_save} />
        </dd>
      </div>
    </dl>
  );
}
const isoTimestamp = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

function AuditValue({ field, value }: { field: string; value: string | null }) {
  if (value === null || value === "") return <span>—</span>;
  if (isoTimestamp.test(value)) {
    // Postgres snapshots may use "+00" offsets, which Date does not parse.
    const date = new Date(
      value.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00"),
    );
    if (!Number.isNaN(date.getTime()))
      return <AdminDate value={date.toISOString()} />;
  }
  if (field === "isThai" && (value === "true" || value === "false"))
    return (
      <AdminName
        th={value === "true" ? "ไทย/ลูกครึ่งไทย" : "ต่างชาติ"}
        en={value === "true" ? "Thai" : "Foreign"}
      />
    );
  if (field === "status" && statusLabels[value])
    return <span>{statusLabels[value]}</span>;
  return <AdminName th={value} en={value} />;
}

export function AuditChanges({
  changes,
}: {
  changes: Array<{ key: string; before: string | null; after: string | null }>;
}) {
  if (!changes.length)
    return (
      <p className={styles.hint}>
        รายการนี้ไม่มีรายละเอียดค่าก่อน–หลังที่แสดงได้
      </p>
    );
  return (
    <table className={styles.diffTable}>
      <thead>
        <tr>
          <th scope="col">ช่องข้อมูล</th>
          <th scope="col">ค่าเดิม</th>
          <th scope="col">ค่าใหม่</th>
        </tr>
      </thead>
      <tbody>
        {changes.map((change) => (
          <tr key={change.key}>
            <th scope="row">{adminFieldLabels[change.key] ?? change.key}</th>
            <td>
              <AuditValue field={change.key} value={change.before} />
            </td>
            <td>
              <strong>
                <AuditValue field={change.key} value={change.after} />
              </strong>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function AdminDate({ value }: { value: string | null }) {
  const format = (locale: string) =>
    value
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Bangkok",
        }).format(new Date(value))
      : "";
  return (
    <AdminDateLabel value={value} th={format("th-TH")} en={format("en-GB")} />
  );
}
