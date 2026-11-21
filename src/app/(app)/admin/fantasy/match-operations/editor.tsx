"use client";

import { useEffect, useState, useTransition } from "react";
import { useLanguage } from "@/components/fantasy/i18n";
import { useNavigationBlocker } from "@/components/fantasy/navigation-blocker";
import { AdminActionButton } from "../admin-action-button";
import { AdminNotice } from "../components";
import styles from "../admin.module.css";
import { previewMatchAction, applyMatchAction } from "./actions";
import type { MatchRosterPlayer } from "@/lib/fantasy/match-import";

type Preview = Extract<
  Awaited<ReturnType<typeof previewMatchAction>>,
  { ok: true }
>["preview"];

export function MatchImportEditor({
  fixtureId,
  roster,
  latest,
}: {
  fixtureId: string;
  roster: MatchRosterPlayer[];
  latest: string | null;
}) {
  const { language } = useLanguage();
  const label = (th: string, en: string) => (language === "th" ? th : en);
  const [initial] = useState(
    () =>
      latest ??
      JSON.stringify(
        {
          fixtureId,
          homeScore: null,
          awayScore: null,
          sources: [],
          events: [],
          uncertainties: [],
          players: roster.map((p) => ({
            fantasyPlayerId: p.fantasyPlayerId,
            minutes: null,
            goalsConcededWhilePlaying: null,
            ...(p.position === "goalkeeper" ? { saves: null } : {}),
          })),
        },
        null,
        2,
      ),
  );
  const [payload, setPayload] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [problem, setProblem] = useState<{ th: string; en: string } | null>(
    null,
  );
  const [success, setSuccess] = useState<"saved" | "unchanged" | null>(null);
  const [pending, start] = useTransition();
  const { setNavigationBlocked } = useNavigationBlocker();
  const dirty = payload !== saved;
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
  const submit = () => {
    setProblem(null);
    setSuccess(null);
    start(async () => {
      try {
        if (preview) {
          const result = await applyMatchAction(
            fixtureId,
            payload,
            preview.token,
          );
          setPreview(null);
          if (!result.ok) {
            setProblem(result.message);
            return;
          }
          setSaved(payload);
          setSuccess(result.unchanged ? "unchanged" : "saved");
        } else {
          const result = await previewMatchAction(fixtureId, payload);
          if (result.ok) setPreview(result.preview);
          else setProblem(result.message);
        }
      } catch {
        setPreview(null);
        setProblem({
          th: "ตรวจสอบการเชื่อมต่อและสิทธิ์บัญชี แล้วกดดูคะแนนอีกครั้ง",
          en: "Check your connection and access, then preview the match again.",
        });
      }
    });
  };
  const players = new Map(roster.map((p) => [p.fantasyPlayerId, p]));
  const playerName = (p: MatchRosterPlayer) =>
    language === "th" ? (p.nameTh ?? p.name) : (p.nameEn ?? p.name);
  return (
    <section className={styles.panel}>
      <h2>{label("สถิติทั้งแมตช์", "Match statistics")}</h2>
      <details className={styles.detail}>
        <summary>
          {label("รายชื่อและรหัสนักเตะ", "Roster and player IDs")} (
          {roster.length})
        </summary>
        <div
          className={styles.scroll}
          tabIndex={0}
          role="region"
          aria-label={label("รายชื่อและรหัสนักเตะ", "Roster and player IDs")}
        >
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{label("ทีม", "Team")}</th>
                <th>{label("นักเตะ", "Player")}</th>
                <th>{label("ตำแหน่ง", "Position")}</th>
                <th>fantasyPlayerId</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((p) => (
                <tr key={p.fantasyPlayerId}>
                  <td>
                    {p.side === "home"
                      ? label("เหย้า", "Home")
                      : label("เยือน", "Away")}
                  </td>
                  <td>{playerName(p)}</td>
                  <td>{p.position}</td>
                  <td>
                    <code>{p.fantasyPlayerId}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          if (!pending) submit();
        }}
      >
        <label>
          <span>{label("ข้อมูลการแข่งขัน (JSON)", "Match data (JSON)")}</span>
          <span className={styles.fieldNote}>
            {latest
              ? label(
                  "แสดงข้อมูลจากการนำเข้าล่าสุด แก้ไขและตรวจคะแนนก่อนบันทึกอีกครั้ง",
                  "The latest import is loaded. Edit it and preview the updated scores.",
                )
              : label(
                  "กรอกนาทีและประตูที่เสียตอนอยู่ในสนามให้ครบทุกคน ใช้ 0 เมื่อยืนยันแล้ว",
                  "Complete minutes and on-pitch goals conceded for every player. Enter zero for a confirmed zero.",
                )}
          </span>
          <textarea
            value={payload}
            onChange={(e) => {
              setPayload(e.target.value);
              setPreview(null);
              setSuccess(null);
              setProblem(null);
            }}
            rows={12}
            spellCheck={false}
            required
            disabled={pending}
            dir="ltr"
          />
        </label>
        <details className={styles.detail}>
          <summary>
            {label(
              "รูปแบบข้อมูลและสถิติที่รองรับ",
              "Payload fields and supported statistics",
            )}
          </summary>
          <p>
            {label(
              "ใส่ URL ใน sources ลำดับเหตุการณ์ใน events และคำตัดสินชั่วคราวที่ต้องทบทวนใน uncertainties ทั้งสามช่องเป็นรายการข้อความ",
              "Use lists of strings for source URLs (sources), ordered incidents (events) and provisional decisions for review (uncertainties).",
            )}
          </p>
          <p>
            {label(
              "กรอกยอดเซฟจริงของผู้รักษาประตูที่ลงเล่น และระบุจำนวน Fantasy Assist ทั้งแมตช์ต่อคนเมื่อต่างจากแหล่งข้อมูล",
              "Provide actual saves for each goalkeeper who played. To override the source, specify the player’s total Fantasy assists for this match.",
            )}
          </p>
          <p>
            <code>
              goals, sourceAssists, fantasyAssists, saves, penaltySaves,
              penaltyMisses, yellowCards, redCards, ownGoals
            </code>
          </p>
        </details>
        {problem && (
          <AdminNotice
            tone="danger"
            title={label("ยังบันทึกไม่ได้", "Could not save")}
          >
            {problem[language]}
          </AdminNotice>
        )}
        {preview && (
          <>
            <h3>{label("ตรวจคะแนนก่อนบันทึก", "Score preview")}</h3>
            {preview.unchanged && (
              <p>
                {label(
                  "ข้อมูลตรงกับที่บันทึกไว้แล้ว",
                  "The submitted data matches the saved match.",
                )}
              </p>
            )}
            <div
              className={styles.scroll}
              tabIndex={0}
              role="region"
              aria-label={label("คะแนนรายคน", "Player scores")}
            >
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{label("นักเตะ", "Player")}</th>
                    <th>{label("คะแนนเดิม", "Previous")}</th>
                    <th>{label("คะแนนใหม่", "New")}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => {
                    const player = players.get(row.fantasyPlayerId);
                    return (
                      <tr key={row.fantasyPlayerId}>
                        <td>
                          {player ? playerName(player) : row.fantasyPlayerId}
                        </td>
                        <td>{row.previousPoints ?? "—"}</td>
                        <td>
                          <strong>{row.points}</strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
        <div className={styles.actions}>
          <AdminActionButton pending={pending}>
            {preview
              ? label(
                  "ยืนยันผลและคะแนนทั้งแมตช์",
                  "Apply match result and scores",
                )
              : label("ตรวจข้อมูลและดูคะแนน", "Validate and preview scores")}
          </AdminActionButton>
        </div>
        <div role="status">
          {success && (
            <AdminNotice tone="success">
              {success === "saved"
                ? label(
                    "บันทึกผลและคำนวณคะแนนแล้ว",
                    "Match saved and scores recalculated.",
                  )
                : label(
                    "ยืนยันแล้ว ข้อมูลตรงกับที่บันทึกไว้",
                    "Verified. This match is already up to date.",
                  )}
            </AdminNotice>
          )}
        </div>
      </form>
    </section>
  );
}
