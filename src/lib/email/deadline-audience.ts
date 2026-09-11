export const deadlineAudienceOptions = [
  {
    id: "previous-complete",
    label: "บันทึกทีมครบใน GW ก่อนหน้า",
    description:
      "เฉพาะสมาชิกที่กดบันทึกทีมครบ 15 คนใน Gameweek ก่อนหน้า เหมาะสำหรับการเตือนผู้เล่นที่เพิ่งมีส่วนร่วม",
  },
  {
    id: "ever-complete",
    label: "เคยบันทึกทีมครบอย่างน้อยหนึ่ง GW",
    description:
      "สมาชิกที่เคยกดบันทึกทีมครบ 15 คนในฤดูกาลนี้ แม้ไม่ได้บันทึกซ้ำใน Gameweek ก่อนหน้า",
  },
  {
    id: "all-members",
    label: "สมาชิกทุกคนที่มีทีม",
    description:
      "สมาชิกที่มีทีมใช้งานอยู่ทั้งหมด รวมทีมที่ยังจัดไม่ครบ แต่ไม่รวม Guest, Bot และอีเมลที่ยังไม่ยืนยัน",
  },
] as const;

export type DeadlineAudienceId = (typeof deadlineAudienceOptions)[number]["id"];

export const defaultDeadlineAudience: DeadlineAudienceId = "previous-complete";

export function parseDeadlineAudience(value: string): DeadlineAudienceId {
  return (
    deadlineAudienceOptions.find((option) => option.id === value)?.id ??
    defaultDeadlineAudience
  );
}

export function maskRecipientEmail(email: string) {
  const separator = email.lastIndexOf("@");
  if (separator <= 0 || separator === email.length - 1) return "•••";

  const local = email.slice(0, separator);
  const domain = email.slice(separator + 1);
  const maskLength = Math.min(Math.max(local.length - 1, 2), 4);

  return `${local.slice(0, 1)}${"•".repeat(maskLength)}@${domain}`;
}

export function redactDeadlineRecipient<T extends { email: string }>(
  recipient: T,
): Omit<T, "email"> & { maskedEmail: string } {
  const { email, ...safeRecipient } = recipient;
  return {
    ...safeRecipient,
    maskedEmail: maskRecipientEmail(email),
  };
}
