/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // mdb-reader / exceljs se ejecutan en el navegador: desactivamos módulos de Node
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, crypto: false, stream: false, zlib: false };
    return config;
  },
};
export default nextConfig;
