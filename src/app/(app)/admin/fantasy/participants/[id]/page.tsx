import { notFound } from "next/navigation";
import { getAdminTeam, param, type AdminParams } from "@/data/admin";
import {
  AdminHeading,
  AdminLocalized,
  AdminName,
  AdminTabs,
  AdminUrlSelect,
  Status,
} from "../../components";
import { Empty, TeamSummary } from "../../server-components";
import { positionShort } from "../../time";
import { teamTabs } from "./tabs";
import styles from "../../admin.module.css";

const positionOrder = ["goalkeeper", "defender", "midfielder", "forward"];

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
  const starters = squad
    .filter((p) => p.role === "starter")
    .sort(
      (a, b) =>
        positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position),
    );
  const bench = squad
    .filter((p) => p.role !== "starter")
    .sort((a, b) => (a.bench ?? 0) - (b.bench ?? 0));
  const groups = [
    { label: "ตัวจริง", rows: starters },
    { label: "ตัวสำรอง", rows: bench },
  ];

  return (
    <AdminLocalized>
      <AdminHeading
        title={team.name}
        titleIsData
        back={{
          href: `/admin/fantasy/participants?gw=${week?.number ?? ""}`,
          label: "รายชื่อทีม",
        }}
      >
        <Status value={team.kind} />
        {!team.active ? <Status value="inactive" /> : null}
      </AdminHeading>
      <AdminTabs
        label="มุมมองทีม"
        items={teamTabs(team.id, week?.number, "squad")}
      />

      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <AdminUrlSelect
            name="gw"
            label="Gameweek"
            value={week ? String(week.number) : undefined}
            options={weeks.map((candidate) => ({
              value: String(candidate.number),
              label: `GW ${candidate.number}`,
            }))}
          />
        </div>
        <TeamSummary team={team} />
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
              {groups.map((group) => (
                <tbody key={group.label}>
                  <tr className={styles.groupRow}>
                    <th colSpan={4} scope="colgroup">
                      {group.label} ({group.rows.length})
                    </th>
                  </tr>
                  {group.rows.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <AdminName th={p.th} en={p.en} />
                      </td>
                      <td>{positionShort[p.position] ?? p.position}</td>
                      <td>L{p.tier}</td>
                      <td>
                        <span className={styles.roleCell}>
                          {p.role === "starter" ? null : p.bench === 0 ? (
                            "สำรองผู้รักษาประตู"
                          ) : (
                            <AdminName
                              th={`สำรองลำดับ ${p.bench}`}
                              en={`Bench ${p.bench}`}
                            />
                          )}
                          {p.captain === "captain" ? (
                            <span className={styles.roleBadge}>กัปตัน (C)</span>
                          ) : p.captain === "vice_captain" ? (
                            <span className={styles.roleBadge}>
                              รองกัปตัน (VC)
                            </span>
                          ) : p.role === "starter" ? (
                            "—"
                          ) : null}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        ) : (
          <Empty>ยังไม่มีนักเตะที่บันทึกใน Gameweek นี้</Empty>
        )}
      </section>
    </AdminLocalized>
  );
}
