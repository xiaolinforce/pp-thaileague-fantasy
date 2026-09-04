import "server-only";

import { createHash } from "node:crypto";

import { and, count, desc, eq, gte } from "drizzle-orm";

import { db } from "@/db";
import { authEmailDeliveries } from "@/db/schema";
import {
  resolveEmailProviderOrder,
  shouldTryNextProvider,
  type EmailProviderName,
} from "@/lib/email/provider-routing";
import { acceptedMessageId, quotaState } from "@/lib/email/delivery-policy";
import { reportEmailEvent } from "@/lib/email/alerts";

type ProviderConfig = {
  name: EmailProviderName;
  dailyLimit: number;
  monthlyLimit: number;
  configured: boolean;
};

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getProviderConfigs(): ProviderConfig[] {
  const byName: Record<EmailProviderName, ProviderConfig> = {
    resend: {
      name: "resend",
      dailyLimit: positiveInteger(process.env.RESEND_DAILY_LIMIT, 100),
      monthlyLimit: positiveInteger(process.env.RESEND_MONTHLY_LIMIT, 3000),
      configured: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
    },
    mailjet: {
      name: "mailjet",
      dailyLimit: positiveInteger(process.env.MAILJET_DAILY_LIMIT, 200),
      monthlyLimit: positiveInteger(process.env.MAILJET_MONTHLY_LIMIT, 6000),
      configured: Boolean(
        process.env.MAILJET_API_KEY &&
        process.env.MAILJET_SECRET_KEY &&
        process.env.EMAIL_FROM,
      ),
    },
  };
  return resolveEmailProviderOrder(process.env.AUTH_EMAIL_PROVIDERS).map(
    (name) => byName[name],
  );
}

function utcBoundaries(now: Date) {
  const day = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { day, month };
}

async function acceptedCount(provider: EmailProviderName, since: Date) {
  const rows = await db
    .select({ value: count() })
    .from(authEmailDeliveries)
    .where(
      and(
        eq(authEmailDeliveries.provider, provider),
        eq(authEmailDeliveries.status, "accepted"),
        gte(authEmailDeliveries.createdAt, since),
      ),
    );
  return rows[0]?.value ?? 0;
}

async function providerUsage(config: ProviderConfig, now: Date) {
  const { day, month } = utcBoundaries(now);
  const [daily, monthly] = await Promise.all([
    acceptedCount(config.name, day),
    acceptedCount(config.name, month),
  ]);
  return { daily, monthly };
}

async function lastDelivery(provider: EmailProviderName) {
  const [last] = await db
    .select({
      status: authEmailDeliveries.status,
      createdAt: authEmailDeliveries.createdAt,
    })
    .from(authEmailDeliveries)
    .where(eq(authEmailDeliveries.provider, provider))
    .orderBy(desc(authEmailDeliveries.createdAt))
    .limit(1);
  return last;
}

export async function isAuthenticationEmailAvailable() {
  try {
    const providers = getProviderConfigs().filter(
      (provider) => provider.configured,
    );
    const available = await Promise.all(
      providers.map(async (provider) => {
        const [usage, last] = await Promise.all([
          providerUsage(provider, new Date()),
          lastDelivery(provider.name),
        ]);
        return (
          quotaState(usage, provider) !== "exhausted" &&
          !(
            last?.status === "failed" &&
            Date.now() - last.createdAt.getTime() < 60_000
          )
        );
      }),
    );
    return available.some(Boolean);
  } catch {
    return false;
  }
}

function recipientHash(email: string) {
  const salt =
    process.env.AUTH_EMAIL_HASH_SECRET ?? process.env.BETTER_AUTH_SECRET;
  if (!salt) throw new Error("AUTH_EMAIL_HASH_SECRET is not configured.");
  return createHash("sha256")
    .update(`${salt}:${email.trim().toLowerCase()}`)
    .digest("hex");
}

function sender() {
  const email = process.env.EMAIL_FROM;
  if (!email) throw new Error("EMAIL_FROM is not configured.");
  return {
    email,
    name: process.env.EMAIL_FROM_NAME ?? "PP Thai League Fantasy",
  };
}

async function sendWithProvider(
  provider: EmailProviderName,
  input: { to: string; subject: string; text: string; html: string },
) {
  const from = sender();
  let url: string;
  let headers: Record<string, string>;
  let body: unknown;
  if (provider === "resend") {
    url = "https://api.resend.com/emails";
    headers = {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    };
    body = {
      from: `${from.name} <${from.email}>`,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,
    };
  } else {
    url = "https://api.mailjet.com/v3.1/send";
    const credentials = Buffer.from(
      `${process.env.MAILJET_API_KEY}:${process.env.MAILJET_SECRET_KEY}`,
    ).toString("base64");
    headers = {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    };
    body = {
      Messages: [
        {
          From: { Email: from.email, Name: from.name },
          To: [{ Email: input.to }],
          Subject: input.subject,
          TextPart: input.text,
          HTMLPart: input.html,
        },
      ],
    };
  }
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  const responseBody = (await response.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!response.ok) {
    const error = new Error(
      `${provider} rejected the email (${response.status}).`,
    );
    Object.assign(error, { status: response.status });
    throw error;
  }
  return acceptedMessageId(provider, responseBody);
}

export async function sendAuthenticationOtp(input: {
  email: string;
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password" | "change-email";
}) {
  try {
    await deliverAuthenticationOtp(input);
  } catch (error) {
    reportEmailEvent("unavailable");
    throw error;
  }
}

async function deliverAuthenticationOtp(input: {
  email: string;
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password" | "change-email";
}) {
  if (process.env.AUTH_EMAIL_ENABLED !== "true") {
    throw new Error("Email sign-in is not enabled in this environment.");
  }
  if (
    process.env.NODE_ENV === "production" &&
    process.env.AUTH_PRODUCTION_READY !== "true"
  ) {
    throw new Error(
      "Production authentication readiness has not been approved.",
    );
  }
  if (
    !process.env.TURNSTILE_SECRET_KEY ||
    !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  ) {
    throw new Error(
      "Turnstile must be configured before email sign-in is enabled.",
    );
  }
  const hash = recipientHash(input.email);
  const providers = getProviderConfigs().filter(
    (provider) => provider.configured,
  );
  if (providers.length === 0) {
    throw new Error("No transactional email provider is configured.");
  }
  const subject = `${input.otp} คือรหัสเข้าใช้ PP Thai League Fantasy`;
  const text = `รหัส OTP ของคุณคือ ${input.otp} รหัสนี้มีอายุ 5 นาที หากคุณไม่ได้ขอรหัสนี้ ไม่ต้องดำเนินการใด ๆ`;
  const html = `<p>รหัส OTP สำหรับเข้าใช้ <strong>PP Thai League Fantasy</strong></p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${input.otp}</p><p>รหัสนี้มีอายุ 5 นาที หากคุณไม่ได้ขอรหัสนี้ ไม่ต้องดำเนินการใด ๆ</p>`;
  let lastFailure: Error | null = null;
  for (const [index, provider] of providers.entries()) {
    const usage = await providerUsage(provider, new Date());
    if (quotaState(usage, provider) === "exhausted") {
      reportEmailEvent("quota_exhausted", provider.name, {
        ...usage,
        dailyLimit: provider.dailyLimit,
        monthlyLimit: provider.monthlyLimit,
      });
      await db.insert(authEmailDeliveries).values({
        provider: provider.name,
        status: "skipped_quota",
        recipientHash: hash,
        purpose: input.type,
      });
      continue;
    }
    const previousDelivery = await lastDelivery(provider.name);
    try {
      const providerMessageId = await sendWithProvider(provider.name, {
        to: input.email,
        subject,
        text,
        html,
      });
      await db
        .insert(authEmailDeliveries)
        .values({
          provider: provider.name,
          status: "accepted",
          recipientHash: hash,
          purpose: input.type,
          providerMessageId,
        })
        .catch(() => reportEmailEvent("delivery_log_failed", provider.name));
      if (index > 0) reportEmailEvent("fallback_used", provider.name);
      if (previousDelivery && previousDelivery.status !== "accepted") {
        reportEmailEvent("recovered", provider.name);
      }
      const nextUsage = { daily: usage.daily + 1, monthly: usage.monthly + 1 };
      const nextState = quotaState(nextUsage, provider);
      if (
        nextState !== quotaState(usage, provider) &&
        nextState !== "available"
      ) {
        reportEmailEvent(
          nextState === "exhausted" ? "quota_exhausted" : "near_quota",
          provider.name,
          {
            ...nextUsage,
            dailyLimit: provider.dailyLimit,
            monthlyLimit: provider.monthlyLimit,
          },
        );
      }
      return;
    } catch (error) {
      lastFailure = error instanceof Error ? error : new Error(String(error));
      const status = Number(
        (error as (Error & { status?: number }) | undefined)?.status ?? 0,
      );
      reportEmailEvent("provider_failed", provider.name, { status });
      await db.insert(authEmailDeliveries).values({
        provider: provider.name,
        status: "failed",
        recipientHash: hash,
        purpose: input.type,
        errorCode: status ? String(status) : "provider_error",
      });
      if (!status) {
        throw new Error(
          "Email delivery status is unknown, so no duplicate was sent through another provider.",
        );
      }
      if (!shouldTryNextProvider(status)) {
        throw lastFailure;
      }
    }
  }
  throw (
    lastFailure ?? new Error("All email providers are unavailable or at quota.")
  );
}
