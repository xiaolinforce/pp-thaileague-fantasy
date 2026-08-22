import { Crown, Lock, Trophy, UsersRound } from "lucide-react";

import { AppShell, PageHeader } from "@/components/fantasy/app-shell";
import { getFantasyState } from "@/data/fantasy";

export default async function LeaguesPage() {
  const fantasy = await getFantasyState();
  const privateLeague = fantasy.leagues.find(
    (league) => league.type === "private",
  );
  const overallLeague = fantasy.leagues.find(
    (league) => league.type === "overall",
  );
  const myPrivateRank = privateLeague?.standings.find(
    (standing) => standing.mine,
  )?.rank;
  const myOverallRank = overallLeague?.standings.find(
    (standing) => standing.mine,
  )?.rank;

  return (
    <AppShell>
      <main id="main-content" className="content product-content">
        <PageHeader
          eyebrow="การแข่งขัน"
          title="Classic Leagues"
          description="อันดับเรียงจากคะแนนรวม และใช้จำนวน Transfer ที่น้อยกว่าเป็นตัวตัดสิน"
        />

        <section className="league-cards" aria-labelledby="my-leagues-heading">
          <h2 id="my-leagues-heading" className="sr-only">
            ลีกของฉัน
          </h2>
          <article className="league-feature-card active">
            <span className="league-icon">
              <Crown />
            </span>
            <div>
              <span className="eyebrow">มินิลีกส่วนตัว</span>
              <h3>{privateLeague?.name ?? "—"}</h3>
              <p>
                <UsersRound size={14} /> {privateLeague?.standings.length ?? 0}{" "}
                ผู้จัดการ
              </p>
            </div>
            <strong>#{myPrivateRank ?? "—"}</strong>
          </article>
          <article className="league-feature-card">
            <span className="league-icon dark">
              <Trophy />
            </span>
            <div>
              <span className="eyebrow">ลีกทั้งหมด</span>
              <h3>{overallLeague?.name ?? "—"}</h3>
              <p>
                <UsersRound size={14} /> {overallLeague?.standings.length ?? 0}{" "}
                ผู้จัดการ
              </p>
            </div>
            <strong>#{myOverallRank ?? "—"}</strong>
          </article>
          <article className="league-feature-card invite">
            <span className="league-icon pale">
              <Lock />
            </span>
            <div>
              <span className="eyebrow">รหัสเชิญเพื่อน</span>
              <h3>{privateLeague?.inviteCode ?? "—"}</h3>
              <p>Classic scoring · ไม่มีบอลถ้วย</p>
            </div>
          </article>
        </section>

        {fantasy.leagues.length === 0 && (
          <section
            className="product-card inline-empty-state large"
            role="status"
          >
            <Trophy aria-hidden="true" />
            <strong>ยังไม่มีลีกสำหรับทีมนี้</strong>
            <span>ลีกโดยรวมและมินิลีกจะแสดงที่นี่เมื่อพร้อมใช้งาน</span>
          </section>
        )}

        {[...fantasy.leagues]
          .sort(
            (a, b) =>
              Number(a.type === "overall") - Number(b.type === "overall"),
          )
          .map((league) => (
            <section
              className="product-card league-table-card fantasy-league-section"
              key={league.id}
            >
              <div className="league-table-toolbar">
                <div>
                  <span className="eyebrow">
                    {league.type === "overall" ? "Overall" : "Private Classic"}
                  </span>
                  <h2>{league.name}</h2>
                </div>
                <span>
                  Gameweek {String(fantasy.gameweek.number).padStart(2, "0")}
                </span>
              </div>
              <div className="league-table">
                <div className="league-head">
                  <span>อันดับ</span>
                  <span>ทีม / ผู้จัดการ</span>
                  <span>GW</span>
                  <span>รวม</span>
                  <span>Transfer</span>
                </div>
                {league.standings.map((team) => (
                  <article
                    className={`league-row ${team.mine ? "mine" : ""}`}
                    key={team.teamId}
                  >
                    <strong className="rank-number">{team.rank}</strong>
                    <div>
                      <strong>
                        {team.teamName}
                        {team.mine && <i>คุณ</i>}
                      </strong>
                      <span>{team.managerName}</span>
                    </div>
                    <strong>{team.gameweekPoints}</strong>
                    <strong>{team.totalPoints}</strong>
                    <span>{team.transferCount}</span>
                  </article>
                ))}
              </div>
              <div className="table-footer">
                <span>
                  {fantasy.gameweek.scoreComplete
                    ? "คะแนน Final"
                    : "คะแนนชั่วคราว — อาจเปลี่ยนเมื่อมีแมตช์ตกค้าง"}
                </span>
                <span>Wildcard ไม่นับจำนวน Transfer</span>
              </div>
            </section>
          ))}
      </main>
    </AppShell>
  );
}
