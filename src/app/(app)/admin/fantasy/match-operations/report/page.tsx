import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatchReport } from "@/data/match-report";
import { getRequestLanguage } from "@/lib/i18n/server";
import { Status } from "../../components";
import styles from "../../admin.module.css";

export default async function MatchReportPage({
  searchParams,
}: {
  searchParams: Promise<{ gw?: string }>;
}) {
  const gw = Number((await searchParams).gw);
  if (!Number.isInteger(gw) || gw < 1 || gw > 32767) notFound();
  const [fixtures, language] = await Promise.all([
    getMatchReport(gw),
    getRequestLanguage(),
  ]);
  if (!fixtures.length) notFound();
  const th = language === "th";
  const finished = fixtures.filter((f) => f.status === "finished").length;
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        className={styles.backLink}
        href={`/admin/fantasy/match-operations?gw=${gw}`}
      >
        {th ? "กลับไปจัดการผลการแข่งขัน" : "Back to match operations"}
      </Link>
      <header className={styles.heading}>
        <div>
          <h1>
            {th ? "รายงานการแข่งขัน" : "Match report"} · GW {gw}
          </h1>
          <p>
            {th
              ? `แข่งจบแล้ว ${finished} จาก ${fixtures.length} คู่`
              : `${finished} of ${fixtures.length} fixtures finished`}
          </p>
        </div>
      </header>
      {fixtures.map((fixture) => (
        <section key={fixture.id} className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>
              {th ? fixture.homeTh : fixture.homeEn} {fixture.homeScore ?? "–"}{" "}
              : {fixture.awayScore ?? "–"}{" "}
              {th ? fixture.awayTh : fixture.awayEn}
            </h2>
            <Status value={fixture.status} />
          </div>
          {fixture.uncertainties === null ? (
            <p className={styles.hint}>
              {th
                ? "ยังไม่มีรายงานจากหน้านำเข้าทั้งแมตช์"
                : "No report from the match importer yet."}
            </p>
          ) : (
            <>
              <h3>{th ? "จังหวะที่ขอให้ทบทวน" : "Decisions for review"}</h3>
              {fixture.uncertainties.length ? (
                <ul className="list-disc space-y-1 ps-6">
                  {fixture.uncertainties.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              ) : (
                <p className={styles.hint}>
                  {th
                    ? "ไม่มีจังหวะที่ระบุไว้ให้ทบทวน"
                    : "No decisions flagged for review."}
                </p>
              )}
              <details className="mt-3">
                <summary>
                  {th ? "เหตุการณ์และแหล่งข้อมูล" : "Events and sources"}
                </summary>
                <ol className="list-decimal ps-6">
                  {fixture.events?.map((event, i) => (
                    <li key={i}>{event}</li>
                  ))}
                </ol>
                <ul className="mt-3 list-disc break-words ps-6">
                  {fixture.sources
                    ?.filter((url) => /^https?:\/\//i.test(url))
                    .map((url, i) => (
                      <li key={i}>
                        <a href={url} rel="noreferrer">
                          {url}
                        </a>
                      </li>
                    ))}
                </ul>
              </details>
            </>
          )}
        </section>
      ))}
    </div>
  );
}
