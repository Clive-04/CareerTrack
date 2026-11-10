import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV !== "production";
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const backendApiUrl = process.env.BACKEND_API_URL?.replace(/\/$/, "");
let connectSource = "'self'";

if (apiUrl.startsWith("/")) {
  if (apiUrl === "/") {
    throw new Error("NEXT_PUBLIC_API_URL must use a path prefix such as '/api', not '/'.");
  }
  if (!isDevelopment && (!backendApiUrl || !backendApiUrl.startsWith("https://"))) {
    throw new Error("BACKEND_API_URL must be an HTTPS URL when NEXT_PUBLIC_API_URL is relative.");
  }
} else {
  try {
    connectSource = `'self' ${new URL(apiUrl).origin}`;
  } catch {
    throw new Error("NEXT_PUBLIC_API_URL must be an absolute URL or a path beginning with '/'.");
  }
}

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self' data:",
  `connect-src ${connectSource}${isDevelopment ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    if (!apiUrl.startsWith("/") || !backendApiUrl) return [];
    const prefix = apiUrl.replace(/\/$/, "");
    return [{ source: `${prefix}/:path*`, destination: `${backendApiUrl}/:path*` }];
  },
  async headers() {
    const headers = [
      { key: "Content-Security-Policy", value: contentSecurityPolicy },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];

    if (!isDevelopment) {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains",
      });
    }

    return [{ source: "/(.*)", headers }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
