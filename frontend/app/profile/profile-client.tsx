"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User as UserIcon,
  Mail,
  Calendar,
  LogOut,
  Loader2,
  ShieldCheck,
} from "lucide-react";

interface ProfileUser {
  id: string | number;
  name: string;
  email: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date | string;
}

interface ProfileSession {
  id: string | number;
  expiresAt: Date | string;
  token?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface ProfileClientProps {
  user: ProfileUser;
  session: ProfileSession;
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter();
  const [logoutError, setLogoutError] = React.useState("");
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError("");

    try {
      const { error } = await authClient.signOut();
      if (error) throw new Error("Không thể đăng xuất. Vui lòng thử lại.");
      router.push("/dang-nhap");
      router.refresh();
    } catch (err) {
      setLogoutError(err instanceof Error ? err.message : "Không thể đăng xuất. Vui lòng thử lại.");
      setIsLoggingOut(false);
    }
  };

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : "Không xác định";

  const initials = user.name
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "S2S";

  return (
    <div className="min-h-[calc(100svh-4rem)] bg-background text-foreground flex flex-col">
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
          <p className="text-muted-foreground mt-1">
            Thông tin tài khoản của bạn trên hệ thống S2S
          </p>
        </div>

        {logoutError && <p role="alert" className="text-sm text-destructive">{logoutError}</p>}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Avatar Card */}
          <Card className="md:col-span-1 shadow-sm border-border flex flex-col items-center text-center p-6 justify-center">
            <div className="relative mb-4">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-full object-cover border-2 border-primary"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-primary/15 text-primary flex items-center justify-center text-2xl font-bold border-2 border-primary/30">
                  {initials}
                </div>
              )}
              <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-primary border-2 border-background flex items-center justify-center text-[10px] text-primary-foreground font-bold">
                {user.emailVerified ? "✓" : "!"}
              </span>
            </div>

            <h2 className="font-semibold text-lg">{user.name}</h2>
            <p className="text-sm text-muted-foreground break-all">{user.email}</p>

            <div className="mt-4 w-full pt-4 border-t border-border flex items-center justify-center gap-1.5 text-xs text-primary font-medium">
              <ShieldCheck className="h-4 w-4" />
              {user.emailVerified ? "Email đã xác minh" : "Email chưa xác minh"}
            </div>
          </Card>

          {/* Details Card */}
          <Card className="md:col-span-2 shadow-sm border-border">
            <CardHeader>
              <CardTitle>Chi tiết tài khoản S2S</CardTitle>
              <CardDescription>
                Thông tin cơ bản của bạn trên nền tảng trao đổi sinh viên
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="h-10 w-10 rounded-md bg-background flex items-center justify-center text-muted-foreground shadow-xs">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Họ và tên</p>
                  <p className="font-medium text-sm">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="h-10 w-10 rounded-md bg-background flex items-center justify-center text-muted-foreground shadow-xs">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs text-muted-foreground">Email đăng ký</p>
                  <p className="font-medium text-sm truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="h-10 w-10 rounded-md bg-background flex items-center justify-center text-muted-foreground shadow-xs">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ngày tham gia hệ thống</p>
                  <p className="font-medium text-sm">{formattedDate}</p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2 flex justify-end">
              <Button
                variant="destructive"
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="w-full sm:w-auto"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang đăng xuất...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất tài khoản
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
