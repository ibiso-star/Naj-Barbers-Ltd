import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Baseline security headers (SEC-014 clickjacking/MIME sniffing; SEC-032 HSTS
// is left to the host until the full domain inventory is HTTPS-verified).
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // This app sits inside another project's repo; without an explicit root,
  // Turbopack guesses from the outer lockfile.
  turbopack: { root: fileURLToPath(new URL(".", import.meta.url)) },
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
