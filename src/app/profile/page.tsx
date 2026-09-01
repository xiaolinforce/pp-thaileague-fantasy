"use client";

import { LoaderCircle, Mail, Save, UserPlus, UsersRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { updateFantasyTeamNameAction } from "@/app/fantasy-actions";
import { AppShell } from "@/components/fantasy/app-shell";
import {
  useAppIdentity,
  useSetAppIdentity,
} from "@/components/fantasy/identity";
import { useLanguage } from "@/components/fantasy/i18n";
import { toast } from "@/components/ui/sonner";
import { normalizeFantasyName, validateFantasyName } from "@/lib/auth/names";

export default function ProfilePage() {
  const router = useRouter();
  const { language, translate } = useLanguage();
  const identity = useAppIdentity();
  const setIdentity = useSetAppIdentity();
  const [teamName, setTeamName] = useState(identity?.teamName ?? "");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const formErrorRef = useRef<HTMLParagraphElement>(null);

  const teamNameLocked = (identity?.teamNameChangesRemaining ?? 0) <= 0;
  const hasNameChanges =
    normalizeFantasyName(teamName) !== (identity?.teamName ?? "");
  const canEditTeamName = Boolean(
    identity && !identity.isGuest && !teamNameLocked,
  );

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

    const validation = validateFantasyName(teamName);
    if (!validation.ok) {
      const message = translate(validation.message ?? "ชื่อไม่ถูกต้อง");
      setFormStatus("");
      setFormError(message);
      window.requestAnimationFrame(() => formErrorRef.current?.focus());
      return;
    }

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
      setTeamName(result.teamName);
      setIdentity((currentIdentity) =>
        currentIdentity
          ? {
              ...currentIdentity,
              teamName: result.teamName,
              teamNameChangesRemaining: result.teamNameChangesRemaining,
            }
          : currentIdentity,
      );
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
          <h1>โปรไฟล์</h1>
        </header>

        <div className="account-card-stack">
          <section
            className="product-card account-task-card"
            aria-labelledby="email-heading"
          >
            <div className="profile-section-heading">
              <span className="settings-icon orange" aria-hidden="true">
                <Mail />
              </span>
              <h2 id="email-heading">อีเมล</h2>
            </div>

            <div className="account-readonly-value">
              {identity?.email ? (
                <span data-localize="off">{identity.email}</span>
              ) : (
                <span>Guest ไม่มีอีเมล</span>
              )}
            </div>
          </section>

          <form
            className="product-card account-task-card"
            aria-labelledby="team-heading"
            onSubmit={save}
            noValidate
          >
            <div className="profile-section-heading">
              <span className="settings-icon orange" aria-hidden="true">
                <UsersRound />
              </span>
              <h2 id="team-heading">ชื่อทีม</h2>
            </div>

            <div className="account-team-name-field">
              <input
                id="team-name"
                name="teamName"
                value={teamName}
                onChange={(event) => {
                  setTeamName(event.target.value);
                  setFormError("");
                  setFormStatus("");
                }}
                readOnly={!canEditTeamName}
                autoComplete="off"
                spellCheck={false}
                aria-labelledby="team-heading"
                aria-describedby={`team-name-help${formError ? " team-name-error" : ""}`}
                aria-invalid={Boolean(formError)}
              />
              <small id="team-name-help">
                {language === "th"
                  ? `เปลี่ยนชื่อทีมได้อีก ${identity?.teamNameChangesRemaining ?? 0} ครั้งในฤดูกาลนี้`
                  : `${identity?.teamNameChangesRemaining ?? 0} team-name changes remaining this season`}
              </small>
              {formError ? (
                <p
                  id="team-name-error"
                  className="account-field-error"
                  ref={formErrorRef}
                  role="alert"
                  tabIndex={-1}
                >
                  {formError}
                </p>
              ) : null}
            </div>

            <div className="account-card-action-row">
              <div className="profile-form-feedback" aria-live="polite">
                {!formError && formStatus ? <p>{formStatus}</p> : null}
              </div>
              <button
                type="submit"
                className="primary-button"
                disabled={saving || !canEditTeamName || !hasNameChanges}
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
          </form>

          {identity?.isGuest ? (
            <section
              className="product-card account-task-card"
              aria-labelledby="guest-heading"
            >
              <div className="profile-section-heading">
                <span className="settings-icon orange" aria-hidden="true">
                  <UserPlus />
                </span>
                <h2 id="guest-heading">บัญชี Guest</h2>
              </div>
              <div className="account-card-action-row">
                <Link href="/upgrade" className="primary-button">
                  สมัครสมาชิก
                </Link>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </AppShell>
  );
}
