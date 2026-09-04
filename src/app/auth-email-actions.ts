"use server";

import { authFeatures } from "@/lib/auth/server";
import { isAuthenticationEmailAvailable } from "@/lib/email/transactional";

export async function checkEmailAvailabilityAction() {
  return authFeatures.email && (await isAuthenticationEmailAvailable());
}
