import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "auctions.c.yimg.jp" },
      { protocol: "https", hostname: "auc-pctr.c.yimg.jp" },
      { protocol: "https", hostname: "**.yimg.jp" },
    ],
  },
};

export default nextConfig;
