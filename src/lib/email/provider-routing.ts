export const ACTIVE_EMAIL_PROVIDERS = ["resend", "mailjet"] as const;

export type EmailProviderName = (typeof ACTIVE_EMAIL_PROVIDERS)[number];

const activeProviders = new Set<string>(ACTIVE_EMAIL_PROVIDERS);

export function resolveEmailProviderOrder(
  configuredOrder: string | undefined,
): EmailProviderName[] {
  const requested = (configuredOrder ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const unsupported = requested.filter(
    (provider) => !activeProviders.has(provider),
  );
  if (unsupported.length > 0) {
    throw new Error(
      `Unsupported transactional email provider: ${[...new Set(unsupported)].join(", ")}.`,
    );
  }

  const order =
    requested.length > 0
      ? (requested as EmailProviderName[])
      : [...ACTIVE_EMAIL_PROVIDERS];
  return [...new Set(order)];
}

export function shouldTryNextProvider(status: number) {
  return status >= 500 || [402, 403, 429].includes(status);
}
