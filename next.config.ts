import type { NextConfig } from "next";

// When NEXT_OUTPUT=export (used by GitHub Pages workflow) we build a fully
// static bundle. The repo is served from https://<user>.github.io/<repo>/,
// so basePath/assetPrefix must point to the repo subpath.
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
