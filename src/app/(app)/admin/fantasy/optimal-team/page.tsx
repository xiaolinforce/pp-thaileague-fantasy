import { getAdminOptimalTeam } from "@/data/admin-optimal-team";
import type { AdminParams } from "@/data/admin";
import {
  AdminHeading,
  AdminLocalized,
  AdminUrlSelect,
  Status,
} from "../components";
import { AdminScoredSquad } from "../scored-squad";
import styles from "../admin.module.css";

export default async function OptimalTeamPage({
  searchParams,
}: {
  searchParams: Promise<AdminParams>;
}) {
  const state = await getAdminOptimalTeam(await searchParams);

  return (
    <AdminLocalized>
      <div className={styles.optimalPage}>
        <AdminHeading title="ทีมคะแนนสูงสุดที่เป็นไปได้" />
        <div className={styles.optimalToolbar}>
          <AdminUrlSelect
            name="gw"
            label="Gameweek"
            value={state.week ? String(state.week.number) : undefined}
            options={state.weeks.map((week) => ({
              value: String(week.number),
              label: `GW ${week.number}`,
            }))}
            hideLabel
          />
          {state.week ? <Status value={state.week.status} /> : null}
        </div>

        {state.state === "ready" ? (
          <AdminScoredSquad
            squad={state.squad}
            players={state.players}
            score={{
              totalPoints: state.score.totalPoints,
              autoSubstitutions: state.score.autoSubstitutions,
              countedPlayerIds: state.score.countedPlayerIds,
            }}
          />
        ) : (
          <section className={styles.panel}>
            <p className={styles.empty}>
              {state.state === "not_scored"
                ? "จะแสดงทีมที่ดีที่สุดหลัง Gameweek นี้ปิดและเริ่มคำนวณคะแนนแล้ว"
                : state.state === "missing_result"
                  ? "ยังไม่มีผลทีมที่ดีที่สุดที่บันทึกไว้สำหรับ Gameweek นี้"
                  : "ไม่พบ Gameweek สำหรับแสดงผล"}
            </p>
          </section>
        )}
      </div>
    </AdminLocalized>
  );
}
