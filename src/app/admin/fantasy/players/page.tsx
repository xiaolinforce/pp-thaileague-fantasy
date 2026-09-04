import { AdminLocalized } from "../components";
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
              {[1, 2, 3, 4].map((n) => (
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
          <button className="secondary-button">โหลดข้อมูล</button>
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
            key={`${data.player.id}:${data.week.id}`}
            action={updateFantasyPlayerClassificationAction}
            label="บันทึกระดับและสถานะ"
            confirmation={{
              th: `ปรับระดับของ ${data.player.th} ตั้งแต่ GW ${data.week.number} และเปลี่ยนสถานะไทยปัจจุบัน รวมถึงข้อมูลทีม Draft ใน GW ที่เลือก ทีมที่ล็อกแล้วคงข้อมูลเดิม`,
              en: `Set ${data.player.en}’s tier from GW ${data.week.number}, update current Thai status and draft snapshots in the selected GW. Locked snapshots remain unchanged.`,
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
                  {[1, 2, 3, 4].map((level) => (
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
