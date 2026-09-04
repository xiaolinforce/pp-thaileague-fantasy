export type DeadlineLabels = Record<"th" | "en", string>;

// Call on the server and serialize both labels with the page. Formatting the
// same date independently in Node and a mobile browser can use different ICU
// abbreviations, which makes otherwise identical HTML fail hydration.
export function getDeadlineLabels(deadlineAt: string): DeadlineLabels {
  const date = new Date(deadlineAt);
  const parts = (locale: string, options: Intl.DateTimeFormatOptions) => {
    const formatted = new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "Asia/Bangkok",
      ...options,
    }).formatToParts(date);
    return (type: Intl.DateTimeFormatPartTypes) =>
      formatted.find((part) => part.type === type)?.value ?? "";
  };
  const th = parts("th-TH", { weekday: "short" });
  const en = parts("en-GB", { year: "numeric" });
  return {
    th: `${th("weekday")}ที่ ${th("day")} ${th("month")} ${th("hour")}:${th("minute")}`,
    en: `${en("day")} ${en("month").slice(0, 3)} ${en("year")}, ${en("hour")}:${en("minute")}`,
  };
}
