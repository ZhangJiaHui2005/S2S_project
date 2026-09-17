import { headers } from "next/headers";
import { getAdminSession } from "@/lib/admin-session";
import {
  Users,
  Package,
  Clock,
  ArrowLeftRight,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      {/* Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-900/40 p-6 md:p-8 overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-indigo-600/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Bảng điều khiển Trung tâm Quản trị
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Xin chào, {admin?.fullName || "Quản trị viên"}!
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Hệ thống S2S đang vận hành với kiến trúc Escrow QR & Điểm thưởng Karma. Bạn có toàn quyền giám sát dữ liệu và người dùng.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-xl p-3 backdrop-blur-sm self-start md:self-auto">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <div className="text-slate-400">Lần đăng nhập gần nhất</div>
              <div className="font-semibold text-slate-200">{formattedLastLogin}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <Card className="bg-slate-900/80 border-slate-800 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Tổng Thành Viên
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalUsers}</div>
            <p className="text-[11px] text-slate-500 mt-1">Tài khoản sinh viên đã đăng ký</p>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card className="bg-slate-900/80 border-slate-800 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Vật Phẩm Đăng Tải
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalItems}</div>
            <p className="text-[11px] text-slate-500 mt-1">Giáo trình & đồ dùng sẵn sàng trao đổi</p>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card className="bg-slate-900/80 border-slate-800 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Yêu Cầu Chờ Duyệt
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pendingRequests}</div>
            <p className="text-[11px] text-slate-500 mt-1">Yêu cầu mượn vật phẩm đang xử lý</p>
          </CardContent>
        </Card>

        {/* Card 4 */}
        <Card className="bg-slate-900/80 border-slate-800 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Giao Dịch Escrow
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{activeTransactions}</div>
            <p className="text-[11px] text-slate-500 mt-1">Đơn giao dịch đang khóa điểm Karma</p>
          </CardContent>
        </Card>
      </div>

      {/* Account Info & System Admins */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin info card */}
        <Card className="bg-slate-900/80 border-slate-800 shadow-lg lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Thông Tin Tài Khoản Hiện Tại
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Quyền quản trị cấp cao trong bảng Admin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Họ và tên</span>
              <span className="font-semibold text-slate-100">{admin?.fullName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Email quản trị</span>
              <span className="font-mono text-indigo-300">{admin?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Mã quản trị (Admin ID)</span>
              <span className="font-mono text-slate-300">#{admin?.adminId}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Vai trò phân quyền</span>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Super Administrator
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Trạng thái bảo mật</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Đang bảo vệ phiên JWT
              </span>
            </div>
          </CardContent>
        </Card>

        {/* List of Admins in System */}
        <Card className="bg-slate-900/80 border-slate-800 shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Danh Sách Quản Trị Viên Hệ Thống (Bảng Admin)
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Các tài khoản được ủy quyền điều hành nền tảng S2S
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-800">
              {adminList.length > 0 ? (
                adminList.map((item) => (
                  <div key={item.admin_id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                        {item.full_name ? item.full_name.charAt(0).toUpperCase() : "A"}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                          {item.full_name}
                          {item.email === admin?.email && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                              Bạn
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{item.email}</div>
                      </div>
                    </div>

                    <div className="text-right text-[11px]">
                      <span className="text-slate-500 block">Đăng nhập lần cuối:</span>
                      <span className="text-slate-300 font-medium">
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
                <p className="text-xs text-slate-500 py-4 text-center">
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
