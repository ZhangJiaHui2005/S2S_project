"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  admin: {
    fullName: string;
    email: string;
    adminId?: number;
  };
}

export function AdminHeader({ admin }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left side: System Status */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Hệ thống hoạt động bình thường
        </div>
        <span className="text-xs text-slate-500 hidden sm:inline-block">
          S2S Escrow Network • v1.0.0
        </span>
      </div>

      {/* Right side: Admin profile info & Logout */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col text-right">
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-xs font-semibold text-slate-200">
              {admin.fullName || "Quản trị viên"}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Administrator
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {admin.email}
          </span>
        </div>

        <div className="h-8 w-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-xs">
          {admin.fullName ? admin.fullName.charAt(0).toUpperCase() : "A"}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-red-950/50 hover:text-red-300 hover:border-red-800 text-xs flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </Button>
      </div>
    </header>
  );
}
