/**
 * M1.1 run-scoped editorial intake. This builds an *unverified observation
 * queue*, not a policy event, source citation, candidate, or approval. Human
 * notes/dispositions MUST NOT be committed or uploaded to public run artifacts.
 */
import type { PilotReport, PilotSourceId, ReviewObservation } from "./source-monitor";
import type { Source } from "./types";

export type EditorialQueueItem = {
  observationId: string;
  watchSourceId: PilotSourceId;
  firstObservedAt: string;
  change: ReviewObservation["change"];
  publicationDate: string | null;
  titleAsListed: string;
  officialUrl: string;
  keywordHintOnly: boolean;
  exactCitationSourceIds: string[];
  reviewStatus: "unreviewed";
};
export type EditorialReviewQueue = {
  version: 1;
  mode: "shadow_unverified_editorial_queue";
  observedAt: string;
  sourcesDegraded: string[];
  items: EditorialQueueItem[];
  countNew: number;
  countRevised: number;
  countMatchingCitations: number;
};

function comparableUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    // Fragments do not identify a separate source document. Preserve queries,
    // trailing slashes, and paths: avoid declaring two distinct official pages
    // duplicates based on heuristics.
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
}
const codePoint = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

export function buildEditorialReviewQueue(report: PilotReport, publishedSources: readonly Source[]): EditorialReviewQueue {
  if (report.mode !== "shadow_review_only") throw Error("Editorial queue accepts only shadow observation reports");
  const byUrl = new Map<string, string[]>();
  for (const source of publishedSources) {
    const url = comparableUrl(source.url);
    if (!url) continue;
    byUrl.set(url, [...(byUrl.get(url) ?? []), source.id]);
  }
  for (const ids of byUrl.values()) ids.sort(codePoint);

  const seen = new Set<string>();
  const items: EditorialQueueItem[] = [];
  for (const source of report.sources) {
    // Failed sources have no valid changes to review, even if their previous
    // cache contains records; their health is visible at the queue level.
    if (source.health !== "ok" || source.baseline) continue;
    for (const record of source.reviewOnly) {
      const key = source.sourceId + ":" + record.id;
      if (seen.has(key)) throw Error("Repeated editorial observation identity in one run: " + key);
      seen.add(key);
      const url = comparableUrl(record.url);
      if (!url) throw Error("Review observation lacks valid HTTPS official URL: " + key);
      items.push({
        observationId: record.id,
        watchSourceId: source.sourceId,
        firstObservedAt: report.observedAt,
        change: record.change,
        publicationDate: record.publishedDate,
        titleAsListed: record.title,
        officialUrl: record.url,
        keywordHintOnly: record.keywordHint,
        exactCitationSourceIds: [...(byUrl.get(url) ?? [])],
        reviewStatus: "unreviewed",
      });
    }
  }
  items.sort((a, b) =>
    Number(b.keywordHintOnly) - Number(a.keywordHintOnly) ||
    codePoint(b.publicationDate ?? "", a.publicationDate ?? "") ||
    codePoint(a.watchSourceId, b.watchSourceId) ||
    codePoint(a.observationId, b.observationId));
  const countNew = items.filter((item) => item.change === "new").length;
  const countRevised = items.filter((item) => item.change === "revised").length;
  if (countNew !== report.newPublications || countRevised !== report.revisions) {
    throw Error("Editorial queue did not reconcile to monitoring report counts");
  }
  return {
    version: 1,
    mode: "shadow_unverified_editorial_queue",
    observedAt: report.observedAt,
    sourcesDegraded: report.sources.filter((source) => source.health !== "ok").map((source) => source.sourceId),
    items,
    countNew,
    countRevised,
    countMatchingCitations: items.filter((item) => item.exactCitationSourceIds.length > 0).length,
  };
}

/**
 * Spreadsheet injection defense: official page titles are untrusted strings
 * and may start with characters interpreted as a formula by Sheets/Excel.
 * Quote every cell (RFC 4180) and add a literal apostrophe for formula-like
 * values, including after leading whitespace.
 */
function csvCell(value: string): string {
  const normalized = value.replace(/[\r\n\t]+/g, " ");
  const safe = /^\s*[=+\-@]/.test(normalized) ? "'" + normalized : normalized;
  return '"' + safe.replace(/"/g, '""') + '"';
}
export function editorialReviewCsv(queue: EditorialReviewQueue): string {
  const rows = [
    ["Observation ID", "Observed UTC", "Watched source ID", "Change", "Publication date", "Title as listed",
      "Official source URL", "Keyword hint ONLY", "Exact existing source IDs", "Human disposition (local only)", "Private reviewer notes (local only)"],
    ...queue.items.map((r) => [
      r.observationId, r.firstObservedAt, r.watchSourceId, r.change, r.publicationDate ?? "",
      r.titleAsListed, r.officialUrl, r.keywordHintOnly ? "YES (not classification)" : "NO (not exclusion)",
      r.exactCitationSourceIds.join("; "), "", "",
    ]),
  ];
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
