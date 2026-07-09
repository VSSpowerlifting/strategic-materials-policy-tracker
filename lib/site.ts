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
  version: "v0.3-framing",
  lastUpdated: "2026-06-13",
  scopeStart: "April 2025",
  // Placeholder until a domain is registered / deployed.
  url: "https://strategic-materials-policy-tracker.vercel.app",
} as const;

export const nav = [
  { href: "/events", label: "Events" },
  { href: "/materials", label: "Materials" },
  { href: "/actors", label: "Actors" },
  { href: "/framing", label: "Framing" },
  { href: "/compare", label: "Compare" },
  { href: "/timeline", label: "Timeline" },
  { href: "/sources", label: "Sources" },
  { href: "/methodology", label: "Methodology" },
  { href: "/data", label: "Data" },
  { href: "/about", label: "About" },
] as const;
