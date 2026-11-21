import type { ReactNode } from "react";
import { MailCheck, ShieldAlert } from "lucide-react";
import { AdminActionButton } from "../admin-action-button";

import { getAdminDeadlineReminderPreview } from "@/data/admin-deadline-reminders";
import { renderDeadlineReminderEmail } from "@/emails/render-deadline-reminder";
import { getDeadlineCampaignSummary } from "@/lib/email/deadline-campaign-service";
import {
  reminderReadiness,
  reminderTestReadiness,
} from "@/lib/email/deadline-delivery";
import { getReminderDeadlineLabels } from "@/lib/fantasy/deadline-presentation";

import {
  AdminHeading,
  AdminLocalized,
  AdminName,
  AdminNotice,
  AdminUrlSelect,
} from "../components";
import { AdminDate, Empty } from "../server-components";
import {
  createDeadlineCampaignAction,
  markStaleDeadlineBatchAction,
  sendAdminDeadlineTestAction,
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

const deliveryStatuses = [
  ["รอส่ง", "Pending", "pending"],
  ["กำลังส่ง", "Sending", "sending"],
  ["ผู้ให้บริการรับแล้ว", "Accepted by provider", "accepted"],
  ["ถึงเซิร์ฟเวอร์ผู้รับ", "Delivered to recipient server", "delivered"],
  ["ข้าม", "Skipped", "skipped"],
  ["ส่งไม่สำเร็จ", "Failed", "failed"],
  ["ผลไม่แน่ชัด", "Uncertain", "uncertain"],
  ["ตีกลับ", "Bounced", "bounced"],
  ["ร้องเรียนสแปม", "Spam complaints", "complained"],
  ["ระงับ", "Suppressed", "suppressed"],
] as const;
const alwaysShownStatuses = new Set(["pending", "accepted", "delivered"]);
const problemStatuses = new Set([
  "failed",
  "uncertain",
  "bounced",
  "complained",
]);

const noticeText: Record<
  string,
  { text: string; tone: "success" | "warning" | "danger" }
> = {
  "snapshot-created": {
    text: "บันทึกชุดผู้รับแล้ว ตรวจจำนวนก่อนส่ง",
    tone: "success",
  },
  "snapshot-exists": { text: "ชุดผู้รับนี้ถูกบันทึกไว้แล้ว", tone: "warning" },
  "snapshot-error": {
    text: "สร้างชุดผู้รับไม่สำเร็จ ตรวจสถานะ Gameweek และลองใหม่",
    tone: "danger",
  },
  "send-batch-complete": {
    text: "ส่งชุดย่อยเสร็จแล้ว ตรวจสถานะก่อนส่งชุดถัดไป",
    tone: "success",
  },
  "send-rate-limited": {
    text: "ผู้ให้บริการจำกัดอัตราส่ง รอตรวจโควตาก่อนกดส่งอีกครั้ง",
    tone: "warning",
  },
  "send-uncertain": {
    text: "ผลการส่งไม่แน่ชัด หยุดส่งชุดนี้และตรวจผู้ให้บริการก่อน",
    tone: "danger",
  },
  "send-no-pending": { text: "ไม่มีผู้รับที่รอส่งในชุดนี้", tone: "warning" },
  "send-error": {
    text: "ส่งไม่สำเร็จ ตรวจสถานะและผู้ให้บริการก่อนลองอีกครั้ง",
    tone: "danger",
  },
  "stale-reviewed": {
    text: "ย้ายรายการที่ค้างเป็นสถานะไม่แน่ชัดแล้ว ห้ามส่งซ้ำโดยไม่ตรวจผู้ให้บริการ",
    tone: "warning",
  },
  "test-accepted": {
    text: "Resend รับอีเมลทดสอบแล้ว ตรวจกล่องจดหมายและลิงก์ยกเลิกก่อนส่งจริง",
    tone: "success",
  },
  "test-uncertain": {
    text: "ผลทดสอบไม่แน่ชัด ตรวจ Resend ก่อนลองอีกครั้ง เพื่อป้องกันอีเมลซ้ำ",
    tone: "danger",
  },
  "test-error": {
    text: "ส่งอีเมลทดสอบไม่สำเร็จ ตรวจ Resend และการตั้งค่าก่อนส่งจริง",
    tone: "danger",
  },
  invalid: { text: "คำขอไม่ถูกต้อง", tone: "danger" },
};

function StepHeading({
  id,
  step,
  title,
  children,
}: {
  id: string;
  step: number;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className={styles.stepHeading}>
      <span className={styles.stepNumber} aria-hidden="true">
        {step}
      </span>
      <div>
        <h2 id={id}>{title}</h2>
        {children}
      </div>
    </div>
  );
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
  const testReadiness = reminderTestReadiness();
  const canPrepare =
    data.targetWeek?.status === "open" &&
    data.targetWeek.deadlineAt.getTime() > new Date(data.generatedAt).getTime();
  const notice =
    typeof params.notice === "string" ? noticeText[params.notice] : undefined;
  const breakdown = [
    ["สมาชิกที่มีทีมใช้งาน", data.summary.member_teams],
    ["อีเมลสมาชิกที่ยืนยันแล้ว", data.summary.contactable],
    ["ไม่ตรงเงื่อนไขกลุ่ม", data.summary.outside_audience],
    ["อีเมลยังไม่พร้อม", data.summary.unavailable_email],
    ["ยกเลิกการแจ้งเตือน", data.summary.unsubscribed],
    ["ถูกระงับการส่ง", data.summary.suppressed],
  ] as const;

  return (
    <AdminLocalized>
      <AdminHeading
        title="อีเมลเตือนจัดทีม"
        description="เลือกกลุ่มผู้รับ ตรวจรายชื่อและเนื้อหา แล้วส่งเองทีละชุดหลังยืนยัน"
      />

      <section
        className={`${styles.environmentBanner} ${
          data.isProduction
            ? styles.productionEnvironment
            : styles.nonProductionEnvironment
        }`}
        aria-labelledby="environment-heading"
      >
        <ShieldAlert aria-hidden="true" />
        <div>
          <h2 id="environment-heading">
            {data.isProduction
              ? "เว็บไซต์จริง · อีเมลจะถึงผู้เล่นจริง"
              : "สภาพแวดล้อมทดสอบ · ไม่ใช่เว็บไซต์จริง"}
          </h2>
          <p>
            ไม่มีการส่งอัตโนมัติ ต้องสร้างชุดผู้รับ ตรวจตัวอย่าง
            และยืนยันทีละชุดก่อนส่ง ระบบหยุดส่งเมื่อเลย Deadline
          </p>
        </div>
      </section>

      {notice ? (
        <div role="status">
          <AdminNotice tone={notice.tone} title={notice.text} />
        </div>
      ) : null}

      <section className={adminStyles.panel} aria-labelledby="audience-heading">
        <StepHeading id="audience-heading" step={1} title="กำหนดผู้รับ">
          <p className={adminStyles.hint}>
            ตรวจล่าสุด <AdminDate value={data.generatedAt} /> ·
            ตัวเลขอ่านจากฐานข้อมูลของเว็บไซต์นี้ ตรวจป้ายด้านบนก่อนส่ง
          </p>
        </StepHeading>

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
          <div className={styles.audienceSelect}>
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
        </div>

        <div className={styles.audienceResult}>
          <div className={styles.selectedCount}>
            <span>อยู่ในกลุ่มที่เลือก</span>
            <strong>{data.summary.selected.toLocaleString()}</strong>
            <AdminName th="ราย" en="recipients" />
          </div>
          <div>
            <p className={styles.audienceDescription}>
              {selectedAudience?.description}
            </p>
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
          </div>
        </div>

        <dl className={styles.audienceBreakdown}>
          {breakdown.map(([label, count]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{count.toLocaleString()}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className={styles.reviewGrid}>
        <section
          className={`${adminStyles.panel} ${styles.recipientPanel}`}
          aria-labelledby="recipient-heading"
        >
          <StepHeading
            id="recipient-heading"
            step={2}
            title="ตรวจรายชื่อผู้รับ"
          >
            <p className={adminStyles.hint}>
              <AdminName
                th={`แสดงสูงสุด 50 ทีม จาก ${data.summary.selected.toLocaleString()} ทีม · อีเมลถูกปิดบังบางส่วน`}
                en={`Showing up to 50 of ${data.summary.selected.toLocaleString()} teams · Emails are partially masked`}
              />
            </p>
          </StepHeading>

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
              <h2 id="email-preview-heading">ตัวอย่างอีเมล</h2>
              <p className={adminStyles.hint}>
                ข้อความเดียวกันนี้ใช้กับทุกคนในกลุ่ม
              </p>
            </div>
          </div>

          {rendered ? (
            <>
              <dl className={styles.previewMetadata}>
                <div>
                  <dt>หัวเรื่อง</dt>
                  <dd data-localize="off">{rendered.subject}</dd>
                </div>
                <div>
                  <dt>ข้อความในกล่องจดหมาย</dt>
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
                ลิงก์ยกเลิกในตัวอย่างใช้ไม่ได้จริง
                ระบบสร้างลิงก์แยกให้ผู้รับแต่ละคนตอนส่ง
              </p>
            </>
          ) : (
            <Empty>ยังไม่มี Gameweek สำหรับสร้างตัวอย่าง</Empty>
          )}
        </section>
      </div>

      {canPrepare && testReadiness.ready ? (
        <section className={adminStyles.panel} aria-labelledby="test-heading">
          <StepHeading
            id="test-heading"
            step={3}
            title="ทดสอบส่งถึงตัวเอง (ไม่บังคับ)"
          >
            <p className={adminStyles.hint}>
              ส่งหนึ่งฉบับไปยังอีเมลที่ยืนยันแล้วของบัญชีผู้ดูแลที่ล็อกอินอยู่
              ไม่สร้างชุดผู้รับและไม่ส่งถึงสมาชิก
            </p>
          </StepHeading>
          <form
            action={sendAdminDeadlineTestAction}
            className={styles.sendForm}
          >
            <input
              type="hidden"
              name="gameweekId"
              value={data.targetWeek!.id}
            />
            <input type="hidden" name="audience" value={data.audience} />
            <label htmlFor="test-confirmation">
              <AdminName th="พิมพ์" en="Type" />{" "}
              <code data-localize="off">TEST GW{data.targetWeek!.number}</code>{" "}
              <AdminName
                th="เพื่อส่งทดสอบหนึ่งฉบับ"
                en="to send one test email"
              />
            </label>
            <div className={styles.confirmRow}>
              <input
                id="test-confirmation"
                name="confirmation"
                autoComplete="off"
                required
              />
              <AdminActionButton
                type="submit"
                className={styles.secondaryAction}
                pendingLabel="กำลังส่ง…"
              >
                ส่งอีเมลทดสอบให้ตัวเอง
              </AdminActionButton>
            </div>
          </form>
        </section>
      ) : null}

      <section className={adminStyles.panel} aria-labelledby="campaign-heading">
        <StepHeading
          id="campaign-heading"
          step={canPrepare && testReadiness.ready ? 4 : 3}
          title="สร้างชุดผู้รับและส่ง"
        >
          <p className={adminStyles.hint}>
            <AdminName
              th="รายชื่อถูกตรึงไว้ตอนสร้างชุดส่ง แต่ระบบจะตรวจสิทธิ์ อีเมล การยกเลิก และการบันทึกทีมซ้ำก่อนส่งแต่ละฉบับ"
              en="Recipients are frozen at snapshot time. Eligibility, email, unsubscribe state, and team save are checked again before each send."
            />
          </p>
        </StepHeading>
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
              {deliveryStatuses
                .filter(
                  ([, , status]) =>
                    alwaysShownStatuses.has(status) ||
                    (campaign.counts[status] ?? 0) > 0,
                )
                .map(([label, english, status]) => (
                  <div
                    key={status}
                    className={
                      problemStatuses.has(status)
                        ? styles.problemStatus
                        : undefined
                    }
                  >
                    <dt>
                      <AdminName th={label} en={english} />
                    </dt>
                    <dd>{(campaign.counts[status] ?? 0).toLocaleString()}</dd>
                  </div>
                ))}
            </dl>
            {!readiness.ready ? (
              <AdminNotice tone="warning" title="การส่งยังปิดอยู่">
                <span data-localize="off">{readiness.missing.join(", ")}</span>
              </AdminNotice>
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
                  <AdminName th="พิมพ์" en="Type" />{" "}
                  <code data-localize="off">
                    SEND GW{data.targetWeek!.number}
                  </code>{" "}
                  <AdminName
                    th="เพื่อยืนยันการส่งสูงสุด 5 ราย"
                    en="to confirm up to 5 recipients"
                  />
                </label>
                <div className={styles.confirmRow}>
                  <input
                    id="send-confirmation"
                    name="confirmation"
                    autoComplete="off"
                    required
                  />
                  <AdminActionButton
                    type="submit"
                    className={styles.primaryAction}
                    pendingLabel="กำลังส่ง…"
                  >
                    ส่ง 5 รายถัดไป
                  </AdminActionButton>
                </div>
              </form>
            ) : null}
            {(campaign.counts.uncertain ?? 0) > 0 ? (
              <AdminNotice tone="danger" title="มีผลไม่แน่ชัด">
                ต้องตรวจ Resend และให้ผู้ดูแลแก้ไขสถานะก่อนส่งต่อ
              </AdminNotice>
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
                <AdminNotice tone="warning" title="มีรายการค้างสถานะกำลังส่ง">
                  หากค้างเกิน 2 นาที ให้ตรวจ Resend ก่อน แล้วทำเครื่องหมายเป็น
                  “ผลไม่แน่ชัด” รายการนี้จะไม่ถูกส่งซ้ำ
                </AdminNotice>
                <AdminActionButton
                  type="submit"
                  className={styles.secondaryAction}
                >
                  ทำเครื่องหมายรายการค้าง
                </AdminActionButton>
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
            <AdminActionButton
              type="submit"
              className={styles.primaryAction}
              disabled={data.summary.selected === 0}
              pendingLabel="กำลังสร้างชุดผู้รับ…"
            >
              <AdminName th="สร้างชุดผู้รับ" en="Create snapshot for" />{" "}
              {data.summary.selected.toLocaleString()}{" "}
              <AdminName th="ราย" en="recipients" />
            </AdminActionButton>
          </form>
        ) : (
          <AdminNotice
            tone="warning"
            title="Gameweek นี้ยังไม่เปิดหรือเลย Deadline แล้ว จึงสร้างชุดส่งไม่ได้"
          />
        )}
      </section>
    </AdminLocalized>
  );
}
