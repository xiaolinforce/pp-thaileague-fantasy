import { getFantasyRules } from "@/lib/fantasy/rules";
import { AdminLocalized } from "../components";
import { AdminActionButton } from "../admin-action-button";
import { updateFantasyPlayerClassificationAction } from "@/app/fantasy-actions";
import { getAdminPlayerOptions, type AdminParams } from "@/data/admin";
import {
  AdminForm,
  AdminHeading,
  AdminName,
  AdminFilters,
  NameOption,
} from "../components";
import styles from "../admin.module.css";

export default async function Players({
  searchParams,
}: {
  searchParams: Promise<AdminParams>;
}) {
  const data = await getAdminPlayerOptions(await searchParams);
  return (
    <AdminLocalized>
      <AdminHeading
        title="ข้อมูลนักเตะ"
        description="ค้นหานักเตะและกำหนดระดับหรือสถานะไทย ตั้งแต่ Gameweek ที่เลือก"
      />
      <section className={styles.panel}>
        <AdminFilters
          key={`${data.player?.id}:${data.week?.id}:${data.query}:${data.club}:${data.position}:${data.level}`}
          dependencies={{
            club: ["player"],
            position: ["player"],
            level: ["player"],
            submit: ["player"],
          }}
        >
          <label>
            <span>ค้นหานักเตะ</span>
            <input
              data-localize="off"
              name="q"
              defaultValue={data.query}
              maxLength={100}
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
              {getFantasyRules(
                data.week?.tierRulesVersion ?? "two-tier-v1",
              ).tierSlots.map(({ level: n }) => (
                <option key={n} value={n}>
                  L{n}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>นักเตะ</span>
            <select name="player" defaultValue={data.player?.id}>
              {data.rows.map((p) => (
                <NameOption
                  key={p.id}
                  value={p.id}
                  th={`${p.th} · ${p.club_th}`}
                  en={`${p.en} · ${p.club_en}`}
                />
              ))}
            </select>
          </label>
          <label>
            <span>มีผลตั้งแต่ Gameweek</span>
            <select name="week" defaultValue={data.week?.id}>
              {data.weeks.map((w) => (
                <option key={w.id} value={w.id}>
                  GW {w.number}
                </option>
              ))}
            </select>
          </label>
          <AdminActionButton
            className="secondary-button"
            pendingLabel="กำลังโหลด…"
          >
            โหลดข้อมูล
          </AdminActionButton>
        </AdminFilters>
      </section>
      {data.player && data.week && data.state ? (
        <section className={styles.panel}>
          <h2>
            <AdminName th={data.player.th} en={data.player.en} />
          </h2>
          <p className={styles.hint}>
            <AdminName th={data.player.club_th} en={data.player.club_en} /> ·{" "}
            {data.player.position}
          </p>
          <AdminForm
            key={`${data.player.id}:${data.week.id}:${data.state.tier}:${data.state.isThai}`}
            action={updateFantasyPlayerClassificationAction}
            label="บันทึกระดับและสถานะ"
            confirmation={{
              th: `ปรับระดับของ ${data.player.th} ตั้งแต่ GW ${data.week.number} และเปลี่ยนสถานะไทยปัจจุบัน ระดับใน GW ที่วางแผนจะรอจนเปิดรอบ ระบบให้สิทธิ์ผ่อนผันแก่ทีมที่ได้รับผลกระทบเมื่อเริ่มใช้ ทีมที่ล็อกแล้วคงข้อมูลเดิม`,
              en: `Set ${data.player.en}’s tier from GW ${data.week.number} and update current Thai status. Planned tiers activate when the GW opens, granting relief to affected squads then. Locked snapshots remain unchanged.`,
            }}
          >
            {data.state.pendingTier !== null && (
              <p className={styles.hint}>
                <AdminName
                  th="บันทึกระดับที่วางแผนแล้ว รอเริ่มใช้เมื่อเปิด Gameweek นี้"
                  en="Scheduled tier saved. It takes effect when this Gameweek opens."
                />
              </p>
            )}
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
                  {getFantasyRules(
                    data.week?.tierRulesVersion ?? "two-tier-v1",
                  ).tierSlots.map(({ level }) => (
                    <option key={level} value={level}>
                      ระดับ {level}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>สถานะสัญชาติ</span>
                <select name="isThai" defaultValue={String(data.state.isThai)}>
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
        </section>
      ) : (
        <section className={styles.panel}>
          <p className={styles.empty}>ไม่พบนักเตะที่ตรงกับตัวกรอง</p>
        </section>
      )}
    </AdminLocalized>
  );
}
