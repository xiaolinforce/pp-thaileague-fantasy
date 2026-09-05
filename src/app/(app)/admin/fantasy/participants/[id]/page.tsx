import { AdminLocalized } from "../../components";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminTeam, param, type AdminParams } from "@/data/admin";
import { AdminHeading, AdminName, Status } from "../../components";
import { Empty, TeamSummary, WeekSelect } from "../../server-components";
import styles from "../../admin.module.css";

export default async function TeamDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<AdminParams>;
}) {
  const { id } = await params;
  const data = await getAdminTeam(id, param(await searchParams, "gw"));
  if (!data) notFound();
  const { team, squad, weeks, week } = data;
  return (
    <AdminLocalized>
      <AdminHeading
        title="รายละเอียดทีม"
        description="ตรวจทีมที่บันทึกไว้และคะแนนใน Gameweek ที่เลือก"
      />
      <p>
        <Link
          className={styles.link}
          href={`/admin/fantasy/participants?gw=${week?.number}`}
          prefetch={false}
        >
          กลับรายชื่อทีม
        </Link>
      </p>
      <section className={styles.panel}>
        <div className={styles.row}>
          <h2 data-localize="off">{team.name}</h2>
          <Status value={team.kind} />
        </div>
        <TeamSummary team={team} />
        <form className={styles.toolbar}>
          <WeekSelect weeks={weeks} selected={week?.number} />
          <button className="secondary-button">แสดงข้อมูล</button>
        </form>
        {squad.length ? (
          <div
            className={styles.scroll}
            tabIndex={0}
            role="region"
            aria-label="นักเตะในทีม"
          >
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>นักเตะ</th>
                  <th>ตำแหน่ง</th>
                  <th>ระดับที่บันทึก</th>
                  <th>บทบาทในทีม</th>
                </tr>
              </thead>
              <tbody>
                {squad.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <AdminName th={p.th} en={p.en} />
                    </td>
                    <td>
                      {(
                        {
                          goalkeeper: "GK",
                          defender: "DEF",
                          midfielder: "MID",
                          forward: "FWD",
                        } as Record<string, string>
                      )[p.position] ?? p.position}
                    </td>
                    <td>L{p.tier}</td>
                    <td>
                      {p.role === "starter" ? "ตัวจริง" : "ตัวสำรอง"}{" "}
                      {p.role === "bench" ? p.bench : ""}{" "}
                      {p.captain === "captain"
                        ? "(C)"
                        : p.captain === "vice_captain"
                          ? "(VC)"
                          : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>ยังไม่มีนักเตะที่บันทึกใน Gameweek นี้</Empty>
        )}
      </section>
    </AdminLocalized>
  );
}
