/**
 * Site-wide visual motion is a progressive enhancement, and it is limited to result cards: each card in a
 * directory, the research index and the materials index enters once as it scrolls into view, and a card that a
 * filter adds enters the same way, so a changed result list reads as changed. Headings, sections, figures and
 * reading text never wait on motion; title blocks have their own settle and exhibits their own draw (see
 * docs/design/MOTION_AND_INTERACTION.md). Route classification never changes what is rendered or which records
 * exist.
 */
export type SiteMotionScope = "home" | "research-index" | "research-article" | "materials-index" | "dossier" | "standard";

export function siteMotionScope(pathname: string): SiteMotionScope {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return "home";
  if (path === "/research") return "research-index";
  if (path.startsWith("/research/")) return "research-article";
  if (path === "/materials") return "materials-index";
  if (path.startsWith("/materials/")) return "dossier";
  return "standard";
}

/** Named result-card markers are explicit; headings, sections, figures, filter controls and table rows are excluded. */
export function siteMotionSelector(scope: SiteMotionScope): string {
  if (scope === "home") return "";
  const cards = '[data-site-motion="card"]';
  if (scope === "research-index") return `${cards}, article`;
  if (scope === "materials-index") return `${cards}, a.oxide-rule`;
  return cards;
}
