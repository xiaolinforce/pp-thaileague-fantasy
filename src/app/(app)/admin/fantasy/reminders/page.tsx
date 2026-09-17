import { LockKeyhole, MailCheck } from "lucide-react";

import { getAdminDeadlineReminderPreview } from "@/data/admin-deadline-reminders";
import { renderDeadlineReminderEmail } from "@/emails/render-deadline-reminder";
import { getDeadlineCampaignSummary } from "@/lib/email/deadline-campaign-service";
import { reminderReadiness } from "@/lib/email/deadline-delivery";
import { getReminderDeadlineLabels } from "@/lib/fantasy/deadline-presentation";

import {
  AdminHeading,
  AdminLocalized,
  AdminName,
  AdminUrlSelect,
} from "../components";
import { AdminDate, Empty } from "../server-components";
import {
  createDeadlineCampaignAction,
  markStaleDeadlineBatchAction,
  sendDeadlineBatchAction,
} from "./actions";
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
  const params = await searchParams;
  const selectedAudience = data.audienceOptions.find(
    (option) => option.id === data.audience,
  );
  const siteOrigin = getSiteOrigin();
  const deadlineLabels = data.targetWeek
    ? getReminderDeadlineLabels(data.targetWeek.deadlineAt.toISOString())
    : null;
  const rendered =
    data.targetWeek && deadlineLabels
      ? await renderDeadlineReminderEmail({
          gameweekNumber: data.targetWeek.number,
          deadlineTh: deadlineLabels.th,
          deadlineEn: deadlineLabels.en,
          brandLogoUrl: `${siteOrigin}/logo.png`,
          teamUrl: `${siteOrigin}/team`,
          unsubscribeUrl: `${siteOrigin}/email/unsubscribe?preview=1`,
        })
      : null;
  const campaign = data.targetWeek
    ? await getDeadlineCampaignSummary(data.targetWeek.id, data.audience)
    : null;
  const readiness = reminderReadiness();
  const canPrepare =
    data.targetWeek?.status === "open" &&
    data.targetWeek.deadlineAt.getTime() > new Date(data.generatedAt).getTime();
  const notice = typeof params.notice === "string" ? params.notice : "";
  const noticeText: Record<string, string> = {
    "snapshot-created": "บันทึกชุดผู้รับแล้ว ตรวจจำนวนก่อนส่ง",
    "snapshot-exists": "ชุดผู้รับนี้ถูกบันทึกไว้แล้ว",
    "snapshot-error": "สร้างชุดผู้รับไม่สำเร็จ ตรวจสถานะ Gameweek และลองใหม่",
    "send-batch-complete": "ส่งชุดย่อยเสร็จแล้ว ตรวจสถานะก่อนส่งชุดถัดไป",
    "send-rate-limited":
      "ผู้ให้บริการจำกัดอัตราส่ง รอตรวจโควตาก่อนกดส่งอีกครั้ง",
    "send-uncertain": "ผลการส่งไม่แน่ชัด หยุดส่งชุดนี้และตรวจผู้ให้บริการก่อน",
    "send-no-pending": "ไม่มีผู้รับที่รอส่งในชุดนี้",
    "send-error": "ส่งไม่สำเร็จ ตรวจสถานะและผู้ให้บริการก่อนลองอีกครั้ง",
    "stale-reviewed":
      "ย้ายรายการที่ค้างเป็นสถานะไม่แน่ชัดแล้ว ห้ามส่งซ้ำโดยไม่ตรวจผู้ให้บริการ",
    invalid: "คำขอไม่ถูกต้อง",
  };

  return (
    <AdminLocalized>
      <AdminHeading
        title="อีเมลเตือนจัดทีม"
        description="เลือกกลุ่มผู้รับ ตรวจรายชื่อและเนื้อหา แล้วส่งเองทีละชุดหลังยืนยัน"
      />

      <section className={styles.readOnlyNotice} aria-labelledby="phase-status">
        <LockKeyhole aria-hidden="true" />
        <div>
          <h2 id="phase-status">ส่งอีเมลแบบกดเอง</h2>
          <p>
            ไม่มี cron หรือการส่งอัตโนมัติ ต้องบันทึกชุดผู้รับ ตรวจ preview
            และยืนยันทีละชุดก่อนส่ง ระบบหยุดส่งเมื่อเลย Deadline
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

      {noticeText[notice] ? (
        <p className={styles.operationNotice} role="status">
          {noticeText[notice]}
        </p>
      ) : null}

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
            <dt>ยกเลิกการแจ้งเตือน</dt>
            <dd>{data.summary.unsubscribed.toLocaleString()}</dd>
          </div>
          <div>
            <dt>ถูกระงับการส่ง</dt>
            <dd>{data.summary.suppressed.toLocaleString()}</dd>
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

      <section className={adminStyles.panel} aria-labelledby="campaign-heading">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="campaign-heading">ชุดส่งอีเมล</h2>
            <p className={adminStyles.hint}>
              รายชื่อถูกตรึงไว้ตอนสร้างชุดส่ง แต่ระบบจะตรวจสิทธิ์ อีเมล
              การยกเลิก และการบันทึกทีมซ้ำก่อนส่งแต่ละฉบับ
            </p>
          </div>
        </div>
        {campaign ? (
          <>
            <p className={styles.campaignMeta}>
              <AdminName th="สร้างเมื่อ" en="Created" />{" "}
              <AdminDate value={campaign.createdAt.toISOString()} /> ·{" "}
              <AdminName th="ชุดผู้รับ" en="Recipients" />{" "}
              {Object.values(campaign.counts)
                .reduce((sum, count) => sum + count, 0)
                .toLocaleString()}{" "}
              <AdminName th="ราย" en="people" />
            </p>
            <dl className={styles.deliverySummary}>
              {[
                ["รอส่ง", "Pending", "pending"],
                ["กำลังส่ง", "Sending", "sending"],
                ["ผู้ให้บริการรับแล้ว", "Accepted by provider", "accepted"],
                [
                  "ถึงเซิร์ฟเวอร์ผู้รับ",
                  "Delivered to recipient server",
                  "delivered",
                ],
                ["ข้าม", "Skipped", "skipped"],
                ["ส่งไม่สำเร็จ", "Failed", "failed"],
                ["ผลไม่แน่ชัด", "Uncertain", "uncertain"],
                ["ตีกลับ", "Bounced", "bounced"],
                ["ร้องเรียนสแปม", "Spam complaints", "complained"],
                ["ระงับ", "Suppressed", "suppressed"],
              ].map(([label, english, status]) => (
                <div key={status}>
                  <dt>
                    <AdminName th={label} en={english} />
                  </dt>
                  <dd>{(campaign.counts[status] ?? 0).toLocaleString()}</dd>
                </div>
              ))}
            </dl>
            {!readiness.ready ? (
              <p className={styles.blockedNotice}>
                การส่งยังปิดอยู่: {readiness.missing.join(", ")}
              </p>
            ) : null}
            {canPrepare &&
            readiness.ready &&
            (campaign.counts.uncertain ?? 0) === 0 &&
            (campaign.counts.sending ?? 0) === 0 &&
            (campaign.counts.pending ?? 0) > 0 ? (
              <form
                action={sendDeadlineBatchAction}
                className={styles.sendForm}
              >
                <input type="hidden" name="campaignId" value={campaign.id} />
                <input
                  type="hidden"
                  name="gw"
                  value={data.targetWeek!.number}
                />
                <input type="hidden" name="audience" value={data.audience} />
                <label htmlFor="send-confirmation">
                  <AdminName th="พิมพ์" en="Type" /> SEND GW
                  {data.targetWeek!.number}{" "}
                  <AdminName
                    th="เพื่อยืนยันการส่งสูงสุด 5 ราย"
                    en="to confirm up to 5 recipients"
                  />
                </label>
                <input
                  id="send-confirmation"
                  name="confirmation"
                  autoComplete="off"
                  required
                />
                <label className={styles.reviewCheck}>
                  <input type="checkbox" name="checksReviewed" required />
                  <span>
                    ตรวจ DNS/โดเมนส่ง ลิงก์ยกเลิก และความคาดหวังของผู้รับแล้ว
                  </span>
                </label>
                <button type="submit" className={styles.primaryAction}>
                  ส่ง 5 รายถัดไป
                </button>
              </form>
            ) : null}
            {(campaign.counts.uncertain ?? 0) > 0 ? (
              <p className={styles.blockedNotice}>
                มีผลไม่แน่ชัด ต้องตรวจ Resend และให้ผู้ดูแลแก้ไขสถานะก่อนส่งต่อ
              </p>
            ) : null}
            {(campaign.counts.sending ?? 0) > 0 ? (
              <form
                action={markStaleDeadlineBatchAction}
                className={styles.sendForm}
              >
                <input type="hidden" name="campaignId" value={campaign.id} />
                <input
                  type="hidden"
                  name="gw"
                  value={data.targetWeek!.number}
                />
                <input type="hidden" name="audience" value={data.audience} />
                <p className={styles.blockedNotice}>
                  หากค้างเกิน 2 นาที ให้ตรวจ Resend ก่อน แล้วทำเครื่องหมายเป็น
                  “ผลไม่แน่ชัด” รายการนี้จะไม่ถูกส่งซ้ำ
                </p>
                <button type="submit" className={styles.secondaryAction}>
                  ทำเครื่องหมายรายการค้าง
                </button>
              </form>
            ) : null}
          </>
        ) : canPrepare ? (
          <form
            action={createDeadlineCampaignAction}
            className={styles.sendForm}
          >
            <input
              type="hidden"
              name="gameweekId"
              value={data.targetWeek!.id}
            />
            <input type="hidden" name="audience" value={data.audience} />
            <p>
              จะบันทึกเฉพาะผู้รับที่ตรงเงื่อนไขตอนนี้
              โดยไม่เก็บอีเมลเต็มในชุดส่ง
            </p>
            <button
              type="submit"
              className={styles.primaryAction}
              disabled={data.summary.selected === 0}
            >
              <AdminName th="สร้างชุดผู้รับ" en="Create snapshot for" />{" "}
              {data.summary.selected.toLocaleString()}{" "}
              <AdminName th="ราย" en="recipients" />
            </button>
          </form>
        ) : (
          <p className={styles.blockedNotice}>
            Gameweek นี้ยังไม่เปิดหรือเลย Deadline แล้ว จึงสร้างชุดส่งไม่ได้
          </p>
        )}
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
                แสดงข้อความที่จะใช้กับทุกคนในกลุ่ม โดยไม่เปิดเผยอีเมลเต็ม
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
