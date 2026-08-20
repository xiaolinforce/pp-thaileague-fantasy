"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Gamepad2,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Brand } from "@/components/fantasy/app-shell";
import { Localized } from "@/components/fantasy/i18n";
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
        <section className="onboarding-hero">
          <Brand />
          <div className="onboarding-kicker">PP THAI LEAGUE FANTASY</div>
          <h1>
            {upgradeMode
              ? "เก็บทีม Guest นี้ไว้กับบัญชีของคุณ"
              : "จัดทีมไทยลีกในฝัน แล้ววัดฝีมือตลอดฤดูกาล"}
          </h1>
          <p>
            เริ่มเล่นได้ทันที
            หรือเข้าสู่ระบบเพื่อเก็บทีมไว้อย่างปลอดภัยและเล่นต่อได้ทุกอุปกรณ์
          </p>
          <ul>
            <li>
              <CheckCircle2 /> ทีมและคะแนนผูกกับบัญชี
            </li>
            <li>
              <CheckCircle2 /> ตั้งชื่อผู้จัดการและชื่อทีมได้
            </li>
            <li>
              <CheckCircle2 /> เข้าต่อจากมือถือหรือคอมพิวเตอร์เครื่องอื่น
            </li>
          </ul>
        </section>

        <section className="onboarding-panel" aria-labelledby="start-title">
          <div className="onboarding-panel-heading">
            <span>
              <Gamepad2 />
            </span>
            <div>
              <p>พร้อมลงสนาม</p>
              <h2 id="start-title">
                {upgradeMode
                  ? "สมัครสมาชิกหรือเข้าสู่ระบบ"
                  : "เลือกวิธีเริ่มเล่น"}
              </h2>
            </div>
          </div>

          <div className="member-card">
            <div className="member-card-title">
              <ShieldCheck />
              <div>
                <strong>เข้าสู่ระบบหรือสมัครสมาชิก</strong>
                <small>แนะนำ — ไม่มีรหัสผ่าน</small>
              </div>
            </div>

            {googleEnabled && (
              <button
                className="auth-button google-button"
                onClick={signInWithGoogle}
                disabled={busy}
              >
                <span className="google-g">G</span>
                ดำเนินการต่อด้วย Google
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
            <div className="guest-card">
              <div className="guest-warning">
                <AlertTriangle />
                <div>
                  <strong>เล่นต่อโดยไม่สมัครสมาชิก</strong>
                  <p>
                    เล่นได้บนอุปกรณ์และเบราว์เซอร์นี้เท่านั้น
                    ข้อมูลอาจเข้าถึงไม่ได้หากล้างคุกกี้หรือไม่ได้กลับมาเล่นภายใน
                    30 วัน และระบบจะสุ่มชื่อให้โดยเปลี่ยนไม่ได้
                  </p>
                </div>
              </div>
              <label className="guest-confirmation">
                <input
                  type="checkbox"
                  checked={guestAccepted}
                  onChange={(event) => setGuestAccepted(event.target.checked)}
                />
                ฉันเข้าใจความเสี่ยงและต้องการเริ่มแบบ Guest
              </label>
              <button
                className="auth-button guest-button"
                onClick={playAsGuest}
                disabled={busy || !guestAccepted}
              >
                เริ่มเล่นเลย <ArrowRight />
              </button>
            </div>
          )}

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <p className="auth-legal">
            ระบบสมาชิก production
            จะเปิดหลังจากยืนยันโดเมนและเผยแพร่เงื่อนไขการใช้งานกับนโยบายความเป็นส่วนตัวแล้ว
          </p>
        </section>
      </main>
    </Localized>
  );
}
