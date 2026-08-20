import { redirect } from "next/navigation";

import { requireFantasyProfile } from "@/lib/auth/context";

export default async function CompleteAuthenticationPage() {
  const profile = await requireFantasyProfile();
  redirect(
    profile.created && !profile.isAnonymous ? "/profile?setup=1" : "/dashboard",
  );
}
