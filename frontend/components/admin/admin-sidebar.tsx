"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, PackageCheck, ArrowLeftRight, KeyRound, ExternalLink, Shield } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Tổng quan", href: "/admin", icon: LayoutDashboard },
  { title: "Quản lý người dùng", href: "/admin/users", icon: Users },
  { title: "Kiểm duyệt vật phẩm", href: "/admin/items", icon: PackageCheck },
  { title: "Giao dịch Escrow & QR", href: "/admin/transactions", icon: ArrowLeftRight },
  { title: "Đổi mật khẩu / Bảo mật", href: "/admin#password-section", icon: KeyRound },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const closeMobile = () => setOpenMobile(false);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/admin" />} onClick={closeMobile}>
              <Shield />
              <div className="grid text-left leading-tight">
                <span className="font-semibold">S2S Portal</span>
                <span className="text-xs text-muted-foreground">Quản trị trao đổi Campus</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Phân hệ quản trị</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    tooltip={item.title}
                    onClick={closeMobile}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/" target="_blank" rel="noopener noreferrer" />} tooltip="Trang chủ S2S" onClick={closeMobile}>
              <ExternalLink />
              <span>Trang chủ S2S</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
