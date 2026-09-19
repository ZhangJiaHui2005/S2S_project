"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, Eye, EyeOff, AlertCircle, Loader2, KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Email hoặc mật khẩu quản trị không chính xác.");
      }

      // Successful login -> Redirect to admin dashboard
      router.push("/admin");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-svh flex items-center justify-center bg-background px-4 py-12">

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-muted border border-border text-primary mb-4">
            <ShieldCheck className="w-9 h-9 text-primary" />
          </div>
          <Badge variant="secondary" className="mb-2">
            Hệ thống Quản trị Bảo mật
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Cổng Quản Trị Hệ Thống S2S
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Xác thực tài khoản quản trị viên để điều hành và kiểm duyệt nền tảng trao đổi S2S
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" />
              Đăng nhập Quản trị viên
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Vui lòng nhập email quản trị và mật khẩu được cấp phép
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Đăng nhập thất bại</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-foreground">
                  Email Quản trị viên
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@s2s.edu.vn"
                    className="pl-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium text-foreground">
                    Mật khẩu Quản trị
                  </Label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu quản trị..."
                    className="pl-9 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xác thực bảo mật...
                  </>
                ) : (
                  "Đăng nhập Cổng Quản Trị"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pt-2 pb-5 border-t border-border flex flex-col gap-2 text-center text-xs text-muted-foreground">
            <p>
              Chỉ các tài khoản trong danh mục Quản trị hệ thống S2S mới có quyền truy cập.
            </p>
            <p className="text-[11px] text-muted-foreground">
              Cần cấp hoặc đặt lại mật khẩu? Sử dụng lệnh CLI: <code className="text-muted-foreground font-mono bg-muted px-1 py-0.5 rounded">npm run admin:set-password</code>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
