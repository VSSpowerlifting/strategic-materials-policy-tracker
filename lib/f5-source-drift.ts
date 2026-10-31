/**
 * F5-5 prepublication provenance drift: deterministic OFFLINE comparison of
 * explicitly provided, manually captured official-source snapshots.
 *
 * This is not a collector, content verifier, event detector, review attestation,
 * or seed updater. A changed checksum proves only changed bytes. Failed access
 * never implies a new policy, signed agreement or physical industrial event.
 */
import { createHash } from "node:crypto";
import type { Source } from "./types";

export type F5CaptureHealth = "ok" | "not_found" | "blocked" | "timeout" | "error";
export type F5SourceCapture = {
  sourceId: string;
  url: string;
  retrievedAt: string; // Exact UTC retrieval clock, never an occurrence date.
  health: F5CaptureHealth;
  httpStatus: number | null;
  sha256: string | null; // Digest of manually preserved body; null on failure.
  publicationDate: string | null; // Date asserted on original source, if established.
};

export type F5DriftDisposition =
  | "baseline_only" | "unchanged" | "content_or_metadata_revised"
  | "source_unavailable" | "retrieval_degraded" | "source_restored"
  | "retrieval_recovered" | "not_scanned";

export type F5DriftReason =
  | "content_digest_changed" | "publication_date_changed"
  | "source_not_found" | "retrieval_failed" | "source_restored"
  | "retrieval_recovered";

export type F5DriftCase = {
  sourceId: string;
  publisher: string;
  officialUrl: string;
  disposition: F5DriftDisposition;
  reasons: F5DriftReason[];
  previous: F5SourceCapture | null;
  current: F5SourceCapture | null;
  /** Stable for a transition even when the exact same capture is retried. */
  reviewKey: string | null;
  reviewStatus: "unreviewed" | "not_applicable";
  needsHumanSourceAccess: boolean;
  /** Never use an absent capture as evidence that the original URL returned 404. */
  positiveEventInferred: false;
  publicSeedChangeAuthorized: false;
};

export type F5DriftReceipt = {
  schemaVersion: "f5-5-offline-source-drift-1";
  mode: "private_prepublication_review_only";
  candidateCount: number;
  baselineCount: number;
  unchangedCount: number;
  notScannedCount: number;
  publicReleaseAuthorized: false;
  automatedSourceOrMilestonePromotionAuthorized: false;
  cases: F5DriftCase[];
  limitations: string[];
};

const lex = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
const digest = (v: string): string => createHash("sha256").update(v).digest("hex");
const HASH = /^[a-f0-9]{64}$/;
const UTC_CLOCK = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const HEALTH = new Set<F5CaptureHealth>(["ok", "not_found", "blocked", "timeout", "error"]);

function validDay(value: string): boolean {
  return DAY.test(value) && !Number.isNaN(Date.parse(value + "T00:00:00Z")) &&
    new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value;
}
function validClock(value: string): boolean {
  return UTC_CLOCK.test(value) && !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 19) === value.slice(0, 19);
}
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function fingerprint(snapshot: F5SourceCapture): string {
  // Exclude retrieval time so repeated checks of unchanged evidence deduplicate.
  return digest(JSON.stringify([
    snapshot.sourceId, snapshot.url, snapshot.health,
    snapshot.httpStatus, snapshot.sha256, snapshot.publicationDate,
  ]));
}
function validateCaptures(
  value: unknown, label: string, registry: Map<string, Pick<Source, "id" | "publisher" | "url">>,
): Map<string, F5SourceCapture> {
  if (!Array.isArray(value) || value.length > registry.size)
    throw Error("F5 drift: " + label + " must be a bounded array of registered sources");
  const result = new Map<string, F5SourceCapture>();
  for (const item of value) {
    if (!isObject(item) || typeof item.sourceId !== "string" || !registry.has(item.sourceId))
      throw Error("F5 drift: " + label + " has unknown source identity");
    const source = registry.get(item.sourceId)!;
    if (result.has(item.sourceId))
      throw Error("F5 drift: duplicate " + label + " source ID " + item.sourceId);
    if (typeof item.url !== "string" || item.url !== source.url ||
        !item.url.startsWith("https://"))
      throw Error("F5 drift: snapshot URL must exactly match registered HTTPS source " + item.sourceId);
    if (typeof item.retrievedAt !== "string" || !validClock(item.retrievedAt))
      throw Error("F5 drift: invalid UTC retrieval clock for " + item.sourceId);
    if (typeof item.health !== "string" || !HEALTH.has(item.health as F5CaptureHealth))
      throw Error("F5 drift: invalid retrieval health for " + item.sourceId);
    const health = item.health as F5CaptureHealth;
    const status = item.httpStatus;
    if (status !== null && (!Number.isInteger(status) || (status as number) < 100 || (status as number) > 599))
      throw Error("F5 drift: invalid HTTP status for " + item.sourceId);
    if ((health === "ok" && (typeof status !== "number" || status < 200 || status >= 300)) ||
        (health === "not_found" && status !== 404 && status !== 410) ||
        (health === "blocked" && ![401, 403, 429, 451].includes(status as number)))
      throw Error("F5 drift: inconsistent HTTP status/health for " + item.sourceId);
    if (health !== "ok" && (item.sha256 !== null || item.publicationDate !== null))
      throw Error("F5 drift: failed access cannot supply new source content for " + item.sourceId);
    if (health === "ok" && (typeof item.sha256 !== "string" || !HASH.test(item.sha256)))
      throw Error("F5 drift: successful source must have SHA-256 for " + item.sourceId);
    if (item.publicationDate !== null &&
        (typeof item.publicationDate !== "string" || !validDay(item.publicationDate) ||
         item.publicationDate > item.retrievedAt.slice(0, 10)))
      throw Error("F5 drift: invalid/future publication day for " + item.sourceId);
    // Reconstruct a narrow, known-field record. Unexpected input fields cannot
    // be carried into a public-facing output by accident.
    result.set(item.sourceId, {
      sourceId: item.sourceId,
      url: item.url,
      retrievedAt: item.retrievedAt,
      health,
      httpStatus: status as number | null,
      sha256: item.sha256 as string | null,
      publicationDate: item.publicationDate as string | null,
    });
  }
  return result;
}

/**
 * A missing current row means NOT SCANNED; only an explicit, provenance-bearing
 * 404/410 can yield source_unavailable. Distinct bytes are not semantic facts.
 */
export function auditF5SourceDrift(
  before: unknown,
  after: unknown,
  registeredSources: readonly Pick<Source, "id" | "publisher" | "url">[],
): F5DriftReceipt {
  if (!Array.isArray(registeredSources) || !registeredSources.length)
    throw Error("F5 drift: registered source list is required");
  const registry = new Map<string, Pick<Source, "id" | "publisher" | "url">>();
  for (const source of registeredSources) {
    if (!source || typeof source.id !== "string" || !source.id ||
        typeof source.publisher !== "string" || !source.publisher ||
        typeof source.url !== "string" || registry.has(source.id))
      throw Error("F5 drift: invalid/duplicate registered source identity");
    registry.set(source.id, source);
  }
  const old = validateCaptures(before, "prior", registry);
  const now = validateCaptures(after, "current", registry);
  const cases: F5DriftCase[] = [];
  const ids = [...new Set([...old.keys(), ...now.keys()])].sort(lex);
  for (const sourceId of ids) {
    const source = registry.get(sourceId)!;
    const previous = old.get(sourceId) ?? null;
    const current = now.get(sourceId) ?? null;
    if (previous && current) {
      if (Date.parse(current.retrievedAt) < Date.parse(previous.retrievedAt))
        throw Error("F5 drift: stale out-of-order retrieval for " + sourceId);
      if (Date.parse(current.retrievedAt) === Date.parse(previous.retrievedAt) &&
          fingerprint(previous) !== fingerprint(current))
        throw Error("F5 drift: conflicting captures at same retrieval clock for " + sourceId);
    }
    let disposition: F5DriftDisposition = "unchanged";
    const reasons: F5DriftReason[] = [];
    if (!current) disposition = "not_scanned";
    else if (!previous) disposition = "baseline_only";
    else if (current.health === "not_found" && previous.health !== "not_found") {
      disposition = "source_unavailable";
      reasons.push("source_not_found");
    } else if (current.health === "blocked" || current.health === "error" || current.health === "timeout") {
      if (fingerprint(previous) !== fingerprint(current)) {
        disposition = "retrieval_degraded";
        reasons.push("retrieval_failed");
      }
    } else if (current.health === "ok" && previous.health === "not_found") {
      disposition = "source_restored";
      reasons.push("source_restored");
    } else if (current.health === "ok" && previous.health !== "ok") {
      disposition = "retrieval_recovered";
      reasons.push("retrieval_recovered");
    } else if (current.health === "ok" && previous.health === "ok") {
      if (current.sha256 !== previous.sha256) reasons.push("content_digest_changed");
      if (current.publicationDate !== previous.publicationDate)
        reasons.push("publication_date_changed");
      if (reasons.length) disposition = "content_or_metadata_revised";
    }
    const needsReview = reasons.length > 0;
    cases.push({
      sourceId, publisher: source.publisher, officialUrl: source.url,
      disposition, reasons, previous, current,
      reviewKey: needsReview ? digest(JSON.stringify([
        "f5-5", sourceId, disposition,
        previous ? fingerprint(previous) : null,
        current ? fingerprint(current) : null,
      ])) : null,
      reviewStatus: needsReview ? "unreviewed" : "not_applicable",
      needsHumanSourceAccess: needsReview,
      positiveEventInferred: false, publicSeedChangeAuthorized: false,
    });
  }
  return {
    schemaVersion: "f5-5-offline-source-drift-1",
    mode: "private_prepublication_review_only",
    candidateCount: cases.filter(c => c.needsHumanSourceAccess).length,
    baselineCount: cases.filter(c => c.disposition === "baseline_only").length,
    unchangedCount: cases.filter(c => c.disposition === "unchanged").length,
    notScannedCount: cases.filter(c => c.disposition === "not_scanned").length,
    publicReleaseAuthorized: false,
    automatedSourceOrMilestonePromotionAuthorized: false,
    cases,
    limitations: [
      "Source checksums and publication metadata identify review-worthy discrepancies, not substantive amendments or policy events.",
      "HTTP 404/410, blocked requests, and unscanned registered sources are access observations, not evidence that a project failed or new financing occurred.",
      "Candidate entity links, source passage diffs, human review attestation, and publication approval are outside this offline contract.",
      "No monitor runs, source fetches, private reviewer state, public routes, or production corpus writes are performed.",
    ],
  };
}

export function formatF5DriftReceipt(receipt: F5DriftReceipt): string {
  const lines = [
    "F5-5 offline primary-source drift (PRIVATE REVIEW ONLY)",
    "Source cases: " + receipt.cases.length + "; human review: " + receipt.candidateCount +
      "; baseline: " + receipt.baselineCount + "; unscanned: " + receipt.notScannedCount,
  ];
  for (const item of receipt.cases) lines.push(
    item.sourceId + " [" + item.disposition + "] " +
    (item.reasons.length ? item.reasons.join(", ") : "no new review event") +
    (item.reviewKey ? " review=" + item.reviewKey : ""),
  );
  lines.push("SOURCE REVIEW: REQUIRED FOR ALL CANDIDATES; PUBLICATION: NOT AUTHORIZED");
  return lines.join("\n") + "\n";
}
