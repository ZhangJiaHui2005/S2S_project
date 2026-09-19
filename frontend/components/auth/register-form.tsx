"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

type RegisterFields = "name" | "email" | "password" | "confirmPassword";
type FieldErrors = Partial<Record<RegisterFields, string>>;

export function RegisterForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    const nextErrors: FieldErrors = {};

    if (name.length < 2 || name.length > 100) nextErrors.name = "Họ tên phải có từ 2 đến 100 ký tự.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Vui lòng nhập địa chỉ email hợp lệ.";
    if (password.length < 8 || password.length > 128) nextErrors.password = "Mật khẩu phải có từ 8 đến 128 ký tự.";
    if (confirmPassword !== password) nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";

    setFieldErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const { error } = await authClient.signUp.email({ name, email, password });

      if (error) {
        setFormError(
          error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" ||
            error.code === "USER_ALREADY_EXISTS"
            ? "Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác."
            : error.message || "Không thể tạo tài khoản. Vui lòng thử lại.",
        );
        return;
      }

      router.push("/profile");
      router.refresh();
    } catch {
      setFormError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit}>
      {formError ? <Alert className="border-destructive/50 text-destructive"><AlertDescription>{formError}</AlertDescription></Alert> : null}
      <div className="space-y-2">
        <Label htmlFor="name">Họ và tên</Label>
        <Input aria-invalid={Boolean(fieldErrors.name)} autoComplete="name" disabled={isSubmitting} id="name" name="name" placeholder="Nguyễn Văn An" />
        {fieldErrors.name ? <p className="text-sm text-destructive">{fieldErrors.name}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input aria-invalid={Boolean(fieldErrors.email)} autoComplete="email" disabled={isSubmitting} id="email" name="email" placeholder="ban@truong.edu.vn" type="email" />
        {fieldErrors.email ? <p className="text-sm text-destructive">{fieldErrors.email}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input aria-invalid={Boolean(fieldErrors.password)} autoComplete="new-password" disabled={isSubmitting} id="password" name="password" type="password" />
        {fieldErrors.password ? <p className="text-sm text-destructive">{fieldErrors.password}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
        <Input aria-invalid={Boolean(fieldErrors.confirmPassword)} autoComplete="new-password" disabled={isSubmitting} id="confirmPassword" name="confirmPassword" type="password" />
        {fieldErrors.confirmPassword ? <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p> : null}
      </div>
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
        {isSubmitting ? "Đang tạo tài khoản..." : "Đăng ký"}
      </Button>
    </form>
  );
}
