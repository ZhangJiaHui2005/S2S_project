import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { UserNavbar } from "@/components/layout/user-navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "S2S - Chia sẻ đồ dùng trong cộng đồng sinh viên",
    template: "%s | S2S",
  },
  description:
    "Mượn, cho mượn và trao đổi đồ dùng an toàn trong cộng đồng sinh viên cùng S2S.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-mono",
        jetbrainsMono.variable,
      )}
    >
      <body className="min-h-full">
        <ThemeProvider
          attribute={"class"}
          defaultTheme={"system"}
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <div className="flex min-h-svh flex-col">
              <UserNavbar />
              {children}
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
