import { redirect } from "next/navigation";

import { requireFantasyProfile } from "@/lib/auth/context";

export default async function CompleteAuthenticationPage() {
  await requireFantasyProfile();
  redirect("/team");
}
