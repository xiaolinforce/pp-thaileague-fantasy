export type DeadlineLabels = Record<"th" | "en", string>;

function getDateParts(
  date: Date,
  locale: string,
  options: Intl.DateTimeFormatOptions,
) {
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
}

// Call on the server and serialize both labels with the page. Formatting the
// same date independently in Node and a mobile browser can use different ICU
// abbreviations, which makes otherwise identical HTML fail hydration.
export function getDeadlineLabels(deadlineAt: string): DeadlineLabels {
  const date = new Date(deadlineAt);
  const th = getDateParts(date, "th-TH", { weekday: "short" });
  const en = getDateParts(date, "en-GB", { year: "numeric" });
  return {
    th: `${th("weekday")}ที่ ${th("day")} ${th("month")} ${th("hour")}:${th("minute")}`,
    en: `${en("day")} ${en("month").slice(0, 3)} ${en("year")}, ${en("hour")}:${en("minute")}`,
  };
}

export function getReminderDeadlineLabels(deadlineAt: string): DeadlineLabels {
  const date = new Date(deadlineAt);
  const th = getDateParts(date, "th-TH", { weekday: "long" });
  const en = getDateParts(date, "en-GB", {
    weekday: "short",
    year: "numeric",
  });

  return {
    th: `${th("weekday").replace(/^วัน/, "")}ที่ ${th("day")} ${th("month")} ${th("hour")}:${th("minute")} น.`,
    en: `${en("weekday")} ${en("day")} ${en("month").slice(0, 3)} ${en("year")}, ${en("hour")}:${en("minute")} (Bangkok time)`,
  };
}
