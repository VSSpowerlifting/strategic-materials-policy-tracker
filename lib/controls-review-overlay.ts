/**
 * Review overlays for the Controls snapshot.
 *
 * An overlay is a tracked, clearly labelled draft that describes how a
 * published snapshot would change if a reviewer accepted it: a source to add,
 * an instrument to add, a status entry to add, correct or remove. Applying an
 * overlay never touches `data/seed/`, the public snapshot or the site's
 * cutoff dates. It produces a separate snapshot with its own identity so the
 * proposed change can be built, diffed and tested before a person adjudicates
 * it.
 *
 * Human review is recorded in the overlay itself. While `reviewState` is
 * "pending_human_adjudication" the reviewer fields must be empty, and this
 * module refuses an overlay that claims a review dated before the overlay
 * was prepared.
 */
import { CONTROL_EVIDENCE_FIELDS, CONTROL_STATUSES, EVIDENCE_LEVELS } from "./types";
import {
  ControlsIntegrityError,
  sha256Hex,
  snapshotFromRows,
  stableJson,
  type ControlsSnapshot,
  type ControlsSnapshotRows,
  type JsonObject,
} from "./controls-release-archive";

export const OVERLAY_REVIEW_STATES = ["pending_human_adjudication", "adjudicated"] as const;
export type OverlayReviewState = (typeof OVERLAY_REVIEW_STATES)[number];

export type OverlayStatusEntry = {
  status: string;
  date: string | null;
  until: string | null;
  sourceId: string;
  note: string | null;
};

export type OverlayStatusEvidence = {
  supports: string[];
  evidence: string;
  locator: string | null;
  note: string | null;
};

export type OverlayStatusMatch = { date: string | null; sourceId: string };

export type OverlayOperation =
  | { op: "add_source"; row: JsonObject }
  | { op: "add_event"; row: JsonObject }
  | { op: "add_measure"; row: JsonObject }
  | { op: "supersede_event"; eventId: string; successorId: string; reason: string }
  | { op: "add_status"; measureId: string; entry: OverlayStatusEntry; evidence: OverlayStatusEvidence }
  | {
      op: "correct_status";
      measureId: string;
      match: OverlayStatusMatch;
      set: Partial<Pick<OverlayStatusEntry, "status" | "date" | "until" | "note">>;
      reason: string;
    }
  | { op: "remove_status"; measureId: string; match: OverlayStatusMatch; reason: string };

/**
 * The dates one instrument states about itself, read from the original.
 * `operativeThrough` is the last day the instrument states it applies.
 */
export type InstrumentDates = {
  eventId: string;
  sourceId: string;
  signedOn: string | null;
  publishedOn: string | null;
  operativeFrom: string | null;
  operativeThrough: string | null;
};

export type ReviewOverlay = {
  version: 1;
  kind: "controls_review_overlay";
  overlayId: string;
  title: string;
  reviewState: OverlayReviewState;
  preparedOn: string;
  preparedBy: string;
  /** The day the original notices and the issuer's listings were last read. */
  sourceCheckedOn: string;
  reviewer: string | null;
  reviewedAt: string | null;
  approvedBy: string | null;
  baseline: { datasetVersion: string; asOf: string };
  operations: OverlayOperation[];
  instrumentDates: InstrumentDates[];
  /** Free documentation for the reviewer; carried, never interpreted. */
  sourceToClaim?: unknown;
  outsideScope?: unknown;
};

/** Which rows of the resulting snapshot exist only because of the overlay. */
export type PendingRows = {
  overlayId: string;
  reviewState: OverlayReviewState;
  sourceIds: Set<string>;
  eventIds: Set<string>;
  measureIds: Set<string>;
  /** `measureId|date|sourceId`, with "undated" for a null date. */
  statusKeys: Set<string>;
  /** `measureId|sourceId` */
  evidenceKeys: Set<string>;
};

export type OverlayResult = {
  snapshot: ControlsSnapshot;
  /** Identity of the overlaid snapshot. It never takes the published `smpt-controls-v…` form. */
  reviewVersion: string;
  overlaySha256: string;
  pending: PendingRows;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export const statusKey = (measureId: string, date: string | null, sourceId: string): string =>
  `${measureId}|${date ?? "undated"}|${sourceId}`;

const fail = (message: string): never => {
  throw new ControlsIntegrityError(`review overlay: ${message}`);
};

const SOURCE_KEYS = [
  "id", "url", "title", "publisher", "language", "datePublished", "dateAccessed", "sourceType", "confidence",
];
const EVENT_KEYS = [
  "id", "date", "jurisdiction", "issuingBody", "documentNumber", "documentLabel", "titleOriginal",
  "titleOriginalLang", "titleEnSource", "policyStatus", "mechanism", "affectedMaterialIds",
  "verificationStatus", "supersededByEventId", "sourceIds",
];

const MEASURE_KEYS = [
  "id", "eventId", "clause", "issuer", "direction", "measureType",
  "materialIds", "materialAttribution", "controlledItemTypes", "controlledStages",
  "legalBasisAsStated", "legalBasisEventIds", "modifiesExternalInstruments", "modifiesMeasureIds",
  "productCodes", "productScopeAsStated", "targetEndUsersAsStated", "targetEndUsesAsStated",
  "targetEntities", "targetJurisdictions", "targetScopes", "untrackedMaterialsAsStated", "evidence", "notes",
];

function requireExactKeys(row: JsonObject, keys: string[], what: string): void {
  const actual = Object.keys(row);
  const missing = keys.filter((key) => !actual.includes(key));
  const extra = actual.filter((key) => !keys.includes(key));
  if (missing.length || extra.length) {
    fail(`${what} must carry exactly the snapshot fields (missing: ${missing.join(", ") || "none"}; unexpected: ${extra.join(", ") || "none"})`);
  }
}

/** Validate the overlay's own review record. Throws on the first problem. */
export function validateOverlayHeader(overlay: ReviewOverlay): void {
  if (overlay.version !== 1 || overlay.kind !== "controls_review_overlay") fail("unknown version or kind");
  if (!/^rc-[a-z0-9-]+$/.test(overlay.overlayId)) fail(`overlayId "${overlay.overlayId}" must look like rc-…`);
  if (!OVERLAY_REVIEW_STATES.includes(overlay.reviewState)) fail(`unknown reviewState "${overlay.reviewState}"`);
  for (const [name, value] of [["preparedOn", overlay.preparedOn], ["sourceCheckedOn", overlay.sourceCheckedOn]] as const) {
    if (!isIsoDate(value)) fail(`${name} must be a calendar date`);
  }
  if (overlay.sourceCheckedOn > overlay.preparedOn) fail("sourceCheckedOn cannot follow preparedOn");
  if (overlay.sourceCheckedOn < overlay.baseline.asOf) fail("sourceCheckedOn cannot precede the baseline cutoff");
  const review = [overlay.reviewer, overlay.reviewedAt, overlay.approvedBy];
  if (overlay.reviewState === "pending_human_adjudication") {
    if (review.some((value) => value !== null)) {
      fail("a pending overlay must leave reviewer, reviewedAt and approvedBy empty");
    }
  } else {
    if (review.some((value) => typeof value !== "string" || !value.trim())) {
      fail("an adjudicated overlay must name its reviewer, review date and approver");
    }
    if (!isIsoDate(overlay.reviewedAt)) fail("reviewedAt must be a calendar date");
    if ((overlay.reviewedAt as string) < overlay.preparedOn) {
      fail("reviewedAt precedes preparedOn; a review cannot be dated before the draft it reviews");
    }
  }
}

function validateEntry(entry: OverlayStatusEntry, where: string): void {
  if (!(CONTROL_STATUSES as readonly string[]).includes(entry.status)) fail(`${where}: unknown status "${entry.status}"`);
  if (entry.date !== null && !isIsoDate(entry.date)) fail(`${where}: date must be a calendar date or null`);
  if (entry.until !== null && !isIsoDate(entry.until)) fail(`${where}: until must be a calendar date or null`);
  if (entry.date !== null && entry.until !== null && entry.until < entry.date) fail(`${where}: until precedes date`);
}

type History = JsonObject[];

function insertInDateOrder(history: History, entry: JsonObject): void {
  const date = entry.date as string | null;
  if (date === null) {
    if (history.some((row) => row.date === null)) fail(`${String(entry.measureId)}: a second undated entry needs its own review`);
    history.unshift(entry);
    return;
  }
  let index = history.length;
  while (index > 0) {
    const previous = history[index - 1].date as string | null;
    if (previous === null || previous <= date) break;
    index -= 1;
  }
  history.splice(index, 0, entry);
}

function findEntry(history: History, measureId: string, match: OverlayStatusMatch): number {
  const hits = history
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.date === match.date && row.sourceId === match.sourceId);
  if (hits.length !== 1) {
    fail(`${measureId}: expected exactly one status entry dated ${match.date ?? "undated"} citing ${match.sourceId}, found ${hits.length}`);
  }
  return hits[0].index;
}

const byId = (a: JsonObject, b: JsonObject) => (String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0);

/**
 * Apply an overlay to a verified snapshot and return the overlaid snapshot,
 * its identity and the set of rows the overlay is responsible for.
 */
export function applyReviewOverlay(baseline: ControlsSnapshot, overlay: ReviewOverlay): OverlayResult {
  validateOverlayHeader(overlay);
  if (overlay.baseline.datasetVersion !== baseline.manifest.datasetVersion || overlay.baseline.asOf !== baseline.manifest.asOf) {
    fail(`written against ${overlay.baseline.datasetVersion}; cannot apply to ${baseline.manifest.datasetVersion}`);
  }

  // Deep copy through the serialised form so the baseline object is never mutated.
  const rows = JSON.parse(JSON.stringify(baseline.rows)) as ControlsSnapshotRows;
  const clauses = new Map(rows.clauses.map((row) => [String(row.id), row]));
  const sources = new Map(rows.sources.map((row) => [String(row.id), row]));
  const events = new Map(rows.events.map((row) => [String(row.id), row]));
  const histories = new Map<string, History>();
  for (const row of rows.statusHistory) {
    const measureId = String(row.measureId);
    if (!histories.has(measureId)) histories.set(measureId, []);
    (histories.get(measureId) as History).push(row);
  }
  for (const history of histories.values()) history.sort((a, b) => Number(a.sequence) - Number(b.sequence));

  const pending: PendingRows = {
    overlayId: overlay.overlayId,
    reviewState: overlay.reviewState,
    sourceIds: new Set(),
    eventIds: new Set(),
    measureIds: new Set(),
    statusKeys: new Set(),
    evidenceKeys: new Set(),
  };
  const historyOf = (measureId: string): History => {
    if (!clauses.has(measureId)) fail(`unknown measure "${measureId}"`);
    if (!histories.has(measureId)) histories.set(measureId, []);
    return histories.get(measureId) as History;
  };
  const ensureEvidence = (measureId: string, sourceId: string, evidence: OverlayStatusEvidence) => {
    if (!evidence.supports.includes("status")) fail(`${measureId}: status evidence must support "status"`);
    for (const field of evidence.supports) {
      if (!(CONTROL_EVIDENCE_FIELDS as readonly string[]).includes(field)) fail(`${measureId}: unknown evidence field "${field}"`);
    }
    if (!(EVIDENCE_LEVELS as readonly string[]).includes(evidence.evidence)) fail(`${measureId}: unknown evidence level "${evidence.evidence}"`);
    const clause = clauses.get(measureId) as JsonObject;
    const refs = clause.evidence as JsonObject[];
    const existing = refs.find((ref) => ref.sourceId === sourceId);
    if (existing) {
      if (!(existing.supports as string[]).includes("status")) fail(`${measureId}: ${sourceId} is already cited without "status"; correct that reference in a reviewed record change`);
      return;
    }
    refs.push({ sourceId, supports: evidence.supports, evidence: evidence.evidence, locator: evidence.locator, note: evidence.note });
    pending.evidenceKeys.add(`${measureId}|${sourceId}`);
  };

  for (const [index, operation] of overlay.operations.entries()) {
    const where = `operation ${index + 1} (${operation.op})`;
    switch (operation.op) {
      case "add_source": {
        requireExactKeys(operation.row, SOURCE_KEYS, where);
        const id = String(operation.row.id);
        if (sources.has(id)) fail(`${where}: source "${id}" already exists`);
        if (!/^https:\/\//.test(String(operation.row.url))) fail(`${where}: source url must be https`);
        if (operation.row.datePublished !== null && !isIsoDate(operation.row.datePublished)) fail(`${where}: datePublished must be a calendar date or null`);
        if (!isIsoDate(operation.row.dateAccessed) || operation.row.dateAccessed > overlay.sourceCheckedOn ||
            (operation.row.datePublished && operation.row.datePublished > operation.row.dateAccessed)) {
          fail(`${where}: source access must fall between publication and the stated source check`);
        }
        const row = structuredClone(operation.row);
        sources.set(id, row);
        rows.sources.push(row);
        pending.sourceIds.add(id);
        break;
      }
      case "add_event": {
        requireExactKeys(operation.row, EVENT_KEYS, where);
        const id = String(operation.row.id);
        if (events.has(id)) fail(`${where}: event "${id}" already exists`);
        if (!isIsoDate(operation.row.date)) fail(`${where}: event date must be a calendar date`);
        if (operation.row.verificationStatus === "verified") fail(`${where}: an overlay cannot mark an event verified; verification is a human record change`);
        for (const sourceId of operation.row.sourceIds as string[]) {
          if (!sources.has(sourceId)) fail(`${where}: event cites unknown source "${sourceId}"`);
        }
        const row = structuredClone(operation.row);
        events.set(id, row);
        rows.events.push(row);
        pending.eventIds.add(id);
        break;
      }
      case "add_measure": {
        // The overlay uses the archived clause representation. The positive
        // projection and evidence/reference checks are shared with published rows.
        const row = structuredClone(operation.row);
        requireExactKeys(row, MEASURE_KEYS, where);
        const id = String(row.id);
        if (clauses.has(id)) fail(`${where}: measure "${id}" already exists`);
        const event = events.get(String(row.eventId));
        if (!event || row.issuer !== event.jurisdiction) fail(`${where}: parent instrument or issuer disagrees`);
        if (!Array.isArray(row.evidence) || !row.evidence.length) fail(`${where}: a measure needs source evidence`);
        for (const ref of row.evidence as JsonObject[]) {
          requireExactKeys(ref, ["sourceId", "supports", "evidence", "locator", "note"], where);
          const sourceId = String(ref.sourceId);
          if (!sources.has(sourceId)) fail(`${where}: unknown evidence source "${sourceId}"`);
          pending.evidenceKeys.add(`${id}|${sourceId}`);
        }
        clauses.set(id, row);
        rows.clauses.push(row);
        pending.measureIds.add(id);
        break;
      }
      case "supersede_event": {
        const event = events.get(operation.eventId);
        if (!event) throw new ControlsIntegrityError(`${where}: unknown superseded instrument`);
        if (!events.has(operation.successorId) || operation.eventId === operation.successorId || !operation.reason.trim()) {
          fail(`${where}: supersession needs distinct known instruments and a reason`);
        }
        if (event.supersededByEventId) fail(`${where}: instrument already has a successor`);
        event.supersededByEventId = operation.successorId;
        pending.eventIds.add(operation.eventId);
        break;
      }
      case "add_status": {
        const history = historyOf(operation.measureId);
        requireExactKeys(operation.entry, ["status", "date", "until", "sourceId", "note"], where);
        requireExactKeys(operation.evidence, ["supports", "evidence", "locator", "note"], where);
        validateEntry(operation.entry, where);
        if (!sources.has(operation.entry.sourceId)) fail(`${where}: unknown source "${operation.entry.sourceId}"`);
        if (history.some((row) => row.date === operation.entry.date && row.sourceId === operation.entry.sourceId)) {
          fail(`${where}: ${operation.measureId} already has an entry dated ${operation.entry.date ?? "undated"} citing ${operation.entry.sourceId}`);
        }
        ensureEvidence(operation.measureId, operation.entry.sourceId, operation.evidence);
        insertInDateOrder(history, { measureId: operation.measureId, sequence: -1, ...operation.entry });
        pending.statusKeys.add(statusKey(operation.measureId, operation.entry.date, operation.entry.sourceId));
        break;
      }
      case "correct_status": {
        const history = historyOf(operation.measureId);
        if (!operation.reason.trim()) fail(`${where}: a correction needs a reason`);
        const fields = Object.keys(operation.set);
        if (!fields.length || fields.some((key) => !["status", "date", "until", "note"].includes(key))) {
          fail(`${where}: a correction can change only status, date, until or note`);
        }
        const position = findEntry(history, operation.measureId, operation.match);
        const [current] = history.splice(position, 1);
        const next = { ...current, ...operation.set } as JsonObject;
        validateEntry(next as unknown as OverlayStatusEntry, where);
        insertInDateOrder(history, next);
        pending.statusKeys.add(statusKey(operation.measureId, next.date as string | null, String(next.sourceId)));
        break;
      }
      case "remove_status": {
        const history = historyOf(operation.measureId);
        if (!operation.reason.trim()) fail(`${where}: a removal needs a reason`);
        history.splice(findEntry(history, operation.measureId, operation.match), 1);
        if (history.length === 0) fail(`${where}: ${operation.measureId} would be left with no status history`);
        break;
      }
      default:
        fail(`${where}: unknown operation`);
    }
  }

  for (const dates of overlay.instrumentDates) {
    if (!events.has(dates.eventId)) fail(`instrumentDates: unknown event "${dates.eventId}"`);
    if (!sources.has(dates.sourceId)) fail(`instrumentDates: unknown source "${dates.sourceId}"`);
    for (const key of ["signedOn", "publishedOn", "operativeFrom", "operativeThrough"] as const) {
      if (dates[key] !== null && !isIsoDate(dates[key])) fail(`instrumentDates ${dates.eventId}: ${key} must be a calendar date or null`);
    }
    const source = sources.get(dates.sourceId);
    if (dates.publishedOn !== null && dates.publishedOn !== source?.datePublished) fail(`instrumentDates ${dates.eventId}: publication date disagrees with cited source`);
    if (dates.signedOn && dates.publishedOn && dates.signedOn > dates.publishedOn) fail(`instrumentDates ${dates.eventId}: signature follows publication`);
    if (dates.operativeFrom && dates.operativeThrough && dates.operativeThrough < dates.operativeFrom) {
      fail(`instrumentDates ${dates.eventId}: operativeThrough precedes operativeFrom`);
    }
  }

  rows.clauses.sort(byId);
  rows.sources.sort(byId);
  rows.events.sort(byId);
  rows.statusHistory = rows.clauses.flatMap((clause) => {
    const history = histories.get(String(clause.id)) ?? [];
    return history.map((row, sequence) => {
      const { measureId, sequence: discarded, ...rest } = row;
      void discarded;
      return { measureId, sequence, ...rest };
    });
  });

  const snapshot = snapshotFromRows(rows, {
    schemaVersion: baseline.manifest.schemaVersion,
    asOf: baseline.manifest.asOf,
    sourceDatasetVersion: baseline.manifest.sourceDatasetVersion,
  });
  const overlaySha256 = sha256Hex(stableJson(overlay));
  const reviewVersion = `smpt-controls-review-${overlay.overlayId}-${sha256Hex(stableJson(snapshot.manifest.datasets))}`;
  return { snapshot, reviewVersion, overlaySha256, pending };
}
