/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/dashboard", destination: "/inicio", permanent: true },
      { source: "/dashboard/creatives", destination: "/criativo", permanent: true },
      { source: "/dashboard/creatives/:path*", destination: "/criativo/:path*", permanent: true },
      { source: "/dashboard/campaigns", destination: "/criativo", permanent: true },
      { source: "/admin/utilizadores", destination: "/admin/usuarios", permanent: false },
      { source: "/admin/utilizadores/:path*", destination: "/admin/usuarios/:path*", permanent: false },
      { source: "/analises/:path*", destination: "/perfil", permanent: false },
    ];
  },
};

module.exports = nextConfig;
