import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "mealie.crussell.io",
      },
    ],
  },
};

export default nextConfig;
