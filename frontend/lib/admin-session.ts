import "server-only";
import { cookies } from "next/headers";

export type AdminProfile = {
  adminId: number;
  email: string;
  fullName: string;
  lastLoginAt?: string | null;
  createdAt?: string | null;
  role: "admin";
};

export type AdminSessionResult = {
  success: boolean;
  admin: AdminProfile | null;
};

export async function getAdminSession(): Promise<AdminProfile | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("s2s_admin_token")?.value;

  if (!token) {
    return null;
  }

  const authServerUrl = (process.env.AUTH_SERVER_URL ?? "http://localhost:3001").replace(/\/$/, "");

  try {
    const response = await fetch(`${authServerUrl}/api/admin/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        cookie: `s2s_admin_token=${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) return null;
    const data = (await response.json()) as { success: boolean; admin: AdminProfile };
    return data?.success ? data.admin : null;
  } catch {
    return null;
  }
}
