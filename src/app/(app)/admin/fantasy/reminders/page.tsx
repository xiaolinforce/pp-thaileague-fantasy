import { LockKeyhole, MailCheck } from "lucide-react";

import { getAdminDeadlineReminderPreview } from "@/data/admin-deadline-reminders";
import { renderDeadlineReminderEmail } from "@/emails/render-deadline-reminder";
import { getDeadlineLabels } from "@/lib/fantasy/deadline-presentation";

import { AdminHeading, AdminLocalized, AdminUrlSelect } from "../components";
import { AdminDate, Empty } from "../server-components";
import adminStyles from "../admin.module.css";
import styles from "./reminders.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getSiteOrigin() {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://fantasy.ppfootball.net",
    ).origin;
  } catch {
    return "https://fantasy.ppfootball.net";
  }
}

export default async function DeadlineRemindersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const data = await getAdminDeadlineReminderPreview(await searchParams);
  const selectedAudience = data.audienceOptions.find(
    (option) => option.id === data.audience,
  );
  const sampleTeamName = data.recipients[0]?.team_name ?? "ทีมตัวอย่าง";
  const siteOrigin = getSiteOrigin();
  const deadlineLabels = data.targetWeek
    ? getDeadlineLabels(data.targetWeek.deadlineAt.toISOString())
    : null;
  const rendered =
    data.targetWeek && deadlineLabels
      ? await renderDeadlineReminderEmail({
          teamName: sampleTeamName,
          gameweekNumber: data.targetWeek.number,
          deadlineTh: `${deadlineLabels.th} น. (เวลาไทย)`,
          deadlineEn: `${deadlineLabels.en} (Bangkok time)`,
          teamUrl: `${siteOrigin}/team`,
          unsubscribeUrl: `${siteOrigin}/email/unsubscribe?preview=1`,
        })
      : null;

  return (
    <AdminLocalized>
      <AdminHeading
        title="อีเมลเตือนจัดทีม"
        description="เลือกกลุ่มผู้รับจากข้อมูลสมาชิก แล้วตรวจรายชื่อและเนื้อหาก่อนเปิดการส่งจริง"
      />

      <section className={styles.readOnlyNotice} aria-labelledby="phase-status">
        <LockKeyhole aria-hidden="true" />
        <div>
          <h2 id="phase-status">Phase 2 · ตรวจสอบเท่านั้น</h2>
          <p>
            หน้านี้ไม่มีคำสั่งส่งอีเมลและไม่บันทึกการเปลี่ยนแปลง
            สถานะยกเลิกการแจ้งเตือนและ suppression
            ของผู้ให้บริการต้องนำมาคัดออกก่อนเปิดส่งใน Phase 3
          </p>
        </div>
        <span
          className={`${styles.environmentBadge} ${
            data.isProduction
              ? styles.productionEnvironment
              : styles.nonProductionEnvironment
          }`}
        >
          {data.isProduction
            ? "Production deployment"
            : "Non-production deployment"}
        </span>
      </section>

      <section className={adminStyles.panel} aria-labelledby="audience-heading">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="audience-heading">กำหนดผู้รับ</h2>
            <p className={adminStyles.hint}>
              ข้อมูลอัปเดตเมื่อเปิดหน้าหรือเปลี่ยนตัวเลือก · ตรวจล่าสุด{" "}
              <AdminDate value={data.generatedAt} />
            </p>
            <p className={adminStyles.hint}>
              อ่านจาก DATABASE_URL ของ deployment นี้ ให้ตรวจป้าย environment
              ก่อนใช้จำนวนผู้รับจริง
            </p>
          </div>
        </div>

        <div className={adminStyles.toolbar}>
          <AdminUrlSelect
            name="gw"
            label="Gameweek ที่จะเตือน"
            value={data.targetWeek ? String(data.targetWeek.number) : undefined}
            options={data.weeks.map((week) => ({
              value: String(week.number),
              label: `GW ${week.number}`,
            }))}
          />
          <AdminUrlSelect
            name="audience"
            label="กลุ่มผู้รับ"
            value={data.audience}
            options={data.audienceOptions.map((option) => ({
              value: option.id,
              label: option.label,
            }))}
          />
        </div>

        <p className={styles.audienceDescription}>
          {selectedAudience?.description}
        </p>
        <p className={adminStyles.hint}>
          เงื่อนไขเฉพาะที่สั่งผ่านแชทต้องสร้างเป็น recipient snapshot แยก
          และกลับมาตรวจจำนวนอีกครั้งก่อนส่ง
        </p>

        <dl className={styles.audienceSummary}>
          <div>
            <dt>สมาชิกที่มีทีมใช้งาน</dt>
            <dd>{data.summary.member_teams.toLocaleString()}</dd>
          </div>
          <div>
            <dt>อีเมลสมาชิกที่ยืนยันแล้ว</dt>
            <dd>{data.summary.contactable.toLocaleString()}</dd>
          </div>
          <div className={styles.selectedSummary}>
            <dt>อยู่ในกลุ่มที่เลือก</dt>
            <dd>{data.summary.selected.toLocaleString()}</dd>
          </div>
          <div>
            <dt>อีเมลยังไม่พร้อม</dt>
            <dd>{data.summary.unavailable_email.toLocaleString()}</dd>
          </div>
          <div>
            <dt>ไม่ตรงเงื่อนไขกลุ่ม</dt>
            <dd>{data.summary.outside_audience.toLocaleString()}</dd>
          </div>
        </dl>

        <p className={styles.scopeNote}>
          {data.previousWeek ? (
            <>
              กลุ่ม “GW ก่อนหน้า” อ้างอิง GW {data.previousWeek.number}{" "}
              และนับเฉพาะการกดบันทึกทีมครบ {data.season.squadSize} คน
              ไม่รวมการยกทีมอัตโนมัติ
            </>
          ) : (
            "Gameweek ที่เลือกยังไม่มี Gameweek ก่อนหน้า กลุ่มที่อ้างอิง GW ก่อนหน้าจึงไม่มีผู้รับ"
          )}
        </p>
      </section>

      <div className={styles.reviewGrid}>
        <section
          className={`${adminStyles.panel} ${styles.recipientPanel}`}
          aria-labelledby="recipient-heading"
        >
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="recipient-heading">
                รายชื่อที่จะเข้า recipient snapshot
              </h2>
              <p className={adminStyles.hint}>
                แสดงสูงสุด 50 ทีม อีเมลถูก mask และไม่มีอีเมลเต็มส่งมาที่
                browser
              </p>
            </div>
            <strong className={styles.resultCount}>
              {data.summary.selected.toLocaleString()} ทีม
            </strong>
          </div>

          {data.recipients.length ? (
            <div
              className={adminStyles.scroll}
              tabIndex={0}
              role="region"
              aria-label="รายชื่อผู้รับอีเมลเตือน"
            >
              <table className={adminStyles.table}>
                <thead>
                  <tr>
                    <th>ชื่อทีม</th>
                    <th>อีเมล</th>
                    <th>
                      {data.previousWeek
                        ? `GW ${data.previousWeek.number}`
                        : "GW ก่อนหน้า"}
                    </th>
                    <th>บันทึกทีมล่าสุด</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recipients.map((recipient) => (
                    <tr key={recipient.team_id}>
                      <td data-localize="off">{recipient.team_name}</td>
                      <td data-localize="off">{recipient.maskedEmail}</td>
                      <td>
                        {data.previousWeek ? (
                          <>
                            <span className={styles.squadCount}>
                              {recipient.previous_members} /{" "}
                              {data.season.squadSize}
                            </span>
                            <small className={styles.tableMeta}>
                              {recipient.previous_confirmed_at
                                ? "กดบันทึกแล้ว"
                                : "ไม่ได้กดบันทึก"}
                            </small>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <AdminDate value={recipient.last_confirmed_at} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>ไม่พบสมาชิกที่ตรงเงื่อนไขกลุ่มนี้</Empty>
          )}
        </section>

        <section
          className={`${adminStyles.panel} ${styles.previewPanel}`}
          aria-labelledby="email-preview-heading"
        >
          <div className={styles.previewTitle}>
            <span aria-hidden="true">
              <MailCheck />
            </span>
            <div>
              <h2 id="email-preview-heading">Preview เนื้อหาอีเมล</h2>
              <p className={adminStyles.hint}>
                ใช้ทีมแรกในรายชื่อเป็นตัวอย่าง โดยไม่เปิดเผยอีเมลเต็ม
              </p>
            </div>
          </div>

          {rendered ? (
            <>
              <dl className={styles.previewMetadata}>
                <div>
                  <dt>Subject</dt>
                  <dd data-localize="off">{rendered.subject}</dd>
                </div>
                <div>
                  <dt>Inbox preview</dt>
                  <dd data-localize="off">{rendered.previewText}</dd>
                </div>
                <div>
                  <dt>ทีมตัวอย่าง</dt>
                  <dd data-localize="off">{sampleTeamName}</dd>
                </div>
              </dl>
              <div className={styles.previewViewport}>
                <iframe
                  className={styles.previewFrame}
                  title="ตัวอย่างอีเมลเตือนจัดทีมสองภาษา"
                  srcDoc={rendered.html}
                  sandbox=""
                  loading="lazy"
                />
              </div>
              <p className={adminStyles.hint}>
                ลิงก์ยกเลิกใน preview เป็น placeholder
                และจะสร้างแยกสำหรับผู้รับแต่ละคนก่อนเปิดส่งจริง
              </p>
            </>
          ) : (
            <Empty>ยังไม่มี Gameweek สำหรับสร้าง preview</Empty>
          )}
        </section>
      </div>
    </AdminLocalized>
  );
}
