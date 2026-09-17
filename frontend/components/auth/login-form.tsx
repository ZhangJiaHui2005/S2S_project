"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");

    setErrorMessage("");
    if (!email || !password) {
      setErrorMessage("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await authClient.signIn.email({ email, password });

      if (error) {
        setErrorMessage(
          error.code === "INVALID_EMAIL_OR_PASSWORD"
            ? "Email hoặc mật khẩu không chính xác."
            : error.message || "Không thể đăng nhập. Vui lòng thử lại.",
        );
        return;
      }

      router.push("/profile");
      router.refresh();
    } catch {
      setErrorMessage("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit}>
      {errorMessage ? <Alert className="border-destructive/50 text-destructive"><AlertDescription>{errorMessage}</AlertDescription></Alert> : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input autoComplete="email" disabled={isSubmitting} id="email" name="email" placeholder="ban@truong.edu.vn" type="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input autoComplete="current-password" disabled={isSubmitting} id="password" name="password" type="password" />
      </div>
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
        {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
    </form>
  );
}
