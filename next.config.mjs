// Dominio del script de seguimiento del dashboard (debe estar permitido en la CSP)
const TRACKER = "https://aitors-hub-dashboard.asanchezgu.workers.dev";

// Política de seguridad de contenido. 'unsafe-inline' es necesario en scripts porque Next.js
// inyecta scripts de arranque en línea (sin nonces, al ser un sitio estático).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${TRACKER}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${TRACKER}`,
  "font-src 'self'",
  `connect-src 'self' ${TRACKER}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  // Con CSP_REPORT_ONLY=1 la política solo avisa en la consola (útil para depurar en una vista previa)
  { key: process.env.CSP_REPORT_ONLY === "1" ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // no revelar la tecnología del servidor
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  webpack: (config) => {
    // mdb-reader / exceljs se ejecutan en el navegador: desactivamos módulos de Node
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, crypto: false, stream: false, zlib: false };
    return config;
  },
};
export default nextConfig;
