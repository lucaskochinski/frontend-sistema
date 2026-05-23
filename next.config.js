/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    /** Permite thumbnails de qualquer origem HTTPS (Meta, Drive, etc.) se usar next/image */
    remotePatterns: [
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "**.facebook.com" },
      { protocol: "https", hostname: "**.fbsbx.com" },
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    dangerouslyAllowSVG: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Referrer-Policy",
            value: "no-referrer",
          },
        ],
      },
    ];
  },
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
