/**
 * Reference calculations over an integration release.
 *
 * These are the calculations the profile asks a consumer to make for itself:
 * the standing of a clause on a date, what could be known at an earlier
 * vintage, which clauses the record codes for a material and destination, and
 * what a period introduced. `docs/engineering/controls-feed/consumer.py`
 * implements the same rules independently, and a test holds the two to the
 * same answers.
 *
 * Every date is an argument. Nothing here reads a clock, so a replay of an
 * old question cannot pick up knowledge that arrived later, and a date in the
 * future is never reported as observed.
 */
import type { FeedDatasets, FeedMeasure, FeedStatusEntry } from "./controls-feed";
import { isIsoDate } from "./controls-review-overlay";

/** Clause types the worked example counts as restrictions on an outbound flow. */
export const RESTRICTION_TYPES = ["export_licensing", "export_prohibition", "extraterritorial_licensing", "end_use_restriction"] as const;
export const OUTBOUND_DIRECTIONS = ["export", "re_export"] as const;

export const MATCH_CLASSES = [
  "material_and_destination_coded",
  "material_scope_requires_review",
  "destination_or_transaction_scope_requires_review",
] as const;
export type MatchClass = (typeof MATCH_CLASSES)[number];

export const STANDING_BASES = [
  "in_effect",
  "projected_from_record",
  "window_passed_no_successor",
  "scheduled_date_passed_no_successor",
  "undated_only",
  "before_first_entry",
  "no_knowable_entry",
] as const;
export type StandingBasis = (typeof STANDING_BASES)[number];

export type FeedView = { legalStatusCutoff: string; publishedReplayRequiresBaseline?: boolean; datasets: FeedDatasets };

export type ReplayOptions = {
  /**
   * What the answer may know. A calendar date keeps only entries whose cited
   * source was published on or before that day. "release" keeps everything
   * the release records.
   */
  vintage: string;
  /** Include rows a person has not yet adjudicated. Off unless asked for. */
  includePending?: boolean;
};

export type Standing = {
  measureId: string;
  onDate: string;
  vintage: string;
  /** A recorded status, a projection (see lastStatedStatus), unresolved or not_recorded. */
  state: string;
  basis: StandingBasis;
  entryId: string | null;
  sourceId: string | null;
  /** The status of the entry the answer rests on, also when its window has passed. */
  lastStatedStatus: string | null;
  /** Last day of the governing entry's stated window, when one has passed. */
  windowEndedOn: string | null;
  /** The governing entry is not part of the published record. */
  pendingReview: boolean;
  /** The date exceeds the published cutoff or the selected historical vintage. */
  projected: boolean;
  /** The date is after the release's legal-status cutoff. */
  beyondCutoff: boolean;
  /** Entries left out because their source carries no publication date. */
  knowledgeDateMissing: number;
};

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

function checkDates(onDate: string, vintage: string): void {
  if (!isIsoDate(onDate)) throw new RangeError(`"${onDate}" is not a calendar date`);
  if (vintage !== "release" && !isIsoDate(vintage)) throw new RangeError(`vintage must be a calendar date or "release"`);
}

function checkReviewMode(feed: FeedView, options: ReplayOptions): void {
  if (feed.publishedReplayRequiresBaseline && !options.includePending) {
    throw new RangeError("This candidate replaces published entries. Load the published baseline for published-only replay.");
  }
}

function entriesFor(feed: FeedView, measureId: string, options: ReplayOptions) {
  checkReviewMode(feed, options);
  const all = feed.datasets["status-entries.json"].filter(
    (entry) => entry.measureId === measureId && (options.includePending || entry.reviewState === "published"),
  );
  let knowledgeDateMissing = 0;
  let notYetKnowable = 0;
  const knowable: FeedStatusEntry[] = [];
  for (const entry of all) {
    if (options.vintage === "release") knowable.push(entry);
    else if (entry.knownFrom === null) knowledgeDateMissing += 1;
    else if (entry.knownFrom <= options.vintage) knowable.push(entry);
    else notYetKnowable += 1;
  }
  const dated = knowable
    .filter((entry) => entry.effectiveFrom !== null)
    .sort((a, b) => compare(a.effectiveFrom as string, b.effectiveFrom as string));
  const undated = knowable.filter((entry) => entry.effectiveFrom === null);
  return { dated, undated, knowledgeDateMissing, notYetKnowable };
}

/** The standing of one clause on one day, as far as the chosen vintage can know it. */
export function standing(feed: FeedView, measureId: string, onDate: string, options: ReplayOptions): Standing {
  checkDates(onDate, options.vintage);
  if (!feed.datasets["measures.json"].some((row) => row.measureId === measureId && (options.includePending || row.reviewState === "published"))) {
    throw new RangeError(`the release has no measure "${measureId}"`);
  }
  const { dated, undated, knowledgeDateMissing } = entriesFor(feed, measureId, options);
  const reference = options.vintage === "release" ? feed.legalStatusCutoff : options.vintage;
  const base = {
    measureId,
    onDate,
    vintage: options.vintage,
    projected: onDate > reference || onDate > feed.legalStatusCutoff,
    beyondCutoff: onDate > feed.legalStatusCutoff,
    knowledgeDateMissing,
  };
  let governing: FeedStatusEntry | null = null;
  for (const entry of dated) {
    if ((entry.effectiveFrom as string) > onDate) break;
    governing = entry;
  }
  if (!governing) {
    const fallback = undated[0] ?? null;
    return {
      ...base,
      state: fallback ? "unresolved" : "not_recorded",
      basis: fallback ? "undated_only" : dated.length ? "before_first_entry" : "no_knowable_entry",
      entryId: fallback?.entryId ?? null,
      sourceId: fallback?.sourceId ?? null,
      lastStatedStatus: fallback?.status ?? null,
      windowEndedOn: null,
      pendingReview: fallback ? fallback.reviewState !== "published" : false,
    };
  }
  const common = {
    ...base,
    entryId: governing.entryId,
    sourceId: governing.sourceId,
    lastStatedStatus: governing.status,
    pendingReview: governing.reviewState !== "published",
  };
  if (governing.status === "scheduled" && governing.takesEffectOn !== null && onDate >= governing.takesEffectOn) {
    return { ...common, state: "unresolved", basis: "scheduled_date_passed_no_successor", windowEndedOn: null };
  }
  if (governing.effectiveThrough !== null && onDate > governing.effectiveThrough) {
    return { ...common, state: "unresolved", basis: "window_passed_no_successor", windowEndedOn: governing.effectiveThrough };
  }
  if (base.projected) {
    return { ...common, state: "projected", basis: "projected_from_record", windowEndedOn: null };
  }
  return { ...common, state: governing.status, basis: "in_effect", windowEndedOn: null };
}

export type UpcomingEntry = {
  entryId: string;
  status: string;
  effectiveFrom: string;
  effectiveThrough: string | null;
  sourceId: string;
  knownFrom: string | null;
  pendingReview: boolean;
};

export type VintageRow = {
  measureId: string;
  instrumentId: string;
  coverage: string;
  /** Standing on the vintage day itself. */
  now: Standing;
  /** Entries already public at the vintage that start after it. */
  scheduled: UpcomingEntry[];
  /** Entries in the release whose source was published after the vintage. */
  notYetKnowable: number;
  unresolved: boolean;
};

/**
 * For every clause: what was in force on the vintage day, what was already
 * public and due to start later, and how many entries the release holds that
 * could not have been known yet.
 */
export function vintageReport(feed: FeedView, options: ReplayOptions & { pilotOnly?: boolean }): VintageRow[] {
  const day = options.vintage === "release" ? feed.legalStatusCutoff : options.vintage;
  checkDates(day, options.vintage);
  return feed.datasets["measures.json"]
    .filter((measure) => options.includePending || measure.reviewState === "published")
    .filter((measure) => !options.pilotOnly || measure.coverage === "pilot_universe")
    .map((measure) => {
      const now = standing(feed, measure.measureId, day, options);
      const { dated, notYetKnowable } = entriesFor(feed, measure.measureId, options);
      const scheduled = dated
        .filter((entry) => (entry.effectiveFrom as string) > day)
        .map((entry) => ({
          entryId: entry.entryId,
          status: entry.status,
          effectiveFrom: entry.effectiveFrom as string,
          effectiveThrough: entry.effectiveThrough,
          sourceId: entry.sourceId,
          knownFrom: entry.knownFrom,
          pendingReview: entry.reviewState !== "published",
        }));
      return {
        measureId: measure.measureId,
        instrumentId: measure.instrumentId,
        coverage: measure.coverage,
        now,
        scheduled,
        notYetKnowable,
        unresolved: now.state === "unresolved",
      };
    });
}

export const EXCLUSION_REASONS = [
  "other_issuer",
  "direction_not_outbound",
  "not_a_restriction_type",
  "instrument_not_verified",
  "destination_not_named",
  "material_not_tagged",
] as const;
export type ExclusionReason = (typeof EXCLUSION_REASONS)[number];

export type QualifyQuery = ReplayOptions & {
  material: string;
  /** ISO 3166-1 alpha-2 code of the destination. */
  destination: string;
  onDate: string;
  /** Restrict to one issuing jurisdiction. */
  issuer?: string;
};

export type QualifyingMeasure = {
  measureId: string;
  instrumentId: string;
  documentNumber: string | null;
  issuer: string;
  measureType: string;
  clauseLabel: string | null;
  reviewState: FeedMeasure["reviewState"];
  match: MatchClass;
  target: "worldwide" | "named" | "other";
  materialIds: string[];
  standing: Standing;
  productScope: {
    legalScopeCodes: string[];
    referenceCodes: string[];
    /** The source's product wording is withheld; read it at the cited sources before relying on the codes. */
    wordingWithheld: boolean;
    wordingSourceIds: string[];
  };
  limitations: FeedMeasure["limitations"];
  citations: { evidenceId: string; sourceId: string; url: string; locator: string | null; supports: string[] }[];
  coverage: string;
};

export type QualifyResult = {
  query: { material: string; destination: string; onDate: string; issuer: string | null; vintage: string; includePending: boolean };
  /** False when the release holds no clause from the requested issuer. That is a coverage gap, not a finding that nothing applies. */
  issuerCovered: boolean;
  /** False when no clause in the release tags the requested material. Also a coverage gap. */
  materialTracked: boolean;
  matches: QualifyingMeasure[];
  /** Subset of matches that are coded for the material and destination and in force on the day. */
  inForceCoded: string[];
  projectedInForceCoded: string[];
  excluded: { measureId: string; reason: ExclusionReason }[];
  notice: string;
};

export const QUALIFY_NOTICE =
  "Research classification of the public record. A match, a product code or an absence of rows is not a determination that a shipment is or is not controlled; the wording at the cited sources governs.";

function instrumentIndex(feed: FeedView) {
  return new Map(feed.datasets["instruments.json"].map((row) => [row.instrumentId, row]));
}

/** Is the clause a restriction on an outbound flow under a verified instrument? Returns the reason when it is not. */
export function restrictionExclusion(feed: FeedView, measure: FeedMeasure, includePending = false): ExclusionReason | null {
  if (!(OUTBOUND_DIRECTIONS as readonly string[]).includes(measure.direction)) return "direction_not_outbound";
  if (!(RESTRICTION_TYPES as readonly string[]).includes(measure.measureType)) return "not_a_restriction_type";
  const instrument = instrumentIndex(feed).get(measure.instrumentId);
  if (!instrument) return "instrument_not_verified";
  const candidateInstrument = includePending && instrument.reviewState !== "published" && instrument.verificationStatus === "provisional";
  if (instrument.verificationStatus !== "verified" && !candidateInstrument) return "instrument_not_verified";
  return null;
}

/** Clauses the record codes for a material and destination on a day, each with its standing and citations. */
export function qualifyingMeasures(feed: FeedView, query: QualifyQuery): QualifyResult {
  checkReviewMode(feed, query);
  checkDates(query.onDate, query.vintage);
  if (!/^[A-Z]{2}$/.test(query.destination)) throw new RangeError("destination must be a two-letter country code");
  const instruments = instrumentIndex(feed);
  const sources = new Map(feed.datasets["sources.json"].map((row) => [row.sourceId, row]));
  const measures = feed.datasets["measures.json"].filter((row) => query.includePending || row.reviewState === "published");
  const matches: QualifyingMeasure[] = [];
  const excluded: QualifyResult["excluded"] = [];
  for (const measure of measures) {
    if (query.issuer && measure.issuer !== query.issuer) {
      excluded.push({ measureId: measure.measureId, reason: "other_issuer" });
      continue;
    }
    const reason = restrictionExclusion(feed, measure, query.includePending);
    if (reason) {
      excluded.push({ measureId: measure.measureId, reason });
      continue;
    }
    const named = measure.targetScopes.includes("named_jurisdictions");
    const worldwide = measure.targetScopes.includes("all_jurisdictions");
    if (named && !worldwide && !measure.targetJurisdictions.includes(query.destination)) {
      excluded.push({ measureId: measure.measureId, reason: "destination_not_named" });
      continue;
    }
    let match: MatchClass;
    if (!measure.materialIds.includes(query.material)) {
      if (measure.materialIds.length > 0 && measure.materialAttribution === "tracked_only") {
        excluded.push({ measureId: measure.measureId, reason: "material_not_tagged" });
        continue;
      }
      match = "material_scope_requires_review";
    } else if ((worldwide || named) && measure.targetScopes.every((scope) => scope === "all_jurisdictions" || scope === "named_jurisdictions")) {
      match = "material_and_destination_coded";
    } else {
      match = "destination_or_transaction_scope_requires_review";
    }
    const wording = measure.limitations.find((limitation) => limitation.field === "product_scope_text");
    matches.push({
      measureId: measure.measureId,
      instrumentId: measure.instrumentId,
      documentNumber: instruments.get(measure.instrumentId)?.documentNumber ?? null,
      issuer: measure.issuer,
      measureType: measure.measureType,
      clauseLabel: measure.clauseLabel,
      reviewState: measure.reviewState,
      match,
      target: worldwide ? "worldwide" : named ? "named" : "other",
      materialIds: measure.materialIds,
      standing: standing(feed, measure.measureId, query.onDate, query),
      productScope: {
        legalScopeCodes: measure.productCodes.filter((code) => code.role === "legal_scope").map((code) => `${code.system}:${code.code}`),
        referenceCodes: measure.productCodes.filter((code) => code.role === "reference").map((code) => `${code.system}:${code.code}`),
        wordingWithheld: Boolean(wording),
        wordingSourceIds: wording?.sourceIds ?? [],
      },
      limitations: measure.limitations,
      citations: feed.datasets["evidence.json"]
        .filter((row) => row.measureId === measure.measureId && (query.includePending || row.reviewState === "published"))
        .filter((row) => {
          const published = sources.get(row.sourceId)?.datePublished;
          return query.vintage === "release" || (published != null && published <= query.vintage);
        })
        .map((row) => ({
          evidenceId: row.evidenceId,
          sourceId: row.sourceId,
          url: sources.get(row.sourceId)?.url ?? "",
          locator: row.locator,
          supports: row.supports,
        })),
      coverage: measure.coverage,
    });
  }
  return {
    query: {
      material: query.material,
      destination: query.destination,
      onDate: query.onDate,
      issuer: query.issuer ?? null,
      vintage: query.vintage,
      includePending: query.includePending === true,
    },
    issuerCovered: query.issuer ? measures.some((measure) => measure.issuer === query.issuer) : true,
    materialTracked: measures.some((measure) => measure.materialIds.includes(query.material)),
    matches,
    inForceCoded: matches
      .filter((row) => row.match === "material_and_destination_coded" && row.standing.state === "in_force")
      .map((row) => row.measureId),
    projectedInForceCoded: matches
      .filter((row) => row.match === "material_and_destination_coded" && row.standing.state === "projected" && row.standing.lastStatedStatus === "in_force")
      .map((row) => row.measureId),
    excluded,
    notice: QUALIFY_NOTICE,
  };
}

export type PeriodCounts = {
  start: string;
  end: string;
  vintage: string;
  /** Restriction clauses whose first dated in_force entry starts inside the window. */
  introducedClauses: string[];
  /** Distinct instruments those clauses belong to. */
  introducedInstruments: string[];
  /** Restriction clauses in force on the last day of the window. */
  inForceClausesAtEnd: string[];
  inForceInstrumentsAtEnd: string[];
  projectedInForceClausesAtEnd: string[];
  projectedInForceInstrumentsAtEnd: string[];
};

/** First-introduced and in-force counts for an inclusive window, by clause and by instrument. */
export function periodCounts(feed: FeedView, start: string, end: string, options: ReplayOptions): PeriodCounts {
  checkDates(start, options.vintage);
  checkDates(end, options.vintage);
  if (start > end) throw new RangeError("start must not follow end");
  const introduced: FeedMeasure[] = [];
  const inForce: FeedMeasure[] = [];
  const projectedInForce: FeedMeasure[] = [];
  for (const measure of feed.datasets["measures.json"]) {
    if (!options.includePending && measure.reviewState !== "published") continue;
    if (restrictionExclusion(feed, measure, options.includePending)) continue;
    const { dated } = entriesFor(feed, measure.measureId, options);
    const first = dated.find((entry) => entry.status === "in_force");
    if (first && (first.effectiveFrom as string) >= start && (first.effectiveFrom as string) <= end) introduced.push(measure);
    const atEnd = standing(feed, measure.measureId, end, options);
    if (atEnd.state === "in_force") inForce.push(measure);
    if (atEnd.state === "projected" && atEnd.lastStatedStatus === "in_force") projectedInForce.push(measure);
  }
  const ids = (rows: FeedMeasure[]) => rows.map((row) => row.measureId).sort();
  const parents = (rows: FeedMeasure[]) => [...new Set(rows.map((row) => row.instrumentId))].sort();
  return {
    start,
    end,
    vintage: options.vintage,
    introducedClauses: ids(introduced),
    introducedInstruments: parents(introduced),
    inForceClausesAtEnd: ids(inForce),
    inForceInstrumentsAtEnd: parents(inForce),
    projectedInForceClausesAtEnd: ids(projectedInForce),
    projectedInForceInstrumentsAtEnd: parents(projectedInForce),
  };
}
