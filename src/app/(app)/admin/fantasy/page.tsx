import Link from "next/link";
import {
  getAdminGameweekReadiness,
  getAdminParticipants,
  type AdminParams,
} from "@/data/admin";
import {
  AdminHeading,
  AdminLocalized,
  AdminName,
  AdminNotice,
  AdminUrlSelect,
  Status,
} from "./components";
import { AdminDate } from "./server-components";
import { remainingLabel } from "./time";
import styles from "./admin.module.css";

export default async function AdminOverview({
  searchParams,
}: {
  searchParams: Promise<AdminParams>;
}) {
  const { week, weeks, totals, now } = await getAdminParticipants(
    await searchParams,
    true,
  );
  const pending = weeks.filter(
    (w) => w.status === "open" || w.status === "provisional",
  );
  const readiness = await getAdminGameweekReadiness(
    pending.filter((w) => w.status === "provisional").map((w) => w.number),
  );
  const latestFinal = weeks.filter((w) => w.status === "final").at(-1);
  const outOfOrder = pending.filter(
    (w) =>
      w.status === "provisional" &&
      latestFinal !== undefined &&
      w.number < latestFinal.number,
  );
  const base = `/admin/fantasy/participants?gw=${week?.number ?? ""}`;
  const groups = [
    {
      title: { th: "ทีมในฤดูกาล", en: "Season teams" },
      items: [
        ["ทีมทั้งหมด", totals.total, ""],
        ["ทีมสมาชิก", totals.member, "kind=member"],
        ["ทีม Guest", totals.guest, "kind=guest"],
        ["ทีม Bot", totals.bot, "kind=bot"],
        ["Guest เก็บประวัติ", totals.abandoned, "kind=abandoned"],
      ],
    },
    {
      title: {
        th: `การจัดทีม GW ${week?.number ?? "—"}`,
        en: `Squads in GW ${week?.number ?? "—"}`,
      },
      items: [
        ["มีการจัดทีมใน 7 วัน", totals.recent, "state=recent"],
        ["จัดครบ 15 คน", totals.complete, "state=complete"],
        ["ยังไม่ครบ / ทีมไม่ใช้งาน", totals.incomplete, "state=incomplete"],
      ],
    },
  ] as const;

  return (
    <AdminLocalized>
      <AdminHeading
        title="ภาพรวม"
        description="งานที่ต้องจัดการและภาพรวมผู้เล่นในฤดูกาล 2026/27"
      />

      <section className={styles.section} aria-labelledby="tasks-heading">
        <h2 id="tasks-heading" className={styles.sectionTitle}>
          งานรอดำเนินการ
        </h2>
        {outOfOrder.map((w) => (
          <AdminNotice
            key={w.id}
            tone="danger"
            title={
              <AdminName
                th={`GW ${w.number} ยังรอตรวจคะแนน แต่ GW ${latestFinal!.number} ยืนยัน Final แล้ว`}
                en={`GW ${w.number} is still provisional while GW ${latestFinal!.number} is already final`}
              />
            }
          >
            ตรวจสถิติของ Gameweek ที่ค้างและยืนยันคะแนน Final ให้เรียงตามลำดับ
          </AdminNotice>
        ))}
        {pending.length ? (
          <div className={styles.taskList}>
            {pending.map((w) => {
              const remaining = remainingLabel(w.deadlineAt, now);
              const ready = readiness.get(w.number);
              const tone =
                w.status === "provisional" || remaining.passed
                  ? "warning"
                  : remaining.urgent
                    ? "urgent"
                    : "normal";
              return (
                <article
                  key={w.id}
                  className={`${styles.task} ${styles[`task_${tone}`]}`}
                >
                  <div className={styles.taskMain}>
                    <div className={styles.taskTitle}>
                      <strong>GW {w.number}</strong>
                      <Status value={w.status} />
                    </div>
                    {w.status === "open" ? (
                      <>
                        <p>
                          <AdminName
                            th={
                              remaining.passed
                                ? "เลย Deadline แล้ว แต่ยังไม่ได้ล็อกทีม"
                                : "เปิดรับจัดทีม รอถึง Deadline แล้วจึงล็อกทีม"
                            }
                            en={
                              remaining.passed
                                ? "The deadline has passed but squads are not locked yet"
                                : "Open for team changes; lock squads after the deadline"
                            }
                          />
                        </p>
                        <p className={styles.taskMeta}>
                          Deadline{" "}
                          <AdminDate value={w.deadlineAt.toISOString()} /> ·{" "}
                          <strong>
                            <AdminName th={remaining.th} en={remaining.en} />
                          </strong>
                        </p>
                      </>
                    ) : (
                      <>
                        <p>รอตรวจสถิติให้ครบแล้วยืนยันคะแนน Final</p>
                        {ready ? (
                          <p className={styles.taskMeta}>
                            <AdminName
                              th={`แมตช์จบแล้ว ${ready.finished}/${ready.fixtures} · ไม่มีสถิติ ${ready.finishedWithoutStats} แมตช์`}
                              en={`${ready.finished}/${ready.fixtures} matches finished · ${ready.finishedWithoutStats} without stats`}
                            />
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>
                  <div className={styles.taskActions}>
                    {w.status === "open" ? (
                      <>
                        {!remaining.passed ? (
                          <Link
                            prefetch={false}
                            className="secondary-button"
                            href={`/admin/fantasy/reminders?gw=${w.number}`}
                          >
                            ส่งอีเมลเตือน
                          </Link>
                        ) : null}
                        <Link
                          prefetch={false}
                          className={
                            remaining.passed
                              ? "primary-button"
                              : "secondary-button"
                          }
                          href={`/admin/fantasy/gameweeks?gw=${w.number}`}
                        >
                          ไปหน้าล็อกทีม
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          prefetch={false}
                          className="secondary-button"
                          href={`/admin/fantasy/matches?gw=${w.number}`}
                        >
                          ตรวจสถิติ
                        </Link>
                        <Link
                          prefetch={false}
                          className="primary-button"
                          href={`/admin/fantasy/gameweeks?gw=${w.number}`}
                        >
                          ไปหน้ายืนยัน Final
                        </Link>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <AdminNotice tone="success" title="ไม่มี Gameweek ที่รอดำเนินการ" />
        )}
      </section>

      <section className={styles.section} aria-labelledby="teams-heading">
        <div className={styles.sectionHeader}>
          <h2 id="teams-heading" className={styles.sectionTitle}>
            ผู้เล่นและทีม
          </h2>
          <AdminUrlSelect
            name="gw"
            label="Gameweek"
            hideLabel
            value={week ? String(week.number) : undefined}
            options={weeks.map((candidate) => ({
              value: String(candidate.number),
              label: `GW ${candidate.number}`,
            }))}
          />
        </div>
        <div className={styles.metricGroups}>
          {groups.map((group) => (
            <div key={group.title.en} className={styles.metricGroup}>
              <h3>
                <AdminName th={group.title.th} en={group.title.en} />
              </h3>
              <div className={styles.metrics}>
                {group.items.map(([label, count, filter]) => (
                  <Link
                    prefetch={false}
                    className={styles.metric}
                    key={label}
                    href={filter ? `${base}&${filter}` : base}
                  >
                    <span>{label}</span>
                    <strong>{count.toLocaleString()}</strong>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className={styles.footnote}>
          นับเป็นทีม ไม่ใช่จำนวนคนไม่ซ้ำ · กิจกรรม 7
          วันนับการบันทึกหรือย้อนการจัดทีมของสมาชิกและ Guest ไม่รวม Bot · จัดครบ
          15 คนรวมทีมที่ยกมาจาก GW ก่อนหน้า
        </p>
      </section>
    </AdminLocalized>
  );
}
