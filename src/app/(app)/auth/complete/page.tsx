import { redirect } from "next/navigation";

import { requireFantasyProfile } from "@/lib/auth/context";
import { normalizeAuthReturnTo } from "@/lib/auth/return-to";

export default async function CompleteAuthenticationPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const query = await searchParams;
  await requireFantasyProfile();
  redirect(normalizeAuthReturnTo(query.returnTo));
}
