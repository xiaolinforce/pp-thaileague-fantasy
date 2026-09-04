import { AdminLocalized } from "../components";
import { savePlayerMatchStatsAction } from "@/app/fantasy-actions";
import { getAdminMatchOptions, type AdminParams } from "@/data/admin";
import {
  AdminForm,
  AdminHeading,
  AdminName,
  AdminFilters,
  NameOption,
  Status,
} from "../components";
import styles from "../admin.module.css";

const fields = [
  ["minutes", "นาที"],
  ["goals", "ประตู"],
  ["sourceAssists", "Assist จากไทยลีก"],
  ["fantasyAssists", "Fantasy Assist (เว้นว่างเพื่อใช้ต้นทาง)"],
  ["goalsConcededWhilePlaying", "เสียประตูขณะอยู่ในสนาม"],
  ["saves", "เซฟ"],
  ["penaltySaves", "เซฟจุดโทษ"],
  ["penaltyMisses", "ยิงจุดโทษพลาด"],
  ["yellowCards", "ใบเหลือง"],
  ["redCards", "ใบแดง"],
  ["ownGoals", "ทำเข้าประตูตัวเอง"],
] as const;

export default async function Matches({
  searchParams,
}: {
  searchParams: Promise<AdminParams>;
}) {
  const data = await getAdminMatchOptions(await searchParams);
  return (
    <AdminLocalized>
      <AdminHeading
        title="ผลการแข่งขันและสถิติ"
        description="เลือก Gameweek คู่แข่งขัน และนักเตะ แล้วตรวจค่าปัจจุบันก่อนบันทึกและคำนวณคะแนนใหม่"
      />
      <section className={styles.panel}>
        <AdminFilters
          key={`${data.fixture?.id}:${data.player?.id}:${data.gw}`}
          dependencies={{ gw: ["fixture", "player"], fixture: ["player"] }}
        >
          <label>
            <span>Gameweek</span>
            <select name="gw" defaultValue={data.gw}>
              {data.weeks.map((w) => (
                <option value={w.number} key={w.id}>
                  GW {w.number}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>การแข่งขัน</span>
            <select name="fixture" defaultValue={data.fixture?.id}>
              {data.fixtures.map((f) => (
                <NameOption
                  value={f.id}
                  key={f.id}
                  th={`${f.home_th} พบ ${f.away_th}`}
                  en={`${f.home_en} vs ${f.away_en}`}
                />
              ))}
            </select>
          </label>
          <label>
            <span>นักเตะในคู่แข่งขัน</span>
            <select name="player" defaultValue={data.player?.id}>
              {data.players.map((p) => (
                <NameOption
                  value={p.id}
                  key={p.id}
                  th={`${p.th} · ${p.club_th}`}
                  en={`${p.en} · ${p.club_en}`}
                />
              ))}
            </select>
          </label>
          <button className="secondary-button">โหลดสถิติ</button>
        </AdminFilters>
      </section>
      {data.fixture && data.player ? (
        <section className={styles.panel}>
          <div className={styles.row}>
            <h2>
              <AdminName th={data.player.th} en={data.player.en} />
            </h2>
            <Status value={data.fixture.status} />
          </div>
          <p className={styles.hint}>
            <AdminName
              th={`${data.fixture.home_th} พบ ${data.fixture.away_th}`}
              en={`${data.fixture.home_en} vs ${data.fixture.away_en}`}
            />
          </p>
          <AdminForm
            key={`${data.fixture.id}:${data.player.id}`}
            action={savePlayerMatchStatsAction}
            label="บันทึกและคำนวณคะแนนใหม่"
            confirmation={{
              th: `บันทึกสถิติของ ${data.player.th} (${data.fixture.home_th} พบ ${data.fixture.away_th}) ใน GW ${data.gw} และคำนวณคะแนนของทุกทีมใน Gameweek นี้ใหม่`,
              en: `Save stats for ${data.player.en} (${data.fixture.home_en} vs ${data.fixture.away_en}) in GW ${data.gw} and recalculate every team’s score for this Gameweek.`,
            }}
          >
            <input type="hidden" name="fixtureId" value={data.fixture.id} />
            <input
              type="hidden"
              name="fantasyPlayerId"
              value={data.player.id}
            />
            {!data.stats && (
              <p className={styles.feedback}>
                ยังไม่มีสถิติที่บันทึกไว้ ระบบจะสร้างรายการใหม่
              </p>
            )}
            <div className={styles.fields}>
              {fields.map(([name, label]) => (
                <label key={name}>
                  <span>{label}</span>
                  <input
                    type="number"
                    min="0"
                    name={name}
                    defaultValue={
                      data.stats?.[name] ?? (name === "fantasyAssists" ? "" : 0)
                    }
                    required={name !== "fantasyAssists"}
                  />
                </label>
              ))}
            </div>
            <label>
              <span>เหตุผล/แหล่งอ้างอิง</span>
              <textarea
                name="reason"
                required
                maxLength={1000}
                placeholder="URL เอกสารต้นทาง หรือเหตุผลการแก้ไข"
              />
            </label>
          </AdminForm>
        </section>
      ) : (
        <section className={styles.panel}>
          <p className={styles.empty}>
            ยังไม่มีการแข่งขันหรือนักเตะใน Gameweek นี้
          </p>
        </section>
      )}
    </AdminLocalized>
  );
}
