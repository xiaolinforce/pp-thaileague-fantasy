import { Fragment } from "react";
import { AdminDateLabel, AdminName } from "./components";
import styles from "./admin.module.css";
import { adminFieldLabels } from "@/lib/admin-copy";

export function WeekSelect({
  weeks,
  selected,
}: {
  weeks: Array<{ number: number }>;
  selected?: number;
}) {
  return (
    <label>
      <span>Gameweek</span>
      <select name="gw" defaultValue={selected}>
        {weeks.map((w) => (
          <option key={w.number} value={w.number}>
            GW {w.number}
          </option>
        ))}
      </select>
    </label>
  );
}
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
export function AuditChanges({
  before,
  after,
}: {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}) {
  const keys = Array.from(
    new Set([...Object.keys(before), ...Object.keys(after)]),
  );
  if (!keys.length)
    return (
      <p className={styles.hint}>
        รายการนี้ไม่มีรายละเอียดค่าก่อน–หลังที่แสดงได้
      </p>
    );
  return (
    <dl>
      {keys.map((key) => (
        <Fragment key={key}>
          <dt>{adminFieldLabels[key] ?? key}</dt>
          <dd>
            <AdminName
              th={String(before[key] ?? "—")}
              en={String(before[key] ?? "—")}
            />{" "}
            →{" "}
            <AdminName
              th={String(after[key] ?? "—")}
              en={String(after[key] ?? "—")}
            />
          </dd>
        </Fragment>
      ))}
    </dl>
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
