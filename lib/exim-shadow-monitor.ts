/**
 * M2.1 EXIM-only shadow publication monitor. Separate from M1's two-source
 * memory, GitHub workflow, and private editorial inbox. Releases are NOT
 * verified policy events, binding financing, or approved candidates.
 */
import { createHash } from "node:crypto";

export const EXIM_LISTING = "https://www.exim.gov/news";
export const EXIM_SOURCE_ID = "watch-us-exim-news-shadow" as const;
export const EXIM_MAX_PAGES = 3;
const MAX_PAGE_BYTES = 2_000_000;
const MAX_ARTICLE_BYTES = 1_000_000;
const MAX_PAGE_ITEMS = 35;
const MAX_SAVED_IDS = 3_000;
const TIMEOUT_MS = 18_000;
const HINT = /critical[ -]minerals?|rare[ -]earth|gallium|germanium|graphite|antimony|tungsten|lithium|nickel|cobalt|mining|mine\b|supply[ -]chain|industrial[ -]base/i;
const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};
const DATE_RE = /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(20\d\d)\b/gi;
const hash = (s: string): string => createHash("sha256").update(s).digest("hex");
const record = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const iso = (s: string): boolean => !Number.isNaN(Date.parse(s)) && /^\d{4}-\d{2}-\d{2}T/.test(s);
function decodeEntities(s: string): string {
  return s.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp|ndash|mdash|rsquo|lsquo|rdquo|ldquo);/gi,
    (full, ent: string) => {
      const predefined: Record<string, string> = {
        amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
        ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
      };
      if (predefined[ent.toLowerCase()] !== undefined) return predefined[ent.toLowerCase()];
      const num = ent.toLowerCase().startsWith("#x") ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      return Number.isInteger(num) && num > 0 && num <= 0x10ffff && !(num >= 0xd800 && num <= 0xdfff)
        ? String.fromCodePoint(num) : full;
    });
}
function visibleText(html: string): string {
  return decodeEntities(html.replace(/<(?:script|style|noscript)\b[^>]*>[\s\S]*?<\/(?:script|style|noscript)>/gi, " ")
    .replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).trim();
}
function officialArticleUrl(raw: string): string | null {
  try {
    const u = new URL(decodeEntities(raw), EXIM_LISTING);
    if (u.protocol !== "https:" || !["exim.gov", "www.exim.gov"].includes(u.hostname) ||
        u.username || u.password || !/^\/news\/[a-z0-9][a-z0-9-]*\/?$/i.test(u.pathname)) return null;
    // This real EXIM navigation section matched our release-slug pattern in the
    // failed 2026-10-08 live bootstrap (#37730218209). It is a category index,
    // NOT an individual dated news release. Keep date checks strict on actual
    // article candidates instead of trying to assign this link a nearby date.
    if (u.pathname.replace(/\/$/, "").toLowerCase() === "/news/media-advisories") return null;
    u.hostname = "www.exim.gov";
    u.hash = "";
    u.search = "";
    u.pathname = u.pathname.replace(/\/$/, "");
    return u.toString();
  } catch { return null; }
}
function parseDate(raw: string): string | null {
  const match = [...raw.matchAll(DATE_RE)].at(-1);
  if (!match) return null;
  const month = MONTHS[match[1].slice(0, 3).toLowerCase()];
  const day = String(Number(match[2])).padStart(2, "0");
  const date = match[3] + "-" + month + "-" + day;
  if (Number(match[2]) < 1 || Number(match[2]) > 31 ||
      Number.isNaN(Date.parse(date)) || new Date(date + "T00:00:00Z").toISOString().slice(0, 10) !== date)
    return null;
  return date;
}
export type ListedEximRelease = { id: string; url: string; title: string; publicationDate: string };
export type EximRelease = ListedEximRelease & { fingerprint: string; keywordHintOnly: boolean };
export type EximState = {
  version: 1;
  sourceId: typeof EXIM_SOURCE_ID;
  seen: Record<string, string>;
  lastLatestId: string;
  lastSuccessfulAt: string;
};
export type EximObservation = EximRelease & { change: "new" | "revised" };
export type EximReport = {
  version: 1;
  mode: "shadow_exim_publications_only";
  sourceId: typeof EXIM_SOURCE_ID;
  observedAt: string;
  health: "ok" | "blocked" | "http_error" | "timeout" | "invalid_response" | "network_error";
  status: number | null;
  baseline: boolean;
  observed: number;
  pagesRead: number;
  newCount: number;
  revisedCount: number;
  possibleWindowGap: boolean;
  lastSuccessfulAt: string | null;
  message: string | null;
  reviewOnly: EximObservation[];
};
export type EximEditorialQueue = {
  version: 1;
  mode: "shadow_unverified_exim_editorial_queue";
  observedAt: string;
  sourceId: typeof EXIM_SOURCE_ID;
  health: EximReport["health"];
  possibleWindowGap: boolean;
  items: { observationId: string; watchSourceId: typeof EXIM_SOURCE_ID; observedAt: string;
    change: "new" | "revised"; publicationDate: string; titleAsListed: string; officialUrl: string;
    keywordHintOnly: boolean; reviewStatus: "unreviewed" }[];
};

/** Only official anchored dated releases qualify; no dates or identities inferred. */
export function parseEximNewsListing(html: string): ListedEximRelease[] {
  if (Buffer.byteLength(html, "utf8") > MAX_PAGE_BYTES || !/<html\b/i.test(html) ||
      !/<a\b/i.test(html)) throw Error("EXIM listing missing HTML anchors or exceeded safe size");
  const out: ListedEximRelease[] = [];
  const seen = new Set<string>();
  // Image-only or otherwise untitled anchors may point to a real release whose
  // dated headline link appears separately. Accept only if that *same URL*
  // has a verified dated headline elsewhere in the listing. Unknown links
  // without a matching dated headline still fail closed.
  const unverifiedUntitled = new Map<string, number>();
  let previousArticleEnd = 0;
  for (const match of html.matchAll(/<a\b([^>]*?)>([\s\S]*?)<\/a\s*>/gi)) {
    const attr = /\bhref\s*=\s*(?:"([^"]+)"|'([^']+)')/i.exec(match[1]);
    const url = officialArticleUrl(attr?.[1] ?? attr?.[2] ?? "");
    if (!url) continue;
    const title = visibleText(match[2]);
    if (title.length < 12 || title.length > 600) {
      unverifiedUntitled.set(url, title.length);
      continue;
    }
    // Date is rendered in the listing immediately before the title link.
    // Require one visible date BETWEEN consecutive official article links:
    // never reuse a previous item's date when a new row has none.
    const lead = visibleText(html.slice(Math.max(previousArticleEnd, match.index! - 3500), match.index));
    const dateMatches = [...lead.matchAll(DATE_RE)];
    const latest = dateMatches.at(-1);
    const trailing = latest ? lead.slice((latest.index ?? 0) + latest[0].length).trim() : "";
    const date = latest ? parseDate(latest[0]) : null;
    if (!date || trailing.length > 180) throw Error("EXIM listing article has no nearby official publication date: " + url);
    previousArticleEnd = match.index! + match[0].length;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ id: hash(EXIM_SOURCE_ID + "\n" + url), url, title, publicationDate: date });
    if (out.length > MAX_PAGE_ITEMS) throw Error("EXIM listing exceeds bounded 35-release parser limit");
  }
  // Do not silently discard new undated/untitled article-shaped URLs. Only
  // duplicate presentation anchors for an independently dated title may pass.
  for (const [url, titleLength] of unverifiedUntitled) {
    if (!seen.has(url))
      throw Error("EXIM article-shaped link lacks verified dated headline anchor: " + url +
        " (visible title length " + titleLength + ")");
  }
  if (out.length < 5) throw Error("EXIM listing has fewer than five dated official release links; treat as changed template");
  return out;
}

/** Full official release body only, excluding site navigation and footer dynamics. */
export function parseEximArticle(html: string, listed: ListedEximRelease): EximRelease {
  if (Buffer.byteLength(html, "utf8") > MAX_ARTICLE_BYTES || !/<html\b/i.test(html))
    throw Error("EXIM article is not bounded HTML");
  const text = visibleText(html);
  const start = text.search(/\bFOR IMMEDIATE RELEASE\b/i);
  const end = start === -1 ? -1 : text.slice(start).search(/\bABOUT EXIM\s*:/i);
  if (start === -1 || end < 0 || end < 160 || end > 45_000)
    throw Error("EXIM article missing stable release-body boundary");
  const body = text.slice(start, start + end).trim();
  const date = parseDate(body.slice(0, 130));
  if (!date || date !== listed.publicationDate)
    throw Error("EXIM full-release date disagrees with dated listing for " + listed.url);
  const titleArea = text.slice(Math.max(0, start - 800), start).toLowerCase();
  if (!titleArea.includes(listed.title.slice(0, Math.min(28, listed.title.length)).toLowerCase()))
    throw Error("EXIM official release title differs from index: " + listed.url);
  return {
    ...listed,
    fingerprint: hash(listed.title + "\n" + listed.publicationDate + "\n" + body),
    keywordHintOnly: HINT.test(listed.title),
  };
}

export function readEximState(value: unknown): EximState | null {
  if (value === null || value === undefined) return null;
  if (!record(value) || value.version !== 1 || value.sourceId !== EXIM_SOURCE_ID ||
      !record(value.seen) || typeof value.lastLatestId !== "string" ||
      !/^[a-f0-9]{64}$/.test(value.lastLatestId) || typeof value.lastSuccessfulAt !== "string" ||
      !iso(value.lastSuccessfulAt)) throw Error("EXIM shadow state invalid or incompatible; refuse reset");
  const entries = Object.entries(value.seen);
  if (!entries.length || entries.length > MAX_SAVED_IDS ||
      entries.some(([id, fp]) => !/^[a-f0-9]{64}$/.test(id) || typeof fp !== "string" ||
        !/^[a-f0-9]{64}$/.test(fp))) throw Error("EXIM state identities invalid");
  if (!Object.hasOwn(value.seen, value.lastLatestId)) throw Error("EXIM last-latest anchor missing in seen identities");
  return { version: 1, sourceId: EXIM_SOURCE_ID, seen: Object.fromEntries(entries) as Record<string, string>, lastLatestId: value.lastLatestId, lastSuccessfulAt: value.lastSuccessfulAt };
}

export function eximEditorialQueue(report: EximReport): EximEditorialQueue {
  return {
    version: 1, mode: "shadow_unverified_exim_editorial_queue",
    observedAt: report.observedAt, sourceId: EXIM_SOURCE_ID,
    health: report.health, possibleWindowGap: report.possibleWindowGap,
    items: report.health !== "ok" || report.possibleWindowGap || report.baseline ? [] :
      report.reviewOnly.map((r) => ({
        observationId: r.id, watchSourceId: EXIM_SOURCE_ID, observedAt: report.observedAt,
        change: r.change, publicationDate: r.publicationDate, titleAsListed: r.title,
        officialUrl: r.url, keywordHintOnly: r.keywordHintOnly, reviewStatus: "unreviewed",
      })),
  };
}
function eximPage(page: number): string {
  return EXIM_LISTING + "?page=" + page;
}
async function readHtml(fetchFn: typeof fetch, url: string): Promise<{ html: string; status: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetchFn(url, {
      redirect: "follow", signal: controller.signal,
      headers: { accept: "text/html", "user-agent": "SMPT-EXIM-shadow/1.0 (read-only official-publications observation)" },
    });
    const final = new URL(response.url || url);
    if (final.protocol !== "https:" || !["www.exim.gov", "exim.gov"].includes(final.hostname))
      throw Error("EXIM request redirected away from official host");
    if (!response.ok) {
      const error = new Error("EXIM HTTP " + response.status) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }
    const html = await response.text();
    if (Buffer.byteLength(html, "utf8") > MAX_PAGE_BYTES) throw Error("EXIM response too large");
    return { html, status: response.status };
  } finally { clearTimeout(timer); }
}
export async function runEximShadow(
  previousRaw: unknown,
  observedAt: string,
  bootstrap: boolean,
  fetchFn: typeof fetch = fetch,
): Promise<{ state: EximState | null; report: EximReport; queue: EximEditorialQueue }> {
  const previous = readEximState(previousRaw);
  if (bootstrap && previous) throw Error("Refusing EXIM re-baseline: prior state already exists");
  if (!bootstrap && !previous) throw Error("EXIM baseline missing: run explicit first-time bootstrap or restore state artifact");
  if (!iso(observedAt)) throw Error("Invalid EXIM observation time");
  const fail = (health: EximReport["health"], status: number | null, error: string, pagesRead: number) => {
    const report: EximReport = {
      version: 1, mode: "shadow_exim_publications_only", sourceId: EXIM_SOURCE_ID, observedAt,
      health, status, baseline: !previous, observed: 0, pagesRead, newCount: 0, revisedCount: 0,
      possibleWindowGap: false, lastSuccessfulAt: previous?.lastSuccessfulAt ?? null,
      message: error.slice(0, 350), reviewOnly: [],
    };
    return { state: previous, report, queue: eximEditorialQueue(report) };
  };
  let pagesRead = 0, status: number | null = null;
  try {
    const listed: ListedEximRelease[] = [];
    const ids = new Set<string>();
    for (let page = 0; page < EXIM_MAX_PAGES; page++) {
      const response = await readHtml(fetchFn, eximPage(page));
      status = response.status;
      const rows = parseEximNewsListing(response.html);
      pagesRead++;
      const fresh = rows.filter((item) => !ids.has(item.id));
      if (fresh.length < rows.length) throw Error("EXIM listing pagination repeated a release; cannot establish complete window");
      for (const row of fresh) { ids.add(row.id); listed.push(row); }
      if (!previous || listed.some((r) => r.id === previous.lastLatestId)) break;
      // If no prior latest in the first page, bounded traversal is mandatory.
    }
    if (!listed.length) throw Error("EXIM empty bounded listing");
    const anchored = !previous || listed.some((r) => r.id === previous.lastLatestId);
    // An absent anchor may mean >3 pages of new releases or HTML changes.
    // Do not advance any observation identities when continuity is uncertain.
    if (!anchored) {
      const report: EximReport = {
        version: 1, mode: "shadow_exim_publications_only", sourceId: EXIM_SOURCE_ID, observedAt,
        health: "ok", status, baseline: false, observed: listed.length, pagesRead,
        newCount: 0, revisedCount: 0, possibleWindowGap: true,
        lastSuccessfulAt: previous!.lastSuccessfulAt,
        message: "Previous latest release absent from bounded three-page window; investigate coverage gap before resuming",
        reviewOnly: [],
      };
      return { state: previous, report, queue: eximEditorialQueue(report) };
    }
    const fetched: EximRelease[] = [];
    // No title-only revision claims: hash verified full release bodies.
    // Fail closed if an article cannot be read; do not advance partial state.
    for (const item of listed) {
      const article = await readHtml(fetchFn, item.url);
      fetched.push(parseEximArticle(article.html, item));
    }
    const seen = { ...(previous?.seen ?? {}) };
    const changes: EximObservation[] = [];
    for (const item of fetched) {
      if (previous && seen[item.id] !== item.fingerprint) {
        changes.push({ ...item, change: seen[item.id] === undefined ? "new" : "revised" });
      }
      delete seen[item.id];
      seen[item.id] = item.fingerprint;
    }
    while (Object.keys(seen).length > MAX_SAVED_IDS) delete seen[Object.keys(seen)[0]];
    const state: EximState = { version: 1, sourceId: EXIM_SOURCE_ID,
      seen, lastLatestId: listed[0].id, lastSuccessfulAt: observedAt };
    const report: EximReport = {
      version: 1, mode: "shadow_exim_publications_only", sourceId: EXIM_SOURCE_ID, observedAt,
      health: "ok", status, baseline: !previous, observed: fetched.length,
      pagesRead, newCount: changes.filter((r) => r.change === "new").length,
      revisedCount: changes.filter((r) => r.change === "revised").length,
      possibleWindowGap: false, lastSuccessfulAt: observedAt, message: !previous
        ? "Explicit baseline created; first-run entries are not newly discovered" : null,
      reviewOnly: changes,
    };
    return { state, report, queue: eximEditorialQueue(report) };
  } catch (error) {
    const e = error as Error & { status?: number };
    const message = e.message || "Unknown EXIM collection failure";
    const health: EximReport["health"] = [401, 403, 429, 451].includes(e.status ?? -1) ? "blocked" :
      typeof e.status === "number" ? "http_error" :
      e.name === "AbortError" ? "timeout" :
      /EXIM.*(listing|article|date|title|HTML|boundary|window|too large|pagination)|release-body|release title|template|official host|redirected/.test(message)
        ? "invalid_response" : "network_error";
    return fail(health, e.status ?? status, message, pagesRead);
  }
}
