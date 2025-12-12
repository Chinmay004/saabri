import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.propertyfinder.ae',
      },
      {
        protocol: 'https',
        hostname: 'pf-graph-images-production.s3.ap-southeast-1.amazonaws.com',
      },
    ],
    // Allow images that resolve to private IPs (needed for some CDNs)
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Disable optimization for external images to avoid private IP blocking
    unoptimized: true,
  },
};

export default nextConfig;
