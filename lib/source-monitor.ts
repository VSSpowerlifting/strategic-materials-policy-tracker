/**
 * M1 shadow source monitor: pure parsing and state-transition rules.
 *
 * Observed publications are NOT verified policy events, classifications,
 * financial commitments, or candidate records. No seed or site writes.
 * An absent/evicted prior state triggers baseline-only bootstrap; it must
 * never be misreported as "all new" or "no changes."
 */
import { createHash } from "node:crypto";
import type { WatchedSource } from "./types";

export const PILOT_SOURCE_IDS = [
  "watch-ca-nrcan-news",
  "watch-us-federal-register-interior",
] as const;
export type PilotSourceId = (typeof PILOT_SOURCE_IDS)[number];
export type SourceHealth = "ok" | "blocked" | "http_error" | "timeout" | "invalid_response" | "network_error";
export type Publication = {
  id: string;
  title: string;
  url: string;
  publishedDate: string | null;
  fingerprint: string;
  /** Keyword-based review hint, never a factual policy classification. */
  keywordHint: boolean;
};
export type ReviewObservation = Publication & { change: "new" | "revised" };
export type SourceMemory = {
  seen: Record<string, string>;
  lastLatestId: string | null;
  lastSuccessfulAt: string;
};
export type MonitorState = {
  version: 1;
  sources: Partial<Record<PilotSourceId, SourceMemory>>;
};
export type SourceReport = {
  sourceId: PilotSourceId;
  health: SourceHealth;
  status: number | null;
  observed: number;
  baseline: boolean;
  newCount: number;
  revisedCount: number;
  /** Documents from a previously observed latest point are no longer in the finite feed window. */
  possibleWindowGap: boolean;
  lastSuccessfulAt: string | null;
  message: string | null;
  reviewOnly: ReviewObservation[];
};
export type PilotReport = {
  version: 1;
  mode: "shadow_review_only";
  observedAt: string;
  sources: SourceReport[];
  newPublications: number;
  revisions: number;
  degradedSources: number;
  allSourcesHealthy: boolean;
};
export type FetchFunction = typeof fetch;

const MAX_FEED_BYTES = 2_000_000;
const MAX_WINDOW = 100;
const MAX_FEDERAL_REGISTER_PAGES = 4; // 400-document hard cap; never unbounded crawling.
const MAX_PERSISTENT_IDS = 5_000;
const TIMEOUT_MS = 20_000;
const KEYWORD = /critical[ -]minerals?|rare[ -]earth|gallium|germanium|graphite|antimony|tungsten|lithium|nickel|cobalt|neodymium|praseodymium|dysprosium|terbium|strategic[ -]materials?|mineral[ -]supply[ -]chain/i;
const FR_ENDPOINT = "https://www.federalregister.gov/api/v1/documents.json?conditions%5Bagencies%5D%5B%5D=interior-department&order=newest&per_page=100";

const digest = (input: string) => createHash("sha256").update(input).digest("hex");
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown): string => typeof v === "string" ? v.trim() : "";
const publishedDay = (v: unknown): string | null => {
  const value = text(v);
  return /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value) ? value.slice(0, 10) : null;
};
const cleanUrl = (v: unknown) => {
  const u = text(v);
  try {
    const parsed = new URL(u);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
};
const xmlEntities = (v: string) => v.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_matched, e: string) => {
  const basic: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
  if (basic[e.toLowerCase()] !== undefined) return basic[e.toLowerCase()];
  const number = e.toLowerCase().startsWith("#x") ? Number.parseInt(e.slice(2), 16) : Number.parseInt(e.slice(1), 10);
  return Number.isInteger(number) && number > 0 && number <= 0x10ffff && !(number >= 0xd800 && number <= 0xdfff)
    ? String.fromCodePoint(number) : "";
});
const getXmlTag = (chunk: string, name: string) => {
  const r = new RegExp("<(?:[a-z][\\w-]*:)?" + name + "\\b[^>]*>([\\s\\S]*?)<\\/(?:[a-z][\\w-]*:)?" + name + "\\s*>", "i").exec(chunk);
  if (!r) return "";
  return xmlEntities(r[1].replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, "$1").replace(/<[^>]*>/g, "").trim()).trim();
};
const normalize = (sourceId: PilotSourceId, nativeId: string, title: string, url: string, date: string | null): Publication => ({
  id: digest(sourceId + "\n" + nativeId),
  title: title.slice(0, 600),
  url,
  publishedDate: date,
  fingerprint: digest(title + "\n" + url + "\n" + (date ?? "")),
  keywordHint: KEYWORD.test(title),
});

export function parseNrcanAtom(xml: string): Publication[] {
  if (!/<(?:[a-z][\w-]*:)?feed\b/i.test(xml) || !/<\/(?:[a-z][\w-]*:)?feed\s*>/i.test(xml)) {
    throw Error("NRCan response was not a complete Atom feed");
  }
  const entries = [...xml.matchAll(/<(?:[a-z][\w-]*:)?entry\b[^>]*>([\s\S]*?)<\/(?:[a-z][\w-]*:)?entry\s*>/gi)];
  if (entries.length > MAX_WINDOW) throw Error("NRCan feed exceeded bounded parser window");
  if (!entries.length) throw Error("NRCan Atom feed has no parsed entries; do not report a clean empty feed");
  const rows: Publication[] = [];
  for (const match of entries) {
    const chunk = match[1];
    const title = getXmlTag(chunk, "title");
    const atomId = getXmlTag(chunk, "id");
    const date = publishedDay(getXmlTag(chunk, "published") || getXmlTag(chunk, "updated"));
    const links = [...chunk.matchAll(/<(?:[a-z][\w-]*:)?link\b([^>]*?)\/?\s*>/gi)];
    const preferred = links.find((l) => /\brel\s*=\s*["']alternate["']/i.test(l[1])) ?? links.find((l) => !/\brel\s*=\s*["']self["']/i.test(l[1]));
    const url = cleanUrl(xmlEntities(/\bhref\s*=\s*["']([^"']+)["']/i.exec(preferred?.[1] ?? "")?.[1] ?? ""));
    if (!title || !url || !(atomId || url)) throw Error("NRCan Atom entry is missing a stable ID, title or secure URL");
    rows.push(normalize("watch-ca-nrcan-news", atomId || url, title, url, date));
  }
  return uniquePublications(rows);
}

export function parseFederalRegisterJson(raw: string): Publication[] {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || !Array.isArray(parsed.results)) throw Error("Federal Register API response lacks a results array");
  if (parsed.results.length > MAX_WINDOW) throw Error("Federal Register response exceeded bounded parser window");
  if (!parsed.results.length) throw Error("Federal Register results empty; treat as uncertain coverage");
  const rows: Publication[] = [];
  for (const item of parsed.results) {
    if (!isRecord(item)) throw Error("Federal Register result is not an object");
    const doc = text(item.document_number);
    const title = text(item.title);
    const url = cleanUrl(item.html_url);
    if (!doc || !title || !url || !["www.federalregister.gov", "federalregister.gov"].includes(new URL(url).hostname))
      throw Error("Federal Register result missing document number, title or canonical URL");
    rows.push(normalize("watch-us-federal-register-interior", doc, title, url, publishedDay(item.publication_date)));
  }
  return uniquePublications(rows);
}
/**
 * Federal Register's API supplies the next-page URL with its search cursor.
 * Treat the returned URL as untrusted: only continue the same Interior
 * Department document query on the exact original HTTPS API host.
 */
export function federalRegisterNextPage(raw: string): string | null {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || !("next_page_url" in parsed) || parsed.next_page_url === null) return null;
  if (typeof parsed.next_page_url !== "string") throw Error("Federal Register invalid next-page URL");
  const url = cleanUrl(parsed.next_page_url);
  if (!url) throw Error("Federal Register invalid next-page URL");
  const next = new URL(url);
  const isExpected = next.hostname === "www.federalregister.gov" &&
    /^\/api\/v1\/documents(?:\.json)?$/.test(next.pathname) &&
    next.searchParams.getAll("conditions[agencies][]").includes("interior-department") &&
    next.searchParams.get("per_page") === "100";
  if (!isExpected) throw Error("Federal Register next-page URL escaped original agency-filtered API boundary");
  return url;
}

function uniquePublications(rows: Publication[]): Publication[] {
  const seen = new Set<string>();
  return rows.filter((p) => seen.has(p.id) ? false : (seen.add(p.id), true));
}

export function readMonitorState(value: unknown): MonitorState {
  if (value === null || value === undefined) return { version: 1, sources: {} };
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.sources))
    throw Error("Monitor cache state has an unsupported or corrupt shape; refusing a silent reset");
  const sources: MonitorState["sources"] = {};
  for (const sourceId of PILOT_SOURCE_IDS) {
    const candidate = value.sources[sourceId];
    if (candidate === undefined) continue;
    if (!isRecord(candidate) || !isRecord(candidate.seen) || typeof candidate.lastSuccessfulAt !== "string" ||
        !(candidate.lastLatestId === null || typeof candidate.lastLatestId === "string"))
      throw Error("Malformed monitor cache state for " + sourceId);
    const entries = Object.entries(candidate.seen);
    if (entries.length > MAX_PERSISTENT_IDS ||
        entries.some(([id, fp]) => !/^[a-f0-9]{64}$/.test(id) || typeof fp !== "string" || !/^[a-f0-9]{64}$/.test(fp)))
      throw Error("Monitor cache IDs invalid for " + sourceId);
    sources[sourceId] = {
      seen: Object.fromEntries(entries) as Record<string, string>,
      lastLatestId: candidate.lastLatestId,
      lastSuccessfulAt: candidate.lastSuccessfulAt,
    };
  }
  return { version: 1, sources };
}

export function reconcilePublications(
  sourceId: PilotSourceId,
  previous: SourceMemory | undefined,
  items: Publication[],
  observedAt: string,
  httpStatus = 200,
): { memory: SourceMemory; report: SourceReport } {
  const before = previous?.seen ?? {};
  const baseline = !previous;
  const changes: ReviewObservation[] = baseline ? [] : items
    .filter((p) => before[p.id] !== p.fingerprint)
    .map((p) => ({ ...p, change: before[p.id] === undefined ? "new" : "revised" }));
  const additions = changes.filter((p) => p.change === "new").length;
  const revisions = changes.filter((p) => p.change === "revised").length;
  const seen = { ...before };
  for (const item of items) {
    // Re-insert seen keys, so the oldest keys are pruned first.
    delete seen[item.id];
    seen[item.id] = item.fingerprint;
  }
  while (Object.keys(seen).length > MAX_PERSISTENT_IDS) delete seen[Object.keys(seen)[0]];
  return {
    memory: { seen, lastLatestId: items[0]?.id ?? previous?.lastLatestId ?? null, lastSuccessfulAt: observedAt },
    report: {
      sourceId,
      health: "ok",
      status: httpStatus,
      observed: items.length,
      baseline,
      newCount: additions,
      revisedCount: revisions,
      possibleWindowGap: !baseline && items.length >= (sourceId === "watch-ca-nrcan-news" ? 50 : 100) &&
        !!previous?.lastLatestId && !items.some((p) => p.id === previous.lastLatestId),
      lastSuccessfulAt: observedAt,
      message: baseline ? "Baseline created; zero new items claimed" : null,
      reviewOnly: changes,
    },
  };
}

export function pilotEndpoint(source: WatchedSource): string {
  if (source.id === "watch-ca-nrcan-news") return source.url;
  if (source.id === "watch-us-federal-register-interior") return FR_ENDPOINT;
  throw Error("Unapproved M1 pilot source: " + source.id);
}

async function httpBody(fetchFn: FetchFunction, url: string): Promise<{ body: string; status: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetchFn(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { accept: "application/atom+xml, application/json;q=0.9, */*;q=0.5", "user-agent": "SMPT-source-pilot/1.0 (read-only policy source monitoring)" },
    });
    if (!response.ok) {
      const error = new Error("HTTP " + response.status) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }
    const body = await response.text();
    if (Buffer.byteLength(body, "utf8") > MAX_FEED_BYTES) throw Error("Source exceeded maximum safe response size");
    return { body, status: response.status };
  } finally { clearTimeout(timeout); }
}

/**
 * Read at most four Federal Register pages, stopping as soon as the previous
 * latest source-native identifier is found. All pages are parsed before any
 * state is advanced. Missing anchors are surfaced via possibleWindowGap.
 */
async function federalRegisterWindow(
  fetchFn: FetchFunction,
  previousLatestId: string | null,
): Promise<{ rows: Publication[]; status: number }> {
  let next: string | null = FR_ENDPOINT;
  let pages = 0;
  let firstStatus = 200;
  const visited = new Set<string>();
  const rows: Publication[] = [];
  while (next && pages < MAX_FEDERAL_REGISTER_PAGES) {
    if (visited.has(next)) throw Error("Federal Register pagination loop");
    visited.add(next);
    const result = await httpBody(fetchFn, next);
    if (pages === 0) firstStatus = result.status;
    rows.push(...parseFederalRegisterJson(result.body));
    pages += 1;
    if (!previousLatestId || rows.some((row) => row.id === previousLatestId)) break;
    next = federalRegisterNextPage(result.body);
  }
  return { rows: uniquePublications(rows), status: firstStatus };
}

export async function runSourcePilot(
  watchlist: readonly WatchedSource[],
  state: MonitorState,
  observedAt: string,
  fetchFn: FetchFunction = fetch,
): Promise<{ state: MonitorState; report: PilotReport }> {
  const next = readMonitorState(state);
  const sources: SourceReport[] = [];
  for (const sourceId of PILOT_SOURCE_IDS) {
    const source = watchlist.find((s) => s.id === sourceId);
    if (!source || source.status !== "active") throw Error("Required pilot source absent or inactive: " + sourceId);
    try {
      const prior = next.sources[sourceId];
      const { rows, status } = sourceId === "watch-ca-nrcan-news"
        ? await (async () => {
            const response = await httpBody(fetchFn, pilotEndpoint(source));
            return { rows: parseNrcanAtom(response.body), status: response.status };
          })()
        : await federalRegisterWindow(fetchFn, prior?.lastLatestId ?? null);
      const result = reconcilePublications(sourceId, next.sources[sourceId], rows, observedAt, status);
      next.sources[sourceId] = result.memory;
      sources.push(result.report);
    } catch (error) {
      const status = typeof (error as { status?: unknown }).status === "number" ? (error as { status: number }).status : null;
      const msg = (error as Error).message || "Unknown source error";
      const health: SourceHealth =
        status === 401 || status === 403 || status === 429 || status === 451 ? "blocked" :
        status !== null ? "http_error" :
        (error as Error).name === "AbortError" ? "timeout" :
        error instanceof SyntaxError || /Atom|Federal Register|JSON|Source exceeded|bounded parser|entry is missing|result missing/.test(msg) ? "invalid_response" : "network_error";
      sources.push({
        sourceId, health, status, observed: 0, baseline: !next.sources[sourceId],
        newCount: 0, revisedCount: 0, possibleWindowGap: false,
        lastSuccessfulAt: next.sources[sourceId]?.lastSuccessfulAt ?? null,
        message: msg.slice(0, 300), reviewOnly: [],
      });
      // A source failure must NOT overwrite its last healthy identity ledger.
    }
  }
  const report: PilotReport = {
    version: 1, mode: "shadow_review_only", observedAt, sources,
    newPublications: sources.reduce((n, x) => n + x.newCount, 0),
    revisions: sources.reduce((n, x) => n + x.revisedCount, 0),
    degradedSources: sources.filter((x) => x.health !== "ok").length,
    allSourcesHealthy: sources.every((x) => x.health === "ok"),
  };
  return { state: next, report };
}
