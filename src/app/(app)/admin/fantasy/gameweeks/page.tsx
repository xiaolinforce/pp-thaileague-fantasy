import Link from "next/link";
import {
  finalizeFantasyGameweekAction,
  lockFantasyGameweekAction,
} from "@/app/fantasy-actions";
import {
  getAdminContext,
  getAdminGameweekReadiness,
  param,
  type AdminParams,
} from "@/data/admin";
import {
  AdminForm,
  AdminHeading,
  AdminLocalized,
  AdminName,
  AdminNotice,
  AdminUrlSelect,
  Status,
} from "../components";
import { AdminDate } from "../server-components";
import { remainingLabel } from "../time";
import styles from "../admin.module.css";

const lifecycle = [
  { status: "planned", th: "ยังไม่เปิด", en: "Planned" },
  { status: "open", th: "เปิดรับจัดทีม", en: "Open" },
  { status: "provisional", th: "รอตรวจคะแนน", en: "Provisional" },
  { status: "final", th: "คะแนน Final", en: "Final" },
] as const;

export default async function Gameweeks({
  searchParams,
}: {
  searchParams: Promise<AdminParams>;
}) {
  const { weeks, current, now } = await getAdminContext();
  const query = await searchParams;
  const week =
    weeks.find((w) => String(w.number) === param(query, "gw")) ?? current;
  const next = weeks.find((w) => w.number === (week?.number ?? 0) + 1);
  const isLast = week?.number === weeks.at(-1)?.number;
  const canLock =
    week?.status === "open" && (next?.status === "planned" || isLast);
  const readiness = week
    ? (await getAdminGameweekReadiness([week.number])).get(week.number)
    : undefined;
  const latestFinal = weeks.filter((w) => w.status === "final").at(-1);
  const remaining = week ? remainingLabel(week.deadlineAt, now) : null;
  const stepIndex = lifecycle.findIndex(
    (step) =>
      step.status ===
      (week?.status === "locked" ? "provisional" : week?.status),
  );
  const scored = week && week.status !== "planned" && week.status !== "open";

  return (
    <AdminLocalized>
      <AdminHeading
        title="Gameweek"
        description="ตรวจสถานะและ Deadline ก่อนล็อกทีม หรือยืนยันคะแนน Final"
      >
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
      </AdminHeading>

      {week && (
        <section className={styles.panel} aria-labelledby="week-heading">
          <div className={styles.panelHeader}>
            <h2 id="week-heading">GW {week.number}</h2>
            <Status value={week.status} />
          </div>

          <ol className={styles.stepper} aria-label="ขั้นตอนของ Gameweek">
            {lifecycle.map((step, index) => (
              <li
                key={step.status}
                className={
                  index < stepIndex
                    ? styles.stepDone
                    : index === stepIndex
                      ? styles.stepCurrent
                      : undefined
                }
                aria-current={index === stepIndex ? "step" : undefined}
              >
                <span aria-hidden="true">{index + 1}</span>
                <AdminName th={step.th} en={step.en} />
              </li>
            ))}
          </ol>

          <dl className={styles.summary}>
            <div>
              <dt>Deadline (เวลาไทย)</dt>
              <dd>
                <AdminDate value={week.deadlineAt.toISOString()} />
                {week.status === "open" && remaining ? (
                  <span
                    className={`${styles.cellMeta} ${remaining.urgent || remaining.passed ? styles.urgentText : ""}`}
                  >
                    <AdminName th={remaining.th} en={remaining.en} />
                  </span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt>คะแนนเฉลี่ย</dt>
              <dd>{scored ? week.averagePoints : "—"}</dd>
            </div>
            <div>
              <dt>คะแนนสูงสุด</dt>
              <dd>{scored ? week.highestPoints : "—"}</dd>
            </div>
            {readiness ? (
              <div>
                <dt>แมตช์ที่จบแล้ว</dt>
                <dd>
                  {readiness.finished} / {readiness.fixtures}
                </dd>
              </div>
            ) : null}
            {readiness && scored ? (
              <div>
                <dt>แมตช์ที่มีสถิติ</dt>
                <dd>
                  {readiness.withStats} / {readiness.fixtures}
                </dd>
              </div>
            ) : null}
          </dl>

          {week.status === "provisional" &&
          latestFinal &&
          latestFinal.number > week.number ? (
            <AdminNotice
              tone="danger"
              title={
                <AdminName
                  th={`GW ${latestFinal.number} ยืนยัน Final แล้ว แต่ GW นี้ยังรอตรวจคะแนน`}
                  en={`GW ${latestFinal.number} is final while this Gameweek is still provisional`}
                />
              }
            >
              ตรวจสถิติที่ค้างของ Gameweek นี้ แล้วยืนยันคะแนน Final
            </AdminNotice>
          ) : null}

          {canLock ? (
            <div className={styles.actionZone}>
              {remaining && !remaining.passed ? (
                <AdminNotice
                  tone="warning"
                  title={
                    <AdminName
                      th={`ยังไม่ถึง Deadline (${remaining.th})`}
                      en={`The deadline has not passed (${remaining.en})`}
                    />
                  }
                >
                  ถ้าล็อกตอนนี้ ผู้เล่นจะแก้ทีมไม่ได้ทันที แม้ยังไม่ถึง Deadline
                </AdminNotice>
              ) : null}
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
                  <AdminName
                    th={`การล็อกมีผลกับทุกทีม ${next ? `และเปิด GW ${next.number} ต่อทันที` : "และปิดฤดูกาล"}`}
                    en={`Locking affects every team ${next ? `and opens GW ${next.number} immediately` : "and closes the season"}`}
                  />
                </p>
              </AdminForm>
            </div>
          ) : week.status === "provisional" ? (
            <div className={styles.actionZone}>
              {readiness && readiness.finished < readiness.fixtures ? (
                <AdminNotice
                  tone="warning"
                  title={
                    <AdminName
                      th={`ยังมี ${readiness.fixtures - readiness.finished} แมตช์ที่ยังไม่จบ`}
                      en={`${readiness.fixtures - readiness.finished} matches have not finished`}
                    />
                  }
                >
                  ยืนยันคะแนน Final ได้เมื่อทุกแมตช์แข่งจบและบันทึกสถิติครบแล้ว
                </AdminNotice>
              ) : null}
              {readiness && readiness.finishedWithoutStats > 0 ? (
                <AdminNotice
                  tone="warning"
                  title={
                    <AdminName
                      th={`มี ${readiness.finishedWithoutStats} แมตช์ที่จบแล้วแต่ยังไม่มีสถิติ`}
                      en={`${readiness.finishedWithoutStats} finished matches have no stats`}
                    />
                  }
                >
                  <Link
                    prefetch={false}
                    className={styles.link}
                    href={`/admin/fantasy/matches?gw=${week.number}`}
                  >
                    ไปตรวจสถิติการแข่งขัน
                  </Link>
                </AdminNotice>
              ) : null}
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
              </AdminForm>
            </div>
          ) : (
            <p className={styles.hint}>
              <AdminName
                th={
                  week.status === "final"
                    ? "Gameweek นี้ยืนยันคะแนนแล้ว ไม่มีงานที่ต้องทำ"
                    : week.status === "planned"
                      ? "Gameweek นี้จะเปิดเองเมื่อ Gameweek ก่อนหน้าถูกล็อก"
                      : week.status === "open"
                        ? `ล็อกไม่ได้เพราะ GW ${next?.number ?? ""} ไม่ได้อยู่ในสถานะยังไม่เปิด`
                        : "ยังไม่มีการดำเนินการที่พร้อมสำหรับ Gameweek นี้"
                }
                en={
                  week.status === "final"
                    ? "This Gameweek is final. Nothing else is required."
                    : week.status === "planned"
                      ? "This Gameweek opens automatically when the previous one is locked."
                      : week.status === "open"
                        ? `Locking is unavailable because GW ${next?.number ?? ""} is not planned.`
                        : "No action is available for this Gameweek yet."
                }
              />
            </p>
          )}
        </section>
      )}

      <section className={styles.panel} aria-labelledby="season-heading">
        <h2 id="season-heading">Gameweek ทั้งฤดูกาล</h2>
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
                <th className={styles.num}>คะแนนเฉลี่ย</th>
                <th className={styles.num}>คะแนนสูงสุด</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => {
                const hasScore = w.status !== "planned" && w.status !== "open";
                return (
                  <tr
                    key={w.id}
                    aria-current={w.id === week?.id ? "true" : undefined}
                  >
                    <td>
                      <Link
                        prefetch={false}
                        className={styles.link}
                        href={`/admin/fantasy/gameweeks?gw=${w.number}`}
                      >
                        GW {w.number}
                      </Link>
                    </td>
                    <td>
                      <Status value={w.status} />
                    </td>
                    <td>
                      <AdminDate value={w.deadlineAt.toISOString()} />
                    </td>
                    <td className={styles.num}>
                      {hasScore ? w.averagePoints : "—"}
                    </td>
                    <td className={styles.num}>
                      {hasScore ? w.highestPoints : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLocalized>
  );
}
