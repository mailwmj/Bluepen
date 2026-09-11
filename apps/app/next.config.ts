import type { NextConfig } from "next";

const isExport = process.env.NEXT_EXPORT === "true";
const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  distDir: process.env.BLUEPEN_BUILD_DIR || ".next",
  output: isExport ? "export" : undefined,
  env: { NEXT_PUBLIC_TOKENBOX_PROXY: isDev && !isExport ? "/api/ai/tokenbox" : "" },
  images: { unoptimized: true },
  transpilePackages: ["@bluepen/editor"],
  ...(isExport
    ? {}
    : {
        async rewrites() {
          return [
            { source: "/editor.html", destination: "/" },
            ...(isDev ? [{
              source: "/api/ai/tokenbox/responses",
              destination: "https://tokbox-api.netease.im/responses",
            }] : []),
          ];
        },
      }),
};

export default nextConfig;
