import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.sportslogic.ai" }],
        destination: "https://sportslogic.ai/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
