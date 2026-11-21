/** Request-time relative deadline copy for admin task lists. */
export function remainingLabel(target: Date, now: Date) {
  const diff = target.getTime() - now.getTime();
  const passed = diff < 0;
  const minutes = Math.max(1, Math.round(Math.abs(diff) / 60_000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  const th = days
    ? `${days} วัน ${hours} ชม.`
    : hours
      ? `${hours} ชม. ${mins} นาที`
      : `${mins} นาที`;
  const en = days
    ? `${days}d ${hours}h`
    : hours
      ? `${hours}h ${mins}m`
      : `${mins}m`;
  return {
    passed,
    urgent: !passed && diff < 24 * 60 * 60_000,
    th: passed ? `เลยมาแล้ว ${th}` : `เหลือ ${th}`,
    en: passed ? `${en} ago` : `${en} left`,
  };
}

export const positionShort: Record<string, string> = {
  goalkeeper: "GK",
  defender: "DEF",
  midfielder: "MID",
  forward: "FWD",
};
