/** A manual source check compares the issuer's listings and notices with prior observations. */
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { sha256Hex } from "./controls-release-archive";
import type { SourceHealth } from "./source-monitor";
import { REVIEW_STATUSES, type ReviewAudit, type ReviewStatus } from "../scripts/editorial-ledger";

export const WATCH_REGISTER_KIND = "controls_source_watch_register";
export const WATCH_STATE_MODE = "controls_source_watch";
export const WATCH_LEDGER_MODE = "controls_source_watch_ledger";
export const DEFAULT_REGISTER_PATH = "research/controls-review/source-watch-register.json";
export const DEFAULT_STATE_DIR = ".monitor-controls";
export const WATCH_OUTCOMES = [
  "unchanged",
  "detected_candidate",
  "new_unrelated",
  "content_revised",
  "baseline_recorded",
  "source_failure",
  "source_restored",
  "missed_check",
] as const;
export type WatchOutcome = (typeof WATCH_OUTCOMES)[number];

/** Directories of the repository that hold tracked or public content. */
export const PROTECTED_STATE_ROOTS = ["data", "public", "app", "lib", "docs", "research"] as const;

/** Ledger statuses that still wait for a person. */
export const OPEN_REVIEW_STATUSES: readonly ReviewStatus[] = ["unreviewed", "investigating", "needs_verification"];

export type FetchFunction = typeof fetch;

// --- Register ----------------------------------------------------------------

export type WatchListing = {
  id: string;
  url: string;
  label: string;
  /** How often an operator is expected to run a check, in days. */
  expectedIntervalDays: number;
  note: string;
};
export type NoticeRecordState = "published_record" | "review_overlay";
export type KnownNotice = {
  noticeId: string;
  /** Document number in the original language, as the record cites it. */
  documentNumber: string;
  url: string;
  sourceId: string;
  recordState: NoticeRecordState;
  overlayId: string | null;
  /** Fingerprint of the notice page, or null until a first check records one. */
  fingerprint: string | null;
};
export type RulePriority = "direct" | "adjacent";
export type RelevanceRule = {
  id: string;
  priority: RulePriority;
  /** Every string must appear in the title. */
  allOf?: string[];
  /** At least one string must appear in the title. */
  anyOf?: string[];
};
export type SourceWatchRegister = {
  version: 1;
  kind: typeof WATCH_REGISTER_KIND;
  description?: string;
  listings: WatchListing[];
  knownNotices: KnownNotice[];
  rules: RelevanceRule[];
};

const HEX64 = /^[a-f0-9]{64}$/;
const ID = /^[a-z0-9][a-z0-9-]{1,80}$/;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const OVERLAY_ID = /^rc-[a-z0-9][a-z0-9-]{1,100}$/;
const HEALTHS: readonly SourceHealth[] = ["ok", "blocked", "http_error", "timeout", "invalid_response", "network_error"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isIso = (value: unknown): value is string =>
  typeof value === "string" && ISO_UTC.test(value) && Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 19) === value.slice(0, 19);
const isHex64 = (value: unknown): value is string => typeof value === "string" && HEX64.test(value);
const safeText = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;
const isStatus = (value: unknown): value is ReviewStatus =>
  typeof value === "string" && (REVIEW_STATUSES as readonly string[]).includes(value);
const isHealth = (value: unknown): value is SourceHealth =>
  typeof value === "string" && (HEALTHS as readonly string[]).includes(value);
const isHttpsUrl = (value: unknown): value is string => {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
};
const stringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length > 0 && value.every((entry) => safeText(entry, 200) && !/\s/.test(entry as string));

/** Read a register object and refuse anything that is not a valid version 1 register. */
export function parseSourceWatchRegister(raw: unknown): SourceWatchRegister {
  const fail = (message: string): never => {
    throw new Error("source-watch register: " + message);
  };
  if (!isRecord(raw) || raw.version !== 1 || raw.kind !== WATCH_REGISTER_KIND) {
    return fail("expected version 1 and kind " + WATCH_REGISTER_KIND);
  }
  if (!Array.isArray(raw.listings) || !Array.isArray(raw.knownNotices) || !Array.isArray(raw.rules)) {
    return fail("listings, knownNotices and rules must be arrays");
  }
  if (!(raw.description === undefined || typeof raw.description === "string")) fail("description must be a string");
  const ids = new Set<string>();
  const urls = new Set<string>();
  const claim = (id: unknown, what: string): string => {
    if (typeof id !== "string" || !ID.test(id)) return fail(what + " has an invalid id");
    if (ids.has(id)) return fail("id is used twice: " + id);
    ids.add(id);
    return id;
  };
  const claimUrl = (url: unknown, id: string): string => {
    if (!isHttpsUrl(url)) return fail(id + " needs an https URL");
    const key = canonicalUrl(url);
    if (urls.has(key)) return fail("URL is listed twice: " + url);
    urls.add(key);
    return url;
  };
  for (const listing of raw.listings as unknown[]) {
    if (!isRecord(listing)) return fail("a listing is not an object");
    const id = claim(listing.id, "listing");
    claimUrl(listing.url, id);
    if (!safeText(listing.label, 200) || !safeText(listing.note, 1000)) fail(id + " needs a label and a note");
    const interval = listing.expectedIntervalDays;
    if (typeof interval !== "number" || !Number.isFinite(interval) || interval <= 0 || interval > 366) {
      fail(id + " needs expectedIntervalDays between 0 and 366");
    }
  }
  for (const notice of raw.knownNotices as unknown[]) {
    if (!isRecord(notice)) return fail("a known notice is not an object");
    const id = claim(notice.noticeId, "known notice");
    claimUrl(notice.url, id);
    if (!safeText(notice.documentNumber, 200)) fail(id + " needs a documentNumber");
    if (typeof notice.sourceId !== "string" || !/^src-[a-z0-9-]+$/.test(notice.sourceId)) fail(id + " needs a sourceId");
    if (notice.recordState !== "published_record" && notice.recordState !== "review_overlay") {
      fail(id + " recordState must be published_record or review_overlay");
    }
    if (notice.recordState === "review_overlay") {
      if (typeof notice.overlayId !== "string" || !OVERLAY_ID.test(notice.overlayId)) fail(id + " needs an overlayId");
    } else if (notice.overlayId !== null) {
      fail(id + " is a published record, so overlayId must be null");
    }
    if (!(notice.fingerprint === null || isHex64(notice.fingerprint))) fail(id + " fingerprint must be 64 hex characters or null");
  }
  for (const rule of raw.rules as unknown[]) {
    if (!isRecord(rule)) return fail("a rule is not an object");
    const id = claim(rule.id, "rule");
    if (rule.priority !== "direct" && rule.priority !== "adjacent") fail(id + " priority must be direct or adjacent");
    if (rule.allOf === undefined && rule.anyOf === undefined) fail(id + " needs allOf or anyOf");
    if (rule.allOf !== undefined && !stringList(rule.allOf)) fail(id + " allOf must be a list of strings without spaces");
    if (rule.anyOf !== undefined && !stringList(rule.anyOf)) fail(id + " anyOf must be a list of strings without spaces");
  }
  if (raw.listings.length === 0) fail("at least one listing is required");
  return raw as unknown as SourceWatchRegister;
}

// --- Text helpers ------------------------------------------------------------

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ensp: " ", emsp: " ", thinsp: " ",
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (whole, entity: string) => {
    const lower = entity.toLowerCase();
    if (NAMED_ENTITIES[lower] !== undefined) return NAMED_ENTITIES[lower];
    if (!lower.startsWith("#")) return whole;
    const code = lower.startsWith("#x") ? Number.parseInt(lower.slice(2), 16) : Number.parseInt(lower.slice(1), 10);
    const valid = Number.isInteger(code) && code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff);
    return valid ? String.fromCodePoint(code) : "";
  });
}

/** Remove comments, scripts and styles so their text can never count as content. */
function withoutNonContent(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, "");
}

const stripTags = (html: string): string => decodeEntities(html.replace(/<[^>]*>/g, ""));

/** Remove every whitespace character and the zero-width characters. */
const compact = (value: string): string => value.replace(/\s+/g, "").replace(/[\u200B-\u200D\u2060]/g, "");

/** A URL as the watch compares it: https, no fragment. */
export function canonicalUrl(url: string): string {
  const parsed = new URL(url);
  parsed.protocol = "https:";
  parsed.hash = "";
  return parsed.toString();
}

/** The content of a page could not be read as the expected kind of page. */
export class WatchParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WatchParseError";
  }
}

// --- Notice fingerprint ------------------------------------------------------

export type NoticeFields = {
  /** Document number as the page states it, without whitespace. Null when the page states none. */
  documentNumber: string | null;
  /** Operative body text without whitespace and without the trailing signature date. */
  bodyText: string;
  /** Signature date at the end of the body, as YYYY-MM-DD. Null when the body does not end with a date. */
  signatureDate: string | null;
};

/**
 * Where a notice page keeps its body. Two layouts of the same publishing
 * system are known: the article page and the open-government catalogue page.
 */
const BODY_CONTAINERS = [
  /<div\b[^>]*\bergodic\s*=\s*["']article["'][^>]*>/i,
  /<div\b[^>]*\bclass\s*=\s*["'][^"']*\bgsj_htmlcon_bot\b[^"']*["'][^>]*>/i,
];
const DOCUMENT_NUMBER_PATTERNS = [
  /【\s*发布文号\s*】([^<【]*)/,
  /<dt\b[^>]*>(?:\s|&nbsp;)*文(?:\s|&nbsp;)*号(?:\s|&nbsp;)*<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/i,
];

function innerOfDiv(html: string, open: RegExpExecArray): string | null {
  const start = open.index + open[0].length;
  const tag = /<(\/?)div\b[^>]*>/gi;
  tag.lastIndex = start;
  let depth = 1;
  let match = tag.exec(html);
  while (match) {
    depth += match[1] ? -1 : 1;
    if (depth === 0) return html.slice(start, match.index);
    match = tag.exec(html);
  }
  return null;
}

/**
 * Extract the three fields a fingerprint covers. Only text counts: tags,
 * attributes, scripts, navigation and the page address play no part.
 */
export function extractNoticeFields(html: string): NoticeFields {
  const content = withoutNonContent(html);
  let body: string | null = null;
  for (const pattern of BODY_CONTAINERS) {
    const open = pattern.exec(content);
    if (!open) continue;
    body = innerOfDiv(content, open);
    if (body !== null) break;
  }
  if (body === null) throw new WatchParseError("notice page has no recognised body container");
  const text = compact(stripTags(body));
  if (!text) throw new WatchParseError("notice page has an empty body");
  const signed = /(\d{4})年(\d{1,2})月(\d{1,2})日$/.exec(text);
  let documentNumber: string | null = null;
  for (const pattern of DOCUMENT_NUMBER_PATTERNS) {
    const found = pattern.exec(content);
    const value = found ? compact(stripTags(found[1])) : "";
    if (value) {
      documentNumber = value;
      break;
    }
  }
  return {
    documentNumber,
    bodyText: signed ? text.slice(0, signed.index) : text,
    signatureDate: signed ? signed[1] + "-" + signed[2].padStart(2, "0") + "-" + signed[3].padStart(2, "0") : null,
  };
}

/** sha256 over the normalised tuple of document number, body text and signature date. */
export function fingerprintNoticeFields(fields: NoticeFields): string {
  return sha256Hex(
    JSON.stringify(["controls-notice-fingerprint-v1", fields.documentNumber ?? "", fields.bodyText, fields.signatureDate ?? ""]),
  );
}

// --- Listing pages -----------------------------------------------------------

export type ListingItem = { url: string; title: string };
export type ParsedListing = {
  items: ListingItem[];
  /**
   * Number of sections the page fills in with a script after loading. Their
   * items are not in the fetched HTML, so this check cannot see them.
   */
  clientRenderedSections: number;
};

const ARTICLE_PATH = /\/art\/\d{4}\/art_[0-9a-f]+\.html$/i;
const MAX_LISTING_ITEMS = 2000;

const attribute = (attributes: string, name: string): string => {
  const found = new RegExp("(?:^|\\s)" + name + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)')", "i").exec(attributes);
  return found ? decodeEntities(found[1] ?? found[2] ?? "") : "";
};

/** Extract article links from a listing page: absolute URL and title, one row per URL. */
export function parseListingPage(html: string, baseUrl: string): ParsedListing {
  const clientRenderedSections = (html.match(/<script\b[^>]*\bqueryData\s*=/gi) ?? []).length;
  const content = withoutNonContent(html);
  const seen = new Set<string>();
  const items: ListingItem[] = [];
  const anchor = /<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi;
  let match = anchor.exec(content);
  while (match) {
    const href = attribute(match[1], "href").trim();
    let url: URL | null = null;
    try {
      url = href ? new URL(href, baseUrl) : null;
    } catch {
      url = null;
    }
    if (url && !url.username && !url.password && url.hostname === new URL(baseUrl).hostname &&
        (url.protocol === "https:" || url.protocol === "http:") && ARTICLE_PATH.test(url.pathname)) {
      const key = canonicalUrl(url.toString());
      if (!seen.has(key)) {
        seen.add(key);
        const title = (attribute(match[1], "title") || stripTags(match[2])).replace(/\s+/g, " ").trim().slice(0, 600);
        items.push({ url: key, title });
      }
    }
    match = anchor.exec(content);
  }
  if (items.length === 0) throw new WatchParseError("listing page has no article links; an empty listing is never reported as clean");
  if (items.length > MAX_LISTING_ITEMS) throw new WatchParseError("listing page has more article links than the parser accepts");
  return { items, clientRenderedSections };
}

// --- Title rules -------------------------------------------------------------

export type TitleRelevance = { priority: RulePriority | "unrelated"; matchedRules: string[] };

/**
 * Match a listing title against the register rules. Whitespace in the title
 * is ignored. The result is a reading aid, not a statement about the notice.
 */
export function classifyTitle(title: string, rules: readonly RelevanceRule[]): TitleRelevance {
  const text = compact(title);
  const matched = rules.filter(
    (rule) =>
      (rule.allOf ?? []).every((needle) => text.includes(needle)) &&
      (rule.anyOf === undefined || rule.anyOf.some((needle) => text.includes(needle))),
  );
  const direct = matched.some((rule) => rule.priority === "direct");
  return {
    priority: direct ? "direct" : matched.length > 0 ? "adjacent" : "unrelated",
    matchedRules: matched.filter((rule) => !direct || rule.priority === "direct").map((rule) => rule.id),
  };
}

// --- State -------------------------------------------------------------------

export type ListingMemory = {
  url: string;
  lastCheckedAt: string;
  lastSuccessfulAt: string | null;
  lastHealth: SourceHealth;
  lastHttpStatus: number | null;
  consecutiveFailures: number;
  /** Article URL to the time it was first seen. Null until the first successful check. */
  seen: Record<string, string> | null;
  clientRenderedSections: number | null;
};
export type NoticeMemory = {
  url: string;
  lastCheckedAt: string;
  lastSuccessfulAt: string | null;
  lastHealth: SourceHealth;
  lastHttpStatus: number | null;
  consecutiveFailures: number;
  /** Last fingerprint seen. Null until the first successful check. */
  fingerprint: string | null;
};
export type WatchState = {
  version: 1;
  mode: typeof WATCH_STATE_MODE;
  lastRunAt: string | null;
  listings: Record<string, ListingMemory>;
  notices: Record<string, NoticeMemory>;
};

const MAX_REMEMBERED_URLS = 5000;

export const emptyWatchState = (): WatchState => ({
  version: 1, mode: WATCH_STATE_MODE, lastRunAt: null, listings: {}, notices: {},
});

function validMemoryBase(memory: Record<string, unknown>): boolean {
  return isHttpsUrl(memory.url) && isIso(memory.lastCheckedAt) &&
    (memory.lastSuccessfulAt === null || isIso(memory.lastSuccessfulAt)) &&
    isHealth(memory.lastHealth) &&
    (memory.lastHttpStatus === null || (typeof memory.lastHttpStatus === "number" && Number.isInteger(memory.lastHttpStatus))) &&
    typeof memory.consecutiveFailures === "number" && Number.isInteger(memory.consecutiveFailures) && memory.consecutiveFailures >= 0;
}

/** Read a state object. A shape this version did not write is refused, never reset. */
export function parseWatchState(raw: unknown): WatchState {
  const corrupt = (detail: string): never => {
    throw new Error("watch state is corrupt or unsupported (" + detail + "); refusing a silent reset");
  };
  if (!isRecord(raw) || raw.version !== 1 || raw.mode !== WATCH_STATE_MODE) return corrupt("version or mode");
  if (!(raw.lastRunAt === null || isIso(raw.lastRunAt)) || !isRecord(raw.listings) || !isRecord(raw.notices)) {
    return corrupt("lastRunAt, listings or notices");
  }
  for (const [id, memory] of Object.entries(raw.listings)) {
    if (!isRecord(memory) || !validMemoryBase(memory)) return corrupt("listing " + id);
    const seen = memory.seen;
    if (seen !== null) {
      if (!isRecord(seen) || Object.keys(seen).length > MAX_REMEMBERED_URLS) return corrupt("listing " + id + " seen");
      for (const [url, at] of Object.entries(seen)) if (!isHttpsUrl(url) || !isIso(at)) return corrupt("listing " + id + " seen");
    }
    if ((seen === null) !== (memory.lastSuccessfulAt === null)) return corrupt("listing " + id + " baseline");
    if (!(memory.clientRenderedSections === null || typeof memory.clientRenderedSections === "number")) {
      return corrupt("listing " + id + " clientRenderedSections");
    }
  }
  for (const [id, memory] of Object.entries(raw.notices)) {
    if (!isRecord(memory) || !validMemoryBase(memory)) return corrupt("notice " + id);
    if (!(memory.fingerprint === null || isHex64(memory.fingerprint))) return corrupt("notice " + id + " fingerprint");
    if ((memory.fingerprint === null) !== (memory.lastSuccessfulAt === null)) return corrupt("notice " + id + " baseline");
  }
  return raw as unknown as WatchState;
}

// --- Observations ------------------------------------------------------------

type Target = { targetKind: "listing" | "notice"; targetId: string; url: string };

export type BaselineMatch = { url: string; title: string; priority: RulePriority; matchedRules: string[] };

export type WatchObservation = Target & (
  | {
      outcome: "unchanged";
      /** Listing: article links on the page. */
      itemCount?: number;
      /** Listing: URLs of known notices that appeared on the listing for the first time. */
      knownNoticeUrlsAdded?: string[];
      clientRenderedSections?: number;
      /** Notice: the fingerprint seen. */
      fingerprint?: string;
    }
  | {
      outcome: "detected_candidate";
      itemId: string;
      itemUrl: string;
      title: string;
      priority: RulePriority;
      matchedRules: string[];
    }
  | { outcome: "new_unrelated"; count: number; urls: string[] }
  | {
      outcome: "content_revised";
      itemId: string;
      documentNumber: string;
      differsFrom: ("register" | "last_recorded")[];
      registerFingerprint: string | null;
      lastRecordedFingerprint: string | null;
      observedFingerprint: string;
      observed: { documentNumber: string | null; signatureDate: string | null; bodyCharacters: number };
    }
  | {
      outcome: "baseline_recorded";
      /** Listing: article links recorded as already present. None is reported as new. */
      itemCount?: number;
      /** Listing: items already present whose titles match a rule. Shown once so the operator can account for them. */
      ruleMatchesInBaseline?: BaselineMatch[];
      knownNoticeUrlsPresent?: string[];
      clientRenderedSections?: number;
      /** Notice: the fingerprint recorded. */
      fingerprint?: string;
      /** Notice: true when the register already held this fingerprint, null when the register held none. */
      matchesRegister?: boolean | null;
    }
  | {
      outcome: "source_failure";
      health: Exclude<SourceHealth, "ok">;
      httpStatus: number | null;
      message: string;
      consecutiveFailures: number;
      lastSuccessfulAt: string | null;
    }
  | {
      outcome: "source_restored";
      failedChecks: number;
      lastSuccessfulAt: string | null;
      daysSinceLastSuccessfulCheck: number | null;
      coverageGapPossible: boolean;
    }
  | {
      outcome: "missed_check";
      gapDays: number;
      expectedIntervalDays: number;
      lastCheckedAt: string;
      /** True when the last successful check is older than the interval, so items may have left the listing unseen. */
      coverageGapPossible: boolean;
    }
);

export type PendingLedgerEntry = {
  itemId: string;
  kind: "detected_candidate" | "content_revised";
  priority: RulePriority;
  url: string;
  title: string;
  matchedRules: string[];
  targetId: string;
  observedFingerprint: string | null;
};

export type WatchRunSummary = {
  targets: number;
  healthyTargets: number;
  outcomes: Record<WatchOutcome, number>;
  /** True when any outcome other than unchanged or baseline_recorded was reported. */
  needsAttention: boolean;
};

export type WatchRun = {
  observedAt: string;
  state: WatchState;
  observations: WatchObservation[];
  ledgerEntries: PendingLedgerEntry[];
  summary: WatchRunSummary;
};

export const ledgerItemId = (kind: PendingLedgerEntry["kind"], url: string): string => sha256Hex(kind + "\n" + url);

const DAY_MS = 86_400_000;
const daysBetween = (from: string, to: string): number =>
  Math.round(((Date.parse(to) - Date.parse(from)) / DAY_MS) * 100) / 100;

const TIMEOUT_MS = 20_000;
const MAX_PAGE_BYTES = 2_000_000;

class HttpStatusError extends Error {
  status: number;
  constructor(status: number) {
    super("HTTP " + status);
    this.name = "HttpStatusError";
    this.status = status;
  }
}

async function fetchPage(fetchFn: FetchFunction, url: string): Promise<{ body: string; status: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // A plain read: a generic user agent, no cookies, nothing that identifies the operator.
    const response = await fetchFn(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { accept: "text/html,*/*;q=0.5", "user-agent": "Mozilla/5.0" },
    });
    if (!response.ok) throw new HttpStatusError(response.status);
    const body = await response.text();
    if (Buffer.byteLength(body, "utf8") > MAX_PAGE_BYTES) throw new WatchParseError("page is larger than the safe maximum");
    return { body, status: response.status };
  } finally {
    clearTimeout(timer);
  }
}

function describeFailure(error: unknown): { health: Exclude<SourceHealth, "ok">; httpStatus: number | null; message: string } {
  const message = (error instanceof Error ? error.message : String(error)).slice(0, 300) || "unknown source error";
  if (error instanceof HttpStatusError) {
    const blocked = [401, 403, 429, 451].includes(error.status);
    return { health: blocked ? "blocked" : "http_error", httpStatus: error.status, message };
  }
  if (error instanceof WatchParseError) return { health: "invalid_response", httpStatus: null, message };
  const name = error instanceof Error ? error.name : "";
  if (name === "AbortError" || name === "TimeoutError") return { health: "timeout", httpStatus: null, message };
  return { health: "network_error", httpStatus: null, message };
}

function assertSameTarget(kind: string, id: string, recordedUrl: string | undefined, registerUrl: string): void {
  if (recordedUrl !== undefined && canonicalUrl(recordedUrl) !== canonicalUrl(registerUrl)) {
    throw new Error(
      "watch state for " + kind + " " + id + " was recorded for a different URL (" + recordedUrl +
        "); refusing a silent reset. Move the state directory aside to start a new baseline.",
    );
  }
}

/**
 * Run one check: fetch every listing and every known notice once, compare
 * with the previous state and return the new state and what was seen.
 * Nothing is written here. A failed target keeps its earlier memory.
 */
export async function runSourceWatch(
  register: SourceWatchRegister,
  previous: WatchState | null,
  observedAt: string,
  fetchFn: FetchFunction = fetch,
): Promise<WatchRun> {
  if (!isIso(observedAt)) throw new Error("the observation time must be an ISO 8601 UTC timestamp such as 2026-11-26T09:00:00Z");
  const before = previous === null ? emptyWatchState() : parseWatchState(previous);
  if (before.lastRunAt !== null && Date.parse(observedAt) < Date.parse(before.lastRunAt)) {
    throw new Error("the observation time " + observedAt + " is earlier than the last recorded run " + before.lastRunAt);
  }
  const state: WatchState = {
    version: 1,
    mode: WATCH_STATE_MODE,
    lastRunAt: observedAt,
    listings: { ...before.listings },
    notices: { ...before.notices },
  };
  const observations: WatchObservation[] = [];
  const ledgerEntries: PendingLedgerEntry[] = [];
  const knownByUrl = new Map(register.knownNotices.map((notice) => [canonicalUrl(notice.url), notice] as const));
  let healthyTargets = 0;

  for (const listing of register.listings) {
    const target: Target = { targetKind: "listing", targetId: listing.id, url: listing.url };
    const prior = before.listings[listing.id];
    assertSameTarget("listing", listing.id, prior?.url, listing.url);
    if (prior) {
      const gapDays = daysBetween(prior.lastCheckedAt, observedAt);
      if (gapDays > listing.expectedIntervalDays) {
        observations.push({
          ...target,
          outcome: "missed_check",
          gapDays,
          expectedIntervalDays: listing.expectedIntervalDays,
          lastCheckedAt: prior.lastCheckedAt,
          coverageGapPossible:
            prior.lastSuccessfulAt !== null && daysBetween(prior.lastSuccessfulAt, observedAt) > listing.expectedIntervalDays,
        });
      }
    }
    let parsed: ParsedListing;
    let httpStatus: number;
    try {
      const page = await fetchPage(fetchFn, listing.url);
      parsed = parseListingPage(page.body, listing.url);
      httpStatus = page.status;
    } catch (error) {
      const failure = describeFailure(error);
      const consecutiveFailures = (prior?.consecutiveFailures ?? 0) + 1;
      // Only the record of the attempt changes. What was seen before stays as it was.
      state.listings[listing.id] = {
        url: listing.url,
        lastSuccessfulAt: prior?.lastSuccessfulAt ?? null,
        seen: prior?.seen ?? null,
        clientRenderedSections: prior?.clientRenderedSections ?? null,
        lastCheckedAt: observedAt,
        lastHealth: failure.health,
        lastHttpStatus: failure.httpStatus,
        consecutiveFailures,
      };
      observations.push({
        ...target, outcome: "source_failure", ...failure, consecutiveFailures, lastSuccessfulAt: prior?.lastSuccessfulAt ?? null,
      });
      continue;
    }
    healthyTargets += 1;
    const seen: Record<string, string> = { ...(prior?.seen ?? {}) };
    const fresh = parsed.items.filter((item) => seen[item.url] === undefined);
    for (const item of parsed.items) if (seen[item.url] === undefined) seen[item.url] = observedAt;
    const remembered = Object.keys(seen);
    for (const url of remembered.slice(0, Math.max(0, remembered.length - MAX_REMEMBERED_URLS))) delete seen[url];
    state.listings[listing.id] = {
      url: listing.url,
      lastCheckedAt: observedAt,
      lastSuccessfulAt: observedAt,
      lastHealth: "ok",
      lastHttpStatus: httpStatus,
      consecutiveFailures: 0,
      seen,
      clientRenderedSections: parsed.clientRenderedSections,
    };
    if (prior && prior.consecutiveFailures > 0) {
      const sinceSuccess = prior.lastSuccessfulAt === null ? null : daysBetween(prior.lastSuccessfulAt, observedAt);
      observations.push({
        ...target, outcome: "source_restored", failedChecks: prior.consecutiveFailures,
        lastSuccessfulAt: prior.lastSuccessfulAt, daysSinceLastSuccessfulCheck: sinceSuccess,
        coverageGapPossible: sinceSuccess === null || sinceSuccess > listing.expectedIntervalDays,
      });
    }
    if (!prior || prior.seen === null || prior.lastSuccessfulAt === null) {
      // First successful sight. Everything on the page is recorded as already present.
      const ruleMatchesInBaseline: BaselineMatch[] = [];
      for (const item of parsed.items) {
        if (knownByUrl.has(item.url)) continue;
        const relevance = classifyTitle(item.title, register.rules);
        if (relevance.priority !== "unrelated") {
          ledgerEntries.push({
            itemId: ledgerItemId("detected_candidate", item.url), kind: "detected_candidate", priority: relevance.priority,
            url: item.url, title: item.title, matchedRules: relevance.matchedRules, targetId: listing.id, observedFingerprint: null,
          });
          ruleMatchesInBaseline.push({ url: item.url, title: item.title, priority: relevance.priority, matchedRules: relevance.matchedRules });
        }
      }
      observations.push({
        ...target,
        outcome: "baseline_recorded",
        itemCount: parsed.items.length,
        ruleMatchesInBaseline,
        knownNoticeUrlsPresent: parsed.items.filter((item) => knownByUrl.has(item.url)).map((item) => item.url),
        clientRenderedSections: parsed.clientRenderedSections,
      });
      continue;
    }
    const unrelated: string[] = [];
    const knownAdded: string[] = [];
    let detected = 0;
    for (const item of fresh) {
      if (knownByUrl.has(item.url)) {
        knownAdded.push(item.url);
        continue;
      }
      const relevance = classifyTitle(item.title, register.rules);
      if (relevance.priority === "unrelated") {
        unrelated.push(item.url);
        continue;
      }
      detected += 1;
      const itemId = ledgerItemId("detected_candidate", item.url);
      observations.push({
        ...target,
        outcome: "detected_candidate",
        itemId,
        itemUrl: item.url,
        title: item.title,
        priority: relevance.priority,
        matchedRules: relevance.matchedRules,
      });
      ledgerEntries.push({
        itemId, kind: "detected_candidate", priority: relevance.priority, url: item.url, title: item.title,
        matchedRules: relevance.matchedRules, targetId: listing.id, observedFingerprint: null,
      });
    }
    if (unrelated.length > 0) observations.push({ ...target, outcome: "new_unrelated", count: unrelated.length, urls: unrelated });
    if (detected === 0 && unrelated.length === 0) {
      observations.push({
        ...target,
        outcome: "unchanged",
        itemCount: parsed.items.length,
        knownNoticeUrlsAdded: knownAdded,
        clientRenderedSections: parsed.clientRenderedSections,
      });
    }
  }

  for (const notice of register.knownNotices) {
    const target: Target = { targetKind: "notice", targetId: notice.noticeId, url: notice.url };
    const prior = before.notices[notice.noticeId];
    assertSameTarget("notice", notice.noticeId, prior?.url, notice.url);
    let fields: NoticeFields;
    let httpStatus: number;
    try {
      const page = await fetchPage(fetchFn, notice.url);
      fields = extractNoticeFields(page.body);
      httpStatus = page.status;
    } catch (error) {
      const failure = describeFailure(error);
      const consecutiveFailures = (prior?.consecutiveFailures ?? 0) + 1;
      state.notices[notice.noticeId] = {
        url: notice.url,
        lastSuccessfulAt: prior?.lastSuccessfulAt ?? null,
        fingerprint: prior?.fingerprint ?? null,
        lastCheckedAt: observedAt,
        lastHealth: failure.health,
        lastHttpStatus: failure.httpStatus,
        consecutiveFailures,
      };
      observations.push({
        ...target, outcome: "source_failure", ...failure, consecutiveFailures, lastSuccessfulAt: prior?.lastSuccessfulAt ?? null,
      });
      continue;
    }
    healthyTargets += 1;
    const observed = fingerprintNoticeFields(fields);
    state.notices[notice.noticeId] = {
      url: notice.url,
      lastCheckedAt: observedAt,
      lastSuccessfulAt: observedAt,
      lastHealth: "ok",
      lastHttpStatus: httpStatus,
      consecutiveFailures: 0,
      fingerprint: observed,
    };
    const lastRecorded = prior?.fingerprint ?? null;
    if (prior && prior.consecutiveFailures > 0) {
      observations.push({
        ...target,
        outcome: "source_restored",
        failedChecks: prior.consecutiveFailures,
        lastSuccessfulAt: prior.lastSuccessfulAt,
        daysSinceLastSuccessfulCheck: prior.lastSuccessfulAt === null ? null : daysBetween(prior.lastSuccessfulAt, observedAt),
        coverageGapPossible: true,
      });
    }
    const differsFrom: ("register" | "last_recorded")[] = [];
    if (notice.fingerprint !== null && notice.fingerprint !== observed) differsFrom.push("register");
    if (lastRecorded !== null && lastRecorded !== observed) differsFrom.push("last_recorded");
    if (differsFrom.length > 0) {
      const itemId = ledgerItemId("content_revised", canonicalUrl(notice.url));
      observations.push({
        ...target,
        outcome: "content_revised",
        itemId,
        documentNumber: notice.documentNumber,
        differsFrom,
        registerFingerprint: notice.fingerprint,
        lastRecordedFingerprint: lastRecorded,
        observedFingerprint: observed,
        observed: { documentNumber: fields.documentNumber, signatureDate: fields.signatureDate, bodyCharacters: fields.bodyText.length },
      });
      ledgerEntries.push({
        itemId, kind: "content_revised", priority: "direct", url: canonicalUrl(notice.url), title: notice.documentNumber,
        matchedRules: [], targetId: notice.noticeId, observedFingerprint: observed,
      });
    } else if (lastRecorded === null) {
      observations.push({
        ...target,
        outcome: "baseline_recorded",
        fingerprint: observed,
        matchesRegister: notice.fingerprint === null ? null : true,
      });
    } else {
      observations.push({ ...target, outcome: "unchanged", fingerprint: observed });
    }
  }

  const outcomes = Object.fromEntries(WATCH_OUTCOMES.map((outcome) => [outcome, 0])) as Record<WatchOutcome, number>;
  for (const observation of observations) outcomes[observation.outcome] += 1;
  return {
    observedAt,
    state,
    observations,
    ledgerEntries,
    summary: {
      targets: register.listings.length + register.knownNotices.length,
      healthyTargets,
      outcomes,
      needsAttention: ledgerEntries.length > 0 || observations.some((entry) => entry.outcome !== "unchanged" && entry.outcome !== "baseline_recorded"),
    },
  };
}

// --- Operator ledger ---------------------------------------------------------

export type WatchAudit = ReviewAudit & {
  entry: "decision" | "correction";
  /** For a correction: position in this list of the entry it corrects. */
  corrects: number | null;
  /** For candidate_started: the review overlay the person opened. */
  overlayId: string | null;
};
export type WatchLedgerItem = {
  itemId: string;
  kind: "detected_candidate" | "content_revised";
  priority: RulePriority;
  url: string;
  title: string;
  matchedRules: string[];
  /** Listing or notice that produced the observation. */
  targetId: string;
  firstObservedAt: string;
  lastObservedAt: string;
  /** For content_revised: the latest fingerprint seen. */
  observedFingerprint: string | null;
  /** True when the page changed again after the last recorded decision. */
  changedSinceDecision: boolean;
  status: ReviewStatus;
  audit: WatchAudit[];
};
export type WatchLedger = { version: 1; mode: typeof WATCH_LEDGER_MODE; items: WatchLedgerItem[] };

export const emptyWatchLedger = (): WatchLedger => ({ version: 1, mode: WATCH_LEDGER_MODE, items: [] });

/** Read a ledger object. A corrupt ledger is refused so no decision history is dropped. */
export function parseWatchLedger(raw: unknown): WatchLedger {
  const corrupt = (detail: string): never => {
    throw new Error("watch ledger is corrupt or unsupported (" + detail + "); refusing a silent reset");
  };
  if (!isRecord(raw) || raw.version !== 1 || raw.mode !== WATCH_LEDGER_MODE || !Array.isArray(raw.items)) {
    return corrupt("version, mode or items");
  }
  const ids = new Set<string>();
  for (const item of raw.items as unknown[]) {
    if (!isRecord(item) || !isHex64(item.itemId) || ids.has(item.itemId)) return corrupt("item id");
    ids.add(item.itemId);
    const kindOk = item.kind === "detected_candidate" || item.kind === "content_revised";
    if (!kindOk || !isHttpsUrl(item.url) || item.itemId !== ledgerItemId(item.kind as PendingLedgerEntry["kind"], item.url as string)) {
      return corrupt("item " + item.itemId + " identity");
    }
    if ((item.priority !== "direct" && item.priority !== "adjacent") || typeof item.title !== "string" ||
        !Array.isArray(item.matchedRules) || !item.matchedRules.every((rule: unknown) => typeof rule === "string") ||
        typeof item.targetId !== "string" || !isIso(item.firstObservedAt) || !isIso(item.lastObservedAt) ||
        !(item.observedFingerprint === null || isHex64(item.observedFingerprint)) ||
        typeof item.changedSinceDecision !== "boolean" || !isStatus(item.status) || !Array.isArray(item.audit)) {
      return corrupt("item " + item.itemId + " fields");
    }
    let status: ReviewStatus = "unreviewed";
    (item.audit as unknown[]).forEach((entry, index) => {
      if (!isRecord(entry) || !isIso(entry.at) || !safeText(entry.by, 160) || !safeText(entry.reason, 2000) ||
          !isStatus(entry.from) || !isStatus(entry.to) || entry.from !== status ||
          (entry.entry !== "decision" && entry.entry !== "correction") ||
          !(entry.overlayId === null || (typeof entry.overlayId === "string" && OVERLAY_ID.test(entry.overlayId))) ||
          (entry.entry === "decision" ? entry.corrects !== null : entry.corrects !== index - 1) ||
          (entry.entry === "correction" && index === 0)) {
        corrupt("item " + String(item.itemId) + " history");
      } else {
        status = entry.to;
      }
    });
    if (status !== item.status) return corrupt("item " + item.itemId + " status does not follow its history");
  }
  return raw as unknown as WatchLedger;
}

/**
 * Add the observations of one run to the ledger. A new item starts as
 * `unreviewed`. An item that is already there keeps its status and history;
 * only the observation fields move.
 */
export function mergeRunIntoLedger(
  current: WatchLedger,
  entries: readonly PendingLedgerEntry[],
  observedAt: string,
): { ledger: WatchLedger; added: string[]; reobserved: string[] } {
  const ledger = parseWatchLedger(structuredClone(current));
  const added: string[] = [];
  const reobserved: string[] = [];
  for (const entry of entries) {
    const existing = ledger.items.find((item) => item.itemId === entry.itemId);
    if (!existing) {
      ledger.items.push({
        itemId: entry.itemId, kind: entry.kind, priority: entry.priority, url: entry.url, title: entry.title,
        matchedRules: [...entry.matchedRules], targetId: entry.targetId,
        firstObservedAt: observedAt, lastObservedAt: observedAt,
        observedFingerprint: entry.observedFingerprint, changedSinceDecision: false,
        status: "unreviewed", audit: [],
      });
      added.push(entry.itemId);
      continue;
    }
    if (!reobserved.includes(entry.itemId) && !added.includes(entry.itemId)) reobserved.push(entry.itemId);
    if (Date.parse(observedAt) > Date.parse(existing.lastObservedAt)) existing.lastObservedAt = observedAt;
    if (entry.observedFingerprint !== null && entry.observedFingerprint !== existing.observedFingerprint) {
      // The page moved again. The status stays where the person left it; the flag asks for another look.
      if (existing.audit.length > 0) existing.changedSinceDecision = true;
      existing.observedFingerprint = entry.observedFingerprint;
    }
  }
  return { ledger: parseWatchLedger(ledger), added, reobserved };
}

/** Find one ledger item by its id or by a unique prefix of at least eight characters. */
export function findLedgerItem(ledger: WatchLedger, idOrPrefix: string): WatchLedgerItem {
  if (!/^[a-f0-9]{8,64}$/.test(idOrPrefix)) throw new Error("--item needs a ledger item id, or at least its first eight characters");
  const matches = ledger.items.filter((item) => item.itemId.startsWith(idOrPrefix));
  if (matches.length === 0) throw new Error("no ledger item matches " + idOrPrefix);
  if (matches.length > 1) throw new Error("more than one ledger item matches " + idOrPrefix + "; give more characters");
  return matches[0];
}

export type DecisionInput = {
  item: string;
  to: string;
  by: string;
  reason: string;
  at: string;
  overlayId?: string;
};

function checkedDecision(item: WatchLedgerItem, input: DecisionInput): ReviewStatus {
  if (!isStatus(input.to)) throw new Error("--to must be one of: " + REVIEW_STATUSES.join(", "));
  // Same rules as the private editorial ledger: a named person, a reason of 8 to 2000 characters, a UTC time.
  if (!safeText(input.by, 160)) throw new Error("--by must name the person who decided (1 to 160 characters)");
  if (!safeText(input.reason, 2000) || input.reason.trim().length < 8) throw new Error("--reason must be 8 to 2000 characters");
  if (!isIso(input.at)) throw new Error("--at must be an ISO 8601 UTC timestamp such as 2026-11-26T09:00:00Z");
  if (Date.parse(input.at) < Date.parse(item.lastObservedAt)) throw new Error("a decision cannot predate the most recent observation of the item");
  const last = item.audit[item.audit.length - 1];
  if (last && Date.parse(input.at) < Date.parse(last.at)) throw new Error("a decision cannot predate the previous entry in the history");
  return input.to;
}

/**
 * Record a decision a person made about one ledger item. The status is
 * whatever the person typed; this function only checks the form of the entry.
 */
export function recordTriage(current: WatchLedger, input: DecisionInput): WatchLedger {
  const ledger = parseWatchLedger(structuredClone(current));
  const item = findLedgerItem(ledger, input.item);
  const to = checkedDecision(item, input);
  if (to === item.status) throw new Error("the item is already " + to + "; a triage entry must change the status");
  if (to === "candidate_started") {
    if (!input.overlayId) throw new Error("candidate_started needs --overlay naming the review overlay that was opened");
    if (!OVERLAY_ID.test(input.overlayId)) throw new Error("--overlay must be a review overlay id such as rc-cn-mofcom-59-2026");
  } else if (input.overlayId) {
    throw new Error("--overlay is only recorded with candidate_started");
  }
  item.audit.push({
    at: input.at, by: input.by.trim(), from: item.status, to, reason: input.reason.trim(),
    entry: "decision", corrects: null, overlayId: input.overlayId ?? null,
  });
  item.status = to;
  item.changedSinceDecision = false;
  return parseWatchLedger(ledger);
}

/**
 * Correct the latest decision on one item. The earlier entry stays in the
 * history; the new entry points at it.
 */
export function recordCorrection(current: WatchLedger, input: DecisionInput): WatchLedger {
  const ledger = parseWatchLedger(structuredClone(current));
  const item = findLedgerItem(ledger, input.item);
  if (item.audit.length === 0) throw new Error("the item has no decision to correct; record one with triage first");
  const to = checkedDecision(item, input);
  if (input.overlayId) throw new Error("correct takes no --overlay");
  if (to === "candidate_started") throw new Error("candidate_started is recorded with triage and --overlay, not with correct");
  item.audit.push({
    at: input.at, by: input.by.trim(), from: item.status, to, reason: input.reason.trim(),
    entry: "correction", corrects: item.audit.length - 1, overlayId: null,
  });
  item.status = to;
  item.changedSinceDecision = false;
  return parseWatchLedger(ledger);
}

// --- Status report -----------------------------------------------------------

export type TargetStatus = Target & {
  lastCheckedAt: string | null;
  lastSuccessfulAt: string | null;
  health: SourceHealth | "never_checked";
  consecutiveFailures: number;
  daysSinceLastSuccessfulCheck: number | null;
  /** Listing only. */
  expectedIntervalDays?: number;
  checkOverdue?: boolean;
  coverageGapPossible?: boolean;
  itemsRemembered?: number;
  clientRenderedSections?: number | null;
  /** Notice only. */
  recordedFingerprint?: string | null;
  registerFingerprint?: string | null;
};
export type WatchStatusReport = {
  at: string;
  stateRecorded: boolean;
  lastRunAt: string | null;
  targets: TargetStatus[];
  ledger: { items: number; byStatus: Partial<Record<ReviewStatus, number>> };
  openItems: (Pick<WatchLedgerItem,
    "itemId" | "kind" | "priority" | "url" | "title" | "status" | "firstObservedAt" | "lastObservedAt" | "changedSinceDecision">)[];
};

/** Summarise the last check, the health of every target and the items that wait for a person. */
export function watchStatus(
  register: SourceWatchRegister,
  state: WatchState | null,
  ledger: WatchLedger,
  at: string,
): WatchStatusReport {
  if (!isIso(at)) throw new Error("--at must be an ISO 8601 UTC timestamp such as 2026-11-26T09:00:00Z");
  if (state && state.lastRunAt !== null && Date.parse(at) < Date.parse(state.lastRunAt)) {
    throw new Error("--at " + at + " is earlier than the last recorded run " + state.lastRunAt);
  }
  const sinceSuccess = (memory: { lastSuccessfulAt: string | null } | undefined): number | null =>
    memory && memory.lastSuccessfulAt !== null ? daysBetween(memory.lastSuccessfulAt, at) : null;
  const targets: TargetStatus[] = [];
  for (const listing of register.listings) {
    const memory = state?.listings[listing.id];
    const days = sinceSuccess(memory);
    targets.push({
      targetKind: "listing", targetId: listing.id, url: listing.url,
      lastCheckedAt: memory?.lastCheckedAt ?? null,
      lastSuccessfulAt: memory?.lastSuccessfulAt ?? null,
      health: memory?.lastHealth ?? "never_checked",
      consecutiveFailures: memory?.consecutiveFailures ?? 0,
      daysSinceLastSuccessfulCheck: days,
      expectedIntervalDays: listing.expectedIntervalDays,
      checkOverdue: !memory || daysBetween(memory.lastCheckedAt, at) > listing.expectedIntervalDays,
      coverageGapPossible: days === null || days > listing.expectedIntervalDays,
      itemsRemembered: memory?.seen ? Object.keys(memory.seen).length : 0,
      clientRenderedSections: memory?.clientRenderedSections ?? null,
    });
  }
  for (const notice of register.knownNotices) {
    const memory = state?.notices[notice.noticeId];
    targets.push({
      targetKind: "notice", targetId: notice.noticeId, url: notice.url,
      lastCheckedAt: memory?.lastCheckedAt ?? null,
      lastSuccessfulAt: memory?.lastSuccessfulAt ?? null,
      health: memory?.lastHealth ?? "never_checked",
      consecutiveFailures: memory?.consecutiveFailures ?? 0,
      daysSinceLastSuccessfulCheck: sinceSuccess(memory),
      recordedFingerprint: memory?.fingerprint ?? null,
      registerFingerprint: notice.fingerprint,
    });
  }
  const byStatus: Partial<Record<ReviewStatus, number>> = {};
  for (const item of ledger.items) byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
  return {
    at,
    stateRecorded: state !== null,
    lastRunAt: state?.lastRunAt ?? null,
    targets,
    ledger: { items: ledger.items.length, byStatus },
    openItems: ledger.items
      .filter((item) => OPEN_REVIEW_STATUSES.includes(item.status) || item.changedSinceDecision)
      .map((item) => ({
        itemId: item.itemId, kind: item.kind, priority: item.priority, url: item.url, title: item.title, status: item.status,
        firstObservedAt: item.firstObservedAt, lastObservedAt: item.lastObservedAt, changedSinceDecision: item.changedSinceDecision,
      })),
  };
}

// --- Private files -----------------------------------------------------------

/** Resolve symbolic links for the part of a path that already exists. */
function realish(path: string): string {
  let existing = resolve(path);
  const tail: string[] = [];
  while (!existsSync(existing)) {
    const parent = dirname(existing);
    if (parent === existing) break;
    tail.unshift(existing.slice(parent.length).replace(/^[\\/]/, ""));
    existing = parent;
  }
  return join(realpathSync(existing), ...tail);
}

const isInside = (child: string, parent: string): boolean => {
  const rel = relative(parent, child);
  return rel === "" || (!rel.startsWith(".." + sep) && rel !== ".." && !isAbsolute(rel));
};

/**
 * Resolve the state directory and refuse a place where private memory could
 * be committed or served. Inside the repository only `.monitor-controls`,
 * which git ignores, is accepted.
 */
export function resolveStateDir(dir: string | undefined, root: string = process.cwd()): string {
  const base = realish(root);
  const target = realish(resolve(root, dir ?? DEFAULT_STATE_DIR));
  if (!isInside(target, base)) return target;
  const rel = relative(base, target);
  const first = rel.split(sep)[0];
  if ((PROTECTED_STATE_ROOTS as readonly string[]).includes(first)) {
    throw new Error("the state directory must not be inside " + first + "/: watch memory and operator decisions are private");
  }
  if (first !== DEFAULT_STATE_DIR) {
    throw new Error("inside the repository the state directory must be " + DEFAULT_STATE_DIR + "/ (git-ignored); choose it or a directory outside the repository");
  }
  return target;
}

/** Read and validate a register file. */
export function readSourceWatchRegister(path: string): { register: SourceWatchRegister; sha256: string } {
  if (!existsSync(path)) throw new Error("source-watch register is missing: " + path);
  const text = readFileSync(path, "utf8");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("source-watch register is not valid JSON: " + path);
  }
  return { register: parseSourceWatchRegister(raw), sha256: sha256Hex(text) };
}

/** Path of a review overlay file, for checking that an overlay named in a decision exists. */
export const reviewOverlayPath = (overlayId: string, root: string = process.cwd()): string =>
  join(root, "research", "controls-review", overlayId + ".json");

// --- Offline replay ----------------------------------------------------------

export type ReplayEntry = { file: string; status?: number } | { status: number } | { error: string };

/**
 * Build a fetch function from a replay directory. `replay.json` maps each URL
 * to a saved file or to a failure, so a check can run without the network.
 */
export function loadReplay(dir: string): FetchFunction {
  const path = join(dir, "replay.json");
  if (!existsSync(path)) throw new Error("replay directory has no replay.json: " + dir);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new Error("replay.json is not valid JSON: " + path);
  }
  if (!isRecord(raw) || raw.version !== 1 || !isRecord(raw.responses)) {
    throw new Error("replay.json needs version 1 and a responses object: " + path);
  }
  const base = realish(dir);
  const responses = new Map<string, ReplayEntry>();
  for (const [url, entry] of Object.entries(raw.responses)) {
    if (!isRecord(entry)) throw new Error("replay entry is not an object: " + url);
    if (typeof entry.file === "string") {
      const file = realish(resolve(dir, entry.file));
      if (!isInside(file, base) || !existsSync(file)) throw new Error("replay file is missing or outside the replay directory: " + entry.file);
      responses.set(canonicalUrl(url), { file, status: typeof entry.status === "number" ? entry.status : 200 });
    } else if (typeof entry.status === "number") {
      responses.set(canonicalUrl(url), { status: entry.status });
    } else if (typeof entry.error === "string") {
      responses.set(canonicalUrl(url), { error: entry.error });
    } else {
      throw new Error("replay entry needs file, status or error: " + url);
    }
  }
  const fetchFn = (async (input: unknown) => {
    const entry = responses.get(canonicalUrl(String(input)));
    if (!entry) throw new Error("replay has no entry for " + String(input));
    if ("error" in entry) {
      const error = new Error("replayed " + entry.error);
      if (entry.error === "timeout") error.name = "AbortError";
      throw error;
    }
    if ("file" in entry) return new Response(readFileSync(entry.file, "utf8"), { status: entry.status ?? 200 });
    return new Response("", { status: entry.status });
  }) as FetchFunction;
  return fetchFn;
}
