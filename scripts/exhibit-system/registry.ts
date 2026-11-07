// Exhibit pattern registry: loads and validates patterns/<id>.json, the
// fixtures and the demo deck spec. Pure (node:fs only; no pptxgenjs).
//
//   npm run exhibits:registry   # regenerate exhibit-registry.json
//
// The registry JSON is a generated, committed artifact. A test fails when it
// is out of date with the pattern files.

import fs from "node:fs";
import path from "node:path";
import { arr, ContractError, num, obj, oneOf, str, strList } from "./contract";
import { DEMO_DECK_SPEC, FIXTURES_DIR, PATTERNS_DIR, REGISTRY_FILE, REPO } from "./paths";
import { EDITABILITY_TIERS, type EditabilityTier, type Fixture } from "./types";

export const FAMILIES = {
  A: "Comparison",
  B: "Change between two observations",
  C: "Time series",
  D: "Composition",
  E: "Reconciliation",
  F: "Sensitivity",
  G: "Relationship",
  H: "Distribution and uncertainty",
  I: "Time and sequence",
  J: "Structure and flow",
  K: "Lookup and decision",
} as const;
export type FamilyCode = keyof typeof FAMILIES;
const FAMILY_CODES = Object.keys(FAMILIES) as FamilyCode[];

/** What the reader is trying to learn. The selection workflow starts here. */
export const QUESTION_TYPES = [
  "rank",
  "compare-two-observations",
  "trend",
  "composition",
  "reconcile",
  "sensitivity",
  "relationship",
  "distribution",
  "uncertainty",
  "sequence",
  "state",
  "flow",
  "lookup",
  "decision",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

/** Properties of the evidence that a pattern requires or cannot honestly show. */
export const DATA_TRAITS = [
  "single-measure",
  "two-observations",
  "time-axis",
  "several-series",
  "parts-of-whole",
  "status-stages",
  "additive-movements",
  "non-comparable-bases",
  "model-output",
  "two-measures",
  "third-measure",
  "sample",
  "intervals",
  "dated-events",
  "parallel-tracks",
  "durations",
  "states",
  "conditions",
  "quantified-flows",
  "edges",
  "criteria",
  "exact-values",
  "locations",
] as const;
export type DataTrait = (typeof DATA_TRAITS)[number];

/**
 * Public reference examples (VISUAL_REPERTOIRE_AND_REFERENCES.md, "Public
 * reference gallery"). SMPT patterns adapt the analytical principle only.
 */
export const REFERENCES = {
  "mckinsey-2025-small-multiples": "McKinsey, year in charts (8 Dec 2025): five aligned line panels",
  "mckinsey-2025-two-period-rank": "McKinsey, year in charts (8 Dec 2025): 2019 vs 2024 export ranking",
  "bcg-sia-2022-exhibit-6": "BCG and SIA (Nov 2022), PDF p16, Exhibit 6: zero-based labelled bars",
  "bain-pe-2025-figure-2": "Bain, Global Private Equity Report 2025, PDF p44, Figure 2: value-creation bridge",
  "strategyand-2018-exhibit-5": "Strategy&, Every Molecule (2018), p13, Exhibit 5: value-chain network",
  "strategyand-2018-exhibit-6": "Strategy&, Every Molecule (2018), p14, Exhibit 6: option comparisons",
  "smpt-repertoire-2026": "SMPT original repertoire examples (examples/05-visual-repertoire.svg)",
} as const;
export type ReferenceKey = keyof typeof REFERENCES;

export interface ContractField {
  field: string;
  type: string;
  notes: string;
}

export interface Exclusion {
  form: string;
  reason: string;
}

export interface PatternSpec {
  id: string;
  name: string;
  family_code: FamilyCode;
  family: string;
  order: number;
  reader_question: string;
  relationship: string;
  question_types: QuestionType[];
  requires: DataTrait[];
  incompatible: DataTrait[];
  capacity: { min_items: number; max_items: number; what: string };
  use_when: string[];
  avoid_when: string[];
  data_contract: ContractField[];
  units: string;
  editability: {
    tier: EditabilityTier;
    editable: string[];
    not_data_bound: string[];
    raster: string[];
  };
  renderer: string;
  fixture: string;
  integrity_rules: string[];
  table_alternative: string;
  variations: string[];
  limitations: string[];
  excluded_alternatives: Exclusion[];
  references: ReferenceKey[];
}

function parsePattern(raw: unknown, file: string): PatternSpec {
  const o = obj(raw, file);
  const p = (k: string) => `${file}.${k}`;
  const family_code = oneOf(o.family_code, FAMILY_CODES, p("family_code"));
  const cap = obj(o.capacity, p("capacity"));
  const ed = obj(o.editability, p("editability"));
  const spec: PatternSpec = {
    id: str(o.id, p("id")),
    name: str(o.name, p("name")),
    family_code,
    family: FAMILIES[family_code],
    order: num(o.order, p("order")),
    reader_question: str(o.reader_question, p("reader_question")),
    relationship: str(o.relationship, p("relationship")),
    question_types: arr(o.question_types, p("question_types")).map((q, i) =>
      oneOf(q, QUESTION_TYPES, `${p("question_types")}[${i}]`),
    ),
    requires: arr(o.requires, p("requires"), 0).map((t, i) => oneOf(t, DATA_TRAITS, `${p("requires")}[${i}]`)),
    incompatible: arr(o.incompatible, p("incompatible"), 0).map((t, i) =>
      oneOf(t, DATA_TRAITS, `${p("incompatible")}[${i}]`),
    ),
    capacity: {
      min_items: num(cap.min_items, p("capacity.min_items")),
      max_items: num(cap.max_items, p("capacity.max_items")),
      what: str(cap.what, p("capacity.what")),
    },
    use_when: strList(o.use_when, p("use_when")),
    avoid_when: strList(o.avoid_when, p("avoid_when")),
    data_contract: arr(o.data_contract, p("data_contract")).map((f, i) => {
      const fo = obj(f, `${p("data_contract")}[${i}]`);
      return {
        field: str(fo.field, `${p("data_contract")}[${i}].field`),
        type: str(fo.type, `${p("data_contract")}[${i}].type`),
        notes: str(fo.notes, `${p("data_contract")}[${i}].notes`),
      };
    }),
    units: str(o.units, p("units")),
    editability: {
      tier: oneOf(ed.tier, EDITABILITY_TIERS, p("editability.tier")),
      editable: strList(ed.editable, p("editability.editable")),
      not_data_bound: strList(ed.not_data_bound, p("editability.not_data_bound"), 0),
      raster: strList(ed.raster, p("editability.raster"), 0),
    },
    renderer: str(o.renderer, p("renderer")),
    fixture: str(o.fixture, p("fixture")),
    integrity_rules: strList(o.integrity_rules, p("integrity_rules")),
    table_alternative: str(o.table_alternative, p("table_alternative")),
    variations: strList(o.variations, p("variations")),
    limitations: strList(o.limitations, p("limitations")),
    excluded_alternatives: arr(o.excluded_alternatives, p("excluded_alternatives")).map((x, i) => {
      const xo = obj(x, `${p("excluded_alternatives")}[${i}]`);
      return {
        form: str(xo.form, `${p("excluded_alternatives")}[${i}].form`),
        reason: str(xo.reason, `${p("excluded_alternatives")}[${i}].reason`),
      };
    }),
    references: arr(o.references, p("references")).map((r, i) =>
      oneOf(r, Object.keys(REFERENCES) as ReferenceKey[], `${p("references")}[${i}]`),
    ),
  };
  if (spec.capacity.min_items > spec.capacity.max_items) {
    throw new ContractError(`${file}: capacity.min_items exceeds max_items`);
  }
  return spec;
}

/** All pattern specs, validated, in registry order (family code, then order). */
export function loadRegistry(dir = PATTERNS_DIR): PatternSpec[] {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  const errors: string[] = [];
  const specs: PatternSpec[] = [];
  for (const f of files) {
    try {
      const spec = parsePattern(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")), f);
      if (`${spec.id}.json` !== f) throw new ContractError(`${f}: id "${spec.id}" does not match file name`);
      if (!fs.existsSync(path.join(REPO, spec.renderer))) throw new ContractError(`${f}: renderer ${spec.renderer} missing`);
      if (!fs.existsSync(path.join(FIXTURES_DIR, path.basename(spec.fixture)))) {
        throw new ContractError(`${f}: fixture ${spec.fixture} missing`);
      }
      specs.push(spec);
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  const ids = new Set<string>();
  for (const s of specs) {
    if (ids.has(s.id)) errors.push(`duplicate pattern id ${s.id}`);
    ids.add(s.id);
  }
  if (errors.length) throw new ContractError(`pattern registry invalid:\n  ${errors.join("\n  ")}`);
  return specs.sort((a, b) =>
    a.family_code === b.family_code ? a.order - b.order || a.id.localeCompare(b.id) : a.family_code.localeCompare(b.family_code),
  );
}

export function parseFixture(raw: unknown, file: string): Fixture {
  const o = obj(raw, file);
  const layout = o.layout === undefined ? undefined : oneOf(o.layout, ["split", "wide"] as const, `${file}.layout`);
  if (o.classification !== "synthetic-demonstration") {
    throw new ContractError(`${file}: classification must be "synthetic-demonstration"`);
  }
  if (o.data === undefined) throw new ContractError(`${file}: data missing`);
  return {
    pattern: str(o.pattern, `${file}.pattern`),
    classification: "synthetic-demonstration",
    title: str(o.title, `${file}.title`),
    subtitle: str(o.subtitle, `${file}.subtitle`),
    annotation: str(o.annotation, `${file}.annotation`),
    source: str(o.source, `${file}.source`),
    visual_text: strList(o.visual_text, `${file}.visual_text`),
    layout,
    data: o.data,
  };
}

/** Fixture by file stem (usually the pattern id; demo-deck variants use other stems). */
export function loadFixture(stem: string): Fixture {
  const file = path.join(FIXTURES_DIR, `${stem}.json`);
  return parseFixture(JSON.parse(fs.readFileSync(file, "utf8")), `${stem}.json`);
}

export interface DeckSpec {
  title: string;
  cover_lines: string[];
  slides: { fixture: string; label: string }[];
}

export function loadDeckSpec(file = DEMO_DECK_SPEC): DeckSpec {
  const o = obj(JSON.parse(fs.readFileSync(file, "utf8")), path.basename(file));
  return {
    title: str(o.title, "deck.title"),
    cover_lines: strList(o.cover_lines, "deck.cover_lines"),
    slides: arr(o.slides, "deck.slides").map((s, i) => {
      const so = obj(s, `deck.slides[${i}]`);
      return { fixture: str(so.fixture, `deck.slides[${i}].fixture`), label: str(so.label, `deck.slides[${i}].label`) };
    }),
  };
}

/** The generated registry document (deterministic: no timestamps). */
export function registryDocument(specs: PatternSpec[]): unknown {
  return {
    note: "Generated by scripts/exhibit-system/registry.ts from patterns/*.json. Do not edit by hand.",
    classification: "Development reference. Every fixture is synthetic demonstration data, not an SMPT finding.",
    families: FAMILIES,
    question_types: QUESTION_TYPES,
    data_traits: DATA_TRAITS,
    references: REFERENCES,
    pattern_count: specs.length,
    patterns: specs,
  };
}

export function registryJson(specs: PatternSpec[]): string {
  return `${JSON.stringify(registryDocument(specs), null, 2)}\n`;
}

if (require.main === module) {
  const specs = loadRegistry();
  fs.writeFileSync(REGISTRY_FILE, registryJson(specs));
  console.log(`exhibit registry: ${specs.length} patterns → ${path.relative(REPO, REGISTRY_FILE)}`);
}
