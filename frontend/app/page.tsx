import { ArrowRight, User } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-xl shadow-lg border-border">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-mono text-lg font-bold">
            S2S
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight">S2S</CardTitle>
            <CardDescription className="text-base">
              Nền tảng trao đổi vật phẩm học tập và sinh hoạt an toàn trong cộng đồng sinh viên.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link className={buttonVariants({ className: "sm:min-w-36" })} href="/dang-ky">
            Tạo tài khoản
            <ArrowRight aria-hidden="true" className="size-4 ml-1.5" />
          </Link>
          <Link className={buttonVariants({ variant: "outline", className: "sm:min-w-36" })} href="/dang-nhap">
            Đăng nhập
          </Link>
          <Link className={buttonVariants({ variant: "ghost", className: "sm:min-w-36" })} href="/profile">
            <User aria-hidden="true" className="size-4 mr-1.5" />
            Hồ sơ cá nhân
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
