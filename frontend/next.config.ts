import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const authServerUrl = process.env.AUTH_SERVER_URL ?? "http://localhost:3001";

    return {
      // Better Auth and Admin API are hosted by NestJS. Run this before filesystem routes so
      // the browser always talks to one canonical server.
      beforeFiles: [
        {
          source: "/api/auth/:path*",
          destination: `${authServerUrl}/api/auth/:path*`,
        },
        {
          source: "/api/admin/:path*",
          destination: `${authServerUrl}/api/admin/:path*`,
        },
      ],
    };
  },
  async redirects() {
    return [
      {
        source: "/login",
        destination: "/dang-nhap",
        permanent: true,
      },
      {
        source: "/register",
        destination: "/dang-ky",
        permanent: true,
      },
      {
        source: "/admin/dang-nhap",
        destination: "/admin/login",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
