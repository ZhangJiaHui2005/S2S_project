"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, Eye, EyeOff, AlertCircle, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminLoginPage() {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-12 text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
            <ShieldCheck className="w-9 h-9 text-indigo-400" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
            Hệ thống Quản trị Bảo mật
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Cổng Quản Trị Hệ Thống S2S
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xs">
            Xác thực tài khoản quản trị viên để điều hành và kiểm duyệt nền tảng trao đổi S2S
          </p>
        </div>

        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-xl shadow-2xl shadow-black/50 text-slate-100">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              Đăng nhập Quản trị viên
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Vui lòng nhập email quản trị và mật khẩu được cấp phép
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-950/50 border-red-900/50 text-red-300">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertTitle className="text-xs font-semibold">Đăng nhập thất bại</AlertTitle>
                <AlertDescription className="text-xs mt-1">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-slate-300">
                  Email Quản trị viên
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@s2s.edu.vn"
                    className="pl-9 bg-slate-950/60 border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium text-slate-300">
                    Mật khẩu Quản trị
                  </Label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu quản trị..."
                    className="pl-9 pr-10 bg-slate-950/60 border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg shadow-lg shadow-indigo-600/30 transition-all mt-2"
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

          <CardFooter className="pt-2 pb-5 border-t border-slate-800/60 flex flex-col gap-2 text-center text-xs text-slate-500">
            <p>
              Chỉ các tài khoản trong danh mục Quản trị hệ thống S2S mới có quyền truy cập.
            </p>
            <p className="text-[11px] text-slate-600">
              Cần cấp hoặc đặt lại mật khẩu? Sử dụng lệnh CLI: <code className="text-slate-400 font-mono bg-slate-800 px-1 py-0.5 rounded">npm run admin:set-password</code>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
