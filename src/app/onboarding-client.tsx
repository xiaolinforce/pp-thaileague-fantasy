"use client";

import { AlertTriangle, ArrowRight, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Brand } from "@/components/fantasy/app-shell";
import { Localized, useLanguage } from "@/components/fantasy/i18n";
import { authClient } from "@/lib/auth/client";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
          theme: "light";
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

function Turnstile({
  siteKey,
  onToken,
}: {
  siteKey: string;
  onToken: (token: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scriptId = "cloudflare-turnstile-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    let widgetId: string | null = null;
    const interval = window.setInterval(() => {
      if (!window.turnstile || !containerRef.current || widgetId) return;
      window.clearInterval(interval);
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onToken,
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
        theme: "light",
      });
    }, 100);
    return () => {
      window.clearInterval(interval);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [onToken, siteKey]);
  return <div ref={containerRef} className="turnstile-slot" />;
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
}

export default function OnboardingClient({
  emailEnabled,
  googleEnabled,
  turnstileSiteKey,
  upgradeMode = false,
}: {
  emailEnabled: boolean;
  googleEnabled: boolean;
  turnstileSiteKey: string | null;
  upgradeMode?: boolean;
}) {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaEpoch, setCaptchaEpoch] = useState(0);
  const [guestAccepted, setGuestAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const sendOtp = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await authClient.emailOtp.sendVerificationOtp(
        { email: email.trim(), type: "sign-in" },
        captchaToken
          ? { headers: { "x-captcha-response": captchaToken } }
          : undefined,
      );
      if (result.error) throw result.error;
      setOtpSent(true);
    } catch (requestError) {
      setError(errorMessage(requestError));
      setCaptchaToken("");
      setCaptchaEpoch((value) => value + 1);
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await authClient.signIn.emailOtp({
        email: email.trim(),
        otp: otp.trim(),
      });
      if (result.error) throw result.error;
      router.push("/auth/complete");
      router.refresh();
    } catch (requestError) {
      setError(errorMessage(requestError));
      setBusy(false);
    }
  };

  const playAsGuest = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await authClient.signIn.anonymous();
      if (result.error) throw result.error;
      router.push("/auth/complete");
      router.refresh();
    } catch (requestError) {
      setError(errorMessage(requestError));
      setBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    setBusy(true);
    setError("");
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/auth/complete",
    });
    if (result?.error) {
      setError(errorMessage(result.error));
      setBusy(false);
    }
  };

  return (
    <Localized>
      <main className="onboarding-page">
        <div
          className="onboarding-language-switcher"
          role="group"
          aria-label={language === "th" ? "เปลี่ยนภาษา" : "Change language"}
        >
          <button
            type="button"
            className={language === "th" ? "is-active" : undefined}
            aria-label={language === "th" ? "ภาษาไทย" : "Thai"}
            aria-pressed={language === "th"}
            onClick={() => setLanguage("th")}
          >
            TH
          </button>
          <button
            type="button"
            className={language === "en" ? "is-active" : undefined}
            aria-label={language === "th" ? "ภาษาอังกฤษ" : "English"}
            aria-pressed={language === "en"}
            onClick={() => setLanguage("en")}
          >
            EN
          </button>
        </div>

        <section className="onboarding-hero">
          <Brand />
          <div className="onboarding-kicker">PP THAI LEAGUE FANTASY</div>
          <h1>
            {upgradeMode
              ? "เก็บทีม Guest นี้ไว้กับบัญชีของคุณ"
              : "จัดทีมไทยลีกในฝัน"}
          </h1>
          <p>
            {upgradeMode
              ? "เข้าสู่ระบบเพื่อเก็บทีมนี้และเล่นต่อได้ทุกอุปกรณ์"
              : "เลือกนักเตะ ลุ้นคะแนน และแข่งกับเพื่อนตลอดฤดูกาล"}
          </p>
        </section>

        <section className="onboarding-panel" aria-labelledby="start-title">
          <div className="onboarding-panel-heading">
            <div>
              <p>{upgradeMode ? "เก็บทีมของคุณ" : "พร้อมลงสนาม"}</p>
              <h2 id="start-title">
                {upgradeMode ? "เข้าสู่ระบบ" : "เริ่มเล่น"}
              </h2>
            </div>
          </div>

          <div className="member-card">
            <div className="member-card-title">
              <strong>เข้าสู่ระบบหรือสมัครสมาชิก</strong>
            </div>

            {googleEnabled && (
              <button
                className="auth-button google-button"
                onClick={signInWithGoogle}
                disabled={busy}
              >
                <span className="google-g">G</span>
                ใช้บัญชี Google
              </button>
            )}

            {googleEnabled && emailEnabled && (
              <div className="auth-divider">
                <span>หรือ</span>
              </div>
            )}

            {emailEnabled ? (
              <div className="email-auth-form">
                <label htmlFor="auth-email">อีเมล</label>
                <div className="auth-input-wrap">
                  <Mail />
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={otpSent || busy}
                  />
                </div>
                {otpSent ? (
                  <>
                    <label htmlFor="auth-otp">รหัส OTP 6 หลัก</label>
                    <input
                      id="auth-otp"
                      className="otp-input"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otp}
                      onChange={(event) =>
                        setOtp(event.target.value.replace(/\D/g, ""))
                      }
                      placeholder="000000"
                    />
                    <button
                      className="auth-button primary-auth-button"
                      onClick={verifyOtp}
                      disabled={busy || otp.length !== 6}
                    >
                      ยืนยันและเริ่มเล่น <ArrowRight />
                    </button>
                    <button
                      className="auth-text-button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp("");
                        setCaptchaToken("");
                        setCaptchaEpoch((value) => value + 1);
                      }}
                      disabled={busy}
                    >
                      เปลี่ยนอีเมลหรือขอรหัสใหม่
                    </button>
                  </>
                ) : (
                  <>
                    {turnstileSiteKey && (
                      <Turnstile
                        key={captchaEpoch}
                        siteKey={turnstileSiteKey}
                        onToken={setCaptchaToken}
                      />
                    )}
                    <button
                      className="auth-button primary-auth-button"
                      onClick={sendOtp}
                      disabled={
                        busy ||
                        !email.includes("@") ||
                        Boolean(turnstileSiteKey && !captchaToken)
                      }
                    >
                      ส่งรหัส OTP ทางอีเมล <ArrowRight />
                    </button>
                  </>
                )}
              </div>
            ) : !googleEnabled ? (
              <p className="auth-unavailable">
                การเข้าสู่ระบบสมาชิกยังไม่เปิดใน environment นี้
                แต่ยังทดลองเล่นแบบ Guest ได้
              </p>
            ) : null}
          </div>

          {!upgradeMode && (
            <>
              <div className="onboarding-choice-divider">
                <span>หรือ</span>
              </div>
              <div className="guest-card">
                <div className="guest-warning">
                  <AlertTriangle />
                  <div>
                    <strong>เล่นแบบ Guest</strong>
                    <ul className="guest-risk-list">
                      <li>เฉพาะอุปกรณ์และเบราว์เซอร์นี้</li>
                      <li>ชื่อเป็นแบบสุ่มและเปลี่ยนไม่ได้</li>
                      <li>ล้างคุกกี้หรือหายไป 30 วัน อาจเข้าถึงทีมไม่ได้</li>
                    </ul>
                  </div>
                </div>
                <label className="guest-confirmation">
                  <input
                    type="checkbox"
                    checked={guestAccepted}
                    onChange={(event) => setGuestAccepted(event.target.checked)}
                  />
                  ฉันเข้าใจและต้องการเล่นแบบ Guest
                </label>
                <button
                  className="auth-button guest-button"
                  onClick={playAsGuest}
                  disabled={busy || !guestAccepted}
                >
                  เล่นแบบ Guest <ArrowRight />
                </button>
              </div>
            </>
          )}

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
        </section>
      </main>
    </Localized>
  );
}
