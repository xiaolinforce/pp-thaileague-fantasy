import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getCurrentFantasyIdentity } from "@/lib/auth/context";
import { parseInterfaceLanguage } from "@/lib/auth/preferences";

export const getDeviceLanguage = cache(async () =>
  parseInterfaceLanguage((await cookies()).get("thai-fantasy-language")?.value),
);
export const getRequestLanguage = cache(async () => {
  const [identity, deviceLanguage] = await Promise.all([
    getCurrentFantasyIdentity(),
    getDeviceLanguage(),
  ]);
  if (process.env.NODE_ENV === "development" && deviceLanguage)
    return deviceLanguage;
  return (
    (!identity?.isAnonymous &&
      parseInterfaceLanguage(identity?.manager?.preferredLanguage)) ||
    deviceLanguage ||
    "th"
  );
});
