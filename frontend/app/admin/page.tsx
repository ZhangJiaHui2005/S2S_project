import { headers } from "next/headers";
import { getAdminSession } from "@/lib/admin-session";
import {
  Users,
  Package,
  Clock,
  ArrowLeftRight,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AdminPasswordForm } from "@/components/admin/admin-password-form";

interface AdminListItem {
  admin_id: number;
  email: string;
  full_name: string;
  last_login_at: string | null;
}

interface AdminStats {
  totalUsers: number;
  totalItems: number;
  pendingRequests: number;
  activeTransactions: number;
  admins: AdminListItem[];
}

async function getStats(): Promise<AdminStats | null> {
  const requestHeaders = await headers();
  const authServerUrl = (process.env.AUTH_SERVER_URL ?? "http://localhost:3001").replace(/\/$/, "");

  try {
    const res = await fetch(`${authServerUrl}/api/admin/stats`, {
      headers: {
        cookie: requestHeaders.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = (await res.json()) as { stats?: AdminStats };
    return data?.stats ?? null;
  } catch {
    return null;
  }
}

export default async function AdminDashboardPage() {
  const admin = await getAdminSession();
  const stats = await getStats();

  const totalUsers = stats?.totalUsers ?? 0;
  const totalItems = stats?.totalItems ?? 0;
  const pendingRequests = stats?.pendingRequests ?? 0;
  const activeTransactions = stats?.activeTransactions ?? 0;
  const adminList = stats?.admins ?? [];

  const formattedLastLogin = admin?.lastLoginAt
    ? new Date(admin.lastLoginAt).toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Chưa có bản ghi";

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Xin chào, {admin?.fullName || "Quản trị viên"}!</h1>
          <p className="text-sm text-muted-foreground">Tổng quan hoạt động và quản lý nền tảng S2S.</p>
        </div>
        <p className="text-sm text-muted-foreground">Lần đăng nhập gần nhất: {formattedLastLogin}</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tổng Thành Viên
            </CardTitle>
            <div className="p-2 rounded-lg bg-muted text-primary">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalUsers}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Tài khoản sinh viên đã đăng ký</p>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Vật Phẩm Đăng Tải
            </CardTitle>
            <div className="p-2 rounded-lg bg-muted text-primary">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalItems}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Giáo trình & đồ dùng sẵn sàng trao đổi</p>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Yêu Cầu Chờ Duyệt
            </CardTitle>
            <div className="p-2 rounded-lg bg-muted text-primary">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{pendingRequests}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Yêu cầu mượn vật phẩm đang xử lý</p>
          </CardContent>
        </Card>

        {/* Card 4 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Giao Dịch Escrow
            </CardTitle>
            <div className="p-2 rounded-lg bg-muted text-primary">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeTransactions}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Đơn giao dịch đang khóa điểm Karma</p>
          </CardContent>
        </Card>
      </div>

      {/* Account Info & System Admins */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin info card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Thông Tin Tài Khoản Hiện Tại
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Quyền quản trị cấp cao trong bảng Admin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex flex-wrap justify-between gap-2 py-2 border-b border-border">
              <span className="text-muted-foreground">Họ và tên</span>
              <span className="font-semibold text-foreground">{admin?.fullName}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-2 py-2 border-b border-border">
              <span className="text-muted-foreground">Email quản trị</span>
              <span className="break-all text-foreground">{admin?.email}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-2 py-2 border-b border-border">
              <span className="text-muted-foreground">Mã quản trị (Admin ID)</span>
              <span className="font-mono text-foreground">#{admin?.adminId}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-2 py-2 border-b border-border">
              <span className="text-muted-foreground">Vai trò phân quyền</span>
              <Badge variant="secondary">Super Administrator</Badge>
            </div>
            <div className="flex flex-wrap justify-between gap-2 py-2">
              <span className="text-muted-foreground">Trạng thái bảo mật</span>
              <span className="text-primary font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Đang bảo vệ phiên JWT
              </span>
            </div>
          </CardContent>
        </Card>

        {/* List of Admins in System */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              Danh Sách Quản Trị Viên Hệ Thống (Bảng Admin)
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Các tài khoản được ủy quyền điều hành nền tảng S2S
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {adminList.length > 0 ? (
                adminList.map((item) => (
                  <div key={item.admin_id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{item.full_name ? item.full_name.charAt(0).toUpperCase() : "A"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                          {item.full_name}
                          {item.email === admin?.email && (
                            <Badge variant="secondary">Bạn</Badge>
                          )}
                        </div>
                        <div className="break-all text-[11px] text-muted-foreground font-mono">{item.email}</div>
                      </div>
                    </div>

                    <div className="text-right text-[11px]">
                      <span className="text-muted-foreground block">Đăng nhập lần cuối:</span>
                      <span className="text-foreground font-medium">
                        {item.last_login_at
                          ? new Date(item.last_login_at).toLocaleString("vi-VN", {
                              timeZone: "Asia/Ho_Chi_Minh",
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "Chưa đăng nhập"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Đang đồng bộ danh sách quản trị viên từ cơ sở dữ liệu...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Management & CLI Section */}
      <AdminPasswordForm currentEmail={admin?.email || ""} />
    </div>
  );
}
