/**
 * M2.3: convert only mutually consistent, healthy EXIM source observations
 * into existing M1.3 private human-review rows. Not an auto-classifier or
 * candidate handoff. EXIM's original report and queue stay authoritative.
 */
import { createHash } from "node:crypto";
import { EXIM_SOURCE_ID, type EximEditorialQueue, type EximReport } from "../lib/exim-shadow-monitor";
import type { EditorialReviewQueue, EditorialQueueItem } from "../lib/monitor-editorial-queue";

const object = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);
const hex64 = (x: unknown): x is string =>
  typeof x === "string" && /^[a-f0-9]{64}$/.test(x);
const utcTime = (x: unknown): x is string =>
  typeof x === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(x) &&
  !Number.isNaN(Date.parse(x));
const validDay = (x: unknown): x is string => {
  if (typeof x !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return false;
  const t = Date.parse(x + "T00:00:00Z");
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === x;
};
const canonicalExim = (raw: unknown): raw is string => {
  if (typeof raw !== "string" || raw.length > 2048) return false;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && u.hostname === "www.exim.gov" &&
      u.port === "" && u.username === "" && u.password === "" &&
      u.pathname.startsWith("/news/") &&
      /^[a-z0-9][a-z0-9-]*$/.test(u.pathname.slice(6)) &&
      !u.hash && !u.search && u.toString() === raw;
  } catch { return false; }
};
function validRecord(row: unknown): row is Record<string, unknown> {
  if (!object(row) || !hex64(row.observationId) || !canonicalExim(row.officialUrl) ||
      row.watchSourceId !== EXIM_SOURCE_ID || !utcTime(row.observedAt) ||
      !validDay(row.publicationDate) || !["new", "revised"].includes(String(row.change)) ||
      typeof row.titleAsListed !== "string" || !row.titleAsListed.trim() ||
      row.titleAsListed.length > 600 || typeof row.keywordHintOnly !== "boolean" ||
      row.reviewStatus !== "unreviewed") return false;
  const expectedId = createHash("sha256")
    .update(EXIM_SOURCE_ID + "\n" + row.officialUrl).digest("hex");
  return row.observationId === expectedId;
}

/**
 * Require exact agreement between the independent health report and the
 * editorial queue. Reject bad dates, duplicate IDs, off-host URLs, unpaired
 * rows, and stale/partially failed publisher observations.
 */
export function validateAndAdaptEximEditorial(
  queueRaw: unknown, reportRaw: unknown,
): EditorialReviewQueue {
  if (!object(reportRaw) || reportRaw.version !== 1 ||
      reportRaw.mode !== "shadow_exim_publications_only" ||
      reportRaw.sourceId !== EXIM_SOURCE_ID ||
      !utcTime(reportRaw.observedAt) || reportRaw.health !== "ok" ||
      reportRaw.status !== 200 || reportRaw.possibleWindowGap !== false ||
      typeof reportRaw.baseline !== "boolean" ||
      !Number.isInteger(reportRaw.observed) || Number(reportRaw.observed) < 5 ||
      !Number.isInteger(reportRaw.pagesRead) || Number(reportRaw.pagesRead) < 1 ||
      Number(reportRaw.pagesRead) > 3 ||
      !Number.isInteger(reportRaw.newCount) || Number(reportRaw.newCount) < 0 ||
      !Number.isInteger(reportRaw.revisedCount) || Number(reportRaw.revisedCount) < 0 ||
      !Array.isArray(reportRaw.reviewOnly) ||
      !object(queueRaw) || queueRaw.version !== 1 ||
      queueRaw.mode !== "shadow_unverified_exim_editorial_queue" ||
      queueRaw.sourceId !== EXIM_SOURCE_ID ||
      queueRaw.health !== "ok" || queueRaw.possibleWindowGap !== false ||
      queueRaw.observedAt !== reportRaw.observedAt ||
      !Array.isArray(queueRaw.items)) {
    throw Error("EXIM editorial import requires healthy, matching publisher report and review queue");
  }
  const queue = queueRaw as EximEditorialQueue;
  const report = reportRaw as EximReport;
  if (queue.items.length !== report.reviewOnly.length ||
      queue.items.length !== report.newCount + report.revisedCount ||
      (report.baseline && queue.items.length > 0)) {
    throw Error("EXIM editorial queue/report counts disagree or baseline falsely claims discoveries");
  }
  const pairs = new Map<string, EximReport["reviewOnly"][number]>();
  for (const observation of report.reviewOnly) {
    if (!object(observation) || !hex64(observation.id) ||
        !hex64(observation.fingerprint) || !canonicalExim(observation.url) ||
        !validDay(observation.publicationDate) ||
        typeof observation.title !== "string" || !observation.title.trim() ||
        observation.title.length > 600 ||
        typeof observation.keywordHintOnly !== "boolean" ||
        !["new", "revised"].includes(String(observation.change)) ||
        pairs.has(observation.id)) {
      throw Error("EXIM publisher report contains malformed or repeated release evidence");
    }
    const expectedId = createHash("sha256")
      .update(EXIM_SOURCE_ID + "\n" + observation.url).digest("hex");
    if (observation.id !== expectedId)
      throw Error("EXIM publisher report has altered canonical identity");
    pairs.set(observation.id, observation as EximReport["reviewOnly"][number]);
  }

  const seen = new Set<string>();
  const rows: EditorialQueueItem[] = [];
  for (const row of queue.items) {
    if (!validRecord(row) || row.observedAt !== report.observedAt ||
        seen.has(row.observationId)) {
      throw Error("EXIM queue contains invalid, duplicated, or mismatched publication");
    }
    seen.add(row.observationId);
    const release = pairs.get(row.observationId);
    if (!release || release.url !== row.officialUrl ||
        release.title !== row.titleAsListed ||
        release.publicationDate !== row.publicationDate ||
        release.change !== row.change ||
        release.keywordHintOnly !== row.keywordHintOnly) {
      throw Error("EXIM queue item differs from source-verified release report");
    }
    rows.push({
      observationId: row.observationId, watchSourceId: EXIM_SOURCE_ID,
      observedAt: report.observedAt, change: row.change,
      publicationDate: row.publicationDate, titleAsListed: row.titleAsListed,
      officialUrl: row.officialUrl, keywordHintOnly: row.keywordHintOnly,
      // Citation reconciliation is NOT performed in this source-schema bridge.
      exactCitationSourceIds: [], reviewStatus: "unreviewed",
    });
  }
  if (rows.filter((r) => r.change === "new").length !== report.newCount ||
      rows.filter((r) => r.change === "revised").length !== report.revisedCount) {
    throw Error("EXIM queue change counts contradict independent source report");
  }
  return {
    version: 1, mode: "shadow_unverified_editorial_queue",
    observedAt: report.observedAt, sourcesDegraded: [], items: rows,
    countNew: report.newCount, countRevised: report.revisedCount,
    countMatchingCitations: 0, // Unassessed; do not present as 'no matches'.
  };
}
