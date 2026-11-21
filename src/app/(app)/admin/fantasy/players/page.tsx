import Link from "next/link";
import { getFantasyRules } from "@/lib/fantasy/rules";
import { updateFantasyPlayerClassificationAction } from "@/app/fantasy-actions";
import { getAdminPlayerOptions, type AdminParams } from "@/data/admin";
import { AdminActionButton } from "../admin-action-button";
import {
  AdminFilters,
  AdminForm,
  AdminHeading,
  AdminLocalized,
  AdminName,
  AdminUrlSelect,
  LinkPendingHint,
  NameOption,
  Pagination,
} from "../components";
import { Empty } from "../server-components";
import { positionShort } from "../time";
import styles from "../admin.module.css";

export default async function Players({
  searchParams,
}: {
  searchParams: Promise<AdminParams>;
}) {
  const data = await getAdminPlayerOptions(await searchParams);
  const tierSlots = getFantasyRules(
    data.week?.tierRulesVersion ?? "two-tier-v1",
  ).tierSlots;
  const listParams = {
    q: data.query,
    club: data.club,
    position: data.position,
    level: data.level,
    week: data.week?.id ?? "",
  };
  const rowHref = (id: string) => {
    const query = new URLSearchParams(
      Object.entries({
        ...listParams,
        page: data.page > 1 ? String(data.page) : "",
        player: id,
      }).filter(([, value]) => value !== ""),
    );
    return `/admin/fantasy/players?${query}`;
  };

  return (
    <AdminLocalized>
      <AdminHeading
        title="ข้อมูลนักเตะ"
        description="ค้นหานักเตะ แล้วเลือกจากตารางเพื่อกำหนดระดับหรือสถานะไทย"
      />
      <section className={styles.panel} aria-label="ตัวกรองนักเตะ">
        <AdminFilters
          key={`${data.query}:${data.club}:${data.position}:${data.level}`}
          dependencies={{
            club: ["player"],
            position: ["player"],
            level: ["player"],
            submit: ["player"],
          }}
        >
          <input type="hidden" name="week" value={data.week?.id ?? ""} />
          <label className={styles.searchField}>
            <span>ค้นหานักเตะ</span>
            <input
              data-localize="off"
              type="search"
              name="q"
              defaultValue={data.query}
              maxLength={100}
              placeholder="ชื่อไทยหรืออังกฤษ"
            />
          </label>
          <label>
            <span>สโมสร</span>
            <select name="club" defaultValue={data.club}>
              <option value="">ทุกสโมสร</option>
              {data.clubs.map((c) => (
                <NameOption value={c.id} key={c.id} th={c.th} en={c.en} />
              ))}
            </select>
          </label>
          <label>
            <span>ตำแหน่ง</span>
            <select name="position" defaultValue={data.position}>
              <option value="">ทุกตำแหน่ง</option>
              <option value="goalkeeper">GK</option>
              <option value="defender">DEF</option>
              <option value="midfielder">MID</option>
              <option value="forward">FWD</option>
            </select>
          </label>
          <label>
            <span>ระดับ</span>
            <select name="level" defaultValue={data.level}>
              <option value="">ทุกระดับ</option>
              {tierSlots.map(({ level: n }) => (
                <option key={n} value={n}>
                  L{n}
                </option>
              ))}
            </select>
          </label>
          <AdminActionButton
            className="secondary-button"
            pendingLabel="กำลังค้นหา…"
          >
            ค้นหา
          </AdminActionButton>
        </AdminFilters>
      </section>

      <div className={styles.workbench}>
        <section className={styles.panel} aria-labelledby="player-list">
          <div className={styles.panelHeader}>
            <h2 id="player-list">รายชื่อนักเตะ</h2>
            <p className={styles.hint}>
              <AdminName
                th={`ระดับที่แสดงคือระดับใน GW ${data.week?.number ?? "—"}`}
                en={`Levels shown are for GW ${data.week?.number ?? "—"}`}
              />
            </p>
          </div>
          {data.rows.length ? (
            <div
              className={styles.scroll}
              tabIndex={0}
              role="region"
              aria-label="รายชื่อนักเตะ"
            >
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>นักเตะ</th>
                    <th>ตำแหน่ง</th>
                    <th>ระดับ</th>
                    <th>สัญชาติ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((p) => (
                    <tr
                      key={p.id}
                      aria-current={
                        p.id === data.player?.id ? "true" : undefined
                      }
                    >
                      <td>
                        <Link
                          prefetch={false}
                          scroll={false}
                          className={styles.link}
                          href={rowHref(p.id)}
                        >
                          <AdminName th={p.th} en={p.en} />
                          <LinkPendingHint />
                        </Link>
                        <span className={styles.cellMeta}>
                          <AdminName th={p.club_th} en={p.club_en} />
                        </span>
                      </td>
                      <td>{positionShort[p.position] ?? p.position}</td>
                      <td>L{p.level}</td>
                      <td>{p.is_thai ? "ไทย" : "ต่างชาติ"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>ไม่พบนักเตะที่ตรงกับตัวกรอง</Empty>
          )}
          <Pagination
            page={data.page}
            total={data.total}
            pageSize={data.pageSize}
            base="/admin/fantasy/players"
            params={listParams}
          />
        </section>

        <section
          className={`${styles.panel} ${styles.stickyPanel} ${data.player ? styles.editorFirst : ""}`}
          aria-labelledby="player-editor"
        >
          {data.player && data.week && data.state ? (
            <>
              <div className={styles.panelHeader}>
                <div>
                  <h2 id="player-editor">
                    <AdminName th={data.player.th} en={data.player.en} />
                  </h2>
                  <p className={styles.hint}>
                    <AdminName
                      th={data.player.club_th}
                      en={data.player.club_en}
                    />{" "}
                    ·{" "}
                    {positionShort[data.player.position] ??
                      data.player.position}
                  </p>
                </div>
              </div>
              <div className={styles.toolbar}>
                <AdminUrlSelect
                  name="week"
                  label="มีผลตั้งแต่ Gameweek"
                  value={data.week.id}
                  options={data.weeks.map((w) => ({
                    value: w.id,
                    label: `GW ${w.number}`,
                  }))}
                />
              </div>
              {data.state.pendingTier !== null ? (
                <p className={styles.hint}>
                  <AdminName
                    th="บันทึกระดับที่วางแผนแล้ว รอเริ่มใช้เมื่อเปิด Gameweek นี้"
                    en="Scheduled tier saved. It takes effect when this Gameweek opens."
                  />
                </p>
              ) : null}
              <AdminForm
                key={`${data.player.id}:${data.week.id}:${data.state.tier}:${data.state.isThai}`}
                action={updateFantasyPlayerClassificationAction}
                label="บันทึกระดับและสถานะ"
                initialValues={{
                  level: String(data.state.tier),
                  isThai: String(data.state.isThai),
                }}
                valueLabels={{
                  level: Object.fromEntries(
                    tierSlots.map(({ level }) => [
                      String(level),
                      `ระดับ ${level}`,
                    ]),
                  ),
                  isThai: { true: "ไทย/ลูกครึ่งไทย", false: "ต่างชาติ" },
                }}
                confirmation={{
                  th: `ปรับระดับของ ${data.player.th} ตั้งแต่ GW ${data.week.number} และเปลี่ยนสถานะไทยปัจจุบัน ระดับใน GW ที่วางแผนจะรอจนเปิดรอบ ระบบให้สิทธิ์ผ่อนผันแก่ทีมที่ได้รับผลกระทบเมื่อเริ่มใช้ ทีมที่ล็อกแล้วคงข้อมูลเดิม`,
                  en: `Set ${data.player.en}’s tier from GW ${data.week.number} and update current Thai status. Planned tiers activate when the GW opens, granting relief to affected squads then. Locked snapshots remain unchanged.`,
                }}
              >
                <input
                  type="hidden"
                  name="fantasyPlayerId"
                  value={data.player.id}
                />
                <input
                  type="hidden"
                  name="effectiveGameweekId"
                  value={data.week.id}
                />
                <div className={styles.fields}>
                  <label>
                    <span>ระดับ</span>
                    <select name="level" defaultValue={data.state.tier}>
                      {tierSlots.map(({ level }) => (
                        <option key={level} value={level}>
                          ระดับ {level}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>สถานะสัญชาติ</span>
                    <select
                      name="isThai"
                      defaultValue={String(data.state.isThai)}
                    >
                      <option value="true">ไทย/ลูกครึ่งไทย</option>
                      <option value="false">ต่างชาติ</option>
                    </select>
                  </label>
                </div>
                <label>
                  <span>เหตุผล</span>
                  <textarea
                    name="reason"
                    required
                    maxLength={1000}
                    placeholder="เหตุผลและแหล่งอ้างอิงสำหรับการเปลี่ยนแปลง"
                  />
                </label>
              </AdminForm>
            </>
          ) : (
            <>
              <h2 id="player-editor">แก้ไขระดับและสถานะ</h2>
              <p className={styles.selectPrompt}>
                เลือกนักเตะจากตารางเพื่อดูและแก้ไขระดับหรือสถานะไทย
              </p>
            </>
          )}
        </section>
      </div>
    </AdminLocalized>
  );
}
