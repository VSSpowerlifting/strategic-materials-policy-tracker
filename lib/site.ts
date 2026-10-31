/**
 * Single source of truth for site identity, navigation, and the footer
 * disclaimers. The name was chosen to fit the multi-actor, policy-instrument
 * scope (not "control", since the project also tracks funding and stockpiling).
 */
export const site = {
  name: "Strategic Materials Policy Tracker",
  shortName: "SMPT",
  tagline:
    "Comparative economic-security research on strategic-material policy and implementation.",
  description:
    "Comparative economic-security research on industrial policy, trade and legal controls, investment, public financing and reported industrial activity across strategic-material supply chains, grounded in source-linked records.",
  version: "v0.6-capital-intelligence",
  /** Last curated corpus revision, NOT a claim that every row was rechecked on this date. */
  lastUpdated: "2026-10-17",
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
      { href: "/response", label: "Industrial response", primary: false },
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
 * The five research journeys, in the order a new reader meets them. Each journey owns a landing route and a set
 * of supporting views; every page in `nav` except /search (which has its own header control) belongs to exactly
 * one journey, so exactly one header item is ever marked current. A journey's supporting views appear in a second
 * header row only while the reader is inside that journey (and under its name in the small-screen menu), so the
 * header never lists every page at once.
 */
export const journeys = [
  {
    href: "/events",
    label: "Government action",
    question: "What have governments decided, and in what legal form?",
    views: [
      { href: "/events", label: "All events" },
      { href: "/timeline", label: "Timeline" },
      { href: "/controls", label: "Control clauses" },
      { href: "/framing", label: "Official framing" },
      { href: "/actors", label: "Governments" },
      { href: "/materials", label: "Materials" },
      { href: "/watchlist", label: "Watchlist" },
    ],
  },
  {
    href: "/capital",
    label: "Public capital",
    question: "Which public money and instruments are committed, and at what status?",
    views: [
      { href: "/capital", label: "Financial commitments" },
      { href: "/programmes", label: "Programmes" },
      { href: "/organizations", label: "Organizations" },
    ],
  },
  {
    href: "/projects",
    label: "Projects",
    question: "What does the record show for one industrial project?",
    views: [{ href: "/projects", label: "Project investigations" }],
  },
  {
    href: "/compare",
    label: "Compare",
    question: "How do approaches differ across governments and supply-chain stages?",
    views: [
      { href: "/compare", label: "Compare governments" },
      { href: "/portfolios", label: "Portfolios" },
      { href: "/interplay", label: "Capital and controls together" },
      { href: "/response", label: "Response by stage" },
    ],
  },
  {
    href: "/sources",
    label: "Evidence",
    question: "Where does each claim come from, and what does the corpus leave out?",
    views: [
      { href: "/sources", label: "Sources" },
      { href: "/methodology", label: "Methodology" },
      { href: "/coverage", label: "Coverage" },
      { href: "/data", label: "Data & API" },
    ],
  },
] as const;

/** Header journeys. The wordmark links to the overview, so the overview is not repeated here. */
export const headerNav: readonly { href: string; label: string; exact?: boolean; alsoCurrentFor?: readonly string[] }[] =
  journeys.map(({ href, label, views }) => ({
    href,
    label,
    alsoCurrentFor: views.map((v) => v.href).filter((h) => h !== href),
  }));

/** `pathname` is `href` or one of its descendants (or exactly `href` when `exact`). */
export const isActivePath = (pathname: string, href: string, exact = false) =>
  exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

/** Whether a header journey is the current one for `pathname`: its landing route or any of its views, with descendants. */
export const isNavCurrent = (pathname: string, item: (typeof headerNav)[number]) =>
  isActivePath(pathname, item.href, item.exact) || (item.alsoCurrentFor ?? []).some((h) => isActivePath(pathname, h));

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
