import { Recycle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  footerText: string;
  footerLink: string;
  footerLabel: string;
};

export function AuthCard({ title, description, children, footerText, footerLink, footerLabel }: AuthCardProps) {
  return (
    <main className="flex min-h-[calc(100svh-4rem)] items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link aria-label="Về trang chủ" className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground" href="/">
            <Recycle aria-hidden="true" className="size-5" />
          </Link>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
          <p className="text-center text-sm text-muted-foreground">
            {footerText}{" "}
            <Link className="font-medium text-primary underline-offset-4 hover:underline" href={footerLink}>
              {footerLabel}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
