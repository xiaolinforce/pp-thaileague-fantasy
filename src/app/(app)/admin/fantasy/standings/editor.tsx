"use client";

import {
  ArrowDown,
  ArrowUp,
  Calculator,
  ListRestart,
  Undo2,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ClubColor } from "@/components/fantasy/club-colors";
import { useLanguage } from "@/components/fantasy/i18n";
import { useNavigationBlocker } from "@/components/fantasy/navigation-blocker";
import type { AdminStandingsEditorData } from "@/data/standings";
import {
  compareStandings,
  deriveStanding,
  STANDING_LIMITS,
  type StandingCounts,
  type StandingEntryInput,
} from "@/lib/fantasy/competition-standings";
import { AdminActionButton } from "../admin-action-button";
import { AdminNotice } from "../components";
import adminStyles from "../admin.module.css";
import styles from "./editor.module.css";
import { saveStandingsAction } from "./actions";

const fields = [
  "won",
  "drawn",
  "lost",
  "goalsFor",
  "goalsAgainst",
  "pointsAdjustment",
] as const satisfies ReadonlyArray<keyof StandingCounts>;
type Field = (typeof fields)[number];
type DraftRow = { entryId: string } & Record<Field, string>;
type Draft = { throughMatchweek: string; rows: DraftRow[] };

const fieldCopy: Record<
  Field,
  { th: string; en: string; full: { th: string; en: string } }
> = {
  won: { th: "ชนะ", en: "W", full: { th: "ชนะ", en: "Won" } },
  drawn: { th: "เสมอ", en: "D", full: { th: "เสมอ", en: "Drawn" } },
  lost: { th: "แพ้", en: "L", full: { th: "แพ้", en: "Lost" } },
  goalsFor: { th: "ได้", en: "GF", full: { th: "ประตูได้", en: "Goals for" } },
  goalsAgainst: {
    th: "เสีย",
    en: "GA",
    full: { th: "ประตูเสีย", en: "Goals against" },
  },
  pointsAdjustment: {
    th: "ปรับ",
    en: "Adj.",
    full: {
      th: "คะแนนปรับ (หักใส่ค่าติดลบ)",
      en: "Point adjustment (negative for deductions)",
    },
  },
};

const limits: Record<Field, [number, number]> = {
  won: [0, STANDING_LIMITS.matches],
  drawn: [0, STANDING_LIMITS.matches],
  lost: [0, STANDING_LIMITS.matches],
  goalsFor: [0, STANDING_LIMITS.goals],
  goalsAgainst: [0, STANDING_LIMITS.goals],
  pointsAdjustment: [-STANDING_LIMITS.adjustment, STANDING_LIMITS.adjustment],
};

function toDraft(
  rows: StandingEntryInput[],
  throughMatchweek: number | null,
): Draft {
  return {
    throughMatchweek: throughMatchweek === null ? "" : String(throughMatchweek),
    rows: rows.map((row) => ({
      entryId: row.entryId,
      won: String(row.won),
      drawn: String(row.drawn),
      lost: String(row.lost),
      goalsFor: String(row.goalsFor),
      goalsAgainst: String(row.goalsAgainst),
      pointsAdjustment: String(row.pointsAdjustment),
    })),
  };
}

function parseField(field: Field, value: string) {
  const trimmed = value.trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  const number = Number(trimmed);
  const [min, max] = limits[field];
  return number >= min && number <= max ? number : null;
}

function counts(row: DraftRow): StandingCounts {
  return Object.fromEntries(
    fields.map((field) => [field, parseField(field, row[field]) ?? 0]),
  ) as StandingCounts;
}

function signed(value: number) {
  return value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : "0";
}

export function StandingsEditor({ data }: { data: AdminStandingsEditorData }) {
  const { language } = useLanguage();
  const label = (th: string, en: string) => (language === "th" ? th : en);
  const clubs = useMemo(
    () => new Map(data.clubs.map((club) => [club.entryId, club])),
    [data.clubs],
  );
  const [baseline, setBaseline] = useState(() =>
    toDraft(data.rows, data.throughMatchweek),
  );
  const [draft, setDraft] = useState(baseline);
  const [version, setVersion] = useState(data.updatedAt);
  const [lastSaved, setLastSaved] = useState({
    at: data.updatedAt,
    by: data.updatedBy,
  });
  const [reason, setReason] = useState("");
  const [problem, setProblem] = useState<{ th: string; en: string } | null>(
    null,
  );
  const [success, setSuccess] = useState<"saved" | "unchanged" | null>(null);
  const [notice, setNotice] = useState<{ th: string; en: string } | null>(null);
  const [pending, start] = useTransition();
  const { setNavigationBlocked } = useNavigationBlocker();

  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  useEffect(() => {
    setNavigationBlocked(dirty || pending);
    return () => setNavigationBlocked(false);
  }, [dirty, pending, setNavigationBlocked]);
  useEffect(() => {
    if (!dirty && !pending) return;
    const keepEdits = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", keepEdits);
    return () => window.removeEventListener("beforeunload", keepEdits);
  }, [dirty, pending]);

  const baselineRows = new Map(
    baseline.rows.map((row, index) => [row.entryId, { row, index }]),
  );
  const changedCount = draft.rows.filter((row, index) => {
    const before = baselineRows.get(row.entryId);
    return (
      !before ||
      before.index !== index ||
      fields.some((field) => before.row[field] !== row[field])
    );
  }).length;
  const invalidCount = draft.rows.reduce(
    (sum, row) =>
      sum +
      fields.filter((field) => parseField(field, row[field]) === null).length,
    0,
  );
  const matchweekInvalid =
    draft.throughMatchweek.trim() !== "" &&
    !(
      /^\d+$/.test(draft.throughMatchweek.trim()) &&
      Number(draft.throughMatchweek) >= 1 &&
      Number(draft.throughMatchweek) <= STANDING_LIMITS.matchweek
    );
  const derived = draft.rows.map((row) => deriveStanding(counts(row)));
  const outOfOrder = derived.findIndex(
    (row, index) => index > 0 && row.points > derived[index - 1].points,
  );

  const clearFeedback = () => {
    setProblem(null);
    setSuccess(null);
    setNotice(null);
  };
  const update = (index: number, field: Field, value: string) => {
    clearFeedback();
    setDraft((current) => ({
      ...current,
      rows: current.rows.map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      ),
    }));
  };
  const move = (index: number, delta: -1 | 1) => {
    clearFeedback();
    setDraft((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.rows.length) return current;
      const rows = [...current.rows];
      [rows[index], rows[target]] = [rows[target], rows[index]];
      return { ...current, rows };
    });
  };
  const sortByPoints = () => {
    clearFeedback();
    setDraft((current) => ({
      ...current,
      rows: current.rows
        .map((row, index) => ({ row, index }))
        .sort(
          (a, b) =>
            compareStandings(counts(a.row), counts(b.row)) || a.index - b.index,
        )
        .map(({ row }) => row),
    }));
    setNotice({
      th: "เรียงตามคะแนน ผลต่างประตู และประตูได้แล้ว หากยังเท่ากันให้ตรวจผลการพบกันและย้ายแถวเอง",
      en: "Sorted by points, goal difference and goals scored. Check head-to-head for remaining ties and move rows manually.",
    });
  };
  const fillFromResults = () => {
    clearFeedback();
    setDraft((current) =>
      toDraft(
        data.fromResults.rows.map((row) => {
          // Keep any deduction already entered; results never carry one.
          const existing = current.rows.find((r) => r.entryId === row.entryId);
          return {
            ...row,
            pointsAdjustment: existing
              ? (parseField("pointsAdjustment", existing.pointsAdjustment) ?? 0)
              : 0,
          };
        }),
        data.fromResults.throughMatchweek,
      ),
    );
    setNotice({
      th: `ดึงข้อมูลจาก ${data.fromResults.resultCount} นัดที่จบแล้ว ตรวจสอบก่อนกดบันทึก`,
      en: `Filled from ${data.fromResults.resultCount} finished matches. Review before saving.`,
    });
  };
  const reset = () => {
    clearFeedback();
    setDraft(baseline);
  };

  const save = () => {
    clearFeedback();
    if (invalidCount > 0 || matchweekInvalid) {
      setProblem({
        th: "มีช่องที่กรอกไม่ถูกต้อง กรุณาแก้ช่องที่ไฮไลต์ก่อนบันทึก",
        en: "Some fields are invalid. Fix the highlighted fields before saving.",
      });
      return;
    }
    const submission = {
      throughMatchweek:
        draft.throughMatchweek.trim() === ""
          ? null
          : Number(draft.throughMatchweek),
      rows: draft.rows.map((row) => ({ entryId: row.entryId, ...counts(row) })),
    };
    const saving = draft;
    start(async () => {
      try {
        const result = await saveStandingsAction({
          submission,
          expectedUpdatedAt: version,
          reason,
        });
        if (!result.ok) {
          setProblem(result.message);
          return;
        }
        setBaseline(saving);
        setReason("");
        if (!result.unchanged) {
          setVersion(result.updatedAt);
          setLastSaved({ at: result.updatedAt, by: null });
        }
        setSuccess(result.unchanged ? "unchanged" : "saved");
      } catch {
        setProblem({
          th: "บันทึกไม่สำเร็จ ตรวจสอบการเชื่อมต่อและสิทธิ์บัญชี แล้วลองอีกครั้ง",
          en: "Could not save. Check your connection and access, then try again.",
        });
      }
    });
  };

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(language === "th" ? "th-TH" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Bangkok",
    }).format(new Date(value));

  return (
    <>
      <section className={adminStyles.panel}>
        <h2>{label("สถานะข้อมูล", "Data status")}</h2>
        <dl className={styles.summary}>
          <div>
            <dt>{label("บันทึกล่าสุด", "Last saved")}</dt>
            <dd>
              {lastSaved.at
                ? formatDate(lastSaved.at)
                : label("ยังไม่เคยบันทึก", "Never saved")}
              {lastSaved.by && (
                <small data-localize="off">{lastSaved.by}</small>
              )}
            </dd>
          </div>
          <div>
            <dt>{label("ผลการแข่งขันที่จบแล้ว", "Finished matches")}</dt>
            <dd>
              {label(
                `${data.fromResults.resultCount} นัด`,
                `${data.fromResults.resultCount} matches`,
              )}
              {data.fromResults.throughMatchweek !== null && (
                <small>
                  {label(
                    `ล่าสุดนัดที่ ${data.fromResults.throughMatchweek}`,
                    `Latest matchweek ${data.fromResults.throughMatchweek}`,
                  )}
                </small>
              )}
            </dd>
          </div>
          <div>
            <dt>{label("จำนวนสโมสร", "Clubs")}</dt>
            <dd>{data.clubs.length}</dd>
          </div>
        </dl>
        {!data.saved && (
          <AdminNotice
            tone="info"
            title={label("ยังไม่มีตารางคะแนน", "No table saved yet")}
          >
            {label(
              "ผู้เล่นจะเห็นข้อความว่ายังไม่มีตารางคะแนนจนกว่าจะบันทึกครั้งแรก เริ่มจากดึงข้อมูลผลการแข่งขันหรือกรอกเองได้",
              "Players see an empty state until the first save. Start from finished results or enter the values manually.",
            )}
          </AdminNotice>
        )}
      </section>

      <section className={adminStyles.panel}>
        <h2>{label("แก้ไขตารางคะแนน", "Edit the table")}</h2>
        <form
          className={adminStyles.form}
          onSubmit={(event) => {
            event.preventDefault();
            if (!pending) save();
          }}
        >
          <fieldset className={adminStyles.form} disabled={pending}>
            <div className={styles.toolbar}>
              <label className={styles.matchweekField}>
                <span>{label("ข้อมูลถึงนัดที่", "Through matchweek")}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={STANDING_LIMITS.matchweek}
                  step={1}
                  value={draft.throughMatchweek}
                  aria-invalid={matchweekInvalid || undefined}
                  onChange={(event) => {
                    clearFeedback();
                    setDraft((current) => ({
                      ...current,
                      throughMatchweek: event.target.value,
                    }));
                  }}
                />
              </label>
              <div className={styles.tools}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={fillFromResults}
                  disabled={data.fromResults.resultCount === 0}
                >
                  <Calculator size={16} aria-hidden="true" />
                  {label("ดึงจากผลการแข่งขัน", "Fill from results")}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={sortByPoints}
                >
                  <ListRestart size={16} aria-hidden="true" />
                  {label("เรียงตามคะแนน", "Sort by points")}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={reset}
                  disabled={!dirty}
                >
                  <Undo2 size={16} aria-hidden="true" />
                  {label("ยกเลิกการแก้ไข", "Discard changes")}
                </button>
              </div>
            </div>
            <p className={adminStyles.fieldNote}>
              {label(
                "ลำดับแถวคืออันดับที่จะแสดง ใช้ปุ่มลูกศรย้ายแถวเมื่อต้องตัดสินด้วยผลการพบกัน จำนวนนัดและคะแนนคำนวณให้อัตโนมัติ",
                "Row order is the published position. Use the arrows for head-to-head tie-breaks. Played and points are calculated for you.",
              )}
            </p>

            <div
              className={`${adminStyles.scroll} ${styles.scroll}`}
              tabIndex={0}
              role="region"
              aria-label={label(
                "ตารางคะแนนที่แก้ไขได้",
                "Editable league table",
              )}
            >
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col" className={styles.clubHead}>
                      {label("สโมสร", "Club")}
                    </th>
                    {fields.map((field) => (
                      <th scope="col" key={field}>
                        <abbr title={fieldCopy[field].full[language]}>
                          {label(fieldCopy[field].th, fieldCopy[field].en)}
                        </abbr>
                      </th>
                    ))}
                    <th scope="col">{label("แข่ง", "P")}</th>
                    <th scope="col">+/-</th>
                    <th scope="col">{label("คะแนน", "Pts")}</th>
                    <th scope="col">
                      <span className="sr-only">
                        {label("ย้ายอันดับ", "Move")}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {draft.rows.map((row, index) => {
                    const club = clubs.get(row.entryId);
                    const name = club
                      ? language === "th"
                        ? club.name.th
                        : club.name.en
                      : row.entryId;
                    const before = baselineRows.get(row.entryId);
                    const changed =
                      !before ||
                      before.index !== index ||
                      fields.some((field) => before.row[field] !== row[field]);
                    const result = derived[index];
                    return (
                      <tr
                        key={row.entryId}
                        className={changed ? styles.changed : undefined}
                      >
                        <td className={styles.position}>
                          {index + 1}
                          {changed && (
                            <span className="sr-only">
                              {label(" (แก้ไขแล้ว)", " (edited)")}
                            </span>
                          )}
                        </td>
                        <th scope="row" className={styles.club}>
                          <span>
                            {club && (
                              <ClubColor
                                color={club.colors[0]}
                                secondaryColor={club.colors[1]}
                                size="small"
                                label={label(
                                  `สีประจำทีม ${name}`,
                                  `${name} team colours`,
                                )}
                              />
                            )}
                            <span title={name}>{name}</span>
                          </span>
                        </th>
                        {fields.map((field) => {
                          const invalid =
                            parseField(field, row[field]) === null;
                          return (
                            <td key={field}>
                              <input
                                className={styles.number}
                                type="number"
                                inputMode="numeric"
                                step={1}
                                min={limits[field][0]}
                                max={limits[field][1]}
                                value={row[field]}
                                aria-label={`${name} — ${fieldCopy[field].full[language]}`}
                                aria-invalid={invalid || undefined}
                                onChange={(event) =>
                                  update(index, field, event.target.value)
                                }
                              />
                            </td>
                          );
                        })}
                        <td className={styles.computed}>{result.played}</td>
                        <td className={styles.computed}>
                          {signed(result.goalDifference)}
                        </td>
                        <td className={styles.points}>{result.points}</td>
                        <td>
                          <span className={styles.moves}>
                            <button
                              type="button"
                              onClick={() => move(index, -1)}
                              disabled={index === 0}
                              aria-label={label(
                                `เลื่อน ${name} ขึ้น`,
                                `Move ${name} up`,
                              )}
                            >
                              <ArrowUp size={16} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => move(index, 1)}
                              disabled={index === draft.rows.length - 1}
                              aria-label={label(
                                `เลื่อน ${name} ลง`,
                                `Move ${name} down`,
                              )}
                            >
                              <ArrowDown size={16} aria-hidden="true" />
                            </button>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {outOfOrder > 0 && (
              <AdminNotice
                tone="warning"
                title={label("ตรวจลำดับอีกครั้ง", "Check the order")}
              >
                {label(
                  `อันดับ ${outOfOrder + 1} มีคะแนนมากกว่าอันดับ ${outOfOrder} กดเรียงตามคะแนนหรือย้ายแถวก่อนบันทึก`,
                  `Position ${outOfOrder + 1} has more points than position ${outOfOrder}. Sort by points or move the row before saving.`,
                )}
              </AdminNotice>
            )}
            {notice && (
              <AdminNotice tone="info">{notice[language]}</AdminNotice>
            )}

            <label>
              <span>
                {label(
                  "เหตุผลการแก้ไข (ไม่บังคับ)",
                  "Reason for change (optional)",
                )}
              </span>
              <textarea
                value={reason}
                maxLength={500}
                rows={2}
                onChange={(event) => setReason(event.target.value)}
                placeholder={label(
                  "เช่น อัปเดตหลังจบนัดที่ 12",
                  "e.g. Updated after matchweek 12",
                )}
              />
            </label>

            {problem && (
              <AdminNotice
                tone="danger"
                title={label("ยังบันทึกไม่ได้", "Could not save")}
              >
                {problem[language]}
              </AdminNotice>
            )}
            <div className={adminStyles.actions}>
              <AdminActionButton
                pending={pending}
                pendingLabel="กำลังบันทึก…"
                disabled={!dirty}
              >
                {label("บันทึกตารางคะแนน", "Save table")}
              </AdminActionButton>
              <span className={styles.changeSummary} aria-live="polite">
                {dirty
                  ? label(
                      `แก้ไขแล้ว ${changedCount} ทีม`,
                      `${changedCount} clubs edited`,
                    )
                  : label("ไม่มีการแก้ไขที่ยังไม่บันทึก", "No unsaved changes")}
              </span>
            </div>
            <div role="status">
              {success && (
                <AdminNotice tone="success">
                  {success === "saved"
                    ? label(
                        "บันทึกตารางคะแนนแล้ว หน้าตารางคะแนนแสดงข้อมูลใหม่แล้ว",
                        "Table saved. The public standings page now shows the update.",
                      )
                    : label(
                        "ข้อมูลตรงกับที่บันทึกไว้แล้ว",
                        "Nothing changed. The table is already up to date.",
                      )}
                </AdminNotice>
              )}
            </div>
          </fieldset>
        </form>
      </section>
    </>
  );
}
