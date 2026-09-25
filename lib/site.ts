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
  version: "v0.6-capital-intelligence",
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

/**
 * Header navigation, grouped by what a reader is looking for. `primary` items
 * sit inline in the desktop header; the rest open under "More". On small
 * screens every group opens from one "Menu" disclosure. Search has its own
 * always-visible header link, so it is listed here only for the footer and
 * sitemap.
 */
export const navGroups = [
  {
    label: "Policy record",
    items: [
      { href: "/events", label: "Events", primary: true },
      { href: "/timeline", label: "Timeline", primary: false },
      { href: "/framing", label: "Framing", primary: true },
      { href: "/compare", label: "Compare", primary: false },
    ],
  },
  {
    label: "Capital & Control",
    items: [
      { href: "/capital", label: "Capital", primary: true },
      { href: "/controls", label: "Controls", primary: true },
      { href: "/interplay", label: "Interplay", primary: true },
      { href: "/portfolios", label: "Portfolios", primary: true },
      { href: "/projects", label: "Projects", primary: false },
      { href: "/organizations", label: "Organizations", primary: false },
      { href: "/programmes", label: "Programmes", primary: false },
    ],
  },
  {
    label: "Reference",
    items: [
      { href: "/materials", label: "Materials", primary: true },
      { href: "/actors", label: "Actors", primary: true },
      { href: "/sources", label: "Sources", primary: false },
      { href: "/coverage", label: "Coverage", primary: false },
      { href: "/watchlist", label: "Watchlist", primary: false },
    ],
  },
  {
    label: "Method & data",
    items: [
      { href: "/methodology", label: "Methodology", primary: false },
      { href: "/data", label: "Data", primary: false },
      { href: "/search", label: "Search", primary: false },
    ],
  },
] as const;

/**
 * The six inline header links of the Lattice Register design. A presentation layer only: `navGroups` and `nav`
 * stay complete, so the sitemap, the footer and the small-screen menu still reach every page. "Explore" opens
 * the existing event explorer and is marked current across the record-browsing pages; "Jurisdictions" is the
 * `/actors` route under its design label.
 */
export const headerNav: readonly { href: string; label: string; exact?: boolean; alsoCurrentFor?: readonly string[] }[] = [
  { href: "/", label: "Overview", exact: true },
  { href: "/compare", label: "Compare" },
  {
    href: "/events",
    label: "Explore",
    alsoCurrentFor: ["/capital", "/controls", "/projects", "/organizations", "/programmes", "/sources", "/timeline", "/framing", "/search"],
  },
  { href: "/materials", label: "Materials" },
  { href: "/actors", label: "Jurisdictions" },
  { href: "/methodology", label: "Method" },
];

/** Every header destination, flattened (footer, sitemap). */
export const nav = navGroups.flatMap((g) => g.items.map(({ href, label }) => ({ href, label })));

/** Inline desktop links, in reading order: the record, then Capital & Control, then reference. */
export const primaryNav = nav.filter((i) =>
  navGroups.some((g) => g.items.some((x) => x.href === i.href && x.primary)),
);

/** Pages reachable from the footer and sitemap but kept out of the crowded header. */
export const secondaryNav = [
  { href: "/saved", label: "Saved" },
  { href: "/about", label: "About" },
] as const;
