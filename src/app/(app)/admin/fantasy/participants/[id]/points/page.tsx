import { notFound } from "next/navigation";

import { getAdminTeamPoints } from "@/data/admin-team-points";
import type { AdminParams } from "@/data/admin";
import {
  AdminHeading,
  AdminLocalized,
  AdminTabs,
  AdminUrlSelect,
  Status,
} from "../../../components";
import { teamTabs } from "../tabs";
import { AdminScoredSquad } from "../../../scored-squad";
import styles from "../../../admin.module.css";

export default async function TeamPointsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<AdminParams>;
}) {
  const { id } = await params;
  const state = await getAdminTeamPoints(id, await searchParams);
  if (!state) notFound();

  return (
    <AdminLocalized>
      <div className={styles.optimalPage}>
        <AdminHeading
          title={state.team.name}
          titleIsData
          back={{
            href: `/admin/fantasy/participants?gw=${state.week?.number ?? ""}`,
            label: "รายชื่อทีม",
          }}
        />
        <AdminTabs
          label="มุมมองทีม"
          items={teamTabs(state.team.id, state.week?.number, "points")}
        />
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
          <>
            {state.week.status === "planned" ||
            state.week.status === "open" ||
            state.week.status === "locked" ? (
              <p className={styles.scorePending} role="status">
                Gameweek นี้ยังไม่เริ่มคำนวณคะแนน
              </p>
            ) : null}
            <AdminScoredSquad
              squad={state.squad}
              players={state.players}
              score={state.score}
              activeChip={state.activeChip}
              scoreComplete={state.week.scoreComplete}
            />
          </>
        ) : (
          <section className={styles.panel}>
            <p className={styles.empty}>
              {state.state === "empty_squad"
                ? "ยังไม่มีนักเตะที่บันทึกใน Gameweek นี้"
                : "ไม่พบ Gameweek สำหรับแสดงผล"}
            </p>
          </section>
        )}
      </div>
    </AdminLocalized>
  );
}
