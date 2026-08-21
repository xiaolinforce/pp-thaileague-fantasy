"use client";

import {
  ArrowLeft,
  ArrowRight,
  LoaderCircle,
  Mail,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
          size: "flexible" | "compact";
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
        size: window.matchMedia("(max-width: 400px)").matches
          ? "compact"
          : "flexible",
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
  const [busyAction, setBusyAction] = useState<
    "guest" | "google" | "send-otp" | "verify-otp" | null
  >(null);
  const [error, setError] = useState("");
  const [authView, setAuthView] = useState<"choices" | "email">("choices");
  const busy = busyAction !== null;

  const sendOtp = async () => {
    setBusyAction("send-otp");
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
      setBusyAction(null);
    }
  };

  const verifyOtp = async () => {
    setBusyAction("verify-otp");
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
      setBusyAction(null);
    }
  };

  const playAsGuest = async () => {
    setBusyAction("guest");
    setError("");
    try {
      const result = await authClient.signIn.anonymous();
      if (result.error) throw result.error;
      router.push("/auth/complete");
      router.refresh();
    } catch (requestError) {
      setError(errorMessage(requestError));
      setBusyAction(null);
    }
  };

  const signInWithGoogle = async () => {
    setBusyAction("google");
    setError("");
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/auth/complete",
    });
    if (result?.error) {
      setError(errorMessage(result.error));
      setBusyAction(null);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "th" ? "en" : "th");
  };

  const showEmailForm = () => {
    setError("");
    setAuthView("email");
  };

  const showAuthChoices = () => {
    setAuthView("choices");
    setOtpSent(false);
    setOtp("");
    setCaptchaToken("");
    setCaptchaEpoch((value) => value + 1);
    setError("");
  };

  return (
    <Localized>
      <main id="main-content" className="onboarding-page">
        <section className="onboarding-hero">
          <button
            type="button"
            className="onboarding-language-switcher"
            role="switch"
            aria-checked={language === "en"}
            aria-label={
              language === "th" ? "เปลี่ยนเป็น English" : "Switch to Thai"
            }
            title={
              language === "th" ? "เปลี่ยนเป็น English" : "สลับเป็นภาษาไทย"
            }
            onClick={toggleLanguage}
          >
            <span className={language === "th" ? "is-active" : undefined}>
              TH
            </span>
            <span className={language === "en" ? "is-active" : undefined}>
              EN
            </span>
          </button>

          <div className="onboarding-kicker">PP THAI LEAGUE FANTASY</div>
          <h1>
            {upgradeMode
              ? "เก็บทีม Guest นี้ไว้กับบัญชีของคุณ"
              : "จัดทีมไทยลีกของคุณ"}
          </h1>
          <p>
            {upgradeMode
              ? "เข้าสู่ระบบเพื่อเก็บทีมนี้และเล่นต่อได้ทุกอุปกรณ์"
              : "เลือกนักเตะ ลุ้นคะแนน และแข่งกับเพื่อนตลอดฤดูกาล"}
          </p>
        </section>

        <section className="onboarding-panel" aria-labelledby="start-title">
          {upgradeMode ? (
            <div className="onboarding-panel-heading">
              <div>
                <p>เก็บทีมของคุณ</p>
                <h2 id="start-title">เข้าสู่ระบบ</h2>
              </div>
            </div>
          ) : (
            <h2 id="start-title" className="sr-only">
              เลือกวิธีเริ่มเล่น
            </h2>
          )}

          <div
            className={
              authView === "choices"
                ? "member-card auth-choice-card"
                : "member-card"
            }
          >
            {authView === "choices" ? (
              <div className="auth-choice-stack">
                {!upgradeMode && (
                  <button
                    type="button"
                    className="auth-button guest-button"
                    onClick={playAsGuest}
                    disabled={busy}
                    aria-busy={busyAction === "guest"}
                  >
                    {busyAction === "guest" ? (
                      <LoaderCircle className="spin" aria-hidden="true" />
                    ) : (
                      <UserRound aria-hidden="true" />
                    )}
                    {busyAction === "guest"
                      ? "กำลังเริ่มโหมด Guest…"
                      : "ทดลองเล่นแบบไม่สมัครสมาชิก"}
                  </button>
                )}

                {googleEnabled && (
                  <button
                    type="button"
                    className="auth-button google-button"
                    onClick={signInWithGoogle}
                    disabled={busy}
                    aria-busy={busyAction === "google"}
                  >
                    {busyAction === "google" ? (
                      <LoaderCircle className="spin" aria-hidden="true" />
                    ) : (
                      <Image
                        className="google-sign-in-icon"
                        src="/google-sign-in-icon.svg"
                        width={40}
                        height={40}
                        alt=""
                        unoptimized
                      />
                    )}
                    {busyAction === "google"
                      ? "กำลังเปิด Google…"
                      : "เข้าสู่ระบบหรือสมัครด้วย GOOGLE"}
                  </button>
                )}

                {emailEnabled && (
                  <button
                    type="button"
                    className="auth-button email-choice-button"
                    onClick={showEmailForm}
                    disabled={busy}
                  >
                    <Mail aria-hidden="true" />
                    เข้าสู่ระบบหรือสมัครด้วย EMAIL
                  </button>
                )}

                {!emailEnabled && !googleEnabled && (
                  <p className="auth-unavailable">
                    การเข้าสู่ระบบสมาชิกยังไม่เปิดใน environment นี้
                    แต่ยังทดลองเล่นแบบ Guest ได้
                  </p>
                )}
              </div>
            ) : (
              <div className="email-auth-form">
                <button
                  type="button"
                  className="auth-back-button"
                  onClick={showAuthChoices}
                  disabled={busy}
                >
                  <ArrowLeft aria-hidden="true" /> ย้อนกลับ
                </button>
                <h3>เข้าสู่ระบบหรือสมัครด้วย EMAIL</h3>
                <label htmlFor="auth-email">อีเมล</label>
                <div className="auth-input-wrap">
                  <Mail aria-hidden="true" />
                  <input
                    id="auth-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    spellCheck={false}
                    disabled={otpSent || busy}
                  />
                </div>
                {otpSent ? (
                  <>
                    <label htmlFor="auth-otp">รหัส OTP 6 หลัก</label>
                    <input
                      id="auth-otp"
                      name="otp"
                      className="otp-input"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otp}
                      onChange={(event) =>
                        setOtp(event.target.value.replace(/\D/g, ""))
                      }
                      placeholder="000000"
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      className="auth-button primary-auth-button"
                      onClick={verifyOtp}
                      disabled={busy || otp.length !== 6}
                      aria-busy={busyAction === "verify-otp"}
                    >
                      {busyAction === "verify-otp" ? (
                        <>
                          <LoaderCircle className="spin" aria-hidden="true" />
                          กำลังตรวจสอบรหัส…
                        </>
                      ) : (
                        <>
                          ยืนยันและเริ่มเล่น <ArrowRight aria-hidden="true" />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
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
                      type="button"
                      className="auth-button primary-auth-button"
                      onClick={sendOtp}
                      disabled={
                        busy ||
                        !email.includes("@") ||
                        Boolean(turnstileSiteKey && !captchaToken)
                      }
                      aria-busy={busyAction === "send-otp"}
                    >
                      {busyAction === "send-otp" ? (
                        <>
                          <LoaderCircle className="spin" aria-hidden="true" />
                          กำลังส่งรหัส OTP…
                        </>
                      ) : (
                        <>
                          ส่งรหัส OTP ทางอีเมล <ArrowRight aria-hidden="true" />
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

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
