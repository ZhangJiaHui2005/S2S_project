import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Đăng ký" };

export default async function RegisterPage() {
  const session = await getCurrentSession();
  if (session?.user) redirect("/profile");

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
