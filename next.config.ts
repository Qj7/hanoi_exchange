import type { NextConfig } from "next";

// Vercel: leave NEXT_OUTPUT unset so Route Handlers (`src/app/api`) work.
//
// Legacy static hosting only: NEXT_OUTPUT=export builds a fully static bundle.
// Cannot be combined with `src/app/api`. GitHub Pages host:
// https://<user>.github.io/<repo>/ — basePath/assetPrefix must match the repo subpath.
const isStaticExport = process.env.NEXT_OUTPUT === "export";
const repoBasePath = process.env.NEXT_BASE_PATH ?? "/hanoi_exchange";

const nextConfig: NextConfig = {
  ...(isStaticExport && {
    output: "export",
    basePath: repoBasePath,
    assetPrefix: repoBasePath,
    images: { unoptimized: true },
    trailingSlash: true,
  }),
};

export default nextConfig;
