/**
 * Runtime validation for the Capital & Control seed files (v0.5):
 * data/seed/financial-commitments.json ("fin-") and
 * data/seed/control-measures.json ("ctl-").
 *
 * Pure on purpose: it takes the parsed seed arrays, the published records they
 * reference and the current date, and returns structured errors and warnings.
 * It reads no file and no clock, and never exits; `scripts/validate-data.ts`
 * formats the issues and owns the exit code, and the tests call it directly.
 *
 * Each record is checked in two passes. The shape pass compares it with the
 * schema in lib/types.ts: required and unknown fields, JSON types, blank
 * strings, controlled vocabularies and value formats. A record whose fields
 * all have their declared JSON types then gets the semantic pass: references,
 * stage and material consistency, status chronology, relationships, target
 * scopes and field-level evidence. Cycles are checked across each collection
 * at the end.
 *
 * Currency and country codes are checked for ISO format only (three and two
 * uppercase letters). The repository holds no ISO 4217 or ISO 3166 registry,
 * so "ZZZ" passes as a currency and "ZZ" as a country.
 */
import {
  CAPITAL_SOURCES,
  CONTROL_DIRECTIONS,
  CONTROL_EVIDENCE_FIELDS,
  CONTROL_MEASURE_ID_PREFIX,
  CONTROL_MEASURE_TYPES,
  CONTROL_STATUSES,
  CURRENCY_BASES,
  EVIDENCE_LEVELS,
  FINANCIAL_COMMITMENT_ID_PREFIX,
  FINANCIAL_EVIDENCE_FIELDS,
  FINANCIAL_INSTRUMENTS,
  FINANCIAL_RELATIONSHIP_TYPES,
  FINANCIAL_STATUSES,
  IMPLEMENTATION_STATUSES,
  JURISDICTIONS,
  MATERIAL_ATTRIBUTIONS,
  OUTCOME_ATTRIBUTIONS,
  OUTCOME_METRICS,
  PRODUCT_CODE_ROLES,
  PRODUCT_CODE_SYSTEMS,
  STAGE_ALLOCATIONS,
  SUPPLY_CHAIN_STAGES,
  TARGET_SCOPES,
  TERM_KINDS,
  VALUE_QUALIFIERS,
  VALUE_ROLES,
  type ControlEvidenceField,
  type ControlMeasure,
  type ControlStatus,
  type ControlStatusEntry,
  type EvidenceReference,
  type FinancialCommitment,
  type FinancialEvidenceField,
  type FinancialRelationship,
  type InstrumentTerm,
  type MonetaryAmount,
  type ProductCode,
  type ProjectLocation,
  type StatedOutcome,
  type StatusEntry,
  type TargetScope,
} from "../lib/types";

// --- Field-level provenance ---------------------------------------------------
//
// The evidence category that covers each substantive field, shared by the
// validator and the tests. `id` and `eventId` are structural, `evidence` is the
// provenance itself and `notes` is editorial, so none of them needs evidence.
// Keyed by the entity's own fields: a field no category covers, or a mapping
// to a category that does not exist, stops compiling.

export const COMMITMENT_FIELD_EVIDENCE: Readonly<
  Record<Exclude<keyof FinancialCommitment, "id" | "eventId" | "evidence" | "notes">, FinancialEvidenceField>
> = {
  relationships: "relationships",
  instrument: "instrument",
  valueRole: "value_role",
  capitalSource: "capital_source",
  amount: "amount",
  provider: "provider",
  providerJurisdiction: "provider",
  legalAuthority: "legal_authority",
  recipient: "recipient",
  project: "project",
  facility: "facility",
  locations: "location",
  stages: "stages",
  stageAllocation: "stages",
  materialIds: "materials",
  materialAttribution: "materials",
  untrackedMaterialsAsStated: "materials",
  financialStatusHistory: "status",
  implementationStatusHistory: "status",
  terms: "terms",
  outcomes: "outcomes",
};

export const CONTROL_FIELD_EVIDENCE: Readonly<
  Record<Exclude<keyof ControlMeasure, "id" | "eventId" | "evidence" | "notes">, ControlEvidenceField>
> = {
  measureType: "measure_type",
  direction: "direction",
  clause: "clause",
  targetScopes: "targets",
  targetJurisdictions: "targets",
  targetEntities: "targets",
  targetEndUsersAsStated: "targets",
  targetEndUsesAsStated: "targets",
  materialIds: "materials",
  materialAttribution: "materials",
  untrackedMaterialsAsStated: "materials",
  productScopeAsStated: "product_scope",
  productCodes: "product_codes",
  legalBasisEventIds: "legal_basis",
  legalBasisAsStated: "legal_basis",
  modifiesMeasureIds: "modified_measures",
  modifiesExternalInstruments: "modified_measures",
  statusHistory: "status",
};

// --- Value formats --------------------------------------------------------------

const DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d*[1-9])?$/;

/**
 * A canonical unsigned decimal string, the one spelling each figure has: "0",
 * "5", "1250000", "0.25", "12.5". No sign, separator, exponent, whitespace,
 * leading zero (other than a lone "0" before the point), trailing fractional
 * zero or bare point, and never NaN or Infinity.
 */
export const isCanonicalDecimal = (value: string): boolean => DECIMAL.test(value);

/** Three uppercase letters, the ISO 4217 format. Registry membership is not checked. */
export const isCurrencyCode = (value: string): boolean => /^[A-Z]{3}$/.test(value);

/** Two uppercase letters, the ISO 3166-1 alpha-2 format. Registry membership is not checked. */
export const isCountryCode = (value: string): boolean => /^[A-Z]{2}$/.test(value);

/** A real calendar date written YYYY-MM-DD: "2024-02-29" passes, "2026-02-30" does not. */
export function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

/** An outcome's target date: a year, a year-month or a real calendar date ("2027", "2027-03", "2027-03-31"). */
export function isTargetDate(value: string): boolean {
  if (/^\d{4}$/.test(value)) return true;
  const yearMonth = /^\d{4}-(\d{2})$/.exec(value);
  if (yearMonth) return Number(yearMonth[1]) >= 1 && Number(yearMonth[1]) <= 12;
  return isCalendarDate(value);
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

// --- Issues ---------------------------------------------------------------------

export type CapitalControlCollection = "financial-commitments" | "control-measures";

/** Stable issue codes: tests and tooling match on these, never on the prose. */
export const CAPITAL_CONTROL_ISSUE_CODES = [
  // Seed files and record shape
  "invalid_json", // the seed file does not parse
  "not_array", // the seed file is not a JSON array
  "invalid_type", // a value, or a whole record, has the wrong JSON type
  "missing_field", // a required field is absent
  "unknown_field", // a field the schema does not define
  "blank_string", // an empty or whitespace-only string
  "invalid_vocabulary", // a value outside its controlled vocabulary
  "invalid_decimal", // a figure that is not a canonical unsigned decimal string
  "invalid_currency", // not three uppercase letters
  "invalid_country", // not two uppercase letters
  "invalid_date", // not a real calendar date (a target date may also be a year or year-month)
  // Identity
  "invalid_id", // the wrong prefix, or not lowercase hyphenated words after it
  "duplicate_id", // one id used twice in a file
  "id_collision", // an id a published record or the other collection already uses
  "id_order", // records out of ascending id order
  // References
  "unresolved_reference", // no such event, source, material, jurisdiction, commitment or measure
  "candidate_reference", // a private candidate identifier
  "material_not_in_event", // a material outside its event's affectedMaterialIds
  "self_reference", // a relationship or modification naming its own record
  "cycle", // relationships or modifications that loop back to where they start
  // Consistency
  "duplicate_value", // an entry repeated in a list that is a set
  "stage_allocation_mismatch", // stageAllocation disagrees with the stages recorded
  "material_attribution_mismatch", // materialAttribution disagrees with the materials recorded
  "target_scope_mismatch", // targetScopes disagrees with the targets recorded
  "incoherent_value", // a qualifier, currency, unit, date or location that contradicts its figure
  // Status histories
  "empty_status_history", // a required history with no entry
  "status_chronology", // dated entries out of order
  "invalid_until", // "until" on a status with no stated end, or before the entry's own date
  "expired_until", // warning: the current status's "until" has passed
  // Field-level evidence
  "missing_evidence", // a populated field group that no evidence reference supports
  "evidence_for_absent_field", // evidence claiming a field group the record leaves empty
  "empty_evidence_supports", // an evidence reference that supports no field
  "missing_same_source_evidence", // a cited source whose evidence does not support that field
] as const;

export type CapitalControlIssueCode = (typeof CAPITAL_CONTROL_ISSUE_CODES)[number];

export type CapitalControlIssue = {
  severity: "error" | "warning";
  code: CapitalControlIssueCode;
  collection: CapitalControlCollection;
  /** The record's id, when it has a non-blank string id. */
  recordId: string | null;
  /** The record's position in its seed file; null for an issue with the file itself. */
  index: number | null;
  /** Path within the record, e.g. "amount.value" or "relationships[1].commitmentId"; "" for the whole record or file. */
  field: string;
  /** The actionable reason. */
  message: string;
};

const COLLECTIONS: Readonly<
  Record<CapitalControlCollection, { entity: string; file: string; prefix: string; example: string }>
> = {
  "financial-commitments": {
    entity: "financial commitment",
    file: "financial-commitments.json",
    prefix: FINANCIAL_COMMITMENT_ID_PREFIX,
    example: "fin-example-grant",
  },
  "control-measures": {
    entity: "control measure",
    file: "control-measures.json",
    prefix: CONTROL_MEASURE_ID_PREFIX,
    example: "ctl-example-licensing",
  },
};

/** One report line, e.g. `financial commitment "fin-x" (amount.value): …`. */
export function formatCapitalControlIssue(issue: CapitalControlIssue): string {
  const { entity, file } = COLLECTIONS[issue.collection];
  if (issue.index === null) return `${file} ${issue.message}`;
  const record = issue.recordId !== null ? `${entity} "${issue.recordId}"` : `${entity} #${issue.index} in ${file}`;
  return issue.field ? `${record} (${issue.field}): ${issue.message}` : `${record}: ${issue.message}`;
}

// --- Inputs and result ------------------------------------------------------------

type CorpusEvent = { id: string; affectedMaterialIds: readonly string[] };

/** The published records Capital & Control rows reference, and the ids they must not reuse. */
export type CapitalControlCorpus = {
  events: readonly CorpusEvent[];
  sources: readonly { id: string }[];
  materials: readonly { id: string; slug?: string | null }[];
  jurisdictions: readonly { id: string }[];
  framing?: readonly { id: string }[];
  watchlist?: readonly { id: string }[];
  /** Private candidate ids and their proposed-source ids: never a valid reference. */
  candidateIds?: Iterable<string>;
};

export type CapitalControlInput = {
  financialCommitments: readonly unknown[];
  controlMeasures: readonly unknown[];
  corpus: CapitalControlCorpus;
  /** The current date, YYYY-MM-DD. Injected so time-dependent warnings stay deterministic. */
  today: string;
};

export type CapitalControlResult = {
  errors: CapitalControlIssue[];
  warnings: CapitalControlIssue[];
  counts: { financialCommitments: number; controlMeasures: number };
};

// --- Shape ------------------------------------------------------------------------

type TextFormat = "decimal" | "currency" | "country" | "date" | "target_date";

type Spec = { optional?: true } & (
  | { kind: "text"; nullable?: true; format?: TextFormat }
  | { kind: "enum"; values: readonly string[]; nullable?: true }
  | { kind: "list"; of: Spec }
  | { kind: "object"; name: string; fields: Readonly<Record<string, Spec>>; nullable?: true }
);

/** One spec per field of T, optional fields included, so a spec cannot drift from lib/types.ts. */
type Fields<T> = { readonly [K in keyof T]-?: Spec };

const text = (format?: TextFormat): Spec => ({ kind: "text", format });
const nullableText = (format?: TextFormat): Spec => ({ kind: "text", nullable: true, format });
const optionalText = (format?: TextFormat): Spec => ({ kind: "text", nullable: true, optional: true, format });
const oneOf = (values: readonly string[]): Spec => ({ kind: "enum", values });
const nullableOneOf = (values: readonly string[]): Spec => ({ kind: "enum", values, nullable: true });
const listOf = (of: Spec): Spec => ({ kind: "list", of });
const objectOf = (name: string, fields: Readonly<Record<string, Spec>>): Spec => ({ kind: "object", name, fields });

const AMOUNT: Fields<MonetaryAmount> = {
  value: text("decimal"),
  currency: text("currency"),
  qualifier: oneOf(VALUE_QUALIFIERS),
  amountAsStated: text(),
  currencyBasis: oneOf(CURRENCY_BASES),
};

const RELATIONSHIP: Fields<FinancialRelationship> = {
  commitmentId: text(),
  relationship: oneOf(FINANCIAL_RELATIONSHIP_TYPES),
  sourceId: text(),
  locator: optionalText(),
  note: optionalText(),
};

const LOCATION: Fields<ProjectLocation> = {
  countryCode: nullableText("country"),
  subnational: nullableText(),
  asStated: nullableText(),
};

const statusEntry = (statuses: readonly string[]): Fields<StatusEntry<string>> => ({
  status: oneOf(statuses),
  date: nullableText("date"),
  sourceId: text(),
  note: optionalText(),
});

const CONTROL_STATUS_ENTRY: Fields<ControlStatusEntry> = { ...statusEntry(CONTROL_STATUSES), until: optionalText("date") };

const TERM: Fields<InstrumentTerm> = {
  kind: oneOf(TERM_KINDS),
  value: nullableText("decimal"),
  qualifier: nullableOneOf(VALUE_QUALIFIERS),
  currency: nullableText("currency"),
  unit: nullableText(),
  asStated: text(),
  sourceId: text(),
  note: optionalText(),
};

const OUTCOME: Fields<StatedOutcome> = {
  metric: oneOf(OUTCOME_METRICS),
  value: nullableText("decimal"),
  qualifier: nullableOneOf(VALUE_QUALIFIERS),
  unit: nullableText(),
  targetDate: nullableText("target_date"),
  asStated: text(),
  statedBy: oneOf(OUTCOME_ATTRIBUTIONS),
  sourceId: text(),
  note: optionalText(),
};

const evidenceReference = (fields: readonly string[]): Fields<EvidenceReference<string>> => ({
  sourceId: text(),
  supports: listOf(oneOf(fields)),
  evidence: oneOf(EVIDENCE_LEVELS),
  locator: optionalText(),
  note: optionalText(),
});

const PRODUCT_CODE: Fields<ProductCode> = {
  system: oneOf(PRODUCT_CODE_SYSTEMS),
  code: text(),
  role: oneOf(PRODUCT_CODE_ROLES),
};

const COMMITMENT: Fields<FinancialCommitment> = {
  id: text(),
  eventId: text(),
  relationships: listOf(objectOf("relationship", RELATIONSHIP)),
  instrument: oneOf(FINANCIAL_INSTRUMENTS),
  valueRole: oneOf(VALUE_ROLES),
  capitalSource: oneOf(CAPITAL_SOURCES),
  amount: { kind: "object", name: "amount", fields: AMOUNT, nullable: true },
  provider: nullableText(),
  providerJurisdiction: nullableOneOf(JURISDICTIONS),
  legalAuthority: nullableText(),
  recipient: nullableText(),
  project: nullableText(),
  facility: nullableText(),
  locations: listOf(objectOf("location", LOCATION)),
  stages: listOf(oneOf(SUPPLY_CHAIN_STAGES)),
  stageAllocation: oneOf(STAGE_ALLOCATIONS),
  materialIds: listOf(text()),
  materialAttribution: oneOf(MATERIAL_ATTRIBUTIONS),
  untrackedMaterialsAsStated: listOf(text()),
  financialStatusHistory: listOf(objectOf("status entry", statusEntry(FINANCIAL_STATUSES))),
  implementationStatusHistory: listOf(objectOf("status entry", statusEntry(IMPLEMENTATION_STATUSES))),
  terms: listOf(objectOf("term", TERM)),
  outcomes: listOf(objectOf("outcome", OUTCOME)),
  evidence: listOf(objectOf("evidence reference", evidenceReference(FINANCIAL_EVIDENCE_FIELDS))),
  notes: optionalText(),
};

const CONTROL: Fields<ControlMeasure> = {
  id: text(),
  eventId: text(),
  measureType: oneOf(CONTROL_MEASURE_TYPES),
  direction: oneOf(CONTROL_DIRECTIONS),
  clause: nullableText(),
  targetScopes: listOf(oneOf(TARGET_SCOPES)),
  targetJurisdictions: listOf(text("country")),
  targetEntities: listOf(text()),
  targetEndUsersAsStated: listOf(text()),
  targetEndUsesAsStated: listOf(text()),
  materialIds: listOf(text()),
  materialAttribution: oneOf(MATERIAL_ATTRIBUTIONS),
  untrackedMaterialsAsStated: listOf(text()),
  productScopeAsStated: nullableText(),
  productCodes: listOf(objectOf("product code", PRODUCT_CODE)),
  legalBasisEventIds: listOf(text()),
  legalBasisAsStated: nullableText(),
  modifiesMeasureIds: listOf(text()),
  modifiesExternalInstruments: listOf(text()),
  statusHistory: listOf(objectOf("status entry", CONTROL_STATUS_ENTRY)),
  evidence: listOf(objectOf("evidence reference", evidenceReference(CONTROL_EVIDENCE_FIELDS))),
  notes: optionalText(),
};

const SHAPES: Readonly<Record<CapitalControlCollection, Spec>> = {
  "financial-commitments": objectOf("financial commitment", COMMITMENT),
  "control-measures": objectOf("control measure", CONTROL),
};

// --- Reporting --------------------------------------------------------------------

/** After these, a record's fields cannot be trusted to have their declared JSON types. */
const STRUCTURAL: ReadonlySet<CapitalControlIssueCode> = new Set(["invalid_type", "missing_field"]);

type IssueLists = { errors: CapitalControlIssue[]; warnings: CapitalControlIssue[] };

/** Collects the issues of one record. */
class Reporter {
  /** False once a field is missing or has the wrong JSON type; the semantic pass is then skipped. */
  sound = true;

  constructor(
    private readonly issues: IssueLists,
    private readonly collection: CapitalControlCollection,
    private readonly index: number | null,
    private readonly recordId: string | null,
  ) {}

  error(code: CapitalControlIssueCode, field: string, message: string): void {
    if (STRUCTURAL.has(code)) this.sound = false;
    this.issues.errors.push(this.issue("error", code, field, message));
  }

  warn(code: CapitalControlIssueCode, field: string, message: string): void {
    this.issues.warnings.push(this.issue("warning", code, field, message));
  }

  private issue(
    severity: CapitalControlIssue["severity"],
    code: CapitalControlIssueCode,
    field: string,
    message: string,
  ): CapitalControlIssue {
    return { severity, code, collection: this.collection, recordId: this.recordId, index: this.index, field, message };
  }
}

// --- Shape pass -------------------------------------------------------------------

const FORMATS: Readonly<
  Record<TextFormat, { code: CapitalControlIssueCode; test: (value: string) => boolean; expected: string }>
> = {
  decimal: {
    code: "invalid_decimal",
    test: isCanonicalDecimal,
    expected:
      'a canonical unsigned decimal string: digits with an optional fraction, and no sign, separator, exponent, whitespace, leading zero or trailing fractional zero (e.g. "1250000", "0.25")',
  },
  currency: {
    code: "invalid_currency",
    test: isCurrencyCode,
    expected: 'an ISO 4217-style currency code of three uppercase letters (e.g. "USD")',
  },
  country: {
    code: "invalid_country",
    test: isCountryCode,
    expected: 'an ISO 3166-1 alpha-2-style country code of two uppercase letters (e.g. "US")',
  },
  date: { code: "invalid_date", test: isCalendarDate, expected: "a real calendar date written YYYY-MM-DD" },
  target_date: {
    code: "invalid_date",
    test: isTargetDate,
    expected: "a year, a year-month or a real calendar date (YYYY, YYYY-MM or YYYY-MM-DD)",
  },
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Extends a field path: at("terms", 0) is "terms[0]", at("amount", "value") is "amount.value". */
const at = (path: string, key: string | number): string =>
  typeof key === "number" ? `${path}[${key}]` : path ? `${path}.${key}` : key;

const withArticle = (noun: string): string => `${/^[aeiou]/.test(noun) ? "an" : "a"} ${noun}`;

function describe(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return "an array";
  if (typeof value === "object") return "an object";
  return `${typeof value} ${JSON.stringify(value)}`;
}

const isNullable = (spec: Spec): boolean => spec.kind !== "list" && spec.nullable === true;

function missingHint(spec: Spec): string {
  if (spec.kind === "list") return "; use [] when there is nothing to record";
  return isNullable(spec) ? "; use null when the source does not state it" : "";
}

function checkShape(value: unknown, spec: Spec, path: string, r: Reporter): void {
  if (value === null) {
    if (!isNullable(spec))
      r.error(
        "invalid_type",
        path,
        spec.kind === "list" ? "must be an array, not null; use [] when there is nothing to record" : "must not be null",
      );
    return;
  }
  switch (spec.kind) {
    case "text": {
      if (typeof value !== "string") {
        const hint = spec.format === "decimal" && typeof value === "number" ? '; write figures as decimal strings, e.g. "1250000"' : "";
        r.error("invalid_type", path, `must be a string${spec.nullable ? " or null" : ""}, not ${describe(value)}${hint}`);
      } else if (value.trim() === "") {
        r.error("blank_string", path, spec.nullable ? "is blank; use null when the source states nothing" : "is blank; give the text or remove the entry");
      } else if (spec.format && !FORMATS[spec.format].test(value)) {
        const { code, expected } = FORMATS[spec.format];
        r.error(code, path, `${JSON.stringify(value)} is not ${expected}`);
      }
      return;
    }
    case "enum":
      if (typeof value !== "string")
        r.error("invalid_type", path, `must be a string${spec.nullable ? " or null" : ""}, not ${describe(value)}`);
      else if (!spec.values.includes(value))
        r.error("invalid_vocabulary", path, `${JSON.stringify(value)} is not an allowed value (${spec.values.join(", ")})`);
      return;
    case "list":
      if (!Array.isArray(value)) r.error("invalid_type", path, `must be an array, not ${describe(value)}`);
      else value.forEach((item, i) => checkShape(item, spec.of, at(path, i), r));
      return;
    case "object": {
      if (!isObject(value)) {
        r.error("invalid_type", path, `must be ${withArticle(spec.name)}${spec.nullable ? " or null" : ""}, not ${describe(value)}`);
        return;
      }
      for (const [key, field] of Object.entries(spec.fields)) {
        const child = Object.hasOwn(value, key) ? value[key] : undefined;
        if (child !== undefined) checkShape(child, field, at(path, key), r);
        else if (!field.optional) r.error("missing_field", at(path, key), `is required${missingHint(field)}`);
      }
      for (const key of Object.keys(value))
        if (!Object.hasOwn(spec.fields, key))
          r.error("unknown_field", at(path, key), `is not a field of ${withArticle(spec.name)}; remove it or correct its name`);
      return;
    }
  }
}

// --- Candidate isolation ------------------------------------------------------------

/** "cand-" belongs to private candidates (data/candidates/) and never appears in a published row. */
const CANDIDATE_ID = /\bcand-/;

function scanForCandidates(value: unknown, path: string, r: Reporter): void {
  if (typeof value === "string") {
    if (CANDIDATE_ID.test(value))
      r.error(
        "candidate_reference",
        path,
        `${JSON.stringify(value)} is a private candidate identifier; candidates stay in data/candidates/ until promoted and are never named by a published row`,
      );
  } else if (Array.isArray(value)) value.forEach((item, i) => scanForCandidates(item, at(path, i), r));
  else if (isObject(value)) for (const [key, item] of Object.entries(value)) scanForCandidates(item, at(path, key), r);
}

// --- References and sets --------------------------------------------------------------

type Refs = {
  events: ReadonlyMap<string, CorpusEvent>;
  sources: ReadonlySet<string>;
  materials: ReadonlySet<string>;
  jurisdictions: ReadonlySet<string>;
  commitments: ReadonlySet<string>;
  controls: ReadonlySet<string>;
  candidates: ReadonlySet<string>;
};

const EVENT = "an event in events.json";
const SOURCE = "a source in sources.json";
const MATERIAL = "a material id in materials.json";
const COMMITMENT_TARGET = "a financial commitment in financial-commitments.json";
const CONTROL_TARGET = "a control measure in control-measures.json";

/** Reports a reference that does not resolve; true when it does. */
function resolves(
  value: string,
  known: { has(value: string): boolean },
  target: string,
  field: string,
  r: Reporter,
  refs: Refs,
): boolean {
  if (known.has(value)) return true;
  if (value.trim() === "" || CANDIDATE_ID.test(value)) return false; // already reported as blank_string or candidate_reference
  if (refs.candidates.has(value))
    r.error(
      "candidate_reference",
      field,
      `${JSON.stringify(value)} belongs to a private candidate, not ${target}; promote it through the candidate workflow first`,
    );
  else r.error("unresolved_reference", field, `${JSON.stringify(value)} does not resolve to ${target}`);
  return false;
}

function resolveEvent(eventId: string, r: Reporter, refs: Refs): CorpusEvent | undefined {
  return resolves(eventId, refs.events, EVENT, "eventId", r, refs) ? refs.events.get(eventId) : undefined;
}

const byCodePoint = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** A key for exact-duplicate checks: object keys sorted, null and absent treated alike. */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    isObject(v)
      ? Object.fromEntries(
          Object.entries(v)
            .filter(([, item]) => item !== null && item !== undefined)
            .sort(([a], [b]) => byCodePoint(a, b)),
        )
      : v,
  );
}

/** Reports every entry that repeats an earlier one, under the given identity key. */
function checkUnique<T>(
  values: readonly T[],
  path: string,
  what: string,
  r: Reporter,
  key: (value: T) => string = canonical,
): void {
  const first = new Map<string, number>();
  values.forEach((value, i) => {
    const k = key(value);
    const earlier = first.get(k);
    if (earlier === undefined) first.set(k, i);
    else r.error("duplicate_value", at(path, i), `repeats ${at(path, earlier)}; list each ${what} once`);
  });
}

const isOneOf = (values: readonly string[], value: string): boolean => values.includes(value);

const joinAnd = (items: readonly string[]): string =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

// --- Field-level evidence -----------------------------------------------------------

/** Whether a field says anything: null, an empty list and "not_stated" say nothing. */
const isPopulated = (value: unknown): boolean =>
  value !== null && value !== undefined && value !== "not_stated" && !(Array.isArray(value) && value.length === 0);

/**
 * Checks a record's evidence against the field-to-evidence map and returns,
 * for each field group, the sources whose evidence supports it.
 */
function checkEvidence<F extends string>(
  record: Readonly<Record<string, unknown>>,
  evidence: readonly EvidenceReference<F>[],
  fieldEvidence: Readonly<Record<string, F>>,
  categories: readonly F[],
  r: Reporter,
  refs: Refs,
): Map<F, Set<string>> {
  const fieldsOf = (category: F) => Object.keys(fieldEvidence).filter((field) => fieldEvidence[field] === category);
  const populated = (category: F) => fieldsOf(category).some((field) => isPopulated(record[field]));

  const covered = new Map<F, Set<string>>();
  evidence.forEach((reference, i) => {
    const path = `evidence[${i}]`;
    resolves(reference.sourceId, refs.sources, SOURCE, `${path}.sourceId`, r, refs);
    if (reference.supports.length === 0)
      r.error("empty_evidence_supports", `${path}.supports`, "names no field; list the fields this source supports, or remove the reference");
    checkUnique(reference.supports, `${path}.supports`, "field", r);
    reference.supports.forEach((category, k) => {
      if (!categories.includes(category)) return; // reported as invalid_vocabulary
      covered.set(category, (covered.get(category) ?? new Set<string>()).add(reference.sourceId));
      if (!populated(category)) {
        const fields = fieldsOf(category);
        r.error(
          "evidence_for_absent_field",
          `${path}.supports[${k}]`,
          `claims "${category}", but ${joinAnd(fields)} ${fields.length === 1 ? "is" : "are all"} empty or not stated; remove "${category}" or record what the source states`,
        );
      }
    });
  });
  checkUnique(evidence, "evidence", "evidence reference", r, (reference) =>
    canonical({ ...reference, supports: [...reference.supports].sort(byCodePoint) }),
  );

  for (const category of categories) {
    if (covered.has(category)) continue;
    const field = fieldsOf(category).find((name) => isPopulated(record[name]));
    if (field)
      r.error("missing_evidence", field, `is populated, but no evidence reference supports "${category}"; cite the source that states it`);
  }
  return covered;
}

/** A term, outcome, relationship or status entry names its source; that source's evidence must support the field. */
function requireSameSource<F extends string>(
  covered: ReadonlyMap<F, ReadonlySet<string>>,
  category: F,
  cited: readonly (readonly [sourceId: string, field: string])[],
  r: Reporter,
): void {
  for (const [sourceId, field] of cited)
    if (!covered.get(category)?.has(sourceId))
      r.error(
        "missing_same_source_evidence",
        field,
        `cites "${sourceId}", but no evidence reference from "${sourceId}" supports "${category}"; add "${category}" to that source's evidence`,
      );
}

// --- Status histories -----------------------------------------------------------------

function checkStatusHistory(
  entries: readonly StatusEntry<string>[],
  path: string,
  required: boolean,
  r: Reporter,
  refs: Refs,
): void {
  if (required && entries.length === 0) {
    r.error("empty_status_history", path, 'needs at least one entry; when the source gives no status, record "not_stated" with that source');
    return;
  }
  // Only the dated entries are ordered: an undated entry keeps the place the sources give it.
  let latest: { date: string; index: number } | undefined;
  entries.forEach((entry, i) => {
    resolves(entry.sourceId, refs.sources, SOURCE, `${path}[${i}].sourceId`, r, refs);
    if (entry.date === null || !isCalendarDate(entry.date)) return;
    if (latest && entry.date < latest.date)
      r.error(
        "status_chronology",
        `${path}[${i}].date`,
        `${entry.date} is earlier than ${latest.date} in ${path}[${latest.index}]; list entries oldest first`,
      );
    else latest = { date: entry.date, index: i };
  });
}

/** The statuses whose stated end means something: a scheduled start, the end of a suspension, the expiry of a measure in force. */
const UNTIL_STATUSES: readonly ControlStatus[] = ["scheduled", "suspended", "in_force"];

function checkUntil(history: readonly ControlStatusEntry[], today: string, r: Reporter): void {
  history.forEach((entry, i) => {
    const { until } = entry;
    if (until === null || until === undefined || !isCalendarDate(until)) return;
    const field = `statusHistory[${i}].until`;
    let coherent = true;
    if (!UNTIL_STATUSES.includes(entry.status)) {
      coherent = false;
      r.error("invalid_until", field, `is set on a "${entry.status}" entry; only "scheduled", "suspended" and "in_force" entries carry a stated end`);
    }
    if (entry.date !== null && isCalendarDate(entry.date) && until < entry.date) {
      coherent = false;
      r.error("invalid_until", field, `${until} precedes the entry's own date, ${entry.date}`);
    }
    if (coherent && i === history.length - 1 && until < today)
      r.warn(
        "expired_until",
        field,
        `the current status "${entry.status}" ran until ${until}, before today (${today}), and no later entry records what followed; review the record against its sources and add the next status`,
      );
  });
}

// --- Financial commitments --------------------------------------------------------------

function checkMaterials(
  row: Pick<FinancialCommitment, "materialIds" | "materialAttribution" | "untrackedMaterialsAsStated">,
  event: CorpusEvent | undefined,
  r: Reporter,
  refs: Refs,
): void {
  checkUnique(row.materialIds, "materialIds", "material", r);
  row.materialIds.forEach((id, i) => {
    const field = `materialIds[${i}]`;
    if (resolves(id, refs.materials, MATERIAL, field, r, refs) && event && !event.affectedMaterialIds.includes(id))
      r.error(
        "material_not_in_event",
        field,
        `"${id}" is not among event "${event.id}"'s affectedMaterialIds; a row names only materials its event covers`,
      );
  });
  checkUnique(row.untrackedMaterialsAsStated, "untrackedMaterialsAsStated", "material", r);

  const tracked = row.materialIds.length;
  const untracked = row.untrackedMaterialsAsStated.length;
  const named = row.untrackedMaterialsAsStated.filter((m) => m.trim() !== "").length;
  const problems: string[] = [];
  if (row.materialAttribution === "tracked_only") {
    if (tracked === 0) problems.push("materialIds names no tracked material");
    if (untracked > 0) problems.push('untrackedMaterialsAsStated is populated (use "includes_untracked")');
  } else if (row.materialAttribution === "includes_untracked") {
    if (named === 0) problems.push("untrackedMaterialsAsStated names no material as the source words it");
  } else if (row.materialAttribution === "not_stated") {
    if (tracked > 0) problems.push("materialIds is populated");
    if (untracked > 0) problems.push("untrackedMaterialsAsStated is populated");
  }
  if (problems.length > 0)
    r.error(
      "material_attribution_mismatch",
      "materialAttribution",
      `"${row.materialAttribution}" does not match the materials recorded: ${problems.join("; ")}`,
    );
}

function checkTerm(term: InstrumentTerm, path: string, r: Reporter): void {
  if (term.value === null) {
    for (const key of ["qualifier", "currency", "unit"] as const)
      if (term[key] !== null)
        r.error("incoherent_value", `${path}.${key}`, "is set, but the term states no figure (value is null); keep the wording in asStated");
    return;
  }
  if (term.qualifier === null)
    r.error("incoherent_value", `${path}.qualifier`, 'is null, but the term states a figure; say whether it is "exact", "up_to", "approximately" or "at_least"');
  if (term.currency === null && term.unit === null)
    r.error(
      "incoherent_value",
      `${path}.unit`,
      'is null and so is currency; a figure needs its currency (money) or its unit as the source gives it, e.g. "%", "years", "per kg"',
    );
}

function checkOutcome(outcome: StatedOutcome, path: string, r: Reporter): void {
  const isDate = outcome.metric === "target_date";
  if (isDate) {
    if (outcome.targetDate === null) r.error("incoherent_value", `${path}.targetDate`, 'is required when metric is "target_date"');
    if (outcome.value !== null)
      r.error("incoherent_value", `${path}.value`, 'must be null when metric is "target_date"; the date goes in targetDate');
  } else if (outcome.targetDate !== null)
    r.error("incoherent_value", `${path}.targetDate`, 'is used only when metric is "target_date"');
  if (outcome.value === null) {
    for (const key of ["qualifier", "unit"] as const)
      if (outcome[key] !== null)
        r.error("incoherent_value", `${path}.${key}`, "is set, but the outcome states no figure (value is null); keep the wording in asStated");
  } else if (!isDate && outcome.qualifier === null)
    r.error("incoherent_value", `${path}.qualifier`, 'is null, but the outcome states a figure; say whether it is "exact", "up_to", "approximately" or "at_least"');
}

function checkCommitment(c: FinancialCommitment, r: Reporter, refs: Refs): void {
  const event = resolveEvent(c.eventId, r, refs);
  if (c.providerJurisdiction !== null && isOneOf(JURISDICTIONS, c.providerJurisdiction))
    resolves(
      c.providerJurisdiction,
      refs.jurisdictions,
      "a jurisdiction record in jurisdictions.json; the provider's jurisdiction must be a tracked actor, or null",
      "providerJurisdiction",
      r,
      refs,
    );

  checkUnique(c.locations, "locations", "location", r);
  c.locations.forEach((location, i) => {
    if (location.countryCode === null && location.subnational === null && location.asStated === null)
      r.error("incoherent_value", `locations[${i}]`, "names no country, place or wording; remove it (an unstated location is an empty list)");
  });

  checkUnique(c.stages, "stages", "stage", r);
  const stageCount = new Set(c.stages).size;
  const allocation = stageCount === 0 ? "not_stated" : stageCount === 1 ? "single_stage" : "multi_stage_unallocated";
  if (isOneOf(STAGE_ALLOCATIONS, c.stageAllocation) && c.stageAllocation !== allocation)
    r.error(
      "stage_allocation_mismatch",
      "stageAllocation",
      `is "${c.stageAllocation}", but ${stageCount} distinct stage${stageCount === 1 ? " is" : "s are"} recorded; "single_stage" needs exactly one stage, "multi_stage_unallocated" two or more, "not_stated" none`,
    );

  checkMaterials(c, event, r, refs);

  c.relationships.forEach((link, i) => {
    const path = `relationships[${i}]`;
    if (link.commitmentId === c.id)
      r.error("self_reference", `${path}.commitmentId`, "is this commitment's own id; a commitment cannot be part of or drawn from itself");
    else resolves(link.commitmentId, refs.commitments, COMMITMENT_TARGET, `${path}.commitmentId`, r, refs);
    resolves(link.sourceId, refs.sources, SOURCE, `${path}.sourceId`, r, refs);
  });
  checkUnique(
    c.relationships,
    "relationships",
    "commitment and relationship type (cite further sources in evidence)",
    r,
    (link) => `${link.commitmentId}\u0000${link.relationship}`,
  );

  checkStatusHistory(c.financialStatusHistory, "financialStatusHistory", true, r, refs);
  checkStatusHistory(c.implementationStatusHistory, "implementationStatusHistory", false, r, refs);

  c.terms.forEach((term, i) => {
    resolves(term.sourceId, refs.sources, SOURCE, `terms[${i}].sourceId`, r, refs);
    checkTerm(term, `terms[${i}]`, r);
  });
  checkUnique(c.terms, "terms", "term", r);
  c.outcomes.forEach((outcome, i) => {
    resolves(outcome.sourceId, refs.sources, SOURCE, `outcomes[${i}].sourceId`, r, refs);
    checkOutcome(outcome, `outcomes[${i}]`, r);
  });
  checkUnique(c.outcomes, "outcomes", "outcome", r);

  const covered = checkEvidence(c, c.evidence, COMMITMENT_FIELD_EVIDENCE, FINANCIAL_EVIDENCE_FIELDS, r, refs);
  const cited = <T extends { sourceId: string }>(entries: readonly T[], path: string) =>
    entries.map((entry, i) => [entry.sourceId, `${path}[${i}].sourceId`] as const);
  requireSameSource(covered, "relationships", cited(c.relationships, "relationships"), r);
  requireSameSource(
    covered,
    "status",
    [
      ...cited(c.financialStatusHistory, "financialStatusHistory"),
      ...cited(c.implementationStatusHistory, "implementationStatusHistory"),
    ],
    r,
  );
  requireSameSource(covered, "terms", cited(c.terms, "terms"), r);
  requireSameSource(covered, "outcomes", cited(c.outcomes, "outcomes"), r);
}

// --- Control measures -------------------------------------------------------------------

/** The target scopes that name their targets, and the list that holds them. */
const SCOPED_TARGETS: readonly (readonly [
  TargetScope,
  "targetJurisdictions" | "targetEntities" | "targetEndUsersAsStated" | "targetEndUsesAsStated",
])[] = [
  ["named_jurisdictions", "targetJurisdictions"],
  ["named_entities", "targetEntities"],
  ["end_users", "targetEndUsersAsStated"],
  ["end_uses", "targetEndUsesAsStated"],
];

function checkControl(m: ControlMeasure, today: string, r: Reporter, refs: Refs): void {
  const event = resolveEvent(m.eventId, r, refs);

  checkUnique(m.targetScopes, "targetScopes", "scope", r);
  for (const [scope, field] of SCOPED_TARGETS) {
    const targets = m[field];
    checkUnique(targets, field, "target", r);
    if (m.targetScopes.includes(scope)) {
      if (targets.every((target) => target.trim() === ""))
        r.error("target_scope_mismatch", field, `names no target, but targetScopes includes "${scope}"; name at least one as the source does, or drop the scope`);
    } else if (targets.length > 0)
      r.error("target_scope_mismatch", field, `is populated, but targetScopes does not include "${scope}"; add the scope or empty the list`);
  }

  checkMaterials(m, event, r, refs);

  checkUnique(m.productCodes, "productCodes", "system and code, with the one role the source gives it", r, (code) =>
    `${code.system}\u0000${code.code}`,
  );

  m.legalBasisEventIds.forEach((id, i) => resolves(id, refs.events, EVENT, `legalBasisEventIds[${i}]`, r, refs));
  checkUnique(m.legalBasisEventIds, "legalBasisEventIds", "event", r);

  m.modifiesMeasureIds.forEach((id, i) => {
    const field = `modifiesMeasureIds[${i}]`;
    if (id === m.id) r.error("self_reference", field, "is this measure's own id; a measure cannot modify itself");
    else resolves(id, refs.controls, CONTROL_TARGET, field, r, refs);
  });
  checkUnique(m.modifiesMeasureIds, "modifiesMeasureIds", "measure", r);
  checkUnique(m.modifiesExternalInstruments, "modifiesExternalInstruments", "instrument", r);

  checkStatusHistory(m.statusHistory, "statusHistory", true, r, refs);
  checkUntil(m.statusHistory, today, r);

  const covered = checkEvidence(m, m.evidence, CONTROL_FIELD_EVIDENCE, CONTROL_EVIDENCE_FIELDS, r, refs);
  requireSameSource(
    covered,
    "status",
    m.statusHistory.map((entry, i) => [entry.sourceId, `statusHistory[${i}].sourceId`] as const),
    r,
  );
}

// --- Cycles -------------------------------------------------------------------------------

type Edge = { to: string; label: string };

/**
 * Every cycle in a directed graph, once each: Tarjan's strongly connected
 * components, then the shortest loop from each component's smallest id,
 * written "a -part_of-> b -drawn_from-> a". Self-links are reported on their
 * own and are left out of the graph.
 */
function findCycles(edges: ReadonlyMap<string, readonly Edge[]>): { start: string; path: string }[] {
  const next = (node: string): Edge[] =>
    [...(edges.get(node) ?? [])].sort((a, b) => byCodePoint(a.to, b.to) || byCodePoint(a.label, b.label));

  let counter = 0;
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const components: string[][] = [];
  const visit = (node: string): void => {
    index.set(node, counter);
    low.set(node, counter);
    counter++;
    stack.push(node);
    onStack.add(node);
    for (const { to } of next(node)) {
      if (!index.has(to)) {
        visit(to);
        low.set(node, Math.min(low.get(node)!, low.get(to)!));
      } else if (onStack.has(to)) low.set(node, Math.min(low.get(node)!, index.get(to)!));
    }
    if (low.get(node) === index.get(node)) {
      const component: string[] = [];
      let member: string;
      do {
        member = stack.pop()!;
        onStack.delete(member);
        component.push(member);
      } while (member !== node);
      components.push(component);
    }
  };
  for (const node of [...edges.keys()].sort(byCodePoint)) if (!index.has(node)) visit(node);

  return components
    .filter((component) => component.length > 1)
    .map((component) => {
      const members = new Set(component);
      const start = [...component].sort(byCodePoint)[0];
      // Breadth-first from the start back to itself, inside the component.
      const via = new Map<string, { from: string; label: string }>();
      const queue = [start];
      for (let q = 0; q < queue.length; q++) {
        const node = queue[q];
        for (const { to, label } of next(node)) {
          if (!members.has(to)) continue;
          if (to === start) {
            const hops = [`-${label}-> ${start}`];
            for (let hop = node; hop !== start; hop = via.get(hop)!.from) hops.unshift(`-${via.get(hop)!.label}-> ${hop}`);
            return { start, path: [start, ...hops].join(" ") };
          }
          if (!via.has(to)) {
            via.set(to, { from: node, label });
            queue.push(to);
          }
        }
      }
      return { start, path: [...members].sort(byCodePoint).join(", ") }; // unreachable for a real component
    })
    .sort((a, b) => byCodePoint(a.start, b.start));
}

// --- Entry points ---------------------------------------------------------------------------

/** Parses one seed file's text. A file that is not a JSON array yields no records and one error. */
export function parseCapitalControlSeed(
  text: string,
  collection: CapitalControlCollection,
): { records: unknown[]; errors: CapitalControlIssue[] } {
  const fail = (code: CapitalControlIssueCode, message: string) => ({
    records: [],
    errors: [{ severity: "error" as const, code, collection, recordId: null, index: null, field: "", message }],
  });
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return fail("invalid_json", `is not valid JSON (${(e as Error).message})`);
  }
  if (!Array.isArray(parsed))
    return fail("not_array", `must hold a JSON array of records, not ${describe(parsed)}; an empty collection is []`);
  return { records: parsed, errors: [] };
}

const idOf = (record: unknown): string | null =>
  isObject(record) && typeof record.id === "string" && record.id.trim() !== "" ? record.id : null;

/** "fin-" or "ctl-", then lowercase letters and digits in hyphen-separated words. */
const ID_BODY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Validates both Capital & Control collections against the corpus they reference. */
export function validateCapitalControl(input: CapitalControlInput): CapitalControlResult {
  const { corpus, today } = input;
  if (!isCalendarDate(today))
    throw new Error(`validateCapitalControl: today must be a YYYY-MM-DD calendar date, got ${JSON.stringify(today)}`);

  const issues: IssueLists = { errors: [], warnings: [] };
  const records: Readonly<Record<CapitalControlCollection, readonly unknown[]>> = {
    "financial-commitments": input.financialCommitments,
    "control-measures": input.controlMeasures,
  };
  const refs: Refs = {
    events: new Map(corpus.events.map((e) => [e.id, e])),
    sources: new Set(corpus.sources.map((s) => s.id)),
    materials: new Set(corpus.materials.map((m) => m.id)),
    jurisdictions: new Set(corpus.jurisdictions.map((j) => j.id)),
    commitments: new Set(input.financialCommitments.flatMap((c) => idOf(c) ?? [])),
    controls: new Set(input.controlMeasures.flatMap((m) => idOf(m) ?? [])),
    candidates: new Set(corpus.candidateIds ?? []),
  };

  // Published ids that no fin-/ctl- id may reuse.
  const published = new Map<string, string>();
  const publish = (kind: string, ids: readonly (string | null | undefined)[]) => {
    for (const id of ids) if (id && !published.has(id)) published.set(id, kind);
  };
  publish("an event", corpus.events.map((e) => e.id));
  publish("a source", corpus.sources.map((s) => s.id));
  publish("a material", corpus.materials.map((m) => m.id));
  publish("a material slug", corpus.materials.map((m) => m.slug));
  publish("a jurisdiction", corpus.jurisdictions.map((j) => j.id));
  publish("a framing claim", (corpus.framing ?? []).map((f) => f.id));
  publish("a watched source", (corpus.watchlist ?? []).map((w) => w.id));

  const edges: Record<CapitalControlCollection, Map<string, Edge[]>> = {
    "financial-commitments": new Map(),
    "control-measures": new Map(),
  };
  const firstIndex: Record<CapitalControlCollection, Map<string, number>> = {
    "financial-commitments": new Map(),
    "control-measures": new Map(),
  };
  const addEdge = (collection: CapitalControlCollection, from: string, to: string, label: string) =>
    edges[collection].set(from, [...(edges[collection].get(from) ?? []), { to, label }]);

  for (const collection of ["financial-commitments", "control-measures"] as const) {
    const { file, prefix, example } = COLLECTIONS[collection];
    const otherPrefix = collection === "financial-commitments" ? CONTROL_MEASURE_ID_PREFIX : FINANCIAL_COMMITMENT_ID_PREFIX;
    const otherFile = collection === "financial-commitments" ? "control-measures.json" : "financial-commitments.json";
    let previous: string | undefined;

    records[collection].forEach((record, index) => {
      const id = idOf(record);
      const r = new Reporter(issues, collection, index, id);
      checkShape(record, SHAPES[collection], "", r);
      scanForCandidates(record, "", r);

      if (id !== null) {
        if (!id.startsWith(prefix) || !ID_BODY.test(id.slice(prefix.length)))
          r.error(
            "invalid_id",
            "id",
            `${JSON.stringify(id)} must be "${prefix}" followed by lowercase letters and digits in hyphen-separated words, e.g. "${example}"${
              id.startsWith(otherPrefix) ? `; "${otherPrefix}" ids belong in ${otherFile}` : ""
            }`,
          );
        const earlier = firstIndex[collection].get(id);
        if (earlier !== undefined)
          r.error("duplicate_id", "id", `${JSON.stringify(id)} is already the id of the record at index ${earlier} in ${file}`);
        else firstIndex[collection].set(id, index);
        const kind = published.get(id);
        if (kind) r.error("id_collision", "id", `${JSON.stringify(id)} is already ${kind} id in the published corpus; ids are unique across the dataset`);
        if (collection === "control-measures" && refs.commitments.has(id))
          r.error("id_collision", "id", `${JSON.stringify(id)} is also a financial commitment id; ids are unique across both collections`);
        if (previous !== undefined && previous > id)
          r.error("id_order", "id", `${JSON.stringify(id)} comes after ${JSON.stringify(previous)}; keep records in ascending code-point order of id`);
        previous = id;
      }

      if (!r.sound) return;
      if (collection === "financial-commitments") {
        const c = record as FinancialCommitment;
        checkCommitment(c, r, refs);
        for (const link of c.relationships)
          if (link.commitmentId !== c.id && refs.commitments.has(link.commitmentId))
            addEdge(collection, c.id, link.commitmentId, link.relationship);
      } else {
        const m = record as ControlMeasure;
        checkControl(m, today, r, refs);
        for (const target of m.modifiesMeasureIds)
          if (target !== m.id && refs.controls.has(target)) addEdge(collection, m.id, target, "modifies");
      }
    });
  }

  for (const { start, path } of findCycles(edges["financial-commitments"]))
    new Reporter(issues, "financial-commitments", firstIndex["financial-commitments"].get(start) ?? null, start).error(
      "cycle",
      "relationships",
      `${path} loops back; a commitment cannot be part of or drawn from itself, directly or through other commitments`,
    );
  for (const { start, path } of findCycles(edges["control-measures"]))
    new Reporter(issues, "control-measures", firstIndex["control-measures"].get(start) ?? null, start).error(
      "cycle",
      "modifiesMeasureIds",
      `${path} loops back; a measure cannot modify itself through other measures`,
    );

  return {
    ...issues,
    counts: { financialCommitments: input.financialCommitments.length, controlMeasures: input.controlMeasures.length },
  };
}
