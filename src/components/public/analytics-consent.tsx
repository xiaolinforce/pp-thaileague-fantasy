"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/fantasy/i18n";
import { useAppIdentity } from "@/components/fantasy/identity";
import {
  ANALYTICS_ID,
  CONSENT_KEY,
  SIGNUP_COOKIE,
  analyticsPath,
  trackEvent,
} from "@/lib/analytics";
import styles from "./public.module.css";

function consentSnapshot() {
  if (
    window.location.hostname !== "fantasy.ppfootball.net" ||
    !/^G-[A-Z0-9]+$/.test(ANALYTICS_ID)
  )
    return "unavailable";
  try {
    return localStorage.getItem(CONSENT_KEY) || "unset";
  } catch {
    return "denied";
  }
}
function subscribeConsent(notify: () => void) {
  const sync = (event: StorageEvent) => {
    if (event.key !== CONSENT_KEY) return;
    if (window.gtag) window.location.reload();
    else notify();
  };
  window.addEventListener("storage", sync);
  window.addEventListener("fantasy-consent", notify);
  return () => {
    window.removeEventListener("storage", sync);
    window.removeEventListener("fantasy-consent", notify);
  };
}

export function AnalyticsConsent() {
  const pathname = usePathname();
  const identity = useAppIdentity();
  const { language } = useLanguage();
  const th = language === "th";
  const choice = useSyncExternalStore(
    subscribeConsent,
    consentSnapshot,
    () => "unavailable",
  );
  const available = choice !== "unavailable";
  const [editing, setEditing] = useState(false);
  const lastPage = useRef<string | null>(null);

  useEffect(() => {
    const path = analyticsPath(pathname);
    const enabled =
      available &&
      choice === "granted" &&
      identity?.role !== "admin" &&
      Boolean(path);
    window.fantasyAnalyticsEnabled = enabled;
    (window as unknown as Record<string, unknown>)[
      `ga-disable-${ANALYTICS_ID}`
    ] = !enabled;
    if (!enabled || !path) return;
    if (!window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        // Preserve the documented gtag command queue's Arguments shape.
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer!.push(arguments);
      };
      window.gtag("consent", "default", {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      window.gtag("js", new Date());
      window.gtag("config", ANALYTICS_ID, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_domain: "none",
        cookie_expires: 60 * 60 * 24 * 90,
        page_location: `https://fantasy.ppfootball.net${path}`,
        page_referrer: "",
        page_title: path,
      });
      const script = document.createElement("script");
      script.id = "fantasy-analytics";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}`;
      document.head.appendChild(script);
    }
    const previous = document.referrer
      ? (() => {
          try {
            return new URL(document.referrer).origin;
          } catch {
            return "";
          }
        })()
      : "";
    window.gtag("set", {
      page_location: `https://fantasy.ppfootball.net${path}`,
      page_title: path,
      page_referrer: previous,
    });
    if (lastPage.current !== path) {
      window.gtag("event", "page_view", {
        page_location: `https://fantasy.ppfootball.net${path}`,
        page_title: path,
        page_referrer: previous,
      });
      lastPage.current = path;
    }
    if (
      identity &&
      !identity.isGuest &&
      document.cookie.split("; ").includes(`${SIGNUP_COOKIE}=1`)
    ) {
      document.cookie = `${SIGNUP_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
      trackEvent("sign_up");
    }
  }, [available, choice, identity, pathname]);

  function choose(value: "granted" | "denied") {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      return;
    }
    document.cookie = `${CONSENT_KEY}=${value}; Max-Age=7776000; Path=/; SameSite=Lax; Secure`;
    window.dispatchEvent(new Event("fantasy-consent"));
    setEditing(false);
    if (value === "denied" && window.gtag) {
      // Reload removes the already-loaded library and its automatic listeners.
      for (const cookie of document.cookie.split(";")) {
        const name = cookie.split("=")[0].trim();
        if (name === "_ga" || name.startsWith("_ga_"))
          document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
      }
      window.location.reload();
    }
  }

  if (!available || identity?.role === "admin" || !analyticsPath(pathname))
    return null;
  if (choice !== "unset" && !editing)
    return pathname === "/privacy" || pathname === "/settings" ? (
      <div className={styles.consentManage}>
        <button className="secondary-button" onClick={() => setEditing(true)}>
          {th ? "ตั้งค่าคุกกี้วิเคราะห์" : "Analytics cookie settings"}
        </button>
      </div>
    ) : null;
  return (
    <aside
      className={styles.consent}
      aria-label={th ? "คุกกี้วิเคราะห์" : "Analytics cookies"}
      data-localize="off"
    >
      <p>
        {th
          ? "อนุญาตคุกกี้ Google Analytics เพื่อช่วยปรับปรุงเว็บและวัดการเริ่มเล่นหรือไม่? คุณเล่นได้ตามปกติแม้ไม่อนุญาต และเปลี่ยนใจได้ที่หน้าความเป็นส่วนตัว"
          : "Allow Google Analytics cookies to help improve the site and measure how people start playing? You can play without accepting and change your choice on the Privacy page."}{" "}
        <Link href="/privacy">{th ? "รายละเอียด" : "Details"}</Link>
      </p>
      <div className={styles.actions}>
        <button className="secondary-button" onClick={() => choose("denied")}>
          {th ? "ไม่อนุญาต" : "Decline"}
        </button>
        <button className="secondary-button" onClick={() => choose("granted")}>
          {th ? "อนุญาต" : "Allow"}
        </button>
      </div>
    </aside>
  );
}
