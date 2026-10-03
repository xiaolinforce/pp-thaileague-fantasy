export const ANALYTICS_ID =
  process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || "G-BRD4T65GNK";
export const CONSENT_KEY = "pp-fantasy-analytics";
export const SIGNUP_COOKIE = "pp-fantasy-sign-up";
export type AnalyticsEvent = "guest_start" | "sign_up" | "first_squad_saved";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fantasyAnalyticsEnabled?: boolean;
  }
}

export function analyticsPath(path: string): string | null {
  const clean = path.split(/[?#]/)[0];
  if (/^\/(admin|auth|api|email|upgrade)(\/|$)/.test(clean)) return null;
  if (/^\/leagues\/[^/]+/.test(clean)) return "/leagues/detail";
  return [
    "/",
    "/how-to-play",
    "/rules",
    "/help",
    "/privacy",
    "/terms",
    "/team",
    "/points",
    "/fixtures",
    "/leagues",
    "/profile",
    "/settings",
    "/thai-league/2026-27/fixtures",
  ].includes(clean)
    ? clean
    : null;
}

export function hasAnalyticsConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}

export function trackEvent(name: AnalyticsEvent) {
  if (
    typeof window === "undefined" ||
    !window.fantasyAnalyticsEnabled ||
    !hasAnalyticsConsent() ||
    !window.gtag
  )
    return;
  const path = analyticsPath(window.location.pathname);
  if (!path) return;
  window.gtag("event", name, {
    page_location: `https://fantasy.ppfootball.net${path}`,
    page_title: path,
    page_referrer: "",
  });
}
