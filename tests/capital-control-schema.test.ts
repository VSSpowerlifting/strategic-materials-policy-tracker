import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
  FINANCIAL_STATUSES,
  IMPLEMENTATION_STATUSES,
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
} from "@/lib/types";
import type {
  ControlMeasure,
  ControlStatusEntry,
  EvidenceReference,
  FinancialCommitment,
  FinancialStatusEntry,
  InstrumentTerm,
  MonetaryAmount,
  PolicyEvent,
  StatedOutcome,
} from "@/lib/types";
import {
  capitalSourceLabels,
  controlDirectionLabels,
  controlEvidenceFieldLabels,
  controlMeasureTypeLabels,
  controlStatusLabels,
  currencyBasisLabels,
  evidenceLevelLabels,
  financialEvidenceFieldLabels,
  financialInstrumentLabels,
  financialStatusLabels,
  implementationStatusLabels,
  materialAttributionLabels,
  outcomeAttributionLabels,
  outcomeMetricLabels,
  productCodeRoleLabels,
  productCodeSystemLabels,
  stageAllocationLabels,
  supplyChainStageLabels,
  targetScopeLabels,
  termKindLabels,
  valueQualifierLabels,
  valueRoleLabels,
} from "@/lib/labels";
import {
  getAllControlMeasures,
  getAllEvents,
  getAllFinancialCommitments,
  getAllFramingClaims,
  getAllJurisdictions,
  getAllMaterials,
  getAllSources,
  getAllWatchedSources,
  getControlMeasureById,
  getControlMeasuresByEvent,
  getDatasetSummary,
  getFinancialCommitmentById,
  getFinancialCommitmentsByEvent,
} from "@/lib/data";

// Capital & Control (v0.5), Phase 1: the data model and its loaders exist, and
// both seed files are deliberately empty. Validation rules arrive in Phase 2.

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => readFileSync(join(root, rel), "utf8");
const readJson = (rel: string): unknown => JSON.parse(read(rel));

const COMMITMENTS_FILE = "data/seed/financial-commitments.json";
const CONTROLS_FILE = "data/seed/control-measures.json";

// --- Controlled vocabularies ------------------------------------------------

const VOCABULARIES: [name: string, values: readonly string[], labels: Record<string, string>][] = [
  ["FINANCIAL_INSTRUMENTS", FINANCIAL_INSTRUMENTS, financialInstrumentLabels],
  ["VALUE_ROLES", VALUE_ROLES, valueRoleLabels],
  ["CAPITAL_SOURCES", CAPITAL_SOURCES, capitalSourceLabels],
  ["FINANCIAL_STATUSES", FINANCIAL_STATUSES, financialStatusLabels],
  ["IMPLEMENTATION_STATUSES", IMPLEMENTATION_STATUSES, implementationStatusLabels],
  ["SUPPLY_CHAIN_STAGES", SUPPLY_CHAIN_STAGES, supplyChainStageLabels],
  ["STAGE_ALLOCATIONS", STAGE_ALLOCATIONS, stageAllocationLabels],
  ["MATERIAL_ATTRIBUTIONS", MATERIAL_ATTRIBUTIONS, materialAttributionLabels],
  ["VALUE_QUALIFIERS", VALUE_QUALIFIERS, valueQualifierLabels],
  ["CURRENCY_BASES", CURRENCY_BASES, currencyBasisLabels],
  ["TERM_KINDS", TERM_KINDS, termKindLabels],
  ["OUTCOME_METRICS", OUTCOME_METRICS, outcomeMetricLabels],
  ["OUTCOME_ATTRIBUTIONS", OUTCOME_ATTRIBUTIONS, outcomeAttributionLabels],
  ["EVIDENCE_LEVELS", EVIDENCE_LEVELS, evidenceLevelLabels],
  ["FINANCIAL_EVIDENCE_FIELDS", FINANCIAL_EVIDENCE_FIELDS, financialEvidenceFieldLabels],
  ["CONTROL_MEASURE_TYPES", CONTROL_MEASURE_TYPES, controlMeasureTypeLabels],
  ["CONTROL_DIRECTIONS", CONTROL_DIRECTIONS, controlDirectionLabels],
  ["CONTROL_STATUSES", CONTROL_STATUSES, controlStatusLabels],
  ["TARGET_SCOPES", TARGET_SCOPES, targetScopeLabels],
  ["PRODUCT_CODE_SYSTEMS", PRODUCT_CODE_SYSTEMS, productCodeSystemLabels],
  ["PRODUCT_CODE_ROLES", PRODUCT_CODE_ROLES, productCodeRoleLabels],
  ["CONTROL_EVIDENCE_FIELDS", CONTROL_EVIDENCE_FIELDS, controlEvidenceFieldLabels],
];

for (const [name, values, labels] of VOCABULARIES) {
  test(`${name}: unique snake_case values, each with exactly one distinct label`, () => {
    assert.ok(values.length > 0, `${name} is empty`);
    assert.equal(new Set(values).size, values.length, `${name} repeats a value`);
    for (const v of values) assert.match(v, /^[a-z][a-z0-9_]*$/, `${name}: "${v}" is not snake_case`);
    assert.deepEqual(
      Object.keys(labels).sort(),
      [...values].sort(),
      `${name}: the label map must cover exactly its values`,
    );
    const texts = values.map((v) => labels[v]);
    for (const [i, t] of texts.entries())
      assert.ok(typeof t === "string" && t.trim().length > 0, `${name}: "${values[i]}" has an empty label`);
    assert.equal(new Set(texts).size, texts.length, `${name}: two values share one label`);
  });
}

test("the vocabularies carry every value the Capital & Control model requires", () => {
  const requires = (name: string, values: readonly string[], required: string[]) => {
    for (const r of required) assert.ok(values.includes(r), `${name} lacks "${r}"`);
  };
  requires("FINANCIAL_INSTRUMENTS", FINANCIAL_INSTRUMENTS, [
    "grant", "loan", "loan_guarantee", "equity", "tax_credit", "price_floor",
    "offtake", "procurement_right", "stockpile_purchase", "unspecified",
  ]);
  requires("VALUE_ROLES", VALUE_ROLES, [
    "commitment", "program_envelope", "budget_appropriation", "lending_authority",
    "expected_co_investment", "private_financing", "recipient_own_funds", "total_project_cost",
  ]);
  requires("CAPITAL_SOURCES", CAPITAL_SOURCES, [
    "public", "public_enterprise", "mixed_vehicle", "private", "not_stated",
  ]);
  requires("FINANCIAL_STATUSES", FINANCIAL_STATUSES, [
    "announced", "authorized", "allocated", "decided", "contracted",
    "partially_disbursed", "disbursed", "withdrawn", "not_stated",
  ]);
  requires("IMPLEMENTATION_STATUSES", IMPLEMENTATION_STATUSES, [
    "announced", "feasibility", "construction", "commissioning", "operational",
    "suspended", "cancelled", "not_stated", "not_applicable",
  ]);
  requires("CONTROL_STATUSES", CONTROL_STATUSES, [
    "announced", "scheduled", "in_force", "suspended", "expired", "revoked",
    "investigation", "not_stated",
  ]);
  requires("SUPPLY_CHAIN_STAGES", SUPPLY_CHAIN_STAGES, [
    "exploration", "mining", "separation", "processing", "refining",
    "component_manufacturing", "final_manufacturing", "recycling", "stockpiling",
    "research_development", "cross_cutting",
  ]);
  requires("STAGE_ALLOCATIONS", STAGE_ALLOCATIONS, [
    "single_stage", "multi_stage_unallocated", "not_stated",
  ]);
  requires("VALUE_QUALIFIERS", VALUE_QUALIFIERS, ["exact", "up_to", "approximately", "at_least"]);
  requires("CURRENCY_BASES", CURRENCY_BASES, ["stated", "issuer_context"]);
  requires("TERM_KINDS", TERM_KINDS, [
    "tax_credit_rate", "price_floor", "annual_reimbursement_cap", "lending_rate", "duration",
    "procurement_share", "offtake_share", "quantity_covenant", "capacity_covenant",
  ]);
  requires("OUTCOME_METRICS", OUTCOME_METRICS, [
    "annual_capacity", "supply_share", "procurement_right_share", "direct_jobs", "target_date", "other",
  ]);
  requires("EVIDENCE_LEVELS", EVIDENCE_LEVELS, ["explicit", "ambiguous"]);
  requires("FINANCIAL_EVIDENCE_FIELDS", FINANCIAL_EVIDENCE_FIELDS, [
    "instrument", "value_role", "capital_source", "amount", "provider", "recipient", "project",
    "location", "stages", "materials", "status", "terms", "outcomes", "legal_authority",
  ]);
  requires("CONTROL_MEASURE_TYPES", CONTROL_MEASURE_TYPES, [
    "export_licensing", "export_prohibition", "extraterritorial_licensing", "end_use_restriction",
    "decontrol", "suspension", "trade_investigation", "import_restriction",
    "investment_divestiture", "customs_enforcement", "domestic_production_control",
    "contractual_ownership_covenant",
  ]);
  requires("CONTROL_DIRECTIONS", CONTROL_DIRECTIONS, [
    "export", "re_export", "import", "inbound_investment", "outbound_investment", "domestic",
  ]);
  requires("CONTROL_EVIDENCE_FIELDS", CONTROL_EVIDENCE_FIELDS, [
    "measure_type", "direction", "clause", "targets", "materials", "product_scope",
    "product_codes", "legal_basis", "modified_measures", "status",
  ]);
  requires("PRODUCT_CODE_ROLES", PRODUCT_CODE_ROLES, ["reference", "legal_scope"]);
  // Absence is recorded as null or an empty array, never as a "not stated" evidence level.
  assert.ok(!(EVIDENCE_LEVELS as readonly string[]).includes("not_stated"));
});

// --- Seed files ---------------------------------------------------------------

for (const file of [COMMITMENTS_FILE, CONTROLS_FILE]) {
  test(`${file} parses as a JSON array`, () => {
    assert.ok(Array.isArray(readJson(file)), `${file} must hold a JSON array`);
  });
}

test("Phase 1 adds the model only: both Capital & Control seed files are empty", () => {
  assert.deepEqual(readJson(COMMITMENTS_FILE), []);
  assert.deepEqual(readJson(CONTROLS_FILE), []);
  assert.deepEqual(getAllFinancialCommitments(), []);
  assert.deepEqual(getAllControlMeasures(), []);
});

test("the loaders read exactly the seed files", () => {
  assert.equal(getAllFinancialCommitments().length, (readJson(COMMITMENTS_FILE) as unknown[]).length);
  assert.equal(getAllControlMeasures().length, (readJson(CONTROLS_FILE) as unknown[]).length);
});

// --- Loaders ------------------------------------------------------------------

test("list loaders are deterministic, ordered by id, and hand out fresh arrays", () => {
  const loaders: [string, () => { id: string }[]][] = [
    ["getAllFinancialCommitments", getAllFinancialCommitments],
    ["getAllControlMeasures", getAllControlMeasures],
  ];
  for (const [name, load] of loaders) {
    const first = load();
    const second = load();
    assert.deepEqual(first, second, `${name} is not deterministic`);
    assert.notEqual(first, second, `${name} must return a new array on every call`);
    const ids = first.map((r) => r.id);
    assert.deepEqual(ids, [...ids].sort(), `${name} must order records by id`);
    first.push({ id: "mutation-probe" });
    assert.deepEqual(load(), second, `mutating ${name}'s result must not leak into the next call`);
  }
});

test("id lookups return undefined for unknown ids and the stored record otherwise", () => {
  for (const id of ["fin-unknown", "ctl-unknown", "", getAllEvents()[0].id]) {
    assert.equal(getFinancialCommitmentById(id), undefined);
    assert.equal(getControlMeasureById(id), undefined);
  }
  for (const c of getAllFinancialCommitments()) assert.equal(getFinancialCommitmentById(c.id), c);
  for (const m of getAllControlMeasures()) assert.equal(getControlMeasureById(m.id), m);
});

test("event getters return only that event's rows, as fresh arrays, and mutate nothing", () => {
  const eventsBefore = JSON.stringify(getAllEvents());
  for (const id of [...getAllEvents().map((e) => e.id), "evt-unknown", ""]) {
    const commitments = getFinancialCommitmentsByEvent(id);
    const controls = getControlMeasuresByEvent(id);
    assert.ok(commitments.every((c) => c.eventId === id));
    assert.ok(controls.every((m) => m.eventId === id));
    assert.deepEqual(getFinancialCommitmentsByEvent(id), commitments, "not deterministic");
    assert.deepEqual(getControlMeasuresByEvent(id), controls, "not deterministic");
    assert.notEqual(getFinancialCommitmentsByEvent(id), commitments, "must return a fresh array");
    assert.notEqual(getControlMeasuresByEvent(id), controls, "must return a fresh array");
    commitments.length = 0;
    controls.length = 0;
  }
  assert.equal(JSON.stringify(getAllEvents()), eventsBefore, "event getters must not alter events");
});

test("Phase 1: every event getter returns an empty array", () => {
  for (const e of getAllEvents()) {
    assert.deepEqual(getFinancialCommitmentsByEvent(e.id), []);
    assert.deepEqual(getControlMeasuresByEvent(e.id), []);
  }
});

// --- Public surface -----------------------------------------------------------

// The Capital & Control foundation adds no public records. These are the public
// counts on main when it landed (4d18c3b). A change that promotes or removes
// public records must update this baseline deliberately, in the same PR.
test("existing public counts are unchanged by the Capital & Control foundation", () => {
  assert.deepEqual(getDatasetSummary(), {
    events: 32,
    framingClaims: 36,
    materials: 11,
    jurisdictions: 8,
    sources: 56,
  });
  const seedLength = (file: string) => (readJson(`data/seed/${file}`) as unknown[]).length;
  assert.equal(getAllEvents().length, seedLength("events.json"));
  assert.equal(getAllSources().length, seedLength("sources.json"));
  assert.equal(getAllFramingClaims().length, seedLength("framing.json"));
  assert.equal(getAllMaterials().length, seedLength("materials.json"));
  assert.equal(getAllJurisdictions().length, seedLength("jurisdictions.json"));
  assert.equal(getAllWatchedSources().length, seedLength("watchlist.json"));
});

test("no candidate data can enter the loaders or the public build path", () => {
  const dataSource = read("lib/data.ts");
  const jsonImports = [...dataSource.matchAll(/from\s+"([^"]+\.json)"/g)].map((m) => m[1]);
  assert.ok(jsonImports.includes(`@/${COMMITMENTS_FILE}`), "lib/data.ts must load the commitments seed");
  assert.ok(jsonImports.includes(`@/${CONTROLS_FILE}`), "lib/data.ts must load the controls seed");
  for (const p of jsonImports) assert.ok(p.startsWith("@/data/seed/"), `lib/data.ts imports non-seed JSON: ${p}`);

  // No module on the public build path imports anything under data/candidates.
  const importsCandidates = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)["'][^"']*data\/candidates[^"']*["']/;
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(join(root, dir))) {
      const rel = `${dir}/${name}`;
      if (statSync(join(root, rel)).isDirectory()) walk(rel);
      else if (/\.(ts|tsx|js|mjs)$/.test(name) && importsCandidates.test(read(rel))) offenders.push(rel);
    }
  };
  for (const dir of ["app", "lib", "components"]) walk(dir);
  assert.deepEqual(offenders, [], "public build path must not import candidate files");

  for (const file of [COMMITMENTS_FILE, CONTROLS_FILE])
    assert.ok(!/\bcand-/.test(read(file)), `${file} carries a candidate id`);
  for (const r of [...getAllFinancialCommitments(), ...getAllControlMeasures()])
    assert.ok(!r.id.startsWith("cand-"), `candidate id reached a loader: ${r.id}`);
});

test("fin- and ctl- are reserved, documented, and collide with no existing id", () => {
  assert.equal(FINANCIAL_COMMITMENT_ID_PREFIX, "fin-");
  assert.equal(CONTROL_MEASURE_ID_PREFIX, "ctl-");
  // "fc-" belongs to framing claims and "cand-" to private candidates.
  for (const p of [FINANCIAL_COMMITMENT_ID_PREFIX, CONTROL_MEASURE_ID_PREFIX])
    for (const q of ["evt-", "src-", "fc-", "cand-"])
      assert.ok(!p.startsWith(q) && !q.startsWith(p), `${p} overlaps the existing prefix ${q}`);

  const existingIds = [
    ...getAllEvents(),
    ...getAllSources(),
    ...getAllFramingClaims(),
    ...getAllMaterials(),
    ...getAllJurisdictions(),
    ...getAllWatchedSources(),
  ].map((r) => r.id);
  for (const id of existingIds)
    assert.ok(!id.startsWith("fin-") && !id.startsWith("ctl-"), `existing id "${id}" uses a reserved prefix`);
  for (const c of getAllFinancialCommitments()) assert.ok(c.id.startsWith(FINANCIAL_COMMITMENT_ID_PREFIX));
  for (const m of getAllControlMeasures()) assert.ok(m.id.startsWith(CONTROL_MEASURE_ID_PREFIX));

  for (const doc of ["README.md", "CLAUDE.md", "app/methodology/page.tsx"]) {
    const text = read(doc);
    assert.ok(text.includes("fin-") && text.includes("ctl-"), `${doc} must document the fin- and ctl- prefixes`);
  }
});

// --- Compile-time guarantees --------------------------------------------------
//
// Tests are part of the TypeScript project, so `npm run typecheck` checks the
// annotated constants below. If money became a number, or a derivable field
// (a source list, a current status, event-level stages) were stored, they would
// stop compiling.

type IsExactly<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type HasKey<T, K extends PropertyKey> = K extends keyof T ? true : false;

test("money and figures are strings, statuses are histories, and no derivable field is stored", () => {
  const amountIsString: IsExactly<MonetaryAmount["value"], string> = true;
  const termValueIsString: IsExactly<InstrumentTerm["value"], string | null> = true;
  const outcomeValueIsString: IsExactly<StatedOutcome["value"], string | null> = true;
  const amountKeepsWording: HasKey<MonetaryAmount, "amountAsStated"> = true;
  const amountKeepsBasis: HasKey<MonetaryAmount, "currencyBasis"> = true;
  const entryHasSource: HasKey<FinancialStatusEntry, "sourceId"> = true;
  const controlEntryHasDate: HasKey<ControlStatusEntry, "date"> = true;
  const evidenceNamesFields: HasKey<EvidenceReference<"amount">, "supports"> = true;
  assert.deepEqual(
    [
      amountIsString,
      termValueIsString,
      outcomeValueIsString,
      amountKeepsWording,
      amountKeepsBasis,
      entryHasSource,
      controlEntryHasDate,
      evidenceNamesFields,
    ],
    [true, true, true, true, true, true, true, true],
  );

  const commitmentStoresSourceIds: HasKey<FinancialCommitment, "sourceIds"> = false;
  const controlStoresSourceIds: HasKey<ControlMeasure, "sourceIds"> = false;
  const commitmentStoresCurrentStatus: HasKey<FinancialCommitment, "currentStatus"> = false;
  const controlStoresCurrentStatus: HasKey<ControlMeasure, "currentStatus"> = false;
  const eventStoresStages: HasKey<PolicyEvent, "stages"> = false;
  assert.deepEqual(
    [
      commitmentStoresSourceIds,
      controlStoresSourceIds,
      commitmentStoresCurrentStatus,
      controlStoresCurrentStatus,
      eventStoresStages,
    ],
    [false, false, false, false, false],
  );
});
