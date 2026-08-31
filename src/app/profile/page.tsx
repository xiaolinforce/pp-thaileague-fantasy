"use client";

import { LoaderCircle, Mail, Save, UsersRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { updateFantasyTeamNameAction } from "@/app/fantasy-actions";
import { AppShell } from "@/components/fantasy/app-shell";
import { useAppIdentity } from "@/components/fantasy/identity";
import { useLanguage } from "@/components/fantasy/i18n";
import { toast } from "@/components/ui/sonner";

function initialsFor(value: string | undefined, fallback: string) {
  const initials = (value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return initials || fallback;
}

export default function ProfilePage() {
  const router = useRouter();
  const { language, translate } = useLanguage();
  const identity = useAppIdentity();
  const [teamName, setTeamName] = useState(identity?.teamName ?? "");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const formErrorRef = useRef<HTMLParagraphElement>(null);

  const teamNameLocked = (identity?.teamNameChangesRemaining ?? 0) <= 0;
  const hasNameChanges = teamName.trim() !== (identity?.teamName ?? "");

  useEffect(() => {
    if (!hasNameChanges) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasNameChanges]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!identity || identity.isGuest || !hasNameChanges || saving) return;

    setSaving(true);
    setFormError("");
    setFormStatus("");
    try {
      const result = await updateFantasyTeamNameAction({ teamName });
      const message = translate(result.message);
      if (!result.ok) {
        setFormError(message);
        toast.error(message);
        window.requestAnimationFrame(() => formErrorRef.current?.focus());
        return;
      }

      setFormStatus(message);
      toast.success(message);
      router.refresh();
    } catch {
      const message =
        language === "th"
          ? "บันทึกชื่อทีมไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง"
          : "Could not save the team name. Check your connection and try again.";
      setFormError(message);
      toast.error(message);
      window.requestAnimationFrame(() => formErrorRef.current?.focus());
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <main id="main-content" className="content product-content account-page">
        <header className="account-page-header">
          <div>
            <h1>โปรไฟล์ทีม</h1>
            <p>จัดการข้อมูลบัญชีและชื่อทีมแฟนตาซีของคุณ</p>
          </div>
          <span className="account-status-pill">
            {identity?.isGuest ? "บัญชี Guest" : "บัญชีสมาชิก"}
          </span>
        </header>

        <form className="product-card profile-editor" onSubmit={save}>
          <section
            className="profile-editor-section"
            aria-labelledby="account-heading"
          >
            <div className="profile-section-heading">
              <span
                className="profile-avatar profile-heading-avatar"
                aria-hidden="true"
                data-localize="off"
              >
                {initialsFor(identity?.teamName, "G")}
              </span>
              <div>
                <h2 id="account-heading">ข้อมูลบัญชี</h2>
                <p>
                  {identity?.isGuest
                    ? "Guest ไม่มีอีเมลและใช้ได้บนอุปกรณ์นี้"
                    : "บัญชีนี้ใช้เก็บทีมและการตั้งค่าข้ามอุปกรณ์"}
                </p>
              </div>
            </div>

            <div className="profile-fields-grid">
              <div className="settings-readonly-field">
                <span>อีเมล</span>
                <strong>
                  <Mail aria-hidden="true" />
                  {identity?.email ?? "Guest ไม่มีอีเมล"}
                </strong>
              </div>
            </div>
          </section>

          <section
            className="profile-editor-section"
            aria-labelledby="team-heading"
          >
            <div className="profile-section-heading">
              <span className="settings-icon orange" aria-hidden="true">
                <UsersRound />
              </span>
              <div>
                <h2 id="team-heading">ข้อมูลทีม</h2>
                <p>ชื่อทีมที่แสดงในคะแนนและตารางอันดับ</p>
              </div>
            </div>

            <div className="team-identity-row">
              {identity?.isGuest ? (
                <div className="team-name-readonly">
                  <span>ชื่อทีม</span>
                  <strong data-localize="off">{identity.teamName}</strong>
                  <p>Guest ใช้ชื่อทีมแบบสุ่มและเปลี่ยนไม่ได้</p>
                </div>
              ) : (
                <label>
                  <span>ชื่อทีม</span>
                  <input
                    name="teamName"
                    value={teamName}
                    onChange={(event) => setTeamName(event.target.value)}
                    disabled={teamNameLocked}
                    required
                    minLength={3}
                    maxLength={30}
                    autoComplete="off"
                    spellCheck={false}
                    aria-describedby="team-name-format team-name-help"
                  />
                  <small id="team-name-format">
                    ใช้ภาษาไทย อังกฤษ ตัวเลข เว้นวรรค และ . _ - ได้ 3–30
                    ตัวอักษร ชื่อทีมต้องไม่ซ้ำในฤดูกาลเดียวกัน
                  </small>
                  <small id="team-name-help">
                    {teamNameLocked
                      ? "ใช้สิทธิ์เปลี่ยนชื่อทีมครบแล้วสำหรับฤดูกาลนี้"
                      : `เปลี่ยนชื่อทีมได้อีก ${identity?.teamNameChangesRemaining ?? 0} ครั้งในฤดูกาลนี้`}
                  </small>
                </label>
              )}
            </div>
          </section>

          {identity?.isGuest ? (
            <div className="profile-guest-upgrade">
              <div>
                <strong>ต้องการเก็บทีมไว้ข้ามอุปกรณ์?</strong>
                <span>สมัครสมาชิกแล้วใช้ทีม Guest เดิมต่อได้</span>
              </div>
              <Link href="/upgrade" className="primary-button">
                สมัครสมาชิก
              </Link>
            </div>
          ) : (
            <div className="profile-save-row">
              <div className="profile-form-feedback" aria-live="polite">
                {formError ? (
                  <p ref={formErrorRef} role="alert" tabIndex={-1}>
                    {formError}
                  </p>
                ) : null}
                {!formError && formStatus ? <p>{formStatus}</p> : null}
              </div>
              <button
                type="submit"
                className="primary-button"
                disabled={saving || !hasNameChanges}
                aria-busy={saving}
              >
                {saving ? (
                  <LoaderCircle className="spin" size={17} aria-hidden="true" />
                ) : (
                  <Save size={17} aria-hidden="true" />
                )}
                {saving ? "กำลังบันทึก…" : "บันทึกชื่อทีม"}
              </button>
            </div>
          )}
        </form>
      </main>
    </AppShell>
  );
}
