import type { MetadataRoute } from "next";
import { site, nav, secondaryNav } from "@/lib/site";
import {
  getAllControlMeasures,
  getAllEvents,
  getAllFinancialCommitments,
  getAllJurisdictions,
  getAllMaterials,
} from "@/lib/data";

/**
 * Static sitemap. `lastModified` uses `site.lastUpdated`, not the build clock:
 * a timestamp that moves on every rebuild tells a crawler the content changed
 * when it did not, and this project's whole claim is that its dates mean
 * something.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(site.lastUpdated);
  const entry = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${site.url}${path}`,
    lastModified,
    changeFrequency: "monthly",
    priority,
  });

  return [
    entry("", 1),
    // `nav` already lists every top-level page (including /search and
    // /coverage), so listing them again here would duplicate sitemap
    // entries — a crawler-facing correctness bug, not a cosmetic one.
    ...[...nav, ...secondaryNav].map((n) => entry(n.href, 0.8)),
    ...getAllEvents().map((e) => entry(`/events/${e.id}`, 0.9)),
    ...getAllMaterials().map((m) => entry(`/materials/${m.slug}`, 0.7)),
    ...getAllJurisdictions().map((j) => entry(`/actors/${j.code.toLowerCase()}`, 0.7)),
    ...getAllFinancialCommitments().map((c) => entry(`/capital/${c.id}`, 0.7)),
    ...getAllControlMeasures().map((m) => entry(`/controls/${m.id}`, 0.7)),
  ];
}
