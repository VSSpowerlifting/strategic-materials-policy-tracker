/**
 * M1.3 pure, offline model for the maintainer's private editorial inbox.
 * Nothing here is imported by site pages, collectors, exports or Actions.
 * A source listing is NEVER itself a verified policy measure.
 */
import { createHash } from "node:crypto";
import type { CandidateRecord } from "../lib/types";
import { PILOT_SOURCE_IDS } from "../lib/source-monitor";
import type { EditorialReviewQueue, EditorialQueueItem } from "../lib/monitor-editorial-queue";

export const REVIEW_STATUSES = [
  "unreviewed", "investigating", "already_covered", "out_of_scope", "needs_verification", "candidate_started",
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
export type ReviewAudit = {
  at: string;
  by: string;
  from: ReviewStatus;
  to: ReviewStatus;
  reason: string;
};
export type EditorialLedgerItem = {
  key: string;
  watchSourceId: string;
  observationId: string;
  firstObservedAt: string;
  lastObservedAt: string;
  officialUrl: string;
  titleAsListed: string;
  publicationDate: string | null;
  keywordHintOnly: boolean;
  exactCitationSourceIds: string[];
  status: ReviewStatus;
  candidateId: string | null;
  changes: { observedAt: string; change: "new" | "revised" }[];
  audit: ReviewAudit[];
};
export type PrivateEditorialLedger = {
  version: 1;
  mode: "private_manual_review";
  imports: { runId: string; sha256: string; observedAt: string }[];
  items: EditorialLedgerItem[];
};
export type ImportResult = {
  ledger: PrivateEditorialLedger;
  imported: number;
  reopened: number;
  alreadyKnown: number;
  skippedOld: number;
  duplicateRun: boolean;
};

const isObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);
const iso = (s: unknown): s is string =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(s) && !Number.isNaN(Date.parse(s));
const safeText = (s: unknown, max: number) => typeof s === "string" && s.trim().length > 0 && s.length <= max;
const keyOf = (sourceId: string, observationId: string): string => sourceId + ":" + observationId;
const validId = (s: unknown): s is string => typeof s === "string" && /^[a-f0-9]{64}$/.test(s);
const allowedStatus = (s: unknown): s is ReviewStatus =>
  typeof s === "string" && (REVIEW_STATUSES as readonly string[]).includes(s);
const pilotSource = (id: unknown): id is string =>
  typeof id === "string" && (PILOT_SOURCE_IDS as readonly string[]).includes(id);
const httpsUrl = (url: unknown): url is string => {
  if (typeof url !== "string" || url.length > 2048) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password;
  } catch { return false; }
};
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

export const emptyPrivateEditorialLedger = (): PrivateEditorialLedger => ({
  version: 1, mode: "private_manual_review", imports: [], items: [],
});

/** Read must fail on corruption, never silently reinitialize a private audit trail. */
export function parsePrivateEditorialLedger(raw: unknown): PrivateEditorialLedger {
  if (!isObject(raw) || raw.version !== 1 || raw.mode !== "private_manual_review" ||
      !Array.isArray(raw.imports) || !Array.isArray(raw.items)) {
    throw Error("Private editorial ledger missing, corrupt, or unsupported");
  }
  const imports = new Set<string>();
  for (const entry of raw.imports) {
    if (!isObject(entry) || typeof entry.runId !== "string" || !/^\d+$/.test(entry.runId) ||
        !validId(entry.sha256) || !iso(entry.observedAt) || imports.has(entry.runId)) {
      throw Error("Invalid or repeated ledger import record");
    }
    imports.add(entry.runId);
  }
  const keys = new Set<string>();
  for (const item of raw.items) {
    if (!isObject(item) || !pilotSource(item.watchSourceId) || !validId(item.observationId) ||
        item.key !== keyOf(item.watchSourceId, item.observationId) || keys.has(item.key) ||
        !iso(item.firstObservedAt) || !iso(item.lastObservedAt) ||
        item.firstObservedAt > item.lastObservedAt || !httpsUrl(item.officialUrl) ||
        !safeText(item.titleAsListed, 600) ||
        !(item.publicationDate === null || (typeof item.publicationDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.publicationDate))) ||
        typeof item.keywordHintOnly !== "boolean" || !Array.isArray(item.exactCitationSourceIds) ||
        !item.exactCitationSourceIds.every((x: unknown) => typeof x === "string" && x.length < 200) ||
        !allowedStatus(item.status) ||
        !(item.candidateId === null || (typeof item.candidateId === "string" && /^cand-[a-z0-9-]+$/.test(item.candidateId))) ||
        (item.status === "candidate_started" && !item.candidateId) ||
        !Array.isArray(item.changes) || !Array.isArray(item.audit)) {
      throw Error("Invalid private ledger observation " + String(item.key));
    }
    if (item.changes.some((x: unknown) => !isObject(x) || !iso(x.observedAt) ||
        !["new", "revised"].includes(String(x.change))) ||
        item.audit.some((x: unknown) => !isObject(x) || !iso(x.at) ||
          !safeText(x.by, 160) || !allowedStatus(x.from) || !allowedStatus(x.to) ||
          !safeText(x.reason, 2000))) {
      throw Error("Invalid editorial history in " + String(item.key));
    }
    keys.add(item.key);
  }
  return raw as PrivateEditorialLedger;
}

function validatedQueue(q: unknown): asserts q is EditorialReviewQueue {
  if (!isObject(q) || q.version !== 1 || q.mode !== "shadow_unverified_editorial_queue" ||
      !iso(q.observedAt) || !Array.isArray(q.items) ||
      !Number.isInteger(q.countNew) || !Number.isInteger(q.countRevised) ||
      !Array.isArray(q.sourcesDegraded)) throw Error("Not a valid M1.1 review queue artifact");
  const seen = new Set<string>();
  let countNew = 0, countRevised = 0;
  for (const r of q.items) {
    if (!isObject(r) || !pilotSource(r.watchSourceId) || !validId(r.observationId) ||
        !iso(r.observedAt) || r.observedAt !== q.observedAt ||
        !["new", "revised"].includes(String(r.change)) ||
        !httpsUrl(r.officialUrl) || !safeText(r.titleAsListed, 600) ||
        !(r.publicationDate === null || (typeof r.publicationDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.publicationDate))) ||
        typeof r.keywordHintOnly !== "boolean" || !Array.isArray(r.exactCitationSourceIds) ||
        !r.exactCitationSourceIds.every((v: unknown) => typeof v === "string" && v.length < 200) ||
        r.reviewStatus !== "unreviewed" || seen.has(keyOf(r.watchSourceId, r.observationId))) {
      throw Error("Malformed or duplicated observation in review queue");
    }
    seen.add(keyOf(r.watchSourceId, r.observationId));
    if (r.change === "new") countNew++; else countRevised++;
  }
  if (countNew !== q.countNew || countRevised !== q.countRevised) throw Error("Review queue count mismatch");
}

export function importReviewQueue(
  current: PrivateEditorialLedger,
  queueUnknown: unknown,
  runId: string,
  rawArtifactContents: string,
): ImportResult {
  const existing = parsePrivateEditorialLedger(structuredClone(current));
  validatedQueue(queueUnknown);
  const queue = queueUnknown;
  if (!/^\d+$/.test(runId)) throw Error("Import requires numeric GitHub Actions run ID");
  const sha256 = createHash("sha256").update(rawArtifactContents).digest("hex");
  const prior = existing.imports.find((row) => row.runId === runId);
  if (prior) {
    if (prior.sha256 !== sha256 || prior.observedAt !== queue.observedAt) {
      throw Error("Run ID was already imported with different contents; refusing to overwrite the audit trail");
    }
    return { ledger: existing, imported: 0, reopened: 0, alreadyKnown: 0, skippedOld: 0, duplicateRun: true };
  }
  let imported = 0, reopened = 0, alreadyKnown = 0, skippedOld = 0;
  for (const row of queue.items as EditorialQueueItem[]) {
    const key = keyOf(row.watchSourceId, row.observationId);
    const prev = existing.items.find((item) => item.key === key);
    if (!prev) {
      existing.items.push({
        key, watchSourceId: row.watchSourceId, observationId: row.observationId,
        firstObservedAt: row.observedAt, lastObservedAt: row.observedAt,
        officialUrl: row.officialUrl, titleAsListed: row.titleAsListed,
        publicationDate: row.publicationDate, keywordHintOnly: row.keywordHintOnly,
        exactCitationSourceIds: [...row.exactCitationSourceIds],
        status: "unreviewed", candidateId: null,
        changes: [{ observedAt: row.observedAt, change: row.change }], audit: [],
      });
      imported++;
      continue;
    }
    alreadyKnown++;
    if (row.observedAt <= prev.lastObservedAt) { skippedOld++; continue; }
    prev.lastObservedAt = row.observedAt;
    prev.changes.push({ observedAt: row.observedAt, change: row.change });
    prev.titleAsListed = row.titleAsListed;
    prev.officialUrl = row.officialUrl;
    prev.publicationDate = row.publicationDate;
    prev.keywordHintOnly = row.keywordHintOnly;
    prev.exactCitationSourceIds = [...row.exactCitationSourceIds];
    if (row.change === "revised" && prev.status !== "unreviewed") {
      prev.audit.push({
        at: row.observedAt, by: "system:source-revision", from: prev.status, to: "unreviewed",
        reason: "Listing changed after editorial review; previous decision retained in audit. Recheck official text and any linked candidate.",
      });
      prev.status = "unreviewed";
      reopened++;
    }
  }
  existing.imports.push({ runId, sha256, observedAt: queue.observedAt });
  existing.imports.sort((a, b) => compare(a.runId.padStart(24, "0"), b.runId.padStart(24, "0")));
  existing.items.sort((a, b) => compare(a.key, b.key));
  return { ledger: parsePrivateEditorialLedger(existing), imported, reopened, alreadyKnown, skippedOld, duplicateRun: false };
}

export function editorialDecision(
  existing: PrivateEditorialLedger, key: string, to: ReviewStatus, by: string, reason: string, at: string,
): PrivateEditorialLedger {
  const ledger = parsePrivateEditorialLedger(structuredClone(existing));
  const item = ledger.items.find((x) => x.key === key);
  if (!item) throw Error("Unknown observation: " + key);
  if (!allowedStatus(to) || to === "candidate_started") throw Error("Candidate handoff requires explicit start-candidate command");
  if (!safeText(by, 160) || !safeText(reason, 2000) || reason.trim().length < 8 || !iso(at))
    throw Error("Every editorial decision requires reviewer, reason (8-2000 characters), and UTC timestamp");
  if (at < item.firstObservedAt) throw Error("Decision cannot predate the first observation");
  if (item.status === to) throw Error("Already at this status; add a substantive transition instead");
  if (item.status === "candidate_started") throw Error("Candidate already initiated; review its private candidate record");
  item.audit.push({ at, by: by.trim(), from: item.status, to, reason: reason.trim() });
  item.status = to;
  return parsePrivateEditorialLedger(ledger);
}

export function beginCandidate(
  existing: PrivateEditorialLedger, key: string, candidateId: string, by: string, at: string,
  acknowledgedFullSourceOpened: boolean,
): { ledger: PrivateEditorialLedger; candidate: CandidateRecord } {
  const ledger = parsePrivateEditorialLedger(structuredClone(existing));
  const item = ledger.items.find((x) => x.key === key);
  if (!item) throw Error("Unknown observation: " + key);
  if (item.status !== "needs_verification" || item.candidateId)
    throw Error("Explicit needs_verification editorial decision required before starting a candidate");
  if (!acknowledgedFullSourceOpened) throw Error("Editor must affirm that the full original official source was opened");
  if (!/^cand-[a-z0-9-]{3,100}$/.test(candidateId) || ledger.items.some((x) => x.candidateId === candidateId))
    throw Error("Invalid or reused candidate ID");
  if (!safeText(by, 160) || !iso(at) || at < item.firstObservedAt)
    throw Error("Candidate handoff requires named reviewer and valid UTC time");
  const jurisdiction = item.watchSourceId === "watch-ca-nrcan-news" ? "canada" : "us";
  const candidate: CandidateRecord = {
    candidateId, status: "draft", createdBy: by.trim(), createdAt: at.slice(0, 10),
    proposedEvent: {
      jurisdiction, titleOriginal: item.titleAsListed, titleEn: item.titleAsListed,
      // intakeMode stays unset until primary-source verification supplies lifecycle evidence;
    },
    verification: { verdict: "pending" },
    classification: { confidence: "low" },
    reviewerNotes: "UNVERIFIED publication-listing handoff " + key + " (" + item.officialUrl +
      "). The listing title is not yet verified as the name of an operative policy instrument.",
    openQuestions: [
      "Read and preserve the full original official source and its publication date.",
      "Determine whether this is a policy action rather than an announcement or unrelated listing.",
      "Check for previously covered SMPT events and verify document number, operative scope and issuing body.",
    ],
    promotion: { promoted: false },
  };
  item.audit.push({ at, by: by.trim(), from: "needs_verification", to: "candidate_started",
    reason: "Editor opened original source and explicitly initiated private pending-verification candidate " + candidateId });
  item.status = "candidate_started";
  item.candidateId = candidateId;
  return { ledger: parsePrivateEditorialLedger(ledger), candidate };
}
