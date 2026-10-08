/**
 * M2.5 DOE CMEI provenance preflight, not a source monitor.
 * This module never creates a publication ID, finance claim, policy candidate,
 * private editorial item, source-monitor state, or source lifecycle timestamp.
 *
 * Every extracted title/date/tag below is a HINT requiring publisher HTML
 * inspection. In particular, a visible date token is NOT linked to an anchor.
 */
import { createHash } from "node:crypto";

export const DOE_CMEI_LISTING_0 =
  "https://www.energy.gov/collection/view?page=0&paragraph=822121";
export const DOE_CMEI_LISTING_1 =
  "https://www.energy.gov/collection/view?page=1&paragraph=822121";
export const DOE_CMEI_EXAMPLES = [
  {
    role: "mining_selections_not_contracts",
    url: "https://www.energy.gov/cmei/articles/does-office-critical-minerals-and-energy-innovation-announces-295-million-national",
  },
  {
    role: "mining_workforce_prize",
    url: "https://www.energy.gov/cmei/articles/energy-department-launches-16-million-prize-grow-mining-and-critical-minerals",
  },
  {
    role: "non_minerals_control",
    url: "https://www.energy.gov/cmei/articles/doe-launches-new-program-help-builders-cut-construction-costs-and-save-americans",
  },
] as const;
const MAX_HTML_BYTES = 2_000_000;
const MAX_EXCERPT = 260;
const TIMEOUT_MS = 18_000;
const DOI = /^(?:www\.)?energy\.gov$/;
const MONTHS =
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+20\d{2}\b/gi;

export type DoePage = {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  bytes: number;
  htmlDigestSha256: string;
  headingHint: string | null;
  anchorCandidates: { url: string; titleHint: string }[];
  outsideMainArticleHints: { url: string; titleHint: string }[];
  unpairedVisibleDateHints: string[];
  notes: string[];
};
export type DoeArticleSample = {
  role: (typeof DOE_CMEI_EXAMPLES)[number]["role"];
  requestedUrl: string;
  finalUrl: string;
  status: number;
  htmlDigestSha256: string;
  headingHint: string | null;
  metaDateHints: string[];
  unpairedVisibleDateHints: string[];
  officeAttributionHint: boolean;
  notes: string[];
};
export type DoeForensicReport = {
  version: 1;
  mode: "doe_cmei_listing_and_article_forensics_only";
  checkedAt: string;
  status: "observed_forensic_only" | "degraded_do_not_activate";
  pages: DoePage[];
  articles: DoeArticleSample[];
  listedAcrossPages: number;
  overlapBetweenPages: number;
  warnings: string[];
  eligibleForMonitoringActivation: false;
};
function visible(s: string): string {
  return s.replace(/<(?:script|style|noscript)\b[^>]*>[\s\S]*?<\/(?:script|style|noscript)>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:nbsp|#160);/gi, " ")
    .replace(/&(?:amp|#38);/gi, "&")
    .replace(/&(?:quot|#34);/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/\s+/g, " ").trim();
}
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
function hostOnly(url: string): URL {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || !DOI.test(parsed.hostname) ||
      parsed.username || parsed.password || parsed.port)
    throw Error("DOE forensic request left expected HTTPS publisher host");
  return parsed;
}
function title(html: string): string | null {
  const matches = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/gi)];
  const choices = matches.map((m) => visible(m[1])).filter(Boolean);
  return choices.length === 1 && choices[0].length <= 500 ? choices[0] : null;
}
function dateHints(html: string): string[] {
  return [...new Set((visible(html).match(MONTHS) ?? []).slice(0, 15))].slice(0, 10);
}
function metadataDateHints(html: string): string[] {
  // Attribute order isn't guaranteed. Record possible meta evidence only;
  // never convert a meta tag into an authoritative publication date.
  const tags = [...html.matchAll(/<meta\b[^>]*>/gi)].map((x) => x[0]);
  const filtered = tags.filter((x) =>
    /(?:article:published_time|article:modified_time|datePublished|dateModified|published_time|modified_time|\bdate\b|lastmod)/i.test(x));
  return filtered.slice(0, 12).map((x) => x.replace(/\s+/g, " ").slice(0, MAX_EXCERPT));
}
export function parseDoeListingForensics(
  html: string, requestedUrl: string, finalUrl = requestedUrl, status = 200,
): DoePage {
  hostOnly(requestedUrl);
  hostOnly(finalUrl);
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES || !/<html\b/i.test(html))
    throw Error("DOE listing missing valid bounded HTML");
  // The DOE HTML has non-listing headline anchors in site chrome. Only
  // analyze the unique document <main> region, and preserve off-main
  // headline shapes separately as diagnostic hints. We deliberately do not
  // certify an article card/date pair merely by its position inside main.
  const mains = [...html.matchAll(/<main\b[^>]*>([\s\S]*?)<\/main\s*>/gi)];
  if (mains.length !== 1)
    throw Error("DOE listing lacks a single bounded <main> region; refuse unspecific anchor extraction");
  const mainHtml = mains[0][1];
  function anchors(fragment: string): Map<string, string> {
    const candidates = new Map<string, string>();
    for (const a of fragment.matchAll(/<a\b([^>]*?)>([\s\S]*?)<\/a\s*>/gi)) {
      const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(a[1]);
      const rawHref = (href?.[1] ?? href?.[2] ?? "").replace(/&amp;/gi, "&");
      if (!rawHref) continue;
      let link: URL;
      try { link = hostOnly(new URL(rawHref, finalUrl).toString()); }
      catch { continue; }
      // A CMEI-filtered list can legitimately contain /articles/ as well as
      // /cmei/articles/. Path prefix alone must NEVER certify a listing row.
      if (!/^\/(?:cmei\/articles|articles)\/[a-z0-9][a-z0-9-]+\/?$/i.test(link.pathname))
        continue;
      const text = visible(a[2]);
      if (text.length < 12 || text.length > 500) continue;
      link.hostname = "www.energy.gov";
      link.search = "";
      link.hash = "";
      link.pathname = link.pathname.replace(/\/$/, "");
      const key = link.toString();
      if (!candidates.has(key)) candidates.set(key, text);
    }
    return candidates;
  }
  const allArticleLinks = anchors(html);
  const mainArticleLinks = anchors(mainHtml);
  const outsideMainArticleHints = [...allArticleLinks]
    .filter(([url]) => !mainArticleLinks.has(url)).slice(0, 20)
    .map(([url, titleHint]) => ({ url, titleHint }));
  return {
    requestedUrl, finalUrl, status,
    bytes: Buffer.byteLength(html, "utf8"),
    htmlDigestSha256: sha(html), headingHint: title(mainHtml),
    anchorCandidates: [...mainArticleLinks].slice(0, 80)
      .map(([url, titleHint]) => ({ url, titleHint })),
    outsideMainArticleHints,
    unpairedVisibleDateHints: dateHints(mainHtml),
    notes: [
      "Only candidate article paths inside the single main region are counted; off-main news-link hints are excluded.",
      "The main region may still contain sidebar/featured links; result-card boundary has NOT been verified.",
      "Visible date hints are not bound to specific titles; no date/issuer/identity accepted.",
      "HTML digest includes layout and navigation; it is NOT an article-content revision fingerprint.",
    ],
  };
}
export function parseDoeArticleForensics(
  html: string, role: DoeArticleSample["role"],
  requestedUrl: string, finalUrl = requestedUrl, status = 200,
): DoeArticleSample {
  hostOnly(requestedUrl);
  hostOnly(finalUrl);
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES || !/<html\b/i.test(html))
    throw Error("DOE article missing valid bounded HTML");
  return {
    role, requestedUrl, finalUrl, status,
    htmlDigestSha256: sha(html),
    headingHint: title(html),
    metaDateHints: metadataDateHints(html),
    unpairedVisibleDateHints: dateHints(html),
    officeAttributionHint: /\bOffice of Critical Minerals and Energy Innovation\b/i.test(visible(html)),
    notes: [
      "Only HTML/metadata diagnostics; full publisher article body and date not verified.",
      role === "mining_selections_not_contracts"
        ? "DOE calls these selections for award negotiations, not contracted loans or disbursements."
        : role === "mining_workforce_prize"
          ? "Prize pool is not a direct project financial commitment; verify competition terms."
          : "Negative-control topic: construction cost program need not be a critical-minerals policy event.",
    ],
  };
}
async function getPublisherHtml(
  url: string, fetchFn: typeof fetch,
): Promise<{ html: string; url: string; status: number }> {
  hostOnly(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetchFn(url, {
      redirect: "follow", signal: controller.signal,
      headers: { accept: "text/html",
        "user-agent": "SMPT-DOE-CMEI-provenance-preflight/1.0 (read-only non-collecting)" },
    });
    const finalUrl = response.url || url;
    hostOnly(finalUrl);
    if (!response.ok) throw Error("DOE provenance HTTP " + response.status + ": " + url);
    const contentType = response.headers.get("content-type") ?? "";
    if (!/text\/html/i.test(contentType))
      throw Error("DOE provenance did not return text/html: " + url);
    const html = await response.text();
    if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES)
      throw Error("DOE provenance HTML exceeded bounded response: " + url);
    return { html, url: finalUrl, status: response.status };
  } finally { clearTimeout(timer); }
}
/** Execute exactly five bounded fetches. No pagination follow-up or state. */
export async function runDoeCmeiPreflight(
  checkedAt: string, fetchFn: typeof fetch = fetch,
): Promise<DoeForensicReport> {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(checkedAt) ||
      Number.isNaN(Date.parse(checkedAt)))
    throw Error("DOE provenance requires precise UTC timestamp");
  const pages: DoePage[] = [];
  const articles: DoeArticleSample[] = [];
  const warnings: string[] = [];
  for (const url of [DOE_CMEI_LISTING_0, DOE_CMEI_LISTING_1]) {
    try {
      const response = await getPublisherHtml(url, fetchFn);
      pages.push(parseDoeListingForensics(response.html, url, response.url, response.status));
    } catch (error) {
      warnings.push("Listing failed or changed: " + url + ": " + String(error).slice(0, 180));
    }
  }
  for (const article of DOE_CMEI_EXAMPLES) {
    try {
      const response = await getPublisherHtml(article.url, fetchFn);
      articles.push(parseDoeArticleForensics(response.html, article.role, article.url,
        response.url, response.status));
    } catch (error) {
      warnings.push("Sample failed or changed: " + article.role + ": " + String(error).slice(0, 180));
    }
  }
  const first = new Set(pages[0]?.anchorCandidates.map((a) => a.url) ?? []);
  const second = new Set(pages[1]?.anchorCandidates.map((a) => a.url) ?? []);
  const overlapBetweenPages = [...first].filter((s) => second.has(s)).length;
  if (pages.length !== 2 || articles.length !== DOE_CMEI_EXAMPLES.length)
    warnings.push("Incomplete five-fetch sample; cannot evaluate monitoring readiness.");
  if (pages.some((p) => p.anchorCandidates.length < 3 || !p.headingHint))
    warnings.push("Listing article candidates or unique H1 missing; investigate publisher template.");
  if (articles.some((a) => !a.headingHint))
    warnings.push("Publisher sample article missing unique bounded H1.");
  if (overlapBetweenPages > 0)
    warnings.push("Potential listing-page overlap; manually scope cards/pagination before source admission.");
  warnings.push("This report NEVER establishes eligibility for monitoring or a policy/financial commitment.");
  return {
    version: 1, mode: "doe_cmei_listing_and_article_forensics_only",
    checkedAt, pages, articles,
    listedAcrossPages: new Set([...first, ...second]).size,
    overlapBetweenPages,
    warnings, eligibleForMonitoringActivation: false,
    status: warnings.some((w) => /failed|Incomplete|missing|overlap/.test(w))
      ? "degraded_do_not_activate" : "observed_forensic_only",
  };
}
