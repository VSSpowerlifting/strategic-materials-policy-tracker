import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { CONTROL_EVIDENCE_FIELDS, FINANCIAL_EVIDENCE_FIELDS } from "@/lib/types";
import type {
  ControlEvidenceField,
  ControlMeasure,
  FinancialCommitment,
  FinancialEvidenceField,
} from "@/lib/types";
import {
  getAllEvents,
  getAllFramingClaims,
  getAllJurisdictions,
  getAllMaterials,
  getAllSources,
  getAllWatchedSources,
} from "@/lib/data";
import {
  COMMITMENT_FIELD_EVIDENCE,
  CONTROL_FIELD_EVIDENCE,
  formatCapitalControlIssue,
  isCalendarDate,
  isCanonicalDecimal,
  isCountryCode,
  isCurrencyCode,
  isTargetDate,
  parseCapitalControlSeed,
  validateCapitalControl,
} from "@/scripts/validate-capital-control";
import type { CapitalControlCorpus, CapitalControlIssue } from "@/scripts/validate-capital-control";

// Capital & Control (v0.5), Phase 2: runtime validation of the two seed files.
// Every record here is an in-memory fixture, never a seed record; ids, sources
// and wording are placeholders.

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => readFileSync(join(root, rel), "utf8");
const readJson = (rel: string): unknown => JSON.parse(read(rel));

// --- Fixtures ---------------------------------------------------------------

const CORPUS: CapitalControlCorpus = {
  events: [
    { id: "evt-alpha", affectedMaterialIds: ["mat-one", "mat-two"] },
    { id: "evt-beta", affectedMaterialIds: [] },
  ],
  sources: [{ id: "src-one" }, { id: "src-two" }],
  materials: [
    { id: "mat-one", slug: "one" },
    { id: "mat-two", slug: "two" },
    { id: "mat-three", slug: "three" },
  ],
  jurisdictions: [{ id: "us" }, { id: "australia" }],
  framing: [{ id: "fc-alpha" }],
  watchlist: [{ id: "watch-alpha" }],
  candidateIds: ["cand-example-0001", "src-proposed-only"],
};

const TODAY = "2026-09-23";

const COMMITMENT_SUPPORTS: FinancialEvidenceField[] = [
  "instrument",
  "value_role",
  "capital_source",
  "amount",
  "provider",
  "recipient",
  "stages",
  "materials",
  "status",
];

const BASE_COMMITMENT: FinancialCommitment = {
  id: "fin-alpha-grant",
  eventId: "evt-alpha",
  relationships: [],
  instrument: "grant",
  valueRole: "commitment",
  capitalSource: "public",
  amount: {
    value: "1250000",
    currency: "USD",
    qualifier: "up_to",
    amountAsStated: "up to $1.25 million",
    currencyBasis: "stated",
  },
  provider: "Example Agency",
  providerJurisdiction: "us",
  legalAuthority: null,
  recipient: "Example Minerals Ltd",
  project: null,
  facility: null,
  locations: [],
  stages: ["separation"],
  stageAllocation: "single_stage",
  materialIds: ["mat-one"],
  materialAttribution: "tracked_only",
  untrackedMaterialsAsStated: [],
  financialStatusHistory: [{ status: "announced", date: "2025-06-01", sourceId: "src-one" }],
  implementationStatusHistory: [],
  terms: [],
  outcomes: [],
  evidence: [{ sourceId: "src-one", supports: COMMITMENT_SUPPORTS, evidence: "explicit", locator: "para. 2" }],
};

const CONTROL_SUPPORTS: ControlEvidenceField[] = [
  "measure_type",
  "direction",
  "clause",
  "targets",
  "materials",
  "product_scope",
  "product_codes",
  "status",
];

const BASE_CONTROL: ControlMeasure = {
  id: "ctl-alpha-licensing",
  eventId: "evt-alpha",
  measureType: "export_licensing",
  direction: "export",
  clause: "Art. 2",
  targetScopes: ["all_jurisdictions"],
  targetJurisdictions: [],
  targetEntities: [],
  targetEndUsersAsStated: [],
  targetEndUsesAsStated: [],
  materialIds: ["mat-two"],
  materialAttribution: "tracked_only",
  untrackedMaterialsAsStated: [],
  productScopeAsStated: "Example oxides and metals",
  productCodes: [{ system: "cn_customs", code: "1234567890", role: "reference" }],
  legalBasisEventIds: [],
  legalBasisAsStated: null,
  modifiesMeasureIds: [],
  modifiesExternalInstruments: [],
  statusHistory: [{ status: "in_force", date: "2025-04-04", sourceId: "src-two" }],
  evidence: [{ sourceId: "src-two", supports: CONTROL_SUPPORTS, evidence: "explicit" }],
};

type Row = Record<string, unknown>;

const commitment = (overrides: Row = {}): Row => ({ ...structuredClone(BASE_COMMITMENT), ...overrides });
const control = (overrides: Row = {}): Row => ({ ...structuredClone(BASE_CONTROL), ...overrides });

/** The base commitment's evidence, supporting extra fields or fewer. */
const commitmentEvidence = (add: string[] = [], remove: string[] = []) => [
  { ...BASE_COMMITMENT.evidence[0], supports: [...COMMITMENT_SUPPORTS.filter((f) => !remove.includes(f)), ...add] },
];
const controlEvidence = (add: string[] = [], remove: string[] = []) => [
  { ...BASE_CONTROL.evidence[0], supports: [...CONTROL_SUPPORTS.filter((f) => !remove.includes(f)), ...add] },
];

const TERM = {
  kind: "price_floor",
  value: "100",
  qualifier: "exact",
  currency: "USD",
  unit: "per kg",
  asStated: "a floor price of 100 US dollars per kilogram",
  sourceId: "src-one",
};

const OUTCOME = {
  metric: "annual_capacity",
  value: "5000",
  qualifier: "approximately",
  unit: "tonnes per annum",
  targetDate: null,
  asStated: "about 5,000 tonnes a year",
  statedBy: "recipient",
  sourceId: "src-one",
};

/** Every evidence category populated. Runs alongside the base commitment it is part of. */
const FULL_COMMITMENT = commitment({
  id: "fin-alpha-full",
  relationships: [{ commitmentId: "fin-alpha-grant", relationship: "part_of", sourceId: "src-one" }],
  legalAuthority: "Example Act, s. 3",
  project: "Example demonstration plant",
  facility: "Example refinery",
  locations: [{ countryCode: "AU", subnational: "Western Australia", asStated: "Western Australia" }],
  implementationStatusHistory: [{ status: "construction", date: "2025-07-01", sourceId: "src-one" }],
  terms: [TERM],
  outcomes: [OUTCOME],
  evidence: [{ sourceId: "src-one", supports: [...FINANCIAL_EVIDENCE_FIELDS], evidence: "explicit" }],
});

/** Only the fields that are never empty: instrument, value role and status. */
const MINIMAL_COMMITMENT = commitment({
  instrument: "unspecified",
  capitalSource: "not_stated",
  amount: null,
  provider: null,
  providerJurisdiction: null,
  recipient: null,
  stages: [],
  stageAllocation: "not_stated",
  materialIds: [],
  materialAttribution: "not_stated",
  financialStatusHistory: [{ status: "not_stated", date: null, sourceId: "src-one" }],
  evidence: [{ sourceId: "src-one", supports: ["instrument", "value_role", "status"], evidence: "ambiguous" }],
});

/** Every evidence category populated. Runs alongside the base measure it modifies. */
const FULL_CONTROL = control({
  id: "ctl-alpha-full",
  legalBasisEventIds: ["evt-beta"],
  legalBasisAsStated: "Example Act, art. 12",
  modifiesMeasureIds: ["ctl-alpha-licensing"],
  modifiesExternalInstruments: ["Example Notice No. 1"],
  evidence: [{ sourceId: "src-two", supports: [...CONTROL_EVIDENCE_FIELDS], evidence: "explicit" }],
});

/** Only the fields that are never empty: measure type, direction and status. */
const MINIMAL_CONTROL = control({
  clause: null,
  targetScopes: [],
  materialIds: [],
  materialAttribution: "not_stated",
  productScopeAsStated: null,
  productCodes: [],
  evidence: [{ sourceId: "src-two", supports: ["measure_type", "direction", "status"], evidence: "explicit" }],
});

const link = (commitmentId: string, relationship: "part_of" | "drawn_from", sourceId = "src-one") => ({
  commitmentId,
  relationship,
  sourceId,
});

/** A commitment holding the given links, with src-one evidence for them. */
const linked = (id: string, relationships: ReturnType<typeof link>[], overrides: Row = {}) =>
  commitment({
    id,
    relationships,
    evidence: commitmentEvidence(relationships.length > 0 ? ["relationships"] : []),
    ...overrides,
  });

function validate(
  commitments: unknown[] = [],
  controls: unknown[] = [],
  options: { today?: string; corpus?: CapitalControlCorpus } = {},
) {
  return validateCapitalControl({
    financialCommitments: commitments,
    controlMeasures: controls,
    corpus: options.corpus ?? CORPUS,
    today: options.today ?? TODAY,
  });
}

/** A stable identifier for an issue: its code, record and field, never its prose. */
const key = (issue: CapitalControlIssue) => `${issue.code}@${issue.recordId ?? `#${issue.index}`}:${issue.field}`;

function assertErrors(result: ReturnType<typeof validate>, expected: string[]): void {
  assert.deepEqual(result.errors.map(key).sort(), [...expected].sort());
}

// --- Baseline ---------------------------------------------------------------

test("well-formed fixtures validate cleanly and are counted", () => {
  const result = validate([commitment()], [control()]);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
  assert.deepEqual(result.counts, { financialCommitments: 1, controlMeasures: 1 });
  assertErrors(validate([FULL_COMMITMENT, commitment()], [FULL_CONTROL, control()]), []);
  assertErrors(validate([MINIMAL_COMMITMENT], [MINIMAL_CONTROL]), []);
});

test("each seed file must parse as a JSON array", () => {
  assert.deepEqual(parseCapitalControlSeed("[]\n", "financial-commitments"), { records: [], errors: [] });
  for (const [text, code] of [
    ["[", "invalid_json"],
    ["", "invalid_json"],
    ["{}", "not_array"],
    ["null", "not_array"],
    ['"fin-a"', "not_array"],
  ]) {
    const { records, errors } = parseCapitalControlSeed(text, "control-measures");
    assert.deepEqual(records, []);
    assert.deepEqual(
      errors.map((e) => [e.severity, e.code, e.collection, e.recordId, e.index]),
      [["error", code, "control-measures", null, null]],
    );
    assert.match(formatCapitalControlIssue(errors[0]), /^control-measures\.json /);
  }
});

// --- Formats ----------------------------------------------------------------

test("figures are canonical unsigned decimal strings", () => {
  for (const ok of ["0", "5", "1250000", "0.25", "12.5", "0.5", "10", "100.001"])
    assert.ok(isCanonicalDecimal(ok), ok);
  for (const bad of [
    "-5", "+5", "1,000", "1 000", "1e6", "1E6", "05", "00", "0.50", "12.50", "1.0", "1.", ".5",
    " 5", "5 ", "5\n", "", "NaN", "Infinity", "-Infinity", "0x10", "١٢",
  ])
    assert.ok(!isCanonicalDecimal(bad), JSON.stringify(bad));

  const amount = BASE_COMMITMENT.amount!;
  const result = validate([
    commitment({
      amount: { ...amount, value: "1,250,000" },
      terms: [{ ...TERM, kind: "tax_credit_rate", value: "10.0", currency: null, unit: "%" }],
      outcomes: [{ ...OUTCOME, value: "+3000", qualifier: "at_least" }],
      evidence: commitmentEvidence(["terms", "outcomes"]),
    }),
  ]);
  assertErrors(result, [
    "invalid_decimal@fin-alpha-grant:amount.value",
    "invalid_decimal@fin-alpha-grant:terms[0].value",
    "invalid_decimal@fin-alpha-grant:outcomes[0].value",
  ]);
  assert.match(formatCapitalControlIssue(result.errors[0]), /^financial commitment "fin-alpha-grant" \(amount\.value\): "1,250,000"/);
  // A JSON number is a type error: no figure passes through floating point.
  assertErrors(validate([commitment({ amount: { ...amount, value: 1250000 } })]), [
    "invalid_type@fin-alpha-grant:amount.value",
  ]);
});

test("currency and country codes have the ISO-style format", () => {
  for (const ok of ["USD", "AUD", "CNY"]) assert.ok(isCurrencyCode(ok), ok);
  for (const bad of ["usd", "US", "USDT", "US$", " USD", "$"]) assert.ok(!isCurrencyCode(bad), bad);
  for (const ok of ["US", "AU", "NA"]) assert.ok(isCountryCode(ok), ok);
  for (const bad of ["us", "USA", "U", "U1", " US"]) assert.ok(!isCountryCode(bad), bad);

  assertErrors(
    validate([
      commitment({
        amount: { ...BASE_COMMITMENT.amount!, currency: "usd" },
        locations: [{ countryCode: "au", subnational: null, asStated: "Australia" }],
        evidence: commitmentEvidence(["location"]),
      }),
    ]),
    ["invalid_currency@fin-alpha-grant:amount.currency", "invalid_country@fin-alpha-grant:locations[0].countryCode"],
  );
  assertErrors(validate([], [control({ targetScopes: ["named_jurisdictions"], targetJurisdictions: ["CHN"] })]), [
    "invalid_country@ctl-alpha-licensing:targetJurisdictions[0]",
  ]);
});

test("dates are real calendar dates; a target date may be a year or a year-month", () => {
  for (const ok of ["2024-02-29", "2000-02-29", "2026-01-31", "2026-04-30", "2026-12-31"])
    assert.ok(isCalendarDate(ok), ok);
  for (const bad of [
    "2026-02-30", "2025-02-29", "1900-02-29", "2026-04-31", "2026-13-01", "2026-00-10", "2026-01-00",
    "2026-1-01", "20260101", "2026/01/01", "2026-01-01T00:00:00Z", " 2026-01-01", "",
  ])
    assert.ok(!isCalendarDate(bad), bad);
  for (const ok of ["2027", "2027-03", "2027-03-31"]) assert.ok(isTargetDate(ok), ok);
  for (const bad of ["27", "2027-3", "2027-13", "2027-00", "2027-02-30", "Q1 2027"]) assert.ok(!isTargetDate(bad), bad);

  const result = validate(
    [
      commitment({
        financialStatusHistory: [{ status: "announced", date: "2026-02-30", sourceId: "src-one" }],
        outcomes: [{ ...OUTCOME, metric: "target_date", value: null, qualifier: null, unit: null, targetDate: "2027-13" }],
        evidence: commitmentEvidence(["outcomes"]),
      }),
    ],
    [control({ statusHistory: [{ status: "scheduled", date: "2025-10-09", until: "2026-04-31", sourceId: "src-two" }] })],
  );
  assertErrors(result, [
    "invalid_date@fin-alpha-grant:financialStatusHistory[0].date",
    "invalid_date@fin-alpha-grant:outcomes[0].targetDate",
    "invalid_date@ctl-alpha-licensing:statusHistory[0].until",
  ]);
});

// --- Shape ------------------------------------------------------------------

test("records carry exactly the schema's fields, with the right JSON types", () => {
  const withoutStages = commitment();
  delete withoutStages.stages;
  assertErrors(validate([withoutStages]), ["missing_field@fin-alpha-grant:stages"]);
  assertErrors(validate([commitment({ stages: "separation" })]), ["invalid_type@fin-alpha-grant:stages"]);
  assertErrors(validate([commitment({ sourceIds: ["src-one"] })]), ["unknown_field@fin-alpha-grant:sourceIds"]);
  assertErrors(validate([commitment({ amount: { ...BASE_COMMITMENT.amount!, currencyCode: "USD" } })]), [
    "unknown_field@fin-alpha-grant:amount.currencyCode",
  ]);
  assertErrors(validate(["fin-alpha-grant"]), ["invalid_type@#0:"]);
  assertErrors(validate([], [control({ statusHistory: null })]), ["invalid_type@ctl-alpha-licensing:statusHistory"]);
  // Optional text may be absent or null, but a supplied string is never blank.
  assertErrors(validate([commitment({ notes: null })]), []);
  assertErrors(validate([commitment({ notes: "", provider: "  " })]), [
    "blank_string@fin-alpha-grant:notes",
    "blank_string@fin-alpha-grant:provider",
  ]);
  // A blank reference is reported once, as blank, not again as unresolved.
  assertErrors(validate([commitment({ eventId: " " })]), ["blank_string@fin-alpha-grant:eventId"]);
});

test("controlled vocabularies are enforced at runtime, nested values included", () => {
  assertErrors(
    validate([commitment({ instrument: "subsidy", providerJurisdiction: "narnia", evidence: commitmentEvidence(["amounts"]) })]),
    [
      "invalid_vocabulary@fin-alpha-grant:instrument",
      "invalid_vocabulary@fin-alpha-grant:providerJurisdiction",
      "invalid_vocabulary@fin-alpha-grant:evidence[0].supports[9]",
    ],
  );
  assertErrors(
    validate([], [control({ direction: "outbound", statusHistory: [{ status: "active", date: "2025-04-04", sourceId: "src-two" }] })]),
    ["invalid_vocabulary@ctl-alpha-licensing:direction", "invalid_vocabulary@ctl-alpha-licensing:statusHistory[0].status"],
  );
});

// --- Identity ---------------------------------------------------------------

test("ids carry their collection's prefix, are unique across the dataset and sorted", () => {
  for (const id of ["ctl-alpha-grant", "fin-", "fin-Alpha", "fin-alpha--grant", "fin_alpha", " fin-alpha", "fin-alpha-"])
    assertErrors(validate([commitment({ id })]), [`invalid_id@${id}:id`]);
  assertErrors(validate([commitment(), commitment()]), ["duplicate_id@fin-alpha-grant:id"]);
  assertErrors(validate([commitment({ id: "fin-b" }), commitment({ id: "fin-a" })]), ["id_order@fin-a:id"]);
  assertErrors(validate([commitment({ id: "fin-a" }), commitment({ id: "fin-b" })]), []);
  // No fin-/ctl- id may reuse a published id, or an id from the other collection.
  assertErrors(validate([commitment()], [], { corpus: { ...CORPUS, framing: [{ id: "fin-alpha-grant" }] } }), [
    "id_collision@fin-alpha-grant:id",
  ]);
  const crossed = validate([commitment()], [control({ id: "fin-alpha-grant" })]);
  assertErrors(crossed, ["id_collision@fin-alpha-grant:id", "invalid_id@fin-alpha-grant:id"]);
  assert.ok(crossed.errors.every((e) => e.collection === "control-measures"));
});

// --- References -------------------------------------------------------------

test("event, source, material and jurisdiction references resolve", () => {
  assertErrors(validate([commitment({ eventId: "evt-missing" })]), ["unresolved_reference@fin-alpha-grant:eventId"]);
  assertErrors(validate([commitment({ materialIds: ["mat-one", "mat-missing"] })]), [
    "unresolved_reference@fin-alpha-grant:materialIds[1]",
  ]);
  // The provider must be a tracked actor with a jurisdiction record.
  assertErrors(validate([commitment({ providerJurisdiction: "canada" })]), [
    "unresolved_reference@fin-alpha-grant:providerJurisdiction",
  ]);
  assertErrors(
    validate([
      commitment({ evidence: [...commitmentEvidence(), { sourceId: "src-missing", supports: ["amount"], evidence: "ambiguous" }] }),
    ]),
    ["unresolved_reference@fin-alpha-grant:evidence[1].sourceId"],
  );
  assertErrors(
    validate([
      commitment({
        terms: [{ ...TERM, sourceId: "src-missing" }],
        evidence: [...commitmentEvidence(["terms"]), { sourceId: "src-missing", supports: ["terms"], evidence: "explicit" }],
      }),
    ]),
    ["unresolved_reference@fin-alpha-grant:terms[0].sourceId", "unresolved_reference@fin-alpha-grant:evidence[1].sourceId"],
  );
  assertErrors(validate([], [control({ legalBasisEventIds: ["evt-missing"], evidence: controlEvidence(["legal_basis"]) })]), [
    "unresolved_reference@ctl-alpha-licensing:legalBasisEventIds[0]",
  ]);
  assertErrors(
    validate(
      [],
      [
        control({
          statusHistory: [{ status: "in_force", date: "2025-04-04", sourceId: "src-missing" }],
          evidence: [...controlEvidence(), { sourceId: "src-missing", supports: ["status"], evidence: "explicit" }],
        }),
      ],
    ),
    ["unresolved_reference@ctl-alpha-licensing:statusHistory[0].sourceId", "unresolved_reference@ctl-alpha-licensing:evidence[1].sourceId"],
  );
});

test("a row names only materials its event covers", () => {
  assertErrors(validate([commitment({ materialIds: ["mat-three"] })]), ["material_not_in_event@fin-alpha-grant:materialIds[0]"]);
  assertErrors(validate([commitment({ eventId: "evt-beta" })]), ["material_not_in_event@fin-alpha-grant:materialIds[0]"]);
  assertErrors(validate([], [control({ materialIds: ["mat-two", "mat-three"] })]), [
    "material_not_in_event@ctl-alpha-licensing:materialIds[1]",
  ]);
});

// --- Commitment consistency -------------------------------------------------

test("stageAllocation matches the number of distinct stages", () => {
  const stages = (list: string[], stageAllocation: string, evidence = commitmentEvidence()) =>
    validate([commitment({ stages: list, stageAllocation, evidence })]);
  assertErrors(stages(["separation", "refining"], "multi_stage_unallocated"), []);
  assertErrors(stages([], "not_stated", commitmentEvidence([], ["stages"])), []);
  for (const [list, allocation] of [
    [["separation", "refining"], "single_stage"],
    [["separation"], "multi_stage_unallocated"],
    [["separation"], "not_stated"],
    [[], "single_stage"],
    [[], "multi_stage_unallocated"],
  ] as const)
    assertErrors(stages([...list], allocation), ["stage_allocation_mismatch@fin-alpha-grant:stageAllocation"]);
  assertErrors(stages(["mining", "mining"], "single_stage"), ["duplicate_value@fin-alpha-grant:stages[1]"]);
  assertErrors(stages(["mining", "mining"], "multi_stage_unallocated"), [
    "duplicate_value@fin-alpha-grant:stages[1]",
    "stage_allocation_mismatch@fin-alpha-grant:stageAllocation",
  ]);
});

test("materialAttribution agrees with the tracked and untracked materials recorded", () => {
  const materials = (materialIds: string[], materialAttribution: string, untracked: string[], evidence = commitmentEvidence()) =>
    validate([commitment({ materialIds, materialAttribution, untrackedMaterialsAsStated: untracked, evidence })]);
  assertErrors(materials(["mat-one"], "includes_untracked", ["scandium"]), []);
  assertErrors(materials([], "includes_untracked", ["cobalt"]), []);
  assertErrors(materials([], "not_stated", [], commitmentEvidence([], ["materials"])), []);
  for (const [ids, attribution, untracked] of [
    [[], "tracked_only", []],
    [["mat-one"], "tracked_only", ["scandium"]],
    [["mat-one"], "includes_untracked", []],
    [["mat-one"], "not_stated", []],
    [[], "not_stated", ["cobalt"]],
  ] as const)
    assertErrors(materials([...ids], attribution, [...untracked]), [
      "material_attribution_mismatch@fin-alpha-grant:materialAttribution",
    ]);
  assertErrors(materials([], "includes_untracked", [" "]), [
    "blank_string@fin-alpha-grant:untrackedMaterialsAsStated[0]",
    "material_attribution_mismatch@fin-alpha-grant:materialAttribution",
  ]);
  assertErrors(materials(["mat-one"], "includes_untracked", ["cobalt", "cobalt"]), [
    "duplicate_value@fin-alpha-grant:untrackedMaterialsAsStated[1]",
  ]);
});

test("amounts are optional, and complete when present", () => {
  // A rate-based instrument states no amount.
  assertErrors(
    validate([
      commitment({
        instrument: "tax_credit",
        amount: null,
        terms: [{ ...TERM, kind: "tax_credit_rate", value: "10", currency: null, unit: "%", asStated: "a 10 per cent credit" }],
        evidence: commitmentEvidence(["terms"], ["amount"]),
      }),
    ]),
    [],
  );
  const amount = BASE_COMMITMENT.amount!;
  assertErrors(validate([commitment({ amount: { ...amount, amountAsStated: " ", qualifier: "roughly", currencyBasis: "assumed" } })]), [
    "blank_string@fin-alpha-grant:amount.amountAsStated",
    "invalid_vocabulary@fin-alpha-grant:amount.qualifier",
    "invalid_vocabulary@fin-alpha-grant:amount.currencyBasis",
  ]);
  const withoutCurrency: Row = { ...amount };
  delete withoutCurrency.currency;
  assertErrors(validate([commitment({ amount: withoutCurrency })]), ["missing_field@fin-alpha-grant:amount.currency"]);
  assertErrors(validate([commitment({ evidence: commitmentEvidence([], ["amount"]) })]), ["missing_evidence@fin-alpha-grant:amount"]);
});

test("term and outcome figures carry a coherent qualifier, currency, unit and date", () => {
  const withTerm = (term: Row) => validate([commitment({ terms: [{ ...TERM, ...term }], evidence: commitmentEvidence(["terms"]) })]);
  const withOutcome = (outcome: Row) =>
    validate([commitment({ outcomes: [{ ...OUTCOME, ...outcome }], evidence: commitmentEvidence(["outcomes"]) })]);
  assertErrors(withTerm({}), []);
  assertErrors(
    withTerm({ kind: "duration", value: null, qualifier: null, currency: null, unit: null, asStated: "for the life of the project" }),
    [],
  );
  assertErrors(withTerm({ value: null }), [
    "incoherent_value@fin-alpha-grant:terms[0].currency",
    "incoherent_value@fin-alpha-grant:terms[0].qualifier",
    "incoherent_value@fin-alpha-grant:terms[0].unit",
  ]);
  assertErrors(withTerm({ qualifier: null }), ["incoherent_value@fin-alpha-grant:terms[0].qualifier"]);
  assertErrors(withTerm({ currency: null, unit: null }), ["incoherent_value@fin-alpha-grant:terms[0].unit"]);
  assertErrors(withTerm({ currency: "US$" }), ["invalid_currency@fin-alpha-grant:terms[0].currency"]);
  // Units stay the source's free text.
  assertErrors(withTerm({ currency: null, unit: "tonnes of contained oxide a year" }), []);
  assertErrors(validate([commitment({ terms: [TERM, { ...TERM }], evidence: commitmentEvidence(["terms"]) })]), [
    "duplicate_value@fin-alpha-grant:terms[1]",
  ]);

  assertErrors(withOutcome({}), []);
  assertErrors(withOutcome({ metric: "direct_jobs", value: "250", unit: null }), []);
  assertErrors(withOutcome({ metric: "target_date", value: null, qualifier: null, unit: null, targetDate: "2027-03" }), []);
  assertErrors(withOutcome({ metric: "target_date", qualifier: null, unit: null }), [
    "incoherent_value@fin-alpha-grant:outcomes[0].targetDate",
    "incoherent_value@fin-alpha-grant:outcomes[0].value",
  ]);
  assertErrors(withOutcome({ targetDate: "2027" }), ["incoherent_value@fin-alpha-grant:outcomes[0].targetDate"]);
  assertErrors(withOutcome({ qualifier: null }), ["incoherent_value@fin-alpha-grant:outcomes[0].qualifier"]);
  assertErrors(withOutcome({ value: null }), [
    "incoherent_value@fin-alpha-grant:outcomes[0].qualifier",
    "incoherent_value@fin-alpha-grant:outcomes[0].unit",
  ]);
});

test("locations name something and are listed once", () => {
  const place = { countryCode: "AU", subnational: "Western Australia", asStated: "Western Australia" };
  const withLocations = (locations: Row[]) => validate([commitment({ locations, evidence: commitmentEvidence(["location"]) })]);
  assertErrors(withLocations([place, { countryCode: "NA", subnational: null, asStated: null }]), []);
  assertErrors(withLocations([{ countryCode: null, subnational: null, asStated: null }]), [
    "incoherent_value@fin-alpha-grant:locations[0]",
  ]);
  assertErrors(withLocations([place, { ...place }]), ["duplicate_value@fin-alpha-grant:locations[1]"]);
});

// --- Status histories -------------------------------------------------------

test("a commitment's financial status history is required; its implementation history is optional", () => {
  assertErrors(validate([commitment({ financialStatusHistory: [], evidence: commitmentEvidence([], ["status"]) })]), [
    "empty_status_history@fin-alpha-grant:financialStatusHistory",
  ]);
  assertErrors(validate([], [control({ statusHistory: [], evidence: controlEvidence([], ["status"]) })]), [
    "empty_status_history@ctl-alpha-licensing:statusHistory",
  ]);
  // No implementation dimension: an empty history, not a manufactured "not_applicable" row.
  assertErrors(validate([commitment({ implementationStatusHistory: [] })]), []);
  const built = { status: "construction", date: "2025-07-01", sourceId: "src-one" };
  assertErrors(validate([commitment({ implementationStatusHistory: [built] })]), []);
  // Once populated it is validated like the financial history.
  assertErrors(validate([commitment({ implementationStatusHistory: [{ ...built, status: "building" }] })]), [
    "invalid_vocabulary@fin-alpha-grant:implementationStatusHistory[0].status",
  ]);
  assertErrors(
    validate([commitment({ implementationStatusHistory: [built, { ...built, status: "feasibility", date: "2025-03-01" }] })]),
    ["status_chronology@fin-alpha-grant:implementationStatusHistory[1].date"],
  );
  assertErrors(validate([commitment({ implementationStatusHistory: [{ ...built, sourceId: "src-two" }] })]), [
    "missing_same_source_evidence@fin-alpha-grant:implementationStatusHistory[0].sourceId",
  ]);
});

test("dated status entries run oldest first; undated entries are skipped, not dated", () => {
  const history = (entries: [string, string | null][]) =>
    entries.map(([status, date]) => ({ status, date, sourceId: "src-one" }));
  assertErrors(
    validate([
      commitment({
        financialStatusHistory: history([
          ["announced", "2025-01-10"],
          ["decided", null],
          ["contracted", "2025-01-10"],
          ["disbursed", "2025-03-01"],
        ]),
      }),
    ]),
    [],
  );
  assertErrors(
    validate([
      commitment({
        financialStatusHistory: history([
          ["contracted", "2025-03-01"],
          ["partially_disbursed", null],
          ["disbursed", "2025-02-01"],
        ]),
      }),
    ]),
    ["status_chronology@fin-alpha-grant:financialStatusHistory[2].date"],
  );
  assertErrors(
    validate(
      [],
      [
        control({
          statusHistory: [
            { status: "announced", date: "2025-10-09", sourceId: "src-two" },
            { status: "in_force", date: "2025-01-01", sourceId: "src-two" },
          ],
        }),
      ],
    ),
    ["status_chronology@ctl-alpha-licensing:statusHistory[1].date"],
  );
});

test("until appears only where a status has a stated end, and never before the entry's date", () => {
  const status = (entry: Row) =>
    validate([], [control({ statusHistory: [{ date: "2025-10-09", sourceId: "src-two", ...entry }] })]);
  for (const s of ["scheduled", "suspended", "in_force"]) assertErrors(status({ status: s, until: "2027-01-01" }), []);
  for (const s of ["announced", "expired", "revoked", "investigation", "not_stated"])
    assertErrors(status({ status: s, until: "2027-01-01" }), ["invalid_until@ctl-alpha-licensing:statusHistory[0].until"]);
  assertErrors(status({ status: "suspended", until: "2025-10-01" }), ["invalid_until@ctl-alpha-licensing:statusHistory[0].until"]);
  assertErrors(status({ status: "suspended", date: null, until: "2027-01-01" }), []);
  assertErrors(status({ status: "suspended", until: null }), []);
  // Financial status entries have no stated end.
  assertErrors(
    validate([commitment({ financialStatusHistory: [{ status: "announced", date: "2025-06-01", until: "2027-01-01", sourceId: "src-one" }] })]),
    ["unknown_field@fin-alpha-grant:financialStatusHistory[0].until"],
  );
});

test("a lapsed until on the current status warns for review, and is not an error", () => {
  const history: Row[] = [
    { status: "in_force", date: "2025-04-04", sourceId: "src-two" },
    { status: "suspended", date: "2025-11-10", until: "2026-11-10", sourceId: "src-two" },
  ];
  const run = (today: string, statusHistory: Row[] = history) => validate([], [control({ statusHistory })], { today });
  const lapsed = run("2026-11-11");
  assert.deepEqual(lapsed.errors, []);
  assert.deepEqual(lapsed.warnings.map(key), ["expired_until@ctl-alpha-licensing:statusHistory[1].until"]);
  assert.equal(lapsed.warnings[0].severity, "warning");
  assert.match(
    formatCapitalControlIssue(lapsed.warnings[0]),
    /^control measure "ctl-alpha-licensing" \(statusHistory\[1\]\.until\): .*2026-11-10/,
  );
  assert.deepEqual(run("2026-11-10").warnings, []);
  assert.deepEqual(run("2026-06-01").warnings, []);
  // A later entry records what followed, so nothing is left to review.
  assert.deepEqual(run("2026-12-01", [...history, { status: "in_force", date: "2026-11-10", sourceId: "src-two" }]).warnings, []);
  assert.throws(() => run("2026-02-30"), /today/);
});

// --- Relationships ----------------------------------------------------------

test("relationships resolve, never point at their own record, and are listed once", () => {
  assertErrors(validate([linked("fin-a", [link("fin-missing", "part_of")])]), [
    "unresolved_reference@fin-a:relationships[0].commitmentId",
  ]);
  assertErrors(validate([linked("fin-a", [link("fin-a", "drawn_from")])]), ["self_reference@fin-a:relationships[0].commitmentId"]);
  // A link names a commitment, never a control measure.
  assertErrors(validate([linked("fin-a", [link("ctl-alpha-licensing", "part_of")])], [control()]), [
    "unresolved_reference@fin-a:relationships[0].commitmentId",
  ]);
  assertErrors(validate([linked("fin-a", [link("fin-b", "part_of", "src-missing")]), linked("fin-b", [])]), [
    "unresolved_reference@fin-a:relationships[0].sourceId",
    "missing_same_source_evidence@fin-a:relationships[0].sourceId",
  ]);
  assertErrors(validate([linked("fin-a", [link("fin-b", "part_of"), link("fin-b", "part_of")]), linked("fin-b", [])]), [
    "duplicate_value@fin-a:relationships[1]",
  ]);
  // The same link from a second source is still the same link: cite that source in evidence.
  assertErrors(
    validate([
      linked("fin-a", [link("fin-b", "part_of"), link("fin-b", "part_of", "src-two")], {
        evidence: [...commitmentEvidence(["relationships"]), { sourceId: "src-two", supports: ["relationships"], evidence: "explicit" }],
      }),
      linked("fin-b", []),
    ]),
    ["duplicate_value@fin-a:relationships[1]"],
  );
  // Links may cross events.
  assertErrors(
    validate([
      linked("fin-a", [link("fin-b", "drawn_from")]),
      linked("fin-b", [], {
        eventId: "evt-beta",
        materialIds: [],
        materialAttribution: "not_stated",
        evidence: commitmentEvidence([], ["materials"]),
      }),
    ]),
    [],
  );
});

test("a commitment can be part of one commitment and drawn from another, or both of one", () => {
  assertErrors(
    validate([
      linked("fin-component", [link("fin-reserve", "part_of"), link("fin-facility", "drawn_from")]),
      linked("fin-facility", []),
      linked("fin-reserve", []),
    ]),
    [],
  );
  assertErrors(
    validate([linked("fin-award", [link("fin-program", "part_of"), link("fin-program", "drawn_from")]), linked("fin-program", [])]),
    [],
  );
});

test("part_of and drawn_from links together form no cycle", () => {
  const three = validate([
    linked("fin-a", [link("fin-b", "part_of")]),
    linked("fin-b", [link("fin-c", "drawn_from")]),
    linked("fin-c", [link("fin-a", "part_of")]),
  ]);
  assertErrors(three, ["cycle@fin-a:relationships"]);
  assert.match(three.errors[0].message, /fin-a -part_of-> fin-b -drawn_from-> fin-c -part_of-> fin-a/);
  assertErrors(validate([linked("fin-a", [link("fin-b", "drawn_from")]), linked("fin-b", [link("fin-a", "part_of")])]), [
    "cycle@fin-a:relationships",
  ]);
  // A diamond is not a cycle.
  assertErrors(
    validate([
      linked("fin-a", []),
      linked("fin-b", [link("fin-a", "part_of")]),
      linked("fin-c", [link("fin-a", "part_of"), link("fin-b", "drawn_from")]),
    ]),
    [],
  );
});

// --- Field-level evidence ---------------------------------------------------

test("every populated field group needs evidence, per the shared field-to-evidence map", () => {
  for (const category of FINANCIAL_EVIDENCE_FIELDS) {
    const supports = FINANCIAL_EVIDENCE_FIELDS.filter((f) => f !== category);
    const result = validate([{ ...FULL_COMMITMENT, evidence: [{ sourceId: "src-one", supports, evidence: "explicit" }] }, commitment()]);
    const missing = result.errors.filter((e) => e.code === "missing_evidence");
    assert.deepEqual(
      missing.map((e) => [e.recordId, COMMITMENT_FIELD_EVIDENCE[e.field as keyof typeof COMMITMENT_FIELD_EVIDENCE]]),
      [["fin-alpha-full", category]],
      category,
    );
  }
  for (const category of CONTROL_EVIDENCE_FIELDS) {
    const supports = CONTROL_EVIDENCE_FIELDS.filter((f) => f !== category);
    const result = validate([], [{ ...FULL_CONTROL, evidence: [{ sourceId: "src-two", supports, evidence: "explicit" }] }, control()]);
    const missing = result.errors.filter((e) => e.code === "missing_evidence");
    assert.deepEqual(
      missing.map((e) => [e.recordId, CONTROL_FIELD_EVIDENCE[e.field as keyof typeof CONTROL_FIELD_EVIDENCE]]),
      [["ctl-alpha-full", category]],
      category,
    );
  }
});

test("evidence never claims a field group the record leaves empty", () => {
  const commitmentBase = ["instrument", "value_role", "status"];
  for (const category of FINANCIAL_EVIDENCE_FIELDS.filter((f) => !commitmentBase.includes(f)))
    assertErrors(
      validate([{ ...MINIMAL_COMMITMENT, evidence: [{ sourceId: "src-one", supports: [...commitmentBase, category], evidence: "explicit" }] }]),
      ["evidence_for_absent_field@fin-alpha-grant:evidence[0].supports[3]"],
    );
  const controlBase = ["measure_type", "direction", "status"];
  for (const category of CONTROL_EVIDENCE_FIELDS.filter((f) => !controlBase.includes(f)))
    assertErrors(
      validate([], [{ ...MINIMAL_CONTROL, evidence: [{ sourceId: "src-two", supports: [...controlBase, category], evidence: "explicit" }] }]),
      ["evidence_for_absent_field@ctl-alpha-licensing:evidence[0].supports[3]"],
    );
});

test("evidence references name at least one field, each once, and are not repeated", () => {
  assertErrors(
    validate([commitment({ evidence: [...commitmentEvidence(), { sourceId: "src-two", supports: [], evidence: "explicit" }] })]),
    ["empty_evidence_supports@fin-alpha-grant:evidence[1].supports"],
  );
  assertErrors(validate([commitment({ evidence: commitmentEvidence(["amount"]) })]), [
    "duplicate_value@fin-alpha-grant:evidence[0].supports[9]",
  ]);
  const [reference] = commitmentEvidence();
  assertErrors(validate([commitment({ evidence: [reference, { ...reference, supports: [...reference.supports].reverse() }] })]), [
    "duplicate_value@fin-alpha-grant:evidence[1]",
  ]);
  // One source may be cited twice at different pinpoints.
  assertErrors(validate([commitment({ evidence: [reference, { ...reference, locator: "para. 9" }] })]), []);
});

test("terms, outcomes, relationships and statuses cite a source whose evidence supports that field", () => {
  const fromSourceTwo = (supports: string[]) => ({ sourceId: "src-two", supports, evidence: "explicit" });
  assertErrors(validate([commitment({ terms: [{ ...TERM, sourceId: "src-two" }], evidence: commitmentEvidence(["terms"]) })]), [
    "missing_same_source_evidence@fin-alpha-grant:terms[0].sourceId",
  ]);
  assertErrors(
    validate([commitment({ terms: [{ ...TERM, sourceId: "src-two" }], evidence: [...commitmentEvidence(), fromSourceTwo(["terms"])] })]),
    [],
  );
  assertErrors(
    validate([commitment({ outcomes: [{ ...OUTCOME, sourceId: "src-two" }], evidence: commitmentEvidence(["outcomes"]) })]),
    ["missing_same_source_evidence@fin-alpha-grant:outcomes[0].sourceId"],
  );
  assertErrors(validate([linked("fin-a", [link("fin-b", "part_of", "src-two")]), linked("fin-b", [])]), [
    "missing_same_source_evidence@fin-a:relationships[0].sourceId",
  ]);
  assertErrors(
    validate([commitment({ financialStatusHistory: [{ status: "announced", date: "2025-06-01", sourceId: "src-two" }] })]),
    ["missing_same_source_evidence@fin-alpha-grant:financialStatusHistory[0].sourceId"],
  );
  assertErrors(validate([], [control({ statusHistory: [{ status: "in_force", date: "2025-04-04", sourceId: "src-one" }] })]), [
    "missing_same_source_evidence@ctl-alpha-licensing:statusHistory[0].sourceId",
  ]);
});

// --- Control measures -------------------------------------------------------

test("targetScopes agree with the named targets, stated end users and stated end uses", () => {
  const targets = (fields: Row) => validate([], [control(fields)]);
  assertErrors(
    targets({
      targetScopes: ["named_jurisdictions", "named_entities", "end_users", "end_uses"],
      targetJurisdictions: ["CN", "US"],
      targetEntities: ["Example Trading Co."],
      targetEndUsersAsStated: ["military end users"],
      targetEndUsesAsStated: ["use in weapons of mass destruction"],
    }),
    [],
  );
  assertErrors(targets({ targetScopes: [], evidence: controlEvidence([], ["targets"]) }), []);
  for (const [scope, field] of [
    ["named_jurisdictions", "targetJurisdictions"],
    ["named_entities", "targetEntities"],
    ["end_users", "targetEndUsersAsStated"],
    ["end_uses", "targetEndUsesAsStated"],
  ]) {
    assertErrors(targets({ targetScopes: [scope] }), [`target_scope_mismatch@ctl-alpha-licensing:${field}`]);
    const named = field === "targetJurisdictions" ? "CN" : "a stated target";
    assertErrors(targets({ targetScopes: ["all_jurisdictions"], [field]: [named] }), [`target_scope_mismatch@ctl-alpha-licensing:${field}`]);
  }
  assertErrors(targets({ targetScopes: ["named_entities"], targetEntities: [" "] }), [
    "blank_string@ctl-alpha-licensing:targetEntities[0]",
    "target_scope_mismatch@ctl-alpha-licensing:targetEntities",
  ]);
  assertErrors(targets({ targetScopes: ["all_jurisdictions", "all_jurisdictions"] }), [
    "duplicate_value@ctl-alpha-licensing:targetScopes[1]",
  ]);
  assertErrors(targets({ targetScopes: ["named_jurisdictions"], targetJurisdictions: ["CN", "CN"] }), [
    "duplicate_value@ctl-alpha-licensing:targetJurisdictions[1]",
  ]);
});

test("product codes use known systems and roles, and each code is listed once", () => {
  const codes = (productCodes: Row[], evidence = controlEvidence()) => validate([], [control({ productCodes, evidence })]);
  const code = { system: "cn_customs", code: "1234567890", role: "reference" };
  assertErrors(codes([code, { ...code, system: "hs" }]), []);
  assertErrors(codes([{ ...code, system: "hs6" }]), ["invalid_vocabulary@ctl-alpha-licensing:productCodes[0].system"]);
  assertErrors(codes([{ ...code, role: "primary" }]), ["invalid_vocabulary@ctl-alpha-licensing:productCodes[0].role"]);
  assertErrors(codes([{ ...code, code: " " }]), ["blank_string@ctl-alpha-licensing:productCodes[0].code"]);
  assertErrors(codes([code, { ...code }]), ["duplicate_value@ctl-alpha-licensing:productCodes[1]"]);
  // One code, one role: the same code cannot be both reference and legal scope.
  assertErrors(codes([code, { ...code, role: "legal_scope" }]), ["duplicate_value@ctl-alpha-licensing:productCodes[1]"]);
  assertErrors(codes([code], controlEvidence([], ["product_codes"])), ["missing_evidence@ctl-alpha-licensing:productCodes"]);
});

test("modified measures resolve, never name the measure itself, and form no cycle", () => {
  const modifies = (id: string, modifiesMeasureIds: string[]) =>
    control({ id, modifiesMeasureIds, evidence: controlEvidence(modifiesMeasureIds.length > 0 ? ["modified_measures"] : []) });
  assertErrors(validate([], [modifies("ctl-a", ["ctl-missing"])]), ["unresolved_reference@ctl-a:modifiesMeasureIds[0]"]);
  assertErrors(validate([], [modifies("ctl-a", ["ctl-a"])]), ["self_reference@ctl-a:modifiesMeasureIds[0]"]);
  assertErrors(validate([], [modifies("ctl-a", []), modifies("ctl-b", ["ctl-a", "ctl-a"])]), [
    "duplicate_value@ctl-b:modifiesMeasureIds[1]",
  ]);
  const cycle = validate([], [modifies("ctl-a", ["ctl-b"]), modifies("ctl-b", ["ctl-a"])]);
  assertErrors(cycle, ["cycle@ctl-a:modifiesMeasureIds"]);
  assert.match(cycle.errors[0].message, /ctl-a -modifies-> ctl-b -modifies-> ctl-a/);
  assertErrors(validate([], [modifies("ctl-a", []), modifies("ctl-b", ["ctl-a"]), modifies("ctl-c", ["ctl-b", "ctl-a"])]), []);
});

// --- Candidate isolation ----------------------------------------------------

test("no candidate identifier enters a Capital & Control row", () => {
  assertErrors(validate([commitment({ id: "fin-cand-alpha" })]), ["candidate_reference@fin-cand-alpha:id"]);
  assertErrors(validate([commitment({ eventId: "cand-example-0001" })]), ["candidate_reference@fin-alpha-grant:eventId"]);
  // A candidate's proposed source is not a published source, whatever its prefix.
  assertErrors(
    validate([
      commitment({ evidence: [...commitmentEvidence(), { sourceId: "src-proposed-only", supports: ["amount"], evidence: "explicit" }] }),
    ]),
    ["candidate_reference@fin-alpha-grant:evidence[1].sourceId"],
  );
  assertErrors(validate([commitment({ notes: "see cand-example-0001" })]), ["candidate_reference@fin-alpha-grant:notes"]);
});

// --- The committed seeds and the validator entry point ----------------------

test("the committed Capital & Control seed files validate cleanly against the corpus", () => {
  const commitments = parseCapitalControlSeed(read("data/seed/financial-commitments.json"), "financial-commitments");
  const controls = parseCapitalControlSeed(read("data/seed/control-measures.json"), "control-measures");
  assert.deepEqual([...commitments.errors, ...controls.errors], []);
  const result = validateCapitalControl({
    financialCommitments: commitments.records,
    controlMeasures: controls.records,
    corpus: {
      events: getAllEvents(),
      sources: getAllSources(),
      materials: getAllMaterials(),
      jurisdictions: getAllJurisdictions(),
      framing: getAllFramingClaims(),
      watchlist: getAllWatchedSources(),
    },
    today: TODAY,
  });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.counts, {
    financialCommitments: commitments.records.length,
    controlMeasures: controls.records.length,
  });
});

const runValidator = (cwd: string) =>
  spawnSync(process.execPath, ["--import", "tsx", "scripts/validate-data.ts"], { cwd, encoding: "utf8" });

test("npm run validate checks both seed files and reports their counts with the corpus counts", () => {
  const pkg = readJson("package.json") as { scripts: Record<string, string> };
  assert.match(pkg.scripts.validate, /\bscripts\/validate-data\.ts\b/);
  const run = runValidator(root);
  assert.equal(run.status, 0, run.stderr);
  const count = (seed: string) => (readJson(`data/seed/${seed}.json`) as unknown[]).length;
  for (const [seed, label] of [
    ["financial-commitments", "financial commitment"],
    ["control-measures", "control measure"],
    ["events", "event"],
    ["framing", "framing claim"],
    ["materials", "material"],
    ["jurisdictions", "jurisdiction"],
    ["sources", "source"],
  ])
    assert.match(run.stdout, new RegExp(`\\b${count(seed)} ${label}s?\\b`), `${seed} count missing from:\n${run.stdout}`);
});

test("npm run validate exits non-zero, naming record and field, when a Capital & Control seed is invalid", () => {
  // A throwaway copy of the validator's inputs, so no production seed is ever touched.
  const dir = mkdtempSync(join(tmpdir(), "smpt-validate-"));
  try {
    for (const rel of ["scripts", "lib", "data/seed"]) cpSync(join(root, rel), join(dir, rel), { recursive: true });
    for (const rel of ["package.json", "tsconfig.json"]) cpSync(join(root, rel), join(dir, rel));
    symlinkSync(join(root, "node_modules"), join(dir, "node_modules"), "dir");
    writeFileSync(
      join(dir, "data/seed/financial-commitments.json"),
      `${JSON.stringify([{ id: "fin-broken", amount: { value: "1,000" } }], null, 2)}\n`,
    );
    writeFileSync(join(dir, "data/seed/control-measures.json"), "{}\n");
    const run = runValidator(dir);
    assert.equal(run.status, 1, run.stdout);
    assert.match(run.stderr, /Validation FAILED/);
    assert.match(run.stderr, /financial commitment "fin-broken" \(amount\.value\): "1,000" is not a canonical unsigned decimal string/);
    assert.match(run.stderr, /financial commitment "fin-broken" \(eventId\): is required/);
    assert.match(run.stderr, /control-measures\.json must hold a JSON array/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// --- Public surface ---------------------------------------------------------

test("Capital & Control stays off every public surface, and the validator out of the build graph", () => {
  // Pages, API routes, exports and components read no Capital & Control data
  // yet; only lib/data.ts loads the seeds. Public counts stay derived from the
  // seeds (tests/capital-control-schema.test.ts), so no number is pinned here.
  const capitalControlData =
    /getAllFinancialCommitments|getFinancialCommitment|getAllControlMeasures|getControlMeasure|financial-commitments|control-measures/;
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(join(root, dir))) {
      const rel = `${dir}/${name}`;
      if (statSync(join(root, rel)).isDirectory()) walk(rel);
      else if (/\.(ts|tsx|js|jsx|mjs)$/.test(name)) {
        const source = read(rel);
        if (source.includes("validate-capital-control")) offenders.push(`${rel} imports the validator`);
        if (rel !== "lib/data.ts" && capitalControlData.test(source)) offenders.push(`${rel} reads Capital & Control data`);
      }
    }
  };
  for (const dir of ["app", "components", "lib"]) walk(dir);
  assert.deepEqual(offenders, []);
});
