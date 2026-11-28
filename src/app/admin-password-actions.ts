"use server";

import { redirect } from "next/navigation";

import {
  ADMIN_PASSWORD_LOGIN_PATH,
  endAdminPasswordSession,
  startAdminPasswordSession,
} from "@/lib/auth/admin-password";

type AdminPasswordState = {
  error: "invalid" | "limited" | "unavailable" | null;
};

export async function signInAdminWithPassword(
  _previousState: AdminPasswordState,
  formData: FormData,
): Promise<AdminPasswordState> {
  const password = formData.get("password");
  if (typeof password !== "string" || !password) return { error: "invalid" };

  const error = await startAdminPasswordSession(password);
  if (error) return { error };

  redirect("/admin/fantasy");
}

export async function signOutAdminWithPassword() {
  await endAdminPasswordSession();
  redirect(ADMIN_PASSWORD_LOGIN_PATH);
}
