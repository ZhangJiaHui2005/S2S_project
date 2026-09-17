import "server-only";
import { headers } from "next/headers";

export type CurrentSession = {
  session: {
    id: string | number;
    expiresAt: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    createdAt: string;
  };
};

export async function getCurrentSession(): Promise<CurrentSession | null> {
  const requestHeaders = await headers();
  const authServerUrl = (process.env.AUTH_SERVER_URL ?? "http://localhost:3001").replace(/\/$/, "");

  try {
    const response = await fetch(`${authServerUrl}/api/auth/get-session`, {
      headers: {
        cookie: requestHeaders.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    if (!response.ok) return null;
    return (await response.json()) as CurrentSession | null;
  } catch {
    return null;
  }
}
