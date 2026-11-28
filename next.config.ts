import type { NextConfig } from "next";
import { site } from "./lib/site";

// Events and /saved stay available on the original origin for browser-local lists.
const migratedPages = [
  "/",
  "/about",
  "/advisory",
  "/contact",
  "/intelligence",
  "/actors",
  "/actors/:code",
  "/capital",
  "/capital/:id",
  "/compare",
  "/controls",
  "/controls/:id",
  "/coverage",
  "/data",
  "/explore",
  "/framing",
  "/interplay",
  "/markets",
  "/materials",
  "/materials/:slug",
  "/methodology",
  "/organizations",
  "/organizations/:id",
  "/portfolios",
  "/programmes",
  "/programmes/:id",
  "/projects",
  "/projects/:id",
  "/research",
  "/research/antimony-supply-resilience",
  "/research/china-export-control-suspension-extension",
  "/research/escondida-copper",
  "/research/hemerdon-financing",
  "/research/tungsten-supply-security",
  "/response",
  "/search",
  "/sources",
  "/sources/:id",
  "/timeline",
  "/watchlist",
];

const legacyHost = new URL(site.legacyUrl).hostname.replaceAll(".", "\\.");

const nextConfig: NextConfig = {
  async redirects() {
    return migratedPages.map((source) => ({
      source,
      destination: `${site.url}${source}`,
      has: [{ type: "host" as const, value: legacyHost }],
      permanent: true,
    }));
  },
};

export default nextConfig;
