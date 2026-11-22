import Link from "next/link";
import { getAdminStandingsEditor } from "@/data/standings";
import { AdminHeading, AdminName } from "../components";
import styles from "../admin.module.css";
import { StandingsEditor } from "./editor";

export default async function AdminStandings() {
  const data = await getAdminStandingsEditor();
  return (
    <>
      <AdminHeading
        title="ตารางคะแนนไทยลีก"
        description="แก้ไขสถิติแต่ละสโมสรและลำดับในตาราง แล้วบันทึกเพื่อเผยแพร่ในหน้าตารางคะแนน"
      >
        <Link className={styles.link} href="/standings" prefetch={false}>
          <AdminName th="ดูหน้าตารางคะแนน" en="View public table" />
        </Link>
      </AdminHeading>
      <StandingsEditor data={data} />
    </>
  );
}
