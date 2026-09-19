"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Moon, Recycle, Sun, UserRound } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { buttonVariants, Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

const navigation = [
  { label: "Giới thiệu", href: "/#gioi-thieu" },
  { label: "Cách hoạt động", href: "/#cach-hoat-dong" },
  { label: "An toàn", href: "/#an-toan" },
];

export function UserNavbar() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (pathname.startsWith("/admin")) return null;
  const isAuthenticated = Boolean(session?.user);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          className="flex items-center gap-2"
          href="/"
          aria-label="Trang chủ S2S"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Recycle className="size-5" aria-hidden="true" />
          </span>
          <span className="leading-none">
            <span className="block font-semibold tracking-tight">S2S</span>
            <span className="hidden text-[10px] text-muted-foreground sm:block">
              Share to Sustain
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Điều hướng chính"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {isPending ? (
            <Skeleton className="h-8 w-28" />
          ) : isAuthenticated ? (
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href="/profile"
            >
              <UserRound aria-hidden="true" /> Hồ sơ
            </Link>
          ) : (
            <>
              <Link
                className={buttonVariants({ variant: "ghost", size: "sm" })}
                href="/dang-nhap"
              >
                Đăng nhập
              </Link>
              <Link className={buttonVariants({ size: "sm" })} href="/dang-ky">
                Tham gia S2S
              </Link>
            </>
          )}
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button
                className="md:hidden"
                size="icon"
                variant="ghost"
                aria-label="Mở menu"
              />
            }
          >
            <Menu aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(22rem,85vw)]">
            <SheetHeader className="border-b">
              <SheetTitle className="flex items-center gap-2">
                <Recycle className="size-5 text-primary" /> S2S
              </SheetTitle>
              <SheetDescription>
                Chia sẻ đồ dùng, kết nối cộng đồng.
              </SheetDescription>
            </SheetHeader>
            <nav
              className="flex flex-col gap-1 px-4"
              aria-label="Điều hướng trên điện thoại"
            >
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "justify-start",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto grid gap-2 border-t p-4">
              {isPending ? (
                <Skeleton className="h-9 w-full" />
              ) : isAuthenticated ? (
                <Link
                  className={buttonVariants()}
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                >
                  <UserRound /> Xem hồ sơ
                </Link>
              ) : (
                <>
                  <Link
                    className={buttonVariants({ variant: "outline" })}
                    href="/dang-nhap"
                    onClick={() => setMobileOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    className={buttonVariants()}
                    href="/dang-ky"
                    onClick={() => setMobileOpen(false)}
                  >
                    Tham gia S2S
                  </Link>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
