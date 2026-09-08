import { Zap } from "lucide-react";

import { PointsPlayerToken } from "@/components/fantasy/points-player-token";
import { getAdminOptimalTeam } from "@/data/admin-optimal-team";
import type { AdminParams } from "@/data/admin";
import { getDisplayedPlayerPoints } from "@/lib/fantasy/points-presentation";
import { AdminHeading, AdminLocalized, Status } from "../components";
import styles from "../admin.module.css";
import { WeekSelect } from "../server-components";

const positionRows = [
  "goalkeeper",
  "defender",
  "midfielder",
  "forward",
] as const;

export default async function OptimalTeamPage({
  searchParams,
}: {
  searchParams: Promise<AdminParams>;
}) {
  const state = await getAdminOptimalTeam(await searchParams);

  return (
    <AdminLocalized>
      <AdminHeading
        title="ทีมคะแนนสูงสุดที่เป็นไปได้"
        description="ดูการจัดทีมที่ถูกกติกาและทำคะแนนได้สูงสุดจากผลจริงของแต่ละ Gameweek"
      />
      <form className={styles.toolbar}>
        <WeekSelect weeks={state.weeks} selected={state.week?.number} />
        <button className="secondary-button">แสดงข้อมูล</button>
      </form>

      {state.week ? (
        <div className={styles.optimalWeekHeading}>
          <strong>GW {state.week.number}</strong>
          <Status value={state.week.status} />
        </div>
      ) : null}

      {state.state === "ready" ? (
        <OptimalTeamResult state={state} />
      ) : (
        <section className={styles.panel}>
          <p className={styles.empty}>
            {state.state === "not_scored"
              ? "จะแสดงทีมที่ดีที่สุดหลัง Gameweek นี้ปิดและเริ่มคำนวณคะแนนแล้ว"
              : state.state === "missing_pool"
                ? "ไม่พบ snapshot รายชื่อนักเตะของ Gameweek นี้ จึงยังคำนวณทีมย้อนหลังไม่ได้"
                : state.state === "missing_scores"
                  ? "ยังไม่มีผลคะแนนนักเตะสำหรับ Gameweek นี้"
                  : state.state === "no_legal_team"
                    ? "ไม่สามารถจัดทีมครบตามกติกาจากรายชื่อนักเตะของ Gameweek นี้"
                    : "ไม่พบ Gameweek สำหรับคำนวณ"}
          </p>
        </section>
      )}
    </AdminLocalized>
  );
}

function OptimalTeamResult({
  state,
}: {
  state: Extract<
    Awaited<ReturnType<typeof getAdminOptimalTeam>>,
    { state: "ready" }
  >;
}) {
  const resultByPlayer = new Map(
    state.players.map((player) => [player.fantasyPlayerId, player]),
  );
  const autoSubIn = new Set(
    state.score.autoSubstitutions.map((item) => item.in),
  );
  const autoSubOut = new Set(
    state.score.autoSubstitutions.map((item) => item.out),
  );
  const fieldMembers = state.squad.filter(
    (member) =>
      (member.lineupRole === "starter" &&
        !autoSubOut.has(member.fantasyPlayerId)) ||
      autoSubIn.has(member.fantasyPlayerId),
  );
  const benchMembers = state.squad
    .filter(
      (member) =>
        (member.lineupRole === "bench" &&
          !autoSubIn.has(member.fantasyPlayerId)) ||
        autoSubOut.has(member.fantasyPlayerId),
    )
    .sort((left, right) => (left.benchOrder ?? 99) - (right.benchOrder ?? 99));
  const countedIds = new Set(state.score.countedPlayerIds);
  const scoringCaptain = state.squad.find(
    (member) =>
      countedIds.has(member.fantasyPlayerId) &&
      (member.captainRole === "captain" ||
        (member.captainRole === "vice_captain" &&
          (resultByPlayer.get(
            state.squad.find((candidate) => candidate.captainRole === "captain")
              ?.fantasyPlayerId ?? "",
          )?.minutes ?? 0) === 0)),
  );
  const contribution = (fantasyPlayerId: string) =>
    getDisplayedPlayerPoints({
      rawPoints: resultByPlayer.get(fantasyPlayerId)?.totalPoints ?? 0,
      counted: countedIds.has(fantasyPlayerId),
      isScoringCaptain: scoringCaptain?.fantasyPlayerId === fantasyPlayerId,
      captainMultiplier: 2,
    });
  const gap = state.score.totalPoints - state.actualHighest;

  return (
    <>
      <section className={styles.optimalScoreStrip} aria-label="สรุปคะแนน">
        <div className={styles.optimalPrimaryScore}>
          <span>คะแนนสูงสุดที่เป็นไปได้</span>
          <strong>{state.score.totalPoints}</strong>
          <small>คะแนน</small>
        </div>
        <dl className={styles.optimalComparisons}>
          <div>
            <dt>คะแนนสูงสุดของทีมจริง</dt>
            <dd>{state.actualHighest}</dd>
          </div>
          <div>
            <dt>ส่วนต่าง</dt>
            <dd>{gap > 0 ? `+${gap}` : gap}</dd>
          </div>
        </dl>
      </section>

      <section
        className={`product-card points-pitch-card ${styles.optimalPitch}`}
      >
        <div className="points-chip-banner">
          <span className="points-chip-banner__icon" aria-hidden="true">
            <Zap size={15} fill="currentColor" />
          </span>
          <span className="points-chip-banner__label">
            ทีมสมมติ · ไม่ใช้ Chip · ไม่คิดคะแนนหัก Transfer
          </span>
        </div>
        <div className="points-pitch">
          <div className="field-lines" aria-hidden="true">
            <span />
            <i />
            <b />
          </div>
          <div className="points-pitch-rows">
            {positionRows.map((position) => (
              <div className="points-pitch-row" key={position}>
                {fieldMembers
                  .filter((member) => member.position === position)
                  .map((member) => (
                    <PointsPlayerToken
                      key={member.fantasyPlayerId}
                      member={member}
                      points={contribution(member.fantasyPlayerId)}
                      counted
                      substitution={
                        autoSubIn.has(member.fantasyPlayerId) ? "in" : undefined
                      }
                      result={resultByPlayer.get(member.fantasyPlayerId)}
                      multiplier={
                        scoringCaptain?.fantasyPlayerId ===
                        member.fantasyPlayerId
                          ? 2
                          : 1
                      }
                    />
                  ))}
              </div>
            ))}
          </div>
        </div>
        <div className="points-bench-panel">
          <div className="bench-title">
            <h3>ม้านั่งสำรอง</h3>
          </div>
          <div className="points-bench-grid">
            {benchMembers.map((member, index) => (
              <div className="points-bench-item" key={member.fantasyPlayerId}>
                <b>{index === 0 ? "GK" : index}</b>
                <PointsPlayerToken
                  member={member}
                  points={contribution(member.fantasyPlayerId)}
                  counted={countedIds.has(member.fantasyPlayerId)}
                  substitution={
                    autoSubOut.has(member.fantasyPlayerId) ? "out" : undefined
                  }
                  showPositionBadge
                  result={resultByPlayer.get(member.fantasyPlayerId)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
      <p className={styles.optimalProvenance}>
        คำนวณใหม่จากคะแนนปัจจุบัน · รายชื่อนักเตะ {state.poolSize} คน ·
        แหล่งข้อมูล {state.poolSource}
      </p>
    </>
  );
}
