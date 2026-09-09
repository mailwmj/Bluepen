import type { NextConfig } from "next";

const isExport = process.env.NEXT_EXPORT === "true";

const nextConfig: NextConfig = {
  distDir: process.env.BLUEPEN_BUILD_DIR || ".next",
  output: isExport ? "export" : undefined,
  images: { unoptimized: true },
  transpilePackages: ["@bluepen/editor"],
  ...(isExport
    ? {}
    : {
        async rewrites() {
          return [{ source: "/editor.html", destination: "/" }];
        },
      }),
};

export default nextConfig;
