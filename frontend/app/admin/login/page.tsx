import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default async function AdminLoginPage() {
  const admin = await getAdminSession();
  if (admin) redirect("/admin");
  return <AdminLoginForm />;
}
