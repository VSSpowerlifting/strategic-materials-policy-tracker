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
    "A source-linked policy and financial-intelligence database tracking how China, the United States, the EU and allied states use export controls, designations, public money, ownership, offtake and stockpiling around rare earths and strategic materials — clause by clause and commitment by commitment, with how each government frames its stance in the original language.",
  version: "v0.5-capital-control",
  lastUpdated: "2026-09-23",
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
  { href: "/capital", label: "Capital" },
  { href: "/controls", label: "Controls" },
  { href: "/interplay", label: "Interplay" },
  { href: "/materials", label: "Materials" },
  { href: "/actors", label: "Actors" },
  { href: "/framing", label: "Framing" },
  { href: "/compare", label: "Compare" },
  { href: "/coverage", label: "Coverage" },
  { href: "/timeline", label: "Timeline" },
  { href: "/sources", label: "Sources" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/search", label: "Search" },
  { href: "/methodology", label: "Methodology" },
  { href: "/data", label: "Data" },
] as const;

/** Pages reachable from the footer and sitemap but kept out of the crowded header. */
export const secondaryNav = [
  { href: "/saved", label: "Saved" },
  { href: "/about", label: "About" },
] as const;
