/**
 * Site-wide visual motion is a progressive enhancement. The home page has its
 * own deliberately composed reveals; other routes use these content targets.
 * Route classification never changes what is rendered or which records exist.
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

/** Named result-card markers are explicit; filter controls and table rows are excluded. */
export function siteMotionSelector(scope: SiteMotionScope): string {
  if (scope === "home") return "";
  const common = 'h1, section, [data-site-motion="card"]';
  if (scope === "research-index") return `${common}, article`;
  if (scope === "materials-index") return `${common}, a.oxide-rule`;
  if (scope === "dossier") return `${common}, .dossier > :not(:first-child)`;
  if (scope === "research-article") return `${common}, figure`;
  return common;
}
