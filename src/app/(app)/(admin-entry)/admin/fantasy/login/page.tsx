import { isAdminPasswordEnabled } from "@/lib/auth/admin-password";
import { AdminPasswordForm } from "./password-form";

export default async function AdminPasswordLoginPage() {
  return <AdminPasswordForm enabled={await isAdminPasswordEnabled()} />;
}
