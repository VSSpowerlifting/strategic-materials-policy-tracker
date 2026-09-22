/**
 * Single source of truth for site identity, navigation, and the footer
 * disclaimers. The name was chosen to fit the multi-actor, policy-instrument
 * scope (not "control", since the project also tracks funding and stockpiling).
 */
export const site = {
  name: "Strategic Materials Policy Tracker",
  shortName: "SMPT",
  tagline:
    "How the major powers contest rare earths and strategic materials through policy.",
  description:
    "A source-linked policy database tracking how China, the United States, the EU and allied states use export controls, designations, funding and stockpiling around rare earths and strategic materials — and how each government frames its stance, in the original language with translation provenance.",
  version: "v0.4-coverage",
  lastUpdated: "2026-09-22",
  /**
   * ISO date prospective monitoring began — set only when a monitoring-capable
   * release is actually deployed. Null until then, deliberately: no timeliness
   * statistic may be computed against a start date the site never had.
   */
  monitoringStartedAt: null as string | null,
  scopeStart: "2018",
  // Placeholder until a domain is registered / deployed.
  url: "https://strategic-materials-policy-tracker.vercel.app",
} as const;

export const nav = [
  { href: "/events", label: "Events" },
  { href: "/materials", label: "Materials" },
  { href: "/actors", label: "Actors" },
  { href: "/framing", label: "Framing" },
  { href: "/compare", label: "Compare" },
  { href: "/coverage", label: "Coverage" },
  { href: "/timeline", label: "Timeline" },
  { href: "/sources", label: "Sources" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/search", label: "Search" },
  { href: "/saved", label: "Saved" },
  { href: "/methodology", label: "Methodology" },
  { href: "/data", label: "Data" },
  { href: "/about", label: "About" },
] as const;
