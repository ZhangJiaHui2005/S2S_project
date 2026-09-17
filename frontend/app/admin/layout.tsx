import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata = {
  title: "Cổng Quản Trị Hệ Thống S2S",
  description: "Bảng điều khiển và quản trị nền tảng trao đổi S2S",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // If on login page, render clean layout without sidebar/header
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Verify Admin Session on server
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex antialiased">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900/30">
        <AdminHeader admin={admin} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
