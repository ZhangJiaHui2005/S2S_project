"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "next-themes";

interface AdminHeaderProps {
  admin: { fullName: string; email: string; adminId?: number };
}

export function AdminHeader({ admin }: AdminHeaderProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) throw new Error("Đăng xuất thất bại.");
      router.push("/admin/login");
      router.refresh();
    } catch {
      setLogoutError("Không thể đăng xuất. Vui lòng thử lại.");
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger aria-label="Đóng/mở thanh điều hướng" />
        <Separator orientation="vertical" className="h-4" />
        <span className="text-sm font-medium">Quản trị S2S</span>
      </div>
      <div className="flex items-center gap-3">
        {logoutError && (
          <span role="alert" className="text-xs text-destructive">
            {logoutError}
          </span>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <div className="hidden text-right text-sm md:block">
          <p className="font-medium">{admin.fullName || "Quản trị viên"}</p>
          <p className="text-xs text-muted-foreground">{admin.email}</p>
        </div>
        <Avatar>
          <AvatarFallback>
            {admin.fullName?.charAt(0).toUpperCase() || "A"}
          </AvatarFallback>
        </Avatar>
        <Button
          variant="destructive"
          size="sm"
          disabled={loggingOut}
          onClick={handleLogout}
          aria-label="Đăng xuất"
        >
          <LogOut />
          <span className="hidden sm:inline">Đăng xuất</span>
        </Button>
      </div>
    </header>
  );
}
