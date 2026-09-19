import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const adminToken = request.cookies.get("s2s_admin_token")?.value;
  const pathname = request.nextUrl.pathname;

  // Kiểm tra route quản trị /admin
  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === "/admin/login";

    // Nếu vào các trang /admin (trừ /admin/login) mà chưa có token -> Chuyển về login
    if (!adminToken && !isLoginPage) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Đây chỉ là kiểm tra sớm cho UX. Trang profile vẫn xác thực session thật
  // với auth server trước khi hiển thị dữ liệu.
  if (pathname.startsWith("/profile") && !sessionCookie) {
    return NextResponse.redirect(new URL("/dang-nhap", request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/admin",
    "/profile/:path*",
    "/dang-nhap",
    "/dang-ky",
  ],
};
