import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return (
    <AuthCard
      description="Đăng nhập để quản lý tài khoản S2S của bạn."
      footerLabel="Đăng ký ngay"
      footerLink="/dang-ky"
      footerText="Chưa có tài khoản?"
      title="Chào mừng trở lại"
    >
      <LoginForm />
    </AuthCard>
  );
}
