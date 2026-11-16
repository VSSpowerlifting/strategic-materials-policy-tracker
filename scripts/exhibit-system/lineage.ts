// Versioned, opt-in provenance contract for research deck claims and figures.
// Pure validation of metadata plus hash verification of pinned local model files.
// Does NOT read spreadsheet cells, recalculate a model, or approve research.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

export class LineageError extends Error {}

export const CLAIM_CLASSES = ["reported", "derived", "modeled", "judgment"] as const;
export type ClaimClass = (typeof CLAIM_CLASSES)[number];
export const FIGURE_STATUSES = [
  "announced", "authorized", "committed", "drawn", "disbursed", "spent",
  "commissioning", "produced", "delivered", "invoiced", "collected",
  "modeled", "not-applicable",
] as const;
export type FigureStatus = (typeof FIGURE_STATUSES)[number];

export interface LineageMeasure {
  value: string;
  unit: string;
  basis: string;
  status: FigureStatus;
  as_of: string;
}
export interface LineageOutput extends LineageMeasure {
  id: string;
  locator: string;
}
export interface LineageModel {
  id: string;
  file: string;
  sha256: string;
  as_of: string;
  outputs: LineageOutput[];
}
export interface LineageSource {
  id: string;
  published_at: string;
  as_of?: string;
}
export interface LineageClaim {
  id: string;
  text: string;
  evidence_class: ClaimClass;
  evidence_refs: string[];
  model_output_refs: string[];
}
export interface LineageFigure extends LineageMeasure {
  id: string;
  evidence_refs: string[];
  model_output_ref?: string;
}
export interface LineageRelation {
  kind: "sum" | "compare" | "parallel";
  figure_ids: string[];
  total_id?: string;
}
export interface LineageSlide {
  slide: number;
  claim_ids: string[];
  figures: LineageFigure[];
  relations: LineageRelation[];
}
export interface DeckLineage {
  version: 1;
  research_cutoff: string;
  sources: LineageSource[];
  models: LineageModel[];
  claims: LineageClaim[];
  slides: LineageSlide[];
}
export interface LineageContext {
  baseDir: string;
  evidence: readonly { id: string }[];
  slides: readonly { evidence_refs?: string[] }[];
}

const ID = /^[A-Za-z][A-Za-z0-9_-]*$/;
const DECIMAL = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;
const HASH = /^[0-9a-f]{64}$/i;
const DATES = /^\d{4}-\d{2}-\d{2}$/;

function object(x: unknown, location: string, fields: readonly string[]): Record<string, unknown> {
  if (typeof x !== "object" || x === null || Array.isArray(x)) {
    throw new LineageError(location + ": expected object");
  }
  const value = x as Record<string, unknown>;
  for (const key of Object.keys(value)) {
    if (!fields.includes(key)) throw new LineageError(location + ": unknown field " + key);
  }
  return value;
}
function array(x: unknown, location: string, min = 0): unknown[] {
  if (!Array.isArray(x) || x.length < min) throw new LineageError(location + ": expected array with at least " + min + " item(s)");
  return x;
}
function string(x: unknown, location: string): string {
  if (typeof x !== "string" || x.trim() !== x || !x) throw new LineageError(location + ": expected non-empty trimmed string");
  return x;
}
function id(x: unknown, location: string): string {
  const s = string(x, location);
  if (!ID.test(s)) throw new LineageError(location + ": invalid identifier");
  return s;
}
function date(x: unknown, location: string): string {
  const s = string(x, location);
  if (!DATES.test(s)) throw new LineageError(location + ": expected YYYY-MM-DD");
  const t = new Date(s + "T00:00:00Z");
  if (!Number.isFinite(t.valueOf()) || t.toISOString().slice(0, 10) !== s) {
    throw new LineageError(location + ": invalid calendar date");
  }
  return s;
}
function decimal(x: unknown, location: string): string {
  const s = string(x, location);
  if (!DECIMAL.test(s)) throw new LineageError(location + ": expected plain decimal string (no exponent, symbols or commas)");
  return s;
}
function choice<T extends string>(x: unknown, values: readonly T[], location: string): T {
  const s = string(x, location);
  if (!values.includes(s as T)) throw new LineageError(location + ": unknown value " + s);
  return s as T;
}
function ids(x: unknown, location: string, min = 1): string[] {
  const result = array(x, location, min).map((v, i) => id(v, location + "[" + i + "]"));
  if (new Set(result).size !== result.length) throw new LineageError(location + ": duplicate identifier");
  return result;
}
function checkUnique(items: readonly { id: string }[], location: string): void {
  if (new Set(items.map((item) => item.id)).size !== items.length) throw new LineageError(location + ": duplicate identifier");
}
function measure(o: Record<string, unknown>, location: string, cutoff: string): LineageMeasure {
  const as_of = date(o.as_of, location + ".as_of");
  if (as_of > cutoff) throw new LineageError(location + ".as_of: later than research cutoff " + cutoff);
  return {
    value: decimal(o.value, location + ".value"),
    unit: string(o.unit, location + ".unit"),
    basis: string(o.basis, location + ".basis"),
    status: choice(o.status, FIGURE_STATUSES, location + ".status"),
    as_of,
  };
}
function requireRefs(refs: readonly string[], available: ReadonlySet<string>, location: string): void {
  for (const ref of refs) {
    if (!available.has(ref)) throw new LineageError(location + ": unresolved reference " + ref);
  }
}
function power(n: number): bigint { return BigInt(10) ** BigInt(n); }
function fixedDecimal(s: string): [bigint, number] {
  const neg = s.startsWith("-");
  const [whole, fraction = ""] = (neg ? s.slice(1) : s).split(".");
  const value = BigInt(whole + fraction);
  return [neg ? -value : value, fraction.length];
}
function sumEquals(values: readonly string[], total: string): boolean {
  const parsed = [...values, total].map(fixedDecimal);
  const places = Math.max(...parsed.map(([, p]) => p));
  const scaled = parsed.map(([n, p]) => n * power(places - p));
  return scaled.slice(0, -1).reduce((a, b) => a + b, BigInt(0)) === scaled[scaled.length - 1];
}

export function parseDeckLineage(raw: unknown, ctx: LineageContext): DeckLineage {
  const root = "lineage";
  const o = object(raw, root, ["version", "research_cutoff", "sources", "models", "claims", "slides"]);
  if (o.version !== 1) throw new LineageError("lineage.version: expected 1");
  const cutoff = date(o.research_cutoff, "lineage.research_cutoff");
  const evidence = new Set(ctx.evidence.map((e) => e.id));
  const sources = array(o.sources ?? [], "lineage.sources").map((v, i): LineageSource => {
    const p = "lineage.sources[" + i + "]";
    const r = object(v, p, ["id", "published_at", "as_of"]);
    const source = { id: id(r.id, p + ".id"), published_at: date(r.published_at, p + ".published_at"), ...(r.as_of === undefined ? {} : { as_of: date(r.as_of, p + ".as_of") }) };
    requireRefs([source.id], evidence, p);
    if (source.published_at > cutoff || (source.as_of && source.as_of > cutoff)) {
      throw new LineageError(p + ": source date later than research cutoff");
    }
    return source;
  });
  checkUnique(sources, "lineage.sources");
  const outputs = new Map<string, LineageOutput>();
  const models = array(o.models ?? [], "lineage.models").map((v, i): LineageModel => {
    const p = "lineage.models[" + i + "]";
    const r = object(v, p, ["id", "file", "sha256", "as_of", "outputs"]);
    const modelId = id(r.id, p + ".id");
    const file = string(r.file, p + ".file");
    if (path.isAbsolute(file) || file.split(/[\\/]/).includes("..")) {
      throw new LineageError(p + ".file: use a relative file within the spec directory");
    }
    const base = fs.realpathSync(ctx.baseDir);
    const target = path.resolve(base, file);
    let bytes: Buffer;
    try {
      const real = fs.realpathSync(target);
      if (real === base || !real.startsWith(base + path.sep)) {
        throw new LineageError(p + ".file: path escapes the spec directory");
      }
      if (!fs.statSync(real).isFile()) throw new LineageError(p + ".file: expected a file");
      bytes = fs.readFileSync(real);
    } catch (e) {
      if (e instanceof LineageError) throw e;
      throw new LineageError(p + ".file: missing or unreadable pinned model");
    }
    const sha256 = string(r.sha256, p + ".sha256");
    if (!HASH.test(sha256) || createHash("sha256").update(bytes).digest("hex") !== sha256.toLowerCase()) {
      throw new LineageError(p + ".sha256: pinned model hash does not match");
    }
    const as_of = date(r.as_of, p + ".as_of");
    if (as_of > cutoff) throw new LineageError(p + ".as_of: later than research cutoff");
    const registered = array(r.outputs, p + ".outputs", 1).map((v, j): LineageOutput => {
      const q = p + ".outputs[" + j + "]";
      const rec = object(v, q, ["id", "locator", "value", "unit", "basis", "status", "as_of"]);
      const output = { id: id(rec.id, q + ".id"), locator: string(rec.locator, q + ".locator"), ...measure(rec, q, cutoff) };
      const key = modelId + "/" + output.id;
      if (outputs.has(key)) throw new LineageError(q + ": duplicate model output reference " + key);
      outputs.set(key, output);
      return output;
    });
    return { id: modelId, file, sha256, as_of, outputs: registered };
  });
  checkUnique(models, "lineage.models");
  const claims = array(o.claims, "lineage.claims", 1).map((v, i): LineageClaim => {
    const p = "lineage.claims[" + i + "]";
    const r = object(v, p, ["id", "text", "evidence_class", "evidence_refs", "model_output_refs"]);
    const result = {
      id: id(r.id, p + ".id"),
      text: string(r.text, p + ".text"),
      evidence_class: choice(r.evidence_class, CLAIM_CLASSES, p + ".evidence_class"),
      evidence_refs: ids(r.evidence_refs, p + ".evidence_refs"),
      model_output_refs: idsForOutputs(r.model_output_refs ?? [], p + ".model_output_refs"),
    };
    requireRefs(result.evidence_refs, evidence, p + ".evidence_refs");
    requireRefs(result.model_output_refs, new Set(outputs.keys()), p + ".model_output_refs");
    if (result.evidence_class === "reported" && result.model_output_refs.length) {
      throw new LineageError(p + ": reported claims cannot be labeled with model outputs");
    }
    if ((result.evidence_class === "derived" || result.evidence_class === "modeled") && !result.model_output_refs.length) {
      throw new LineageError(p + ": derived or modeled claims require a pinned model output");
    }
    return result;
  });
  checkUnique(claims, "lineage.claims");
  const byClaim = new Map(claims.map((c) => [c.id, c]));
  const slides = array(o.slides, "lineage.slides", 1).map((v, i): LineageSlide => {
    const p = "lineage.slides[" + i + "]";
    const r = object(v, p, ["slide", "claim_ids", "figures", "relations"]);
    const slide = r.slide;
    if (!Number.isInteger(slide) || slide !== i + 2 || i >= ctx.slides.length) {
      throw new LineageError(p + ".slide: expected analytical slide " + (i + 2) + " (cover is slide 1)");
    }
    const permitted = new Set(ctx.slides[i].evidence_refs ?? []);
    const claim_ids = ids(r.claim_ids, p + ".claim_ids");
    requireRefs(claim_ids, new Set(byClaim.keys()), p + ".claim_ids");
    for (const claimId of claim_ids) {
      requireRefs(byClaim.get(claimId)!.evidence_refs, permitted, p + ".claim_ids(" + claimId + ").evidence_refs");
    }
    const figures = array(r.figures ?? [], p + ".figures").map((v, j): LineageFigure => {
      const q = p + ".figures[" + j + "]";
      const f = object(v, q, ["id", "value", "unit", "basis", "status", "as_of", "evidence_refs", "model_output_ref"]);
      const evidence_refs = ids(f.evidence_refs, q + ".evidence_refs");
      requireRefs(evidence_refs, permitted, q + ".evidence_refs");
      const outputRef = f.model_output_ref === undefined ? undefined : string(f.model_output_ref, q + ".model_output_ref");
      const result = { id: id(f.id, q + ".id"), ...measure(f, q, cutoff), evidence_refs, ...(outputRef ? { model_output_ref: outputRef } : {}) };
      if (outputRef) {
        const output = outputs.get(outputRef);
        if (!output) throw new LineageError(q + ".model_output_ref: unresolved reference " + outputRef);
        for (const key of ["value", "unit", "basis", "status", "as_of"] as const) {
          if (key === "value" ? !sumEquals([result.value], output.value) : result[key] !== output[key]) {
            throw new LineageError(q + "." + key + ": disagrees with pinned model output " + outputRef);
          }
        }
      }
      return result;
    });
    checkUnique(figures, p + ".figures");
    const byFigure = new Map(figures.map((f) => [f.id, f]));
    const relations = array(r.relations ?? [], p + ".relations").map((v, j): LineageRelation => {
      const q = p + ".relations[" + j + "]";
      const a = object(v, q, ["kind", "figure_ids", "total_id"]);
      const kind = choice(a.kind, ["sum", "compare", "parallel"] as const, q + ".kind");
      const figure_ids = ids(a.figure_ids, q + ".figure_ids", 2);
      requireRefs(figure_ids, new Set(byFigure.keys()), q + ".figure_ids");
      if (kind === "sum") {
        const total_id = id(a.total_id, q + ".total_id");
        if (figure_ids.includes(total_id)) throw new LineageError(q + ": total cannot also be a part");
        requireRefs([total_id], new Set(byFigure.keys()), q + ".total_id");
        const items = [...figure_ids, total_id].map((key) => byFigure.get(key)!);
        for (const basisKey of ["unit", "basis", "status", "as_of"] as const) {
          if (new Set(items.map((item) => item[basisKey])).size !== 1) {
            throw new LineageError(q + ": incompatible " + basisKey + " in additive total");
          }
        }
        if (!sumEquals(figure_ids.map((key) => byFigure.get(key)!.value), byFigure.get(total_id)!.value)) {
          throw new LineageError(q + ": additive total does not reconcile");
        }
        return { kind, figure_ids, total_id };
      }
      if (a.total_id !== undefined) throw new LineageError(q + ": only sum relations accept total_id");
      if (kind === "compare") {
        const items = figure_ids.map((key) => byFigure.get(key)!);
        for (const basisKey of ["unit", "basis"] as const) {
          if (new Set(items.map((item) => item[basisKey])).size !== 1) {
            throw new LineageError(q + ": incomparable " + basisKey + "; use parallel for separate bases");
          }
        }
      }
      return { kind, figure_ids };
    });
    return { slide: slide as number, claim_ids, figures, relations };
  });
  if (slides.length !== ctx.slides.length) throw new LineageError("lineage.slides: one lineage record is required per analytical slide");
  return { version: 1, research_cutoff: cutoff, sources, models, claims, slides };
}
function idsForOutputs(x: unknown, p: string): string[] {
  const result = array(x, p).map((v, i) => {
    const s = string(v, p + "[" + i + "]");
    const parts = s.split("/");
    if (parts.length !== 2 || parts.some((part) => !ID.test(part))) throw new LineageError(p + ": expected ModelID/OutputID");
    return s;
  });
  if (new Set(result).size !== result.length) throw new LineageError(p + ": duplicate output reference");
  return result;
}
