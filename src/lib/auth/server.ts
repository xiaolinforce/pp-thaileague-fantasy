import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { anonymous, captcha, emailOTP } from "better-auth/plugins";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendAuthenticationOtp } from "@/lib/email/transactional";
import { linkAnonymousFantasyProfile } from "@/lib/fantasy/provisioning";

const THIRTY_DAYS = 60 * 60 * 24 * 30;
const ONE_DAY = 60 * 60 * 24;
const productionAuthAllowed =
  process.env.NODE_ENV !== "production" ||
  process.env.AUTH_PRODUCTION_READY === "true";

const googleEnabled =
  productionAuthAllowed &&
  process.env.AUTH_GOOGLE_ENABLED === "true" &&
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const turnstileEnabled = Boolean(
  process.env.TURNSTILE_SECRET_KEY &&
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
);
const emailEnabled =
  productionAuthAllowed &&
  process.env.AUTH_EMAIL_ENABLED === "true" &&
  turnstileEnabled;

const authPlugins = [
  anonymous({
    generateName: () => `guest-${crypto.randomUUID().slice(0, 6)}`,
    generateRandomEmail: () => `${crypto.randomUUID()}@guest.invalid`,
    onLinkAccount: async ({ anonymousUser, newUser }) => {
      await linkAnonymousFantasyProfile({
        anonymousUserId: anonymousUser.user.id,
        memberUserId: newUser.user.id,
      });
    },
  }),
  emailOTP({
    async sendVerificationOTP(data) {
      await sendAuthenticationOtp(data);
    },
    otpLength: 6,
    expiresIn: 300,
    allowedAttempts: 3,
    storeOTP: "hashed",
    resendStrategy: "rotate",
    overrideDefaultEmailVerification: true,
    rateLimit: { window: 60, max: 3 },
  }),
  ...(turnstileEnabled
    ? [
        captcha({
          provider: "cloudflare-turnstile" as const,
          secretKey: process.env.TURNSTILE_SECRET_KEY!,
          endpoints: ["/email-otp/send-verification-otp"],
        }),
      ]
    : []),
  nextCookies(),
];

export const auth = betterAuth({
  appName: "PP Thai League Fantasy",
  baseURL:
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3006",
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    transaction: false,
  }),
  emailAndPassword: { enabled: false },
  socialProviders: googleEnabled
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {},
  user: {
    modelName: "authUsers",
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "member",
        input: false,
      },
    },
  },
  session: {
    modelName: "authSessions",
    expiresIn: THIRTY_DAYS,
    updateAge: ONE_DAY,
  },
  account: {
    modelName: "authAccounts",
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      requireLocalEmailVerified: true,
      allowDifferentEmails: false,
      allowUnlinkingAll: false,
    },
  },
  verification: { modelName: "authVerifications" },
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "authRateLimits",
    window: 60,
    max: 100,
    customRules: {
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
      "/sign-in/email-otp": { window: 60, max: 10 },
      "/sign-in/anonymous": { window: 60, max: 10 },
    },
  },
  plugins: authPlugins,
});

export const authFeatures = {
  email: emailEnabled,
  google: googleEnabled,
  turnstile: turnstileEnabled,
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null,
};
