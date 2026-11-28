"use client";

import { LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { signInAdminWithPassword } from "@/app/admin-password-actions";
import { Brand } from "@/components/fantasy/app-shell";
import { useLanguage } from "@/components/fantasy/i18n";
import { Input } from "@/components/ui/input";
import styles from "./password-form.module.css";

const messages = {
  th: {
    title: "เข้าสู่ระบบแอดมิน",
    password: "รหัสผ่านแอดมิน",
    submit: "เข้าสู่ระบบ",
    pending: "กำลังเข้าสู่ระบบ…",
    invalid: "รหัสผ่านไม่ถูกต้อง",
    limited: "ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่แล้วลองอีกครั้ง",
    unavailable: "ทางเข้าด้วยรหัสผ่านยังไม่พร้อมใช้งาน",
  },
  en: {
    title: "Admin sign-in",
    password: "Admin password",
    submit: "Sign in",
    pending: "Signing in…",
    invalid: "The password is incorrect.",
    limited: "Too many sign-in attempts. Wait a moment and try again.",
    unavailable: "Password sign-in is currently unavailable.",
  },
};

export function AdminPasswordForm({ enabled }: { enabled: boolean }) {
  const { language } = useLanguage();
  const copy = messages[language];
  const [state, signIn, pending] = useActionState(signInAdminWithPassword, {
    error: null,
  });

  return (
    <main id="main-content" className={styles.page}>
      <section className="member-card" aria-labelledby="admin-login-title">
        <div className={styles.brand}>
          <Brand />
        </div>
        <h1 id="admin-login-title" className={styles.title}>
          {copy.title}
        </h1>
        {enabled ? (
          <form action={signIn} className={styles.form}>
            <label htmlFor="admin-password">{copy.password}</label>
            <Input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              readOnly={pending}
              aria-invalid={state.error === "invalid" || undefined}
              aria-describedby={
                state.error ? "admin-password-error" : undefined
              }
              className={styles.password}
            />
            {state.error && (
              <p id="admin-password-error" className="auth-error" role="alert">
                {copy[state.error]}
              </p>
            )}
            <button
              type="submit"
              className={`auth-button ${styles.submit}`}
              disabled={pending}
              aria-busy={pending}
            >
              {pending && (
                <LoaderCircle size={18} className="spin" aria-hidden="true" />
              )}
              {pending ? copy.pending : copy.submit}
            </button>
          </form>
        ) : (
          <p className={styles.unavailable}>{copy.unavailable}</p>
        )}
      </section>
    </main>
  );
}
