/**
 * The Controls integration profile.
 *
 * The public Controls snapshot is a research package: it carries notes,
 * source wording and titles for a reader. This module derives a second,
 * narrower representation for a system that loads the record on a schedule.
 * The profile is defined positively. Every output field is listed in
 * `FEED_FIELDS` with the rule its value must satisfy, and each output row is
 * built one named field at a time. Nothing is copied by spreading an upstream
 * row, so a field added upstream stays out until someone adds it here.
 *
 * Two checks back that up:
 *  - `auditFeedPayload` re-walks every leaf of the finished payload and
 *    rejects any path or value the profile does not allow;
 *  - `reportUpstreamCoverage` classifies every upstream path as mapped,
 *    withheld or unreviewed. The manifest reports only the count of unknown paths.
 *
 * Where wording is withheld from a clause, the row keeps a structured
 * limitation naming what was withheld and the sources that hold it, so that
 * dropping text never makes a control look wider than its source.
 *
 * Nothing here reads a clock. `curatedOn` is an argument.
 */
import {
  CONTROL_DIRECTIONS,
  CONTROL_EVIDENCE_FIELDS,
  CONTROL_MEASURE_TYPES,
  CONTROL_STATUSES,
  CONTROLLED_ITEM_TYPES,
  EN_SOURCES,
  EVIDENCE_LEVELS,
  JURISDICTIONS,
  MATERIAL_ATTRIBUTIONS,
  MECHANISMS,
  PRODUCT_CODE_ROLES,
  PRODUCT_CODE_SYSTEMS,
  SOURCE_CONFIDENCE,
  SOURCE_LANGS,
  SOURCE_TYPES,
  SUPPLY_CHAIN_STAGES,
  TARGET_SCOPES,
  TITLE_LANGS,
  VERIFICATION_STATUSES,
} from "./types";
import {
  ControlsIntegrityError,
  sha256Hex,
  stableJson,
  type ControlsSnapshot,
  type JsonObject,
} from "./controls-release-archive";
import { APPROVED_CLAUSE_LABELS, APPROVED_LOCATORS } from "./controls-feed-register";
import { isIsoDate, statusKey, type OverlayResult, type ReviewOverlay } from "./controls-review-overlay";

export const FEED_NAME = "stratellar-controls-integration";
/**
 * Profile version. Major changes when a field is removed, renamed or retyped,
 * or a value changes meaning; minor when a field or an allowed value is
 * added; patch for documentation only.
 */
export const FEED_PROFILE_VERSION = "1.0.0";

export const FEED_FILES = [
  "instruments.json",
  "instrument-dates.json",
  "measures.json",
  "status-entries.json",
  "evidence.json",
  "sources.json",
] as const;
export type FeedFile = (typeof FEED_FILES)[number];

export const ROW_REVIEW_STATES = ["published", "pending_human_adjudication", "adjudicated_unpublished"] as const;
export type RowReviewState = (typeof ROW_REVIEW_STATES)[number];

export const COVERAGE_TIERS = ["pilot_universe", "wider_public_record"] as const;
export const LIMITATION_FIELDS = [
  "product_scope_text",
  "named_entities",
  "end_user_text",
  "end_use_text",
  "untracked_materials",
  "external_instruments",
  "legal_basis_text",
  "clause_label",
  "unreviewed_scope",
] as const;
export const LIMITATION_EFFECTS = ["qualifies_scope", "additional_coverage", "context"] as const;
export const KNOWN_FROM_BASES = ["source_publication_date", "not_established"] as const;

export type FeedLimitation = {
  field: (typeof LIMITATION_FIELDS)[number];
  effect: (typeof LIMITATION_EFFECTS)[number];
  items: number;
  sourceIds: string[];
};
export type FeedMeasure = {
  measureId: string;
  instrumentId: string;
  issuer: string;
  measureType: string;
  direction: string;
  clauseLabel: string | null;
  targetScopes: string[];
  targetJurisdictions: string[];
  materialIds: string[];
  materialAttribution: string;
  productCodes: { system: string; code: string; role: string }[];
  controlledItemTypes: string[];
  controlledStages: string[];
  legalBasisInstrumentIds: string[];
  modifiesMeasureIds: string[];
  limitations: FeedLimitation[];
  coverage: (typeof COVERAGE_TIERS)[number];
  reviewState: RowReviewState;
};
export type FeedStatusEntry = {
  entryId: string;
  measureId: string;
  status: string;
  effectiveFrom: string | null;
  effectiveThrough: string | null;
  takesEffectOn: string | null;
  sourceId: string;
  knownFrom: string | null;
  knownFromBasis: (typeof KNOWN_FROM_BASES)[number];
  evidenceLevel: string;
  reviewState: RowReviewState;
};
export type FeedEvidence = {
  evidenceId: string;
  measureId: string;
  sourceId: string;
  supports: string[];
  evidenceLevel: string;
  locator: string | null;
  locatorWithheld: boolean;
  reviewState: RowReviewState;
};
export type FeedInstrument = {
  instrumentId: string;
  eventDate: string;
  issuer: string;
  issuingBody: string;
  documentNumber: string | null;
  titleOriginalLang: string;
  titleEnSource: string;
  mechanism: string[];
  affectedMaterialIds: string[];
  verificationStatus: string;
  supersededByInstrumentId: string | null;
  sourceIds: string[];
  coverage: (typeof COVERAGE_TIERS)[number];
  reviewState: RowReviewState;
};
export type FeedInstrumentDates = {
  instrumentId: string;
  sourceId: string;
  signedOn: string | null;
  publishedOn: string | null;
  operativeFrom: string | null;
  operativeThrough: string | null;
  reviewState: RowReviewState;
};
export type FeedSource = {
  sourceId: string;
  url: string;
  publisher: string;
  language: string;
  datePublished: string | null;
  dateAccessed: string;
  sourceType: string;
  confidence: string;
  reviewState: RowReviewState;
};
export type FeedDatasets = {
  "instruments.json": FeedInstrument[];
  "instrument-dates.json": FeedInstrumentDates[];
  "measures.json": FeedMeasure[];
  "status-entries.json": FeedStatusEntry[];
  "evidence.json": FeedEvidence[];
  "sources.json": FeedSource[];
};

/* ------------------------------------------------------------------ */
/* The profile                                                         */
/* ------------------------------------------------------------------ */

export type FieldRule =
  | { kind: "id" }
  | { kind: "enum"; values: readonly string[] }
  | { kind: "date" }
  | { kind: "boolean" }
  | { kind: "count" }
  | { kind: "url" }
  | { kind: "country" }
  | { kind: "code" }
  | { kind: "identifier"; max: number }
  | { kind: "register"; register: "clause_label" | "locator" };

export type FieldSpec = {
  path: string;
  rule: FieldRule;
  nullable?: boolean;
  /** Upstream snapshot paths the value is taken or derived from. */
  from: string[];
  description: string;
};

const id = (): FieldRule => ({ kind: "id" });
const oneOf = (values: readonly string[]): FieldRule => ({ kind: "enum", values });
const date = (): FieldRule => ({ kind: "date" });
const text = (max: number): FieldRule => ({ kind: "identifier", max });
const reviewField = (what: string): FieldSpec => ({
  path: "reviewState",
  rule: oneOf(ROW_REVIEW_STATES),
  from: [],
  description: `Whether this ${what} belongs to the published record or to a review overlay a person has not yet adjudicated.`,
});

export const FEED_KEYS: Record<FeedFile, string> = {
  "instruments.json": "instrumentId",
  "instrument-dates.json": "instrumentId",
  "measures.json": "measureId",
  "status-entries.json": "entryId",
  "evidence.json": "evidenceId",
  "sources.json": "sourceId",
};

export const FEED_FIELDS: Record<FeedFile, FieldSpec[]> = {
  "instruments.json": [
    { path: "instrumentId", rule: id(), from: ["events[].id"], description: "Stable identifier of one legal instrument or official act." },
    { path: "eventDate", rule: date(), from: ["events[].date"], description: "The date the record files the instrument under, as its sources give it. Instrument-specific signature, publication and operative dates are in instrument-dates.json where they have been read from the original." },
    { path: "issuer", rule: oneOf(JURISDICTIONS), from: ["events[].jurisdiction"], description: "Issuing jurisdiction." },
    { path: "issuingBody", rule: text(300), from: ["events[].issuingBody"], description: "Issuing authority as the record names it." },
    { path: "documentNumber", rule: text(120), nullable: true, from: ["events[].documentNumber"], description: "Document number. Numbers restart each year, so two instruments can share a number; join on instrumentId." },
    { path: "titleOriginalLang", rule: oneOf(TITLE_LANGS), from: ["events[].titleOriginalLang"], description: "Language of the original instrument title in the research record." },
    { path: "titleEnSource", rule: oneOf(EN_SOURCES), from: ["events[].titleEnSource"], description: "Provenance of the record's English title: official, self (non-official; withheld) or na (instrument is in English)." },
    { path: "mechanism[]", rule: oneOf(MECHANISMS), from: ["events[].mechanism[]"], description: "Policy mechanisms the record assigns to the instrument." },
    { path: "affectedMaterialIds[]", rule: id(), from: ["events[].affectedMaterialIds[]"], description: "Materials the record ties to the instrument as a whole. Clause-level materials are in measures.json." },
    { path: "verificationStatus", rule: oneOf(VERIFICATION_STATUSES), from: ["events[].verificationStatus"], description: "Whether the instrument record has been verified against its primary source." },
    { path: "supersededByInstrumentId", rule: id(), nullable: true, from: ["events[].supersededByEventId"], description: "Instrument that replaces this one, where the record states one." },
    { path: "sourceIds[]", rule: id(), from: ["events[].sourceIds[]"], description: "Sources cited for the instrument." },
    { path: "coverage", rule: oneOf(COVERAGE_TIERS), from: [], description: "pilot_universe for the declared, replay-tested first universe; wider_public_record for other instruments in the public record." },
    reviewField("instrument"),
  ],
  "instrument-dates.json": [
    { path: "instrumentId", rule: id(), from: [], description: "Instrument the dates belong to." },
    { path: "sourceId", rule: id(), from: [], description: "Original the dates were read from." },
    { path: "signedOn", rule: date(), nullable: true, from: [], description: "Date in the instrument's signature block." },
    { path: "publishedOn", rule: date(), nullable: true, from: [], description: "Date the issuer published the instrument." },
    { path: "operativeFrom", rule: date(), nullable: true, from: [], description: "First day the instrument states it applies." },
    { path: "operativeThrough", rule: date(), nullable: true, from: [], description: "Last day, inclusive, the instrument states it applies. Null where it states no end." },
    reviewField("set of instrument dates"),
  ],
  "measures.json": [
    { path: "measureId", rule: id(), from: ["clauses[].id"], description: "Stable identifier of one clause-level control." },
    { path: "instrumentId", rule: id(), from: ["clauses[].eventId"], description: "Instrument the clause belongs to." },
    { path: "issuer", rule: oneOf(JURISDICTIONS), from: ["clauses[].issuer"], description: "Issuing jurisdiction, repeated from the instrument." },
    { path: "measureType", rule: oneOf(CONTROL_MEASURE_TYPES), from: ["clauses[].measureType"], description: "Kind of control." },
    { path: "direction", rule: oneOf(CONTROL_DIRECTIONS), from: ["clauses[].direction"], description: "Flow the clause governs." },
    { path: "clauseLabel", rule: { kind: "register", register: "clause_label" }, nullable: true, from: ["clauses[].clause"], description: "Structural pointer to the clause inside its instrument. Released only when the label is in the approved register." },
    { path: "targetScopes[]", rule: oneOf(TARGET_SCOPES), from: ["clauses[].targetScopes[]"], description: "How the clause defines whom or what it targets. Several can apply together." },
    { path: "targetJurisdictions[]", rule: { kind: "country" }, from: ["clauses[].targetJurisdictions[]"], description: "ISO 3166-1 alpha-2 codes of named destinations or origins." },
    { path: "materialIds[]", rule: id(), from: ["clauses[].materialIds[]"], description: "Tracked materials the clause names. A clause can carry several, and can carry none." },
    { path: "materialAttribution", rule: oneOf(MATERIAL_ATTRIBUTIONS), from: ["clauses[].materialAttribution"], description: "Whether materialIds is the whole of what the source names (tracked_only), part of it (includes_untracked), or the source names no specific material (not_stated)." },
    { path: "productCodes[].system", rule: oneOf(PRODUCT_CODE_SYSTEMS), from: ["clauses[].productCodes[].system"], description: "Classification system of a listed code." },
    { path: "productCodes[].code", rule: { kind: "code" }, from: ["clauses[].productCodes[].code"], description: "The code as the source prints it." },
    { path: "productCodes[].role", rule: oneOf(PRODUCT_CODE_ROLES), from: ["clauses[].productCodes[].role"], description: "legal_scope where the code itself defines coverage; reference where it is printed for convenience and the item description governs." },
    { path: "controlledItemTypes[]", rule: oneOf(CONTROLLED_ITEM_TYPES), from: ["clauses[].controlledItemTypes[]"], description: "Goods, equipment or technology." },
    { path: "controlledStages[]", rule: oneOf(SUPPLY_CHAIN_STAGES), from: ["clauses[].controlledStages[]"], description: "Supply-chain stage the covered item belongs to." },
    { path: "legalBasisInstrumentIds[]", rule: id(), from: ["clauses[].legalBasisEventIds[]"], description: "Instruments the clause cites as its legal basis." },
    { path: "modifiesMeasureIds[]", rule: id(), from: ["clauses[].modifiesMeasureIds[]"], description: "Clauses this clause suspends, continues or otherwise modifies." },
    { path: "limitations[].field", rule: oneOf(LIMITATION_FIELDS), from: ["clauses[].productScopeAsStated", "clauses[].targetEntities[]", "clauses[].targetEndUsersAsStated[]", "clauses[].targetEndUsesAsStated[]", "clauses[].untrackedMaterialsAsStated[]", "clauses[].modifiesExternalInstruments[]", "clauses[].legalBasisAsStated", "clauses[].clause"], description: "Which source wording the profile withholds from this clause." },
    { path: "limitations[].effect", rule: oneOf(LIMITATION_EFFECTS), from: [], description: "qualifies_scope: the withheld wording narrows or conditions what the structured fields show. additional_coverage: it names coverage beyond the structured fields. context: it changes neither." },
    { path: "limitations[].items", rule: { kind: "count" }, from: [], description: "Number of withheld statements of that kind." },
    { path: "limitations[].sourceIds[]", rule: id(), from: ["clauses[].evidence[].sourceId", "clauses[].evidence[].supports[]"], description: "Sources where the withheld wording can be read." },
    { path: "coverage", rule: oneOf(COVERAGE_TIERS), from: [], description: "Coverage tier of the parent instrument." },
    reviewField("clause"),
  ],
  "status-entries.json": [
    { path: "entryId", rule: id(), from: ["statusHistory[].measureId", "statusHistory[].date", "statusHistory[].sourceId"], description: "Stable key derived from the clause, the entry's start date and the cited source. It does not depend on the entry's position, so an entry added earlier in a history leaves every other key unchanged." },
    { path: "measureId", rule: id(), from: ["statusHistory[].measureId"], description: "Clause the entry belongs to." },
    { path: "status", rule: oneOf(CONTROL_STATUSES), from: ["statusHistory[].status"], description: "Legal status the source states." },
    { path: "effectiveFrom", rule: date(), nullable: true, from: ["statusHistory[].date"], description: "First day the status applies. Null where the source states the status without a date; such an entry orders before the dated ones and never establishes a status on a given day." },
    { path: "effectiveThrough", rule: date(), nullable: true, from: ["statusHistory[].until", "statusHistory[].status"], description: "Last day, inclusive, the source states the status applies. The record says nothing about the following day unless another entry starts then." },
    { path: "takesEffectOn", rule: date(), nullable: true, from: ["statusHistory[].until", "statusHistory[].status"], description: "For a scheduled entry only: the day the clause is due to take effect." },
    { path: "sourceId", rule: id(), from: ["statusHistory[].sourceId"], description: "Source that states the status." },
    { path: "knownFrom", rule: date(), nullable: true, from: ["sources[].datePublished"], description: "Publication date of the cited source: the earliest day the record can show the entry was public. It can follow effectiveFrom where the record cites a later official document for an earlier act." },
    { path: "knownFromBasis", rule: oneOf(KNOWN_FROM_BASES), from: [], description: "source_publication_date, or not_established where the cited source carries no publication date." },
    { path: "evidenceLevel", rule: oneOf(EVIDENCE_LEVELS), from: ["clauses[].evidence[].evidence"], description: "Whether the cited source states the status explicitly." },
    reviewField("status entry"),
  ],
  "evidence.json": [
    { path: "evidenceId", rule: id(), from: [], description: "Stable key derived from the clause, the source, the supported fields and the released locator." },
    { path: "measureId", rule: id(), from: ["clauses[].id"], description: "Clause the citation supports." },
    { path: "sourceId", rule: id(), from: ["clauses[].evidence[].sourceId"], description: "Cited source." },
    { path: "supports[]", rule: oneOf(CONTROL_EVIDENCE_FIELDS), from: ["clauses[].evidence[].supports[]"], description: "Field groups of the clause the source supports." },
    { path: "evidenceLevel", rule: oneOf(EVIDENCE_LEVELS), from: ["clauses[].evidence[].evidence"], description: "explicit where the source states the supported facts; ambiguous where a reading was needed." },
    { path: "locator", rule: { kind: "register", register: "locator" }, nullable: true, from: ["clauses[].evidence[].locator"], description: "Structural pointer into the source. Released only when the locator is in the approved register." },
    { path: "locatorWithheld", rule: { kind: "boolean" }, from: ["clauses[].evidence[].locator"], description: "True where the record holds a locator the profile has not released." },
    reviewField("citation"),
  ],
  "sources.json": [
    { path: "sourceId", rule: id(), from: ["sources[].id"], description: "Stable identifier of one source document." },
    { path: "url", rule: { kind: "url" }, from: ["sources[].url"], description: "Where the source was read." },
    { path: "publisher", rule: text(120), from: ["sources[].publisher"], description: "Publisher as the record names it." },
    { path: "language", rule: oneOf(SOURCE_LANGS), from: ["sources[].language"], description: "Language of the source." },
    { path: "datePublished", rule: date(), nullable: true, from: ["sources[].datePublished"], description: "Publication date of the source, where it carries one." },
    { path: "dateAccessed", rule: date(), from: ["sources[].dateAccessed"], description: "Day the source was last read for the record." },
    { path: "sourceType", rule: oneOf(SOURCE_TYPES), from: ["sources[].sourceType"], description: "Kind of source." },
    { path: "confidence", rule: oneOf(SOURCE_CONFIDENCE), from: ["sources[].confidence"], description: "primary for the instrument itself or its issuer; other values mark translations, state media and secondary sources." },
    reviewField("source"),
  ],
};

export type WithheldPath = { path: string; disposition: "withheld" | "marker_only"; reason: string };

/** Upstream paths the profile knows about and deliberately does not release as values. */
export const WITHHELD_UPSTREAM: WithheldPath[] = [
  { path: "clauses[].notes", disposition: "withheld", reason: "Free-text research note." },
  { path: "clauses[].evidence[].note", disposition: "withheld", reason: "Free-text research note." },
  { path: "statusHistory[].note", disposition: "withheld", reason: "Free text, usually the source's own wording." },
  { path: "statusHistory[].sequence", disposition: "withheld", reason: "Positional index. Replaced by entryId, which does not move when an earlier entry is added." },
  { path: "events[].policyStatus", disposition: "withheld", reason: "Instrument-level summary as of the cutoff. Recompute standing from status-entries.json for the date in question." },
  { path: "events[].documentLabel", disposition: "withheld", reason: "Editorial display labels can include a paraphrase or a non-official translation. Instrument IDs, numbers and source links identify the act." },
  { path: "events[].titleOriginal", disposition: "withheld", reason: "Some records use an editorial description in place of an issuing-document title. Read the linked document for its title." },
  { path: "sources[].title", disposition: "withheld", reason: "Third-party headline or document title. The URL, publisher and dates identify the source." },
  { path: "clauses[].productScopeAsStated", disposition: "marker_only", reason: "Source wording. A product_scope_text limitation marks its presence." },
  { path: "clauses[].targetEntities[]", disposition: "marker_only", reason: "Free-text names. A named_entities limitation marks their presence." },
  { path: "clauses[].targetEndUsersAsStated[]", disposition: "marker_only", reason: "Source wording. An end_user_text limitation marks its presence." },
  { path: "clauses[].targetEndUsesAsStated[]", disposition: "marker_only", reason: "Source wording. An end_use_text limitation marks its presence." },
  { path: "clauses[].untrackedMaterialsAsStated[]", disposition: "marker_only", reason: "Source wording. An untracked_materials limitation marks its presence." },
  { path: "clauses[].modifiesExternalInstruments[]", disposition: "marker_only", reason: "Source wording. An external_instruments limitation marks its presence." },
  { path: "clauses[].legalBasisAsStated", disposition: "marker_only", reason: "Source wording. A legal_basis_text limitation marks its presence." },
];

export class FeedProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeedProfileError";
  }
}

const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9.-]{0,31}$/;
const CONTROL_CHARS = new RegExp("[\\u0000-\\u001f\\u007f" + String.fromCharCode(0x2028, 0x2029) + "]");
const clauseLabels = new Set(APPROVED_CLAUSE_LABELS);
const locators = new Set(APPROVED_LOCATORS);

/** Does `value` satisfy `rule`? Null handling is the caller's. */
export function satisfiesRule(rule: FieldRule, value: unknown): boolean {
  switch (rule.kind) {
    case "id":
      return typeof value === "string" && value.length <= 120 && ID_PATTERN.test(value);
    case "enum":
      return typeof value === "string" && rule.values.includes(value);
    case "date":
      return isIsoDate(value);
    case "boolean":
      return typeof value === "boolean";
    case "count":
      return typeof value === "number" && Number.isInteger(value) && value >= 0;
    case "url":
      return typeof value === "string" && value.length <= 400 && /^https?:\/\/[^\s]+$/.test(value) && !CONTROL_CHARS.test(value);
    case "country":
      return typeof value === "string" && /^[A-Z]{2}$/.test(value);
    case "code":
      return typeof value === "string" && CODE_PATTERN.test(value);
    case "identifier":
      return typeof value === "string" && value.trim() === value && value.length > 0 && value.length <= rule.max && !CONTROL_CHARS.test(value);
    case "register":
      return typeof value === "string" && (rule.register === "clause_label" ? clauseLabels : locators).has(value);
  }
}

/** Every leaf of `value` as a `[path, leaf]` pair. Arrays contribute `[]`; an empty array contributes its own path. */
export function leafPaths(value: unknown, prefix = ""): [string, unknown][] {
  if (Array.isArray(value)) {
    if (value.length === 0) return [[`${prefix}[]`, undefined]];
    return value.flatMap((item) => leafPaths(item, `${prefix}[]`));
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as JsonObject);
    if (!entries.length) return [[prefix, value]];
    return entries.flatMap(([key, item]) => {
      const segment = /[.\[\]]/.test(key) ? JSON.stringify(key) : key;
      return leafPaths(item, prefix ? `${prefix}.${segment}` : segment);
    });
  }
  return [[prefix, value]];
}

/**
 * Check a finished payload against the profile. Throws on any path the
 * profile does not list, any missing field and any value that breaks its rule.
 */
export function auditFeedPayload(datasets: Record<string, unknown>): void {
  const names = Object.keys(datasets);
  const unexpected = names.filter((name) => !(FEED_FILES as readonly string[]).includes(name));
  if (unexpected.length) throw new FeedProfileError(`payload carries datasets outside the profile: ${unexpected.join(", ")}`);
  for (const file of FEED_FILES) {
    const rows = datasets[file];
    if (!Array.isArray(rows)) throw new FeedProfileError(`${file} is missing or is not an array`);
    const specs = new Map(FEED_FIELDS[file].map((spec) => [spec.path, spec]));
    const keys = new Set<string>();
    for (const [index, row] of rows.entries()) {
      const where = `${file} row ${index}`;
      if (row === null || typeof row !== "object" || Array.isArray(row)) throw new FeedProfileError(`${where} is not an object`);
      validateProfileObject(row, "", specs, where);
      const key = String((row as JsonObject)[FEED_KEYS[file]]);
      if (keys.has(key)) throw new FeedProfileError(`${file}: duplicate key ${key}`);
      keys.add(key);
    }
  }
}

/** Validate each element, including empty objects and required children of object arrays. */
function validateProfileObject(value: unknown, prefix: string, specs: Map<string, FieldSpec>, where: string): void {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new FeedProfileError(`${where}: expected an object at ${prefix}`);
  const row = value as JsonObject;
  const children = new Set<string>();
  for (const path of specs.keys()) {
    if (path.startsWith(prefix)) children.add(path.slice(prefix.length).split(".")[0]);
  }
  if (Object.keys(row).length !== children.size) throw new FeedProfileError(`${where}: unexpected or missing fields at ${prefix || "row"}`);
  for (const child of children) {
    const isArray = child.endsWith("[]");
    const name = isArray ? child.slice(0, -2) : child;
    if (!Object.hasOwn(row, name)) throw new FeedProfileError(`${where}: missing ${prefix}${name}`);
    const path = prefix + child;
    const spec = specs.get(path);
    const field = row[name];
    if (isArray && !Array.isArray(field)) throw new FeedProfileError(`${where}: ${path} must be an array`);
    for (const item of isArray ? field as unknown[] : [field]) {
      if (!spec) validateProfileObject(item, path + ".", specs, where);
      else if (!(item === null && spec.nullable) && !satisfiesRule(spec.rule, item)) {
        throw new FeedProfileError(`${where}: invalid value for ${path}`);
      }
    }
  }
}

export type UpstreamCoverage = { mapped: string[]; withheld: string[]; unreviewed: string[] };

const mappedUpstream = new Set(FEED_FILES.flatMap((file) => FEED_FIELDS[file].flatMap((spec) => spec.from)));
const withheldUpstream = new Set(WITHHELD_UPSTREAM.map((entry) => entry.path));

function upstreamDisposition(path: string): keyof UpstreamCoverage {
  const covers = (known: Set<string>) => known.has(path) || [...known].some((entry) => entry.startsWith(`${path}.`));
  if (covers(withheldUpstream)) return "withheld";
  return covers(mappedUpstream) ? "mapped" : "unreviewed";
}

/** Classify every path present in the upstream snapshot rows. */
export function reportUpstreamCoverage(rows: ControlsSnapshot["rows"]): UpstreamCoverage {
  const present = new Set<string>();
  for (const [name, list] of Object.entries(rows)) {
    for (const row of list) for (const [path] of leafPaths(row, `${name}[]`)) present.add(path);
  }
  const result: UpstreamCoverage = { mapped: [], withheld: [], unreviewed: [] };
  for (const path of [...present].sort()) result[upstreamDisposition(path)].push(path);
  return result;
}

function unknownPaths(row: JsonObject, kind: keyof ControlsSnapshot["rows"]): string[] {
  return leafPaths(row, `${kind}[]`).map(([path]) => path).filter((path) => upstreamDisposition(path) === "unreviewed");
}

/* ------------------------------------------------------------------ */
/* Building                                                            */
/* ------------------------------------------------------------------ */

/**
 * The declared first universe: the China-to-US paragraph-specific controls,
 * their worldwide graphite context, and the separate package of October 2025
 * instruments that the November 2025 and November 2026 notices suspend.
 * Instruments those notices modify join the universe through
 * `modifiesMeasureIds`; identifiers absent from a given release are ignored.
 */
export const PILOT_ANCHOR_INSTRUMENTS = [
  "evt-cn-us-ban-2024",
  "evt-cn-mofcom-72-2025",
  "evt-cn-mofcom-59-2026",
  "evt-cn-graphite-2023",
  "evt-cn-dual-use-list-2024",
  "china-rare-earth-suspension-2025-11",
  "china-rare-earth-suspension-extension-2026-11",
] as const;

const str = (value: unknown): string => {
  if (typeof value !== "string") throw new FeedProfileError(`expected a string, found ${typeof value}`);
  return value;
};
const strOrNull = (value: unknown): string | null => (value === null || value === undefined ? null : str(value));
const list = (value: unknown): string[] => {
  if (!Array.isArray(value)) throw new FeedProfileError("expected an array");
  return value.map(str);
};
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

type EvidenceRef = { sourceId: string; supports: string[]; evidence: string; locator: string | null };
function evidenceRefs(clause: JsonObject): EvidenceRef[] {
  if (!Array.isArray(clause.evidence)) throw new FeedProfileError(`${String(clause.id)} has no evidence array`);
  return (clause.evidence as JsonObject[]).map((ref) => ({
    sourceId: str(ref.sourceId),
    supports: list(ref.supports),
    evidence: str(ref.evidence),
    locator: strOrNull(ref.locator),
  }));
}

const LIMITATION_RULES: {
  field: FeedLimitation["field"];
  effect: FeedLimitation["effect"];
  upstream: string;
  supports: string;
}[] = [
  { field: "product_scope_text", effect: "qualifies_scope", upstream: "productScopeAsStated", supports: "product_scope" },
  { field: "named_entities", effect: "qualifies_scope", upstream: "targetEntities", supports: "targets" },
  { field: "end_user_text", effect: "qualifies_scope", upstream: "targetEndUsersAsStated", supports: "targets" },
  { field: "end_use_text", effect: "qualifies_scope", upstream: "targetEndUsesAsStated", supports: "targets" },
  { field: "untracked_materials", effect: "additional_coverage", upstream: "untrackedMaterialsAsStated", supports: "materials" },
  { field: "external_instruments", effect: "context", upstream: "modifiesExternalInstruments", supports: "modified_measures" },
  { field: "legal_basis_text", effect: "context", upstream: "legalBasisAsStated", supports: "legal_basis" },
];

function limitationsFor(clause: JsonObject, refs: EvidenceRef[], labelWithheld: boolean, unknownCount: number): FeedLimitation[] {
  const allSources = [...new Set(refs.map((ref) => ref.sourceId))].sort();
  const sourcesFor = (field: string) => {
    const specific = refs.filter((ref) => ref.supports.includes(field)).map((ref) => ref.sourceId);
    // Fall back to the clause's source list when evidence is not field-specific.
    return specific.length ? [...new Set(specific)].sort() : allSources;
  };
  const result: FeedLimitation[] = [];
  for (const rule of LIMITATION_RULES) {
    const value = clause[rule.upstream];
    const items = Array.isArray(value) ? value.length : value === null || value === undefined || value === "" ? 0 : 1;
    if (items > 0) result.push({ field: rule.field, effect: rule.effect, items, sourceIds: sourcesFor(rule.supports) });
  }
  if (unknownCount) result.push({ field: "unreviewed_scope", effect: "qualifies_scope", items: unknownCount, sourceIds: allSources });
  if (labelWithheld) result.push({ field: "clause_label", effect: "context", items: 1, sourceIds: sourcesFor("clause") });
  return result;
}

export type FeedReviewInput = { overlay: ReviewOverlay; result: OverlayResult };

export type FeedManifest = {
  feed: typeof FEED_NAME;
  profileVersion: string;
  releaseId: string;
  reviewState: "published_record" | "review_candidate_pending_human_adjudication" | "review_candidate_adjudicated_unpublished";
  curatedOn: string;
  legalStatusCutoff: string;
  source: {
    controlsSnapshot: string;
    controlsSchemaVersion: number;
    reviewOverlay: null | { overlayId: string; sha256: string; reviewVersion: string };
  };
  pendingReview: null | {
    overlayId: string;
    preparedOn: string;
    sourceCheckedOn: string;
    reviewedAt: string | null;
    publishedReplayRequiresBaseline: boolean;
    rows: Record<string, string[]>;
  };
  scope: {
    statement: string;
    pilot: {
      instrumentIds: string[];
      measures: number;
      issuers: string[];
      materialIds: string[];
      namedDestinations: string[];
      worldwideMeasures: number;
      earliestInstrumentDate: string | null;
    };
    widerPublicRecord: { instruments: number; measures: number };
  };
  profile: { file: "profile.json"; sha256: string };
  datasets: Record<FeedFile, { rows: number; sha256: string; key: string }>;
  excluded: { withheldUpstreamPaths: string[]; unreviewedUpstreamPathCount: number };
  changesFrom: null | { releaseId: string; file: "changes.json"; sha256: string; summary: Record<string, { added: number; removed: number; changed: number }> };
};

export type FeedBundle = {
  manifest: FeedManifest;
  datasets: FeedDatasets;
  /** File name to exact content, including manifest.json and profile.json. */
  files: Record<string, string>;
  coverage: UpstreamCoverage;
};

export type BuildFeedInput = {
  snapshot: ControlsSnapshot;
  review?: FeedReviewInput;
  /** The day the release is assembled. Passed in; never read from a clock. */
  curatedOn: string;
  previous?: { manifest: FeedManifest; datasets: FeedDatasets };
};

function reviewStateOf(review: FeedReviewInput | undefined, pending: boolean): RowReviewState {
  if (!review || !pending) return "published";
  return review.overlay.reviewState === "adjudicated" ? "adjudicated_unpublished" : "pending_human_adjudication";
}

/** Derive the six integration datasets from a snapshot. Pure; builds each row field by field. */
export function buildFeedDatasets(snapshot: ControlsSnapshot, review?: FeedReviewInput): FeedDatasets {
  const { clauses, events, statusHistory, sources } = snapshot.rows;
  const pending = review?.result.pending;
  const sourceById = new Map(sources.map((row) => [str(row.id), row]));
  const clauseById = new Map(clauses.map((row) => [str(row.id), row]));

  const eventUnknown = new Map(events.map((row) => [str(row.id), unknownPaths(row, "events")]));
  const statusUnknown = new Map<string, string[]>();
  for (const row of statusHistory) {
    const id = str(row.measureId);
    statusUnknown.set(id, [...(statusUnknown.get(id) ?? []), ...unknownPaths(row, "statusHistory")]);
  }
  const pilotInstruments = new Set<string>(PILOT_ANCHOR_INSTRUMENTS);
  for (const clause of clauses) {
    if (!(PILOT_ANCHOR_INSTRUMENTS as readonly string[]).includes(str(clause.eventId))) continue;
    for (const modifiedId of list(clause.modifiesMeasureIds)) {
      const modified = clauseById.get(modifiedId);
      if (!modified) throw new FeedProfileError(`${str(clause.id)} modifies unknown clause ${modifiedId}`);
      pilotInstruments.add(str(modified.eventId));
    }
  }
  const tier = (instrumentId: string) => (pilotInstruments.has(instrumentId) ? "pilot_universe" : "wider_public_record");

  const feedSources: FeedSource[] = sources.map((row) => ({
    sourceId: str(row.id),
    url: str(row.url),
    publisher: str(row.publisher),
    language: str(row.language),
    datePublished: strOrNull(row.datePublished),
    dateAccessed: str(row.dateAccessed),
    sourceType: str(row.sourceType),
    confidence: str(row.confidence),
    reviewState: reviewStateOf(review, pending?.sourceIds.has(str(row.id)) ?? false),
  }));

  const instruments: FeedInstrument[] = events.map((row) => {
    const titleEnSource = str(row.titleEnSource);
    return {
      instrumentId: str(row.id),
      eventDate: str(row.date),
      issuer: str(row.jurisdiction),
      issuingBody: str(row.issuingBody),
      documentNumber: strOrNull(row.documentNumber),
      titleOriginalLang: str(row.titleOriginalLang),
      titleEnSource,
      mechanism: list(row.mechanism),
      affectedMaterialIds: list(row.affectedMaterialIds),
      verificationStatus: str(row.verificationStatus),
      supersededByInstrumentId: strOrNull(row.supersededByEventId),
      sourceIds: list(row.sourceIds),
      coverage: tier(str(row.id)),
      reviewState: reviewStateOf(review, pending?.eventIds.has(str(row.id)) ?? false),
    };
  });

  const instrumentDates: FeedInstrumentDates[] = (review?.overlay.instrumentDates ?? []).map((row) => ({
    instrumentId: row.eventId,
    sourceId: row.sourceId,
    signedOn: row.signedOn,
    publishedOn: row.publishedOn,
    operativeFrom: row.operativeFrom,
    operativeThrough: row.operativeThrough,
    reviewState: reviewStateOf(review, true),
  }));

  const measures: FeedMeasure[] = [];
  const evidence: FeedEvidence[] = [];
  const statusEvidence = new Map<string, string>();
  for (const clause of clauses) {
    const measureId = str(clause.id);
    const refs = evidenceRefs(clause);
    const rawLabel = strOrNull(clause.clause);
    const labelReleased = rawLabel !== null && clauseLabels.has(rawLabel);
    const unknown = new Set([
      ...unknownPaths(clause, "clauses"),
      ...(eventUnknown.get(str(clause.eventId)) ?? []),
      ...(statusUnknown.get(measureId) ?? []),
    ]);
    measures.push({
      measureId,
      instrumentId: str(clause.eventId),
      issuer: str(clause.issuer),
      measureType: str(clause.measureType),
      direction: str(clause.direction),
      clauseLabel: labelReleased ? rawLabel : null,
      targetScopes: list(clause.targetScopes),
      targetJurisdictions: list(clause.targetJurisdictions),
      materialIds: list(clause.materialIds),
      materialAttribution: str(clause.materialAttribution),
      productCodes: (clause.productCodes as JsonObject[]).map((code) => ({
        system: str(code.system),
        code: str(code.code),
        role: str(code.role),
      })),
      controlledItemTypes: list(clause.controlledItemTypes),
      controlledStages: list(clause.controlledStages),
      legalBasisInstrumentIds: list(clause.legalBasisEventIds),
      modifiesMeasureIds: list(clause.modifiesMeasureIds),
      limitations: limitationsFor(clause, refs, rawLabel !== null && !labelReleased, unknown.size),
      coverage: tier(str(clause.eventId)),
      reviewState: reviewStateOf(review, pending?.measureIds.has(measureId) ?? false),
    });
    for (const ref of refs) {
      const released = ref.locator !== null && locators.has(ref.locator);
      const supports = [...ref.supports];
      const locator = released ? ref.locator : null;
      evidence.push({
        evidenceId: `cev-${sha256Hex([measureId, ref.sourceId, [...supports].sort().join(","), locator ?? ""].join("|")).slice(0, 20)}`,
        measureId,
        sourceId: ref.sourceId,
        supports,
        evidenceLevel: ref.evidence,
        locator,
        locatorWithheld: ref.locator !== null && !released,
        reviewState: reviewStateOf(review, pending?.evidenceKeys.has(`${measureId}|${ref.sourceId}`) ?? false),
      });
      if (ref.supports.includes("status")) {
        const key = `${measureId}|${ref.sourceId}`;
        // Where two citations of one source support the status, the weaker level stands.
        if (statusEvidence.get(key) !== "ambiguous") statusEvidence.set(key, ref.evidence);
      }
    }
  }

  const lastDated = new Map<string, string>();
  const sawDated = new Set<string>();
  const statusEntries: FeedStatusEntry[] = statusHistory.map((row) => {
    const measureId = str(row.measureId);
    const sourceId = str(row.sourceId);
    const effectiveFrom = strOrNull(row.date);
    const until = strOrNull(row.until);
    const status = str(row.status);
    if (!clauseById.has(measureId)) throw new FeedProfileError(`status entry for unknown clause ${measureId}`);
    if (effectiveFrom === null) {
      if (sawDated.has(measureId)) throw new FeedProfileError(`${measureId}: an undated status entry follows a dated one; the profile cannot order it`);
    } else {
      const previous = lastDated.get(measureId);
      if (previous !== undefined && previous >= effectiveFrom) {
        throw new FeedProfileError(`${measureId}: two status entries share or reverse the start date ${effectiveFrom}; the profile needs one entry per day in date order`);
      }
      lastDated.set(measureId, effectiveFrom);
      sawDated.add(measureId);
    }
    const level = statusEvidence.get(`${measureId}|${sourceId}`);
    if (!level) throw new FeedProfileError(`${measureId}: status source ${sourceId} is not cited as status evidence`);
    const source = sourceById.get(sourceId);
    if (!source) throw new FeedProfileError(`${measureId}: status cites unknown source ${sourceId}`);
    const knownFrom = strOrNull(source.datePublished);
    return {
      entryId: `cse-${sha256Hex(statusKey(measureId, effectiveFrom, sourceId)).slice(0, 20)}`,
      measureId,
      status,
      effectiveFrom,
      effectiveThrough: status === "scheduled" ? null : until,
      takesEffectOn: status === "scheduled" ? until : null,
      sourceId,
      knownFrom,
      knownFromBasis: knownFrom === null ? "not_established" : "source_publication_date",
      evidenceLevel: level,
      reviewState: reviewStateOf(review, pending?.statusKeys.has(statusKey(measureId, effectiveFrom, sourceId)) ?? false),
    };
  });

  instruments.sort((a, b) => compare(a.instrumentId, b.instrumentId));
  instrumentDates.sort((a, b) => compare(a.instrumentId, b.instrumentId));
  measures.sort((a, b) => compare(a.measureId, b.measureId));
  statusEntries.sort(
    (a, b) => compare(a.measureId, b.measureId) || compare(a.effectiveFrom ?? "", b.effectiveFrom ?? "") || compare(a.sourceId, b.sourceId),
  );
  evidence.sort((a, b) => compare(a.measureId, b.measureId) || compare(a.sourceId, b.sourceId) || compare(a.evidenceId, b.evidenceId));
  feedSources.sort((a, b) => compare(a.sourceId, b.sourceId));

  return {
    "instruments.json": instruments,
    "instrument-dates.json": instrumentDates,
    "measures.json": measures,
    "status-entries.json": statusEntries,
    "evidence.json": evidence,
    "sources.json": feedSources,
  };
}

/** Referential checks across the six datasets. Throws on the first break. */
export function checkFeedReferences(datasets: FeedDatasets): void {
  const instruments = new Set(datasets["instruments.json"].map((row) => row.instrumentId));
  const measures = new Set(datasets["measures.json"].map((row) => row.measureId));
  const sources = new Set(datasets["sources.json"].map((row) => row.sourceId));
  const need = (set: Set<string>, value: string, what: string) => {
    if (!set.has(value)) throw new FeedProfileError(`${what} refers to "${value}", which the release does not contain`);
  };
  for (const row of datasets["instruments.json"]) {
    row.sourceIds.forEach((value) => need(sources, value, `instrument ${row.instrumentId}`));
    if (row.supersededByInstrumentId) need(instruments, row.supersededByInstrumentId, `instrument ${row.instrumentId}`);
  }
  for (const row of datasets["instrument-dates.json"]) {
    need(instruments, row.instrumentId, "instrument-dates");
    need(sources, row.sourceId, `instrument-dates ${row.instrumentId}`);
    if (row.operativeFrom && row.operativeThrough && row.operativeThrough < row.operativeFrom) {
      throw new FeedProfileError(`${row.instrumentId}: inverted operative window`);
    }
  }
  for (const row of datasets["measures.json"]) {
    need(instruments, row.instrumentId, `measure ${row.measureId}`);
    row.legalBasisInstrumentIds.forEach((value) => need(instruments, value, `measure ${row.measureId}`));
    row.modifiesMeasureIds.forEach((value) => need(measures, value, `measure ${row.measureId}`));
    for (const limitation of row.limitations) {
      if (!limitation.sourceIds.length) throw new FeedProfileError(`${row.measureId}: limitation needs a citation`);
      limitation.sourceIds.forEach((value) => need(sources, value, `measure ${row.measureId}`));
    }
  }
  const sourceDates = new Map(datasets["sources.json"].map((row) => [row.sourceId, row.datePublished]));
  const evidenceKeys = new Set(datasets["evidence.json"].filter((row) => row.supports.includes("status")).map((row) => row.measureId + "|" + row.sourceId));
  const starts = new Set<string>();
  const withStatus = new Set<string>();
  for (const row of datasets["status-entries.json"]) {
    need(measures, row.measureId, `status entry ${row.entryId}`);
    need(sources, row.sourceId, `status entry ${row.entryId}`);
    const published = sourceDates.get(row.sourceId);
    if (row.knownFrom !== published || row.knownFromBasis !== (published ? "source_publication_date" : "not_established")) {
      throw new FeedProfileError(`${row.entryId}: publication date disagrees with source`);
    }
    if (!evidenceKeys.has(row.measureId + "|" + row.sourceId)) throw new FeedProfileError(`${row.entryId}: missing status evidence`);
    if (row.status === "scheduled" ? row.effectiveThrough !== null : row.takesEffectOn !== null) {
      throw new FeedProfileError(`${row.entryId}: inconsistent scheduled and effective dates`);
    }
    const end = row.takesEffectOn ?? row.effectiveThrough;
    if (row.effectiveFrom && end && end < row.effectiveFrom) throw new FeedProfileError(`${row.entryId}: inverted date window`);
    const startKey = row.measureId + "|" + (row.effectiveFrom ?? "undated");
    if (starts.has(startKey)) throw new FeedProfileError(`${row.entryId}: duplicate status start for one clause`);
    starts.add(startKey);
    withStatus.add(row.measureId);
  }
  const withEvidence = new Set<string>();
  for (const row of datasets["evidence.json"]) {
    need(measures, row.measureId, `evidence ${row.evidenceId}`);
    need(sources, row.sourceId, `evidence ${row.evidenceId}`);
    withEvidence.add(row.measureId);
  }
  for (const measureId of measures) {
    if (!withStatus.has(measureId)) throw new FeedProfileError(`measure ${measureId} has no status entry`);
    if (!withEvidence.has(measureId)) throw new FeedProfileError(`measure ${measureId} has no evidence`);
  }
}

/* ------------------------------------------------------------------ */
/* Comparing two releases                                              */
/* ------------------------------------------------------------------ */

export type FeedFieldChange = { path: string; before: unknown; after: unknown };
export type FeedChanges = {
  from: string;
  to: string;
  datasets: Record<FeedFile, { added: string[]; removed: string[]; changed: { key: string; fields: FeedFieldChange[] }[] }>;
};

/** Deterministic key-by-key comparison of two releases. */
export function diffFeedDatasets(
  from: { releaseId: string; datasets: FeedDatasets },
  to: { releaseId: string; datasets: FeedDatasets },
): FeedChanges {
  const datasets = {} as FeedChanges["datasets"];
  for (const file of FEED_FILES) {
    const key = FEED_KEYS[file];
    const index = (rows: unknown[]) => new Map((rows as JsonObject[]).map((row) => [String(row[key]), row]));
    const before = index(from.datasets[file]);
    const after = index(to.datasets[file]);
    const added = [...after.keys()].filter((id) => !before.has(id)).sort();
    const removed = [...before.keys()].filter((id) => !after.has(id)).sort();
    const changed: FeedChanges["datasets"][FeedFile]["changed"] = [];
    for (const id of [...after.keys()].filter((entry) => before.has(entry)).sort()) {
      const a = before.get(id) as JsonObject;
      const b = after.get(id) as JsonObject;
      const fields: FeedFieldChange[] = [];
      for (const path of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
        if (JSON.stringify(a[path]) !== JSON.stringify(b[path])) fields.push({ path, before: a[path] ?? null, after: b[path] ?? null });
      }
      if (fields.length) changed.push({ key: id, fields });
    }
    datasets[file] = { added, removed, changed };
  }
  return { from: from.releaseId, to: to.releaseId, datasets };
}

/* ------------------------------------------------------------------ */
/* Profile document and manifest                                       */
/* ------------------------------------------------------------------ */

export const FEED_DATE_SEMANTICS: Record<string, string> = {
  "manifest.curatedOn": "Day the release was assembled. It is neither a legal date nor a statement that any source was re-read that day.",
  "manifest.legalStatusCutoff": "Last day through which the published record was checked for changes in legal status. Published rows make no claim about any later day.",
  "manifest.pendingReview.sourceCheckedOn": "Day the originals behind the pending rows, and the issuer's listings, were last read.",
  "instruments.eventDate": "Date the record files the instrument under. Use instrument-dates.json for signature, publication and operative dates where they have been read from the original.",
  "instrument-dates.signedOn": "Date in the instrument's signature block.",
  "instrument-dates.publishedOn": "Date the issuer published the instrument. A notice can be signed one day and published the next.",
  "instrument-dates.operativeFrom": "First day the instrument states it applies. It can follow publication.",
  "instrument-dates.operativeThrough": "Last day, inclusive, the instrument states it applies.",
  "status-entries.effectiveFrom": "First day the status applies to the clause.",
  "status-entries.effectiveThrough": "Last day, inclusive, the status applies. The day after is unresolved unless another entry starts on it.",
  "status-entries.takesEffectOn": "For a scheduled entry, the day the clause is due to take effect. A later entry records whether it did.",
  "status-entries.knownFrom": "Publication date of the cited source. Compare it with the day a decision was taken to decide whether the entry could have been known then.",
  "sources.datePublished": "Publication date the source carries.",
  "sources.dateAccessed": "Day the source was last read for the record.",
};

/** Values a consumer should compute for itself, and from what. */
export const FEED_RECOMPUTE: Record<string, string> = {
  "standing on a date": "Take the last status entry whose effectiveFrom is on or before the date, among entries whose knownFrom is on or before the vintage being reproduced. If the date is after that entry's effectiveThrough, or on or after its takesEffectOn, and no later entry starts, the record does not state the standing: treat it as unresolved, never as a return to an earlier status. Beyond the published cutoff or an explicit vintage, report any stated status as a projection and exclude it from confirmed in-force counts.",
  "first introduced": "A clause is first introduced on the effectiveFrom of its first dated in_force entry. A suspension, a continuation of a suspension and a status change introduce no clause.",
  "in force on a date": "Count clauses whose standing on the date is in_force. This differs from first introduced and the two should be reported apart.",
  "instrument counts": "Count distinct instrumentId over the clauses selected. One instrument can hold several clauses.",
  "instrument status": "The record's instrument-level status summary is withheld. Derive any instrument-level view from its clauses' status entries for the date in question.",
  "destination and material match": "A match on materialIds and targetScopes shows which clauses the record codes for a material and destination. It is a research classification. It does not decide whether a given shipment is controlled; the product-scope wording at the cited source governs.",
};

export function feedProfileDocument(): JsonObject {
  const ruleView = (rule: FieldRule): JsonObject => {
    switch (rule.kind) {
      case "enum":
        return { type: "enum", values: [...rule.values] };
      case "identifier":
        return { type: "identifier", maxLength: rule.max };
      case "register":
        return { type: "register", register: rule.register };
      default:
        return { type: rule.kind };
    }
  };
  return {
    feed: FEED_NAME,
    profileVersion: FEED_PROFILE_VERSION,
    compatibility: {
      major: "A field was removed, renamed or retyped, or a value changed meaning. Do not load without updating the loader.",
      minor: "A field or an allowed value was added. A loader that rejects unknown fields must be updated first.",
      patch: "Documentation only.",
    },
    datasets: Object.fromEntries(
      FEED_FILES.map((file) => [
        file,
        {
          key: FEED_KEYS[file],
          fields: FEED_FIELDS[file].map((spec) => ({
            path: spec.path,
            ...ruleView(spec.rule),
            nullable: spec.nullable === true,
            description: spec.description,
          })),
        },
      ]),
    ),
    registers: { clause_label: [...APPROVED_CLAUSE_LABELS], locator: [...APPROVED_LOCATORS] },
    withheld: WITHHELD_UPSTREAM.map((entry) => ({ upstreamPath: entry.path, disposition: entry.disposition, reason: entry.reason })),
    dateSemantics: FEED_DATE_SEMANTICS,
    recompute: FEED_RECOMPUTE,
  };
}

const SCOPE_STATEMENT =
  "Pilot universe: China's Announcement No. 46 of 2024 on dual-use exports to the United States and the notices that suspend its second paragraph; the worldwide graphite licensing instrument of 2023 and any coded successor under the consolidated dual-use list; and the October 2025 instruments suspended by the November 2025 and November 2026 notices, with those notices. Rows marked wider_public_record come from the rest of the public Controls record and are carried without the pilot's replay tests. No coverage of an issuer, material or destination outside the rows present should be read as the absence of a control.";

/** Assemble a full release: datasets, profile, manifest and, given a previous release, the change file. */
export function buildControlsFeed(input: BuildFeedInput): FeedBundle {
  const { snapshot, review, curatedOn, previous } = input;
  if (!isIsoDate(curatedOn)) throw new FeedProfileError("curatedOn must be a calendar date");
  if (curatedOn < snapshot.manifest.asOf) throw new FeedProfileError("curatedOn cannot precede the legal-status cutoff");
  if (review?.overlay.reviewedAt && curatedOn < review.overlay.reviewedAt) throw new FeedProfileError("curatedOn cannot precede adjudication");
  if (review && curatedOn < review.overlay.preparedOn) throw new FeedProfileError("curatedOn cannot precede the review overlay it carries");

  const datasets = buildFeedDatasets(snapshot, review);
  auditFeedPayload(datasets);
  checkFeedReferences(datasets);
  const coverage = reportUpstreamCoverage(snapshot.rows);

  const files: Record<string, string> = {};
  const table = {} as FeedManifest["datasets"];
  for (const file of FEED_FILES) {
    files[file] = stableJson(datasets[file]);
    table[file] = { rows: datasets[file].length, sha256: sha256Hex(files[file]), key: FEED_KEYS[file] };
  }
  files["profile.json"] = stableJson(feedProfileDocument());

  const pilotMeasures = datasets["measures.json"].filter((row) => row.coverage === "pilot_universe");
  const pilotInstruments = datasets["instruments.json"].filter((row) => row.coverage === "pilot_universe");
  const pendingRows: Record<string, string[]> = {};
  if (review) {
    for (const file of FEED_FILES) {
      const key = FEED_KEYS[file];
      const keys = (datasets[file] as unknown as JsonObject[])
        .filter((row) => row.reviewState !== "published")
        .map((row) => String(row[key]));
      if (keys.length) pendingRows[file] = keys;
    }
  }

  let changesFrom: FeedManifest["changesFrom"] = null;
  if (previous) {
    const changes = diffFeedDatasets({ releaseId: previous.manifest.releaseId, datasets: previous.datasets }, { releaseId: "this_release", datasets });
    files["changes.json"] = stableJson(changes);
    changesFrom = {
      releaseId: previous.manifest.releaseId,
      file: "changes.json",
      sha256: sha256Hex(files["changes.json"]),
      summary: Object.fromEntries(
        FEED_FILES.map((file) => [
          file,
          {
            added: changes.datasets[file].added.length,
            removed: changes.datasets[file].removed.length,
            changed: changes.datasets[file].changed.length,
          },
        ]),
      ),
    };
  }

  const manifest: FeedManifest = {
    feed: FEED_NAME,
    profileVersion: FEED_PROFILE_VERSION,
    releaseId: "",
    reviewState: !review
      ? "published_record"
      : review.overlay.reviewState === "adjudicated"
        ? "review_candidate_adjudicated_unpublished"
        : "review_candidate_pending_human_adjudication",
    curatedOn,
    legalStatusCutoff: snapshot.manifest.asOf,
    source: {
      controlsSnapshot: review ? review.overlay.baseline.datasetVersion : snapshot.manifest.datasetVersion,
      controlsSchemaVersion: snapshot.manifest.schemaVersion,
      reviewOverlay: review
        ? { overlayId: review.overlay.overlayId, sha256: review.result.overlaySha256, reviewVersion: review.result.reviewVersion }
        : null,
    },
    pendingReview: review
      ? {
          overlayId: review.overlay.overlayId,
          preparedOn: review.overlay.preparedOn,
          sourceCheckedOn: review.overlay.sourceCheckedOn,
          reviewedAt: review.overlay.reviewedAt,
          publishedReplayRequiresBaseline: review.overlay.operations.some(({ op }) => op === "correct_status" || op === "remove_status" || op === "supersede_event"),
          rows: pendingRows,
        }
      : null,
    scope: {
      statement: SCOPE_STATEMENT,
      pilot: {
        instrumentIds: pilotInstruments.map((row) => row.instrumentId),
        measures: pilotMeasures.length,
        issuers: [...new Set(pilotMeasures.map((row) => row.issuer))].sort(),
        materialIds: [...new Set(pilotMeasures.flatMap((row) => row.materialIds))].sort(),
        namedDestinations: [...new Set(pilotMeasures.flatMap((row) => row.targetJurisdictions))].sort(),
        worldwideMeasures: pilotMeasures.filter((row) => row.targetScopes.includes("all_jurisdictions")).length,
        earliestInstrumentDate: pilotInstruments.map((row) => row.eventDate).sort()[0] ?? null,
      },
      widerPublicRecord: {
        instruments: datasets["instruments.json"].length - pilotInstruments.length,
        measures: datasets["measures.json"].length - pilotMeasures.length,
      },
    },
    profile: { file: "profile.json", sha256: sha256Hex(files["profile.json"]) },
    datasets: table,
    excluded: {
      withheldUpstreamPaths: WITHHELD_UPSTREAM.map((entry) => entry.path),
      unreviewedUpstreamPathCount: coverage.unreviewed.length,
    },
    changesFrom,
  };
  manifest.releaseId = releaseIdentity(manifest);
  files["manifest.json"] = stableJson(manifest);
  return { manifest, datasets, files, coverage };
}

/** All manifest metadata and every listed file contribute to the immutable identity. */
function releaseIdentity(manifest: FeedManifest): string {
  const fields = Object.fromEntries(Object.entries(manifest).filter(([key]) => key !== "releaseId"));
  const digest = sha256Hex(stableJson(fields));
  const overlay = manifest.source.reviewOverlay;
  const major = manifest.profileVersion.split(".")[0];
  return `stratellar-controls-feed-p${major}-${manifest.legalStatusCutoff}${overlay ? "-" + overlay.overlayId : ""}-${digest}`;
}

/**
 * Verify the files of a release against its manifest and return it parsed.
 * `files` maps file name to exact content.
 */
export function verifyFeedFiles(files: Record<string, string>): { manifest: FeedManifest; datasets: FeedDatasets } {
  if (!files["manifest.json"]) throw new ControlsIntegrityError("feed release has no manifest.json");
  const manifest = JSON.parse(files["manifest.json"]) as FeedManifest;
  if (manifest.feed !== FEED_NAME) throw new ControlsIntegrityError(`not a ${FEED_NAME} release`);
  if (manifest.profileVersion !== FEED_PROFILE_VERSION) {
    throw new ControlsIntegrityError(`profile ${manifest.profileVersion} is not compatible with ${FEED_PROFILE_VERSION}`);
  }
  if (!isIsoDate(manifest.curatedOn) || !isIsoDate(manifest.legalStatusCutoff) || manifest.curatedOn < manifest.legalStatusCutoff) {
    throw new ControlsIntegrityError("invalid manifest curation date or cutoff");
  }
  if (Object.keys(manifest.datasets).length !== FEED_FILES.length) throw new ControlsIntegrityError("unexpected datasets in manifest");
  const datasets = {} as Record<FeedFile, unknown[]>;
  for (const file of FEED_FILES) {
    const content = files[file];
    const stated = manifest.datasets?.[file];
    if (content === undefined || !stated) throw new ControlsIntegrityError(`feed release is missing ${file}`);
    if (stated.key !== FEED_KEYS[file]) throw new ControlsIntegrityError(`${file}: manifest gives wrong row key`);
    const actual = sha256Hex(content);
    if (actual !== stated.sha256) {
      throw new ControlsIntegrityError(`${file} does not match its manifest: expected sha256 ${stated.sha256}, found ${actual}`);
    }
    const rows: unknown = JSON.parse(content);
    if (!Array.isArray(rows) || rows.length !== stated.rows) {
      throw new ControlsIntegrityError(`${file} does not match its manifest: expected ${stated.rows} rows`);
    }
    datasets[file] = rows;
  }
  if (manifest.releaseId !== releaseIdentity(manifest)) throw new ControlsIntegrityError("releaseId does not match manifest");
  const allowed = new Set<string>(["manifest.json", "profile.json", ...FEED_FILES]);
  if (manifest.changesFrom) allowed.add("changes.json");
  if (Object.keys(files).length !== allowed.size || Object.keys(files).some((name) => !allowed.has(name))) {
    throw new ControlsIntegrityError("release directory has missing or unexpected files");
  }
  if (files["profile.json"] !== stableJson(feedProfileDocument()) || sha256Hex(files["profile.json"]) !== manifest.profile.sha256) {
    throw new ControlsIntegrityError("profile.json differs from the supported integration profile");
  }
  if (manifest.changesFrom) {
    const changes = JSON.parse(files["changes.json"]) as FeedChanges;
    if (sha256Hex(files["changes.json"]) !== manifest.changesFrom.sha256 || changes.to !== "this_release" || changes.from !== manifest.changesFrom.releaseId) {
      throw new ControlsIntegrityError("changes.json does not match its manifest");
    }
    for (const file of FEED_FILES) {
      const summary = manifest.changesFrom.summary[file];
      for (const action of ["added", "removed", "changed"] as const) {
        const entries = changes.datasets[file]?.[action];
        if (!Array.isArray(entries) || entries.length !== summary?.[action]) throw new ControlsIntegrityError(`unexpected change count for ${file}`);
      }
    }
  }
  auditFeedPayload(datasets);
  const typed = datasets as unknown as FeedDatasets;
  checkFeedReferences(typed);
  const review = manifest.pendingReview;
  const reviewState = review === null ? "published" : review.reviewedAt === null ? "pending_human_adjudication" : "adjudicated_unpublished";
  const expectedState = reviewState === "published" ? "published_record" : `review_candidate_${reviewState}`;
  if (manifest.reviewState !== expectedState || (review?.overlayId ?? null) !== (manifest.source.reviewOverlay?.overlayId ?? null)) {
    throw new ControlsIntegrityError("manifest review state disagrees with its overlay");
  }
  if (review && (!isIsoDate(review.preparedOn) || !isIsoDate(review.sourceCheckedOn) || review.sourceCheckedOn > review.preparedOn ||
      review.sourceCheckedOn < manifest.legalStatusCutoff || review.preparedOn > manifest.curatedOn ||
      (review.reviewedAt !== null && (!isIsoDate(review.reviewedAt) || review.reviewedAt < review.preparedOn || review.reviewedAt > manifest.curatedOn)))) {
    throw new ControlsIntegrityError("invalid review dates");
  }
  for (const file of FEED_FILES) {
    const pending = (typed[file] as unknown as JsonObject[]).filter((row) => row.reviewState !== "published");
    const listed = review?.rows[file] ?? [];
    const keys = pending.map((row) => row[FEED_KEYS[file]]).sort();
    if (pending.some((row) => row.reviewState !== reviewState) || stableJson(keys) !== stableJson([...listed].sort())) {
      throw new ControlsIntegrityError(`${file}: pending row list disagrees with review state`);
    }
  }
  return { manifest, datasets: typed };
}
