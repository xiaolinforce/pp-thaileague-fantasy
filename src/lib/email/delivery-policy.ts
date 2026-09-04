export type EmailUsage = { daily: number; monthly: number };
export type EmailLimits = { dailyLimit: number; monthlyLimit: number };

export function quotaState(usage: EmailUsage, limits: EmailLimits) {
  if (
    usage.daily >= Math.floor(limits.dailyLimit * 0.9) ||
    usage.monthly >= Math.floor(limits.monthlyLimit * 0.9)
  )
    return "exhausted";
  if (
    usage.daily >= Math.floor(limits.dailyLimit * 0.8) ||
    usage.monthly >= Math.floor(limits.monthlyLimit * 0.8)
  )
    return "near_quota";
  return "available";
}

// A successful HTTP response is not sufficient: Mailjet reports per-message
// errors in Messages, and malformed responses have an unknown delivery outcome.
export function acceptedMessageId(
  provider: "resend" | "mailjet",
  body: unknown,
) {
  const value = body as {
    id?: string;
    Messages?: Array<{
      Status?: string;
      Errors?: Array<{ StatusCode?: number }>;
      To?: Array<{ MessageID?: string | number }>;
    }>;
  } | null;
  if (provider === "resend" && value?.id) return value.id;
  const message = value?.Messages?.[0];
  if (provider === "mailjet") {
    if (message?.Status === "error") {
      throw Object.assign(new Error("Mailjet rejected the message."), {
        status: message.Errors?.[0]?.StatusCode ?? 400,
      });
    }
    if (message?.Status === "success" && message.To?.[0]?.MessageID) {
      return String(message.To[0].MessageID);
    }
  }
  throw new Error("Email delivery outcome is unknown.");
}
