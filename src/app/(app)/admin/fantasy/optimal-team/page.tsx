import { PointsPlayerToken } from "@/components/fantasy/points-player-token";
import { getAdminOptimalTeam } from "@/data/admin-optimal-team";
import type { AdminParams } from "@/data/admin";
import { getDisplayedPlayerPoints } from "@/lib/fantasy/points-presentation";
import {
  AdminHeading,
  AdminLocalized,
  AdminUrlSelect,
  Status,
} from "../components";
import styles from "../admin.module.css";

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
          <OptimalTeamResult state={state} />
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
  return (
    <>
      <section className={styles.optimalScoreCard} aria-label="สรุปคะแนน">
        <strong>{state.score.totalPoints}</strong>
        <span>คะแนน</span>
      </section>

      <section
        className={`product-card points-pitch-card ${styles.optimalPitch}`}
      >
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
    </>
  );
}
