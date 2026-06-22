import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.11'],
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'alythsequnidggajizyq.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      }
    ],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://alythsequnidggajizyq.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_Of1SsS6rC-CzRTvhqiY_6g_Rdv7edw0"
  },
};

export default nextConfig;
