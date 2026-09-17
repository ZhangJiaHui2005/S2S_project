"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  PackageCheck,
  ArrowLeftRight,
  KeyRound,
  ExternalLink,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    title: "Tổng quan (Dashboard)",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Quản lý người dùng",
    href: "/admin/users",
    icon: Users,
    badge: "Core",
  },
  {
    title: "Kiểm duyệt vật phẩm",
    href: "/admin/items",
    icon: PackageCheck,
  },
  {
    title: "Giao dịch Escrow & QR",
    href: "/admin/transactions",
    icon: ArrowLeftRight,
    badge: "ACID",
  },
  {
    title: "Đổi mật khẩu / Bảo mật",
    href: "/admin#password-section",
    icon: KeyRound,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between flex-shrink-0 min-h-screen text-slate-200">
      <div>
        {/* Brand header */}
        <div className="h-16 px-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              S2S Portal
              <span className="text-[10px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded font-mono">
                ADMIN
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Quản trị trao đổi Campus</p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Phân hệ Quản trị
          </div>

          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group",
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-400"
                    )}
                  />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                      isActive
                        ? "bg-indigo-700 text-indigo-100"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 flex flex-col gap-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-md bg-slate-900/60 hover:bg-slate-900 text-slate-300 transition-colors border border-slate-800"
        >
          <span className="text-xs">Trang chủ S2S</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </Link>
        <p className="text-[10px] text-center text-slate-600">
          S2S Project © 2026 Admin Portal
        </p>
      </div>
    </aside>
  );
}
