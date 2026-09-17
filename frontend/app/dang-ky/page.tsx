import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Đăng ký" };

export default function RegisterPage() {
  return (
    <AuthCard
      description="Tạo tài khoản để bắt đầu trao đổi cùng cộng đồng sinh viên."
      footerLabel="Đăng nhập"
      footerLink="/dang-nhap"
      footerText="Đã có tài khoản?"
      title="Tạo tài khoản"
    >
      <RegisterForm />
    </AuthCard>
  );
}
