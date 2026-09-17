"use client";

import { useState } from "react";
import { KeyRound, CheckCircle2, AlertCircle, Loader2, ShieldCheck, Terminal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AdminPasswordFormProps {
  currentEmail: string;
}

export function AdminPasswordForm({ currentEmail }: AdminPasswordFormProps) {
  const [email, setEmail] = useState(currentEmail);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải có tối thiểu 8 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu mới không trùng khớp.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Không thể cập nhật mật khẩu.");
      }

      setMessage(data.message || "Đã cập nhật mật khẩu thành công!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Có lỗi xảy ra khi đổi mật khẩu.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="password-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* Form đổi mật khẩu UI */}
      <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-400" />
            Cập nhật Mật khẩu Quản trị
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Cập nhật mật khẩu ngay khi được ban quản trị cấp mật khẩu chính thức
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4 bg-red-950/50 border-red-900/50 text-red-300">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="mb-4 bg-emerald-950/50 border-emerald-900/50 text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <AlertDescription className="text-xs">{message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Email quản trị cần đổi</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-950/60 border-slate-700 text-slate-100 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Mật khẩu mới</Label>
              <Input
                type="password"
                required
                placeholder="Nhập mật khẩu mới..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-slate-950/60 border-slate-700 text-slate-100 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Nhập lại mật khẩu mới</Label>
              <Input
                type="password"
                required
                placeholder="Xác nhận lại mật khẩu..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-slate-950/60 border-slate-700 text-slate-100 text-xs"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-2 shadow-lg shadow-indigo-600/20"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý mã hóa Bcrypt...
                </>
              ) : (
                "Lưu mật khẩu mới"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Hướng dẫn đổi mật khẩu qua Terminal CLI */}
      <Card className="bg-slate-900/90 border-slate-800 shadow-xl flex flex-col justify-between">
        <div>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              Lệnh CLI Đổi Mật Khẩu Nhanh
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Có thể chạy trực tiếp từ Terminal của thư mục backend mà không cần qua giao diện
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-slate-300">
            <p>
              Khi bạn hoặc quản trị viên khác được cấp mật khẩu qua email/tin nhắn nội bộ, bạn có thể thực thi script bằng lệnh:
            </p>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto space-y-1">
              <div className="text-slate-500"># Chuyển vào backend và thực thi:</div>
              <div>cd backend</div>
              <div>npm run admin:set-password -- {currentEmail} MatKhauMoiCuaBan</div>
            </div>

            <div className="rounded-lg bg-indigo-950/30 border border-indigo-900/40 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-indigo-300 font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Cơ chế bảo mật mật khẩu
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Tất cả mật khẩu lưu trong bảng <code>Admin</code> đều được băm với thuật toán <strong>Bcrypt (salt rounds = 10)</strong>, chống tấn công dò quét Rainbow Table và đảm bảo an toàn tuyệt đối.
              </p>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
