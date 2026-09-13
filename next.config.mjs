import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cache bust: 2026-02-19
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  experimental: {
    serverActions: {
      allowedOrigins: [
        "weddingboard.pl",
        "www.weddingboard.pl",
        "*.up.railway.app",
        "localhost:3000",
      ],
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "@react-pdf/renderer",
    "pdf-lib",
    "@serwist/next",
  ],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return [
      {
        source: "/:locale(pl|en)/blog",
        destination: "/:locale/magazyn",
        permanent: true,
      },
      {
        source: "/:locale(pl|en)/blog/:slug",
        destination: "/:locale/magazyn/:slug",
        permanent: true,
      },
      {
        source: "/pl/aplikacja-do-planowania-wesela",
        destination: "/pl/aplikacja",
        permanent: true,
      },
      {
        source: "/pl/planowanie-wesela-aplikacja",
        destination: "/pl/aplikacja",
        permanent: true,
      },
      {
        source: "/en/wedding-planning-app",
        destination: "/en/aplikacja",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/(.*)",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          {
            key: "Access-Control-Allow-Origin",
            value: "https://weddingboard.pl",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "geolocation=(), microphone=(), camera=(), payment=(), usb=(), battery=(), gyroscope=(), magnetometer=(), midi=()",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
