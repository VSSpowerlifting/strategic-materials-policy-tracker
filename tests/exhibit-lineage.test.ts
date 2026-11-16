import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseDeckLineage, type LineageContext } from "../scripts/exhibit-system/lineage";
import { parseResearchDeck, renderResearchDeck } from "../scripts/exhibit-system/research-deck";
import { loadFixture } from "../scripts/exhibit-system/registry";

type Document = {
  version: number;
  research_cutoff: string;
  sources: Array<{ id: string; published_at: string; as_of?: string }>;
  models: Array<{
    id: string; file: string; sha256: string; as_of: string;
    outputs: Array<{ id: string; locator: string; value: string; unit: string; basis: string; status: string; as_of: string }>;
  }>;
  claims: Array<{
    id: string; text: string; evidence_class: string; evidence_refs: string[];
    model_output_refs: string[]; [extra: string]: unknown;
  }>;
  slides: Array<{
    slide: number; claim_ids: string[];
    figures: Array<{
      id: string; value: string; unit: string; basis: string; status: string;
      as_of: string; data_pointer: string; evidence_refs: string[]; model_output_ref?: string;
    }>;
    relations: Array<{ kind: string; figure_ids: string[]; total_id?: string }>;
  }>;
};
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
function sample() {
  const dir = mkdtempSync(join(tmpdir(), "smpt-lineage-test-"));
  const modelBytes = '{"illustration":"only; source values are checked in the research review"}\n';
  writeFileSync(join(dir, "model.json"), modelBytes);
  const sha256 = createHash("sha256").update(modelBytes).digest("hex");
  const context: LineageContext = {
    baseDir: dir,
    evidence: [{ id: "E1" }, { id: "E2" }],
    slides: [{ evidence_refs: ["E1", "E2"], data: { f1: 10, f2: 2.5, f3: 12.5 } }],
  };
  const details = { unit: "USD million", basis: "drawn-debt", status: "drawn", as_of: "2026-11-09" };
  const document: Document = {
    version: 1, research_cutoff: "2026-11-10",
    sources: [{ id: "E1", published_at: "2026-11-08", as_of: "2026-11-07" }],
    models: [{
      id: "M1", file: "model.json", sha256, as_of: "2026-11-09",
      outputs: [{ id: "O1", locator: "Schedule!B14", value: "12.500", ...details }],
    }],
    claims: [{ id: "C1", text: "A modelled aggregate of the specified drawn debt", evidence_class: "modeled", evidence_refs: ["E1"], model_output_refs: ["M1/O1"] }],
    slides: [{
      slide: 2, claim_ids: ["C1"],
      figures: [
        { id: "F1", value: "10.0", ...details, data_pointer: "/f1", evidence_refs: ["E1"] },
        { id: "F2", value: "2.50", ...details, data_pointer: "/f2", evidence_refs: ["E1"] },
        { id: "F3", value: "12.5", ...details, data_pointer: "/f3", evidence_refs: ["E1", "E2"], model_output_ref: "M1/O1" },
      ],
      relations: [{ kind: "sum", figure_ids: ["F1", "F2"], total_id: "F3" }],
    }],
  };
  return { dir, context, document };
}
function useSample(fn: (s: ReturnType<typeof sample>) => void): void {
  const s = sample();
  try { fn(s); } finally { rmSync(s.dir, { recursive: true, force: true }); }
}
function rejectsChange(change: (d: Document) => void, matcher: RegExp): void {
  useSample((s) => {
    const input = copy(s.document);
    change(input);
    assert.throws(() => parseDeckLineage(input, s.context), matcher);
  });
}

test("v1 lineage accepts pinned model outputs, exact-decimal totals and traceable slide evidence", () => {
  useSample((s) => {
    const result = parseDeckLineage(s.document, s.context);
    assert.equal(result.version, 1);
    assert.equal(result.slides[0].relations[0].total_id, "F3");
    assert.equal(result.models[0].sha256, s.document.models[0].sha256);
    assert.equal(result.slides[0].figures[2].model_output_ref, "M1/O1");
    assert.equal(result.slides[0].figures[2].value, "12.5");
  });
});

test("lineage is opt-in: a legacy research spec still parses without added metadata", () => {
  const fixture = loadFixture("dumbbell");
  const base = {
    classification: "research",
    title: "Lineage contract legacy test",
    evidence: [{ id: "E1", url: "https://example.com/1", title: "Original document", locator: "Table 1" }],
    slides: [{ pattern: "dumbbell", label: "A", exhibit: {
      title: fixture.title, subtitle: fixture.subtitle, annotation: fixture.annotation,
      source: "Original document, Table 1", evidence_refs: ["E1"], data: fixture.data,
    } }],
  };
  const parsed = parseResearchDeck(base, "legacy-test");
  assert.equal(parsed.lineage, undefined);
  assert.equal(parsed.slides.length, 1);
});

test("version and shape are strict; unknown keys cannot bypass validation", () => {
  rejectsChange((d) => { d.version = 2; }, /version: expected 1/);
  rejectsChange((d) => { d.claims[0].evidence_refz = ["E1"]; }, /unknown field evidence_refz/);
  rejectsChange((d) => { d.slides[0].figures[0].value = "$10m"; }, /plain decimal string/);
  rejectsChange((d) => { d.research_cutoff = "2026-02-30"; }, /invalid calendar date/);
});

test("source IDs, slide-local citations, and claim IDs must resolve", () => {
  rejectsChange((d) => { d.sources[0].id = "UNKNOWN"; }, /unresolved reference UNKNOWN/);
  rejectsChange((d) => { d.claims[0].evidence_refs = ["UNKNOWN"]; }, /unresolved reference UNKNOWN/);
  rejectsChange((d) => { d.slides[0].claim_ids = ["UNKNOWN"]; }, /unresolved reference UNKNOWN/);
  rejectsChange((d) => { d.slides[0].figures[0].evidence_refs = ["UNKNOWN"]; }, /unresolved reference UNKNOWN/);
  useSample((s) => {
    const local: LineageContext = { ...s.context, slides: [{ evidence_refs: ["E2"], data: s.context.slides[0].data }] };
    assert.throws(() => parseDeckLineage(s.document, local), /unresolved reference E1/);
  });
});

test("lineage requires exactly one ordered entry for every analytical slide", () => {
  rejectsChange((d) => { d.slides[0].slide = 3; }, /expected analytical slide 2/);
  rejectsChange((d) => { d.slides = []; }, /expected array with at least 1/);
  useSample((s) => {
    const ctx = { ...s.context, slides: [...s.context.slides, s.context.slides[0]] };
    assert.throws(() => parseDeckLineage(s.document, ctx), /one lineage record is required/);
  });
});

test("reported claims cannot borrow model authority; derived and modeled claims require model output", () => {
  rejectsChange((d) => { d.claims[0].evidence_class = "reported"; }, /reported claims cannot/);
  rejectsChange((d) => { d.claims[0].model_output_refs = []; }, /require a pinned model output/);
  rejectsChange((d) => { d.claims[0].model_output_refs = ["M1/BAD"]; }, /unresolved reference M1\/BAD/);
  rejectsChange((d) => { d.claims[0].model_output_refs = ["BAD"]; }, /ModelID\/OutputID/);
});

test("pinned model file existence, path confinement and hash are enforced", () => {
  rejectsChange((d) => { d.models[0].sha256 = "0".repeat(64); }, /hash does not match/);
  rejectsChange((d) => { d.models[0].file = "missing.json"; }, /missing or unreadable/);
  rejectsChange((d) => { d.models[0].file = "../outside.json"; }, /relative file within/);
  rejectsChange((d) => { d.models[0].file = "/tmp/private-model.json"; }, /relative file within/);
});

test("model output lineage must match displayed numerical value, status, currency basis and date", () => {
  rejectsChange((d) => { d.models[0].outputs[0].value = "12.6"; }, /disagrees with pinned model output/);
  rejectsChange((d) => { d.slides[0].figures[2].status = "committed"; }, /disagrees with pinned model output/);
  rejectsChange((d) => { d.slides[0].figures[2].unit = "EUR million"; }, /disagrees with pinned model output/);
  rejectsChange((d) => { d.slides[0].figures[2].as_of = "2026-11-08"; }, /disagrees with pinned model output/);
  rejectsChange((d) => { d.slides[0].figures[2].model_output_ref = "M1/MISSING"; }, /unresolved reference M1\/MISSING/);
  rejectsChange((d) => { d.claims[0].model_output_refs = []; d.claims[0].evidence_class = "judgment"; }, /not linked to any claim/);
});

test("additive totals reject mixed units, financing stages, measurement bases, dates and arithmetic", () => {
  rejectsChange((d) => { d.slides[0].figures[0].unit = "EUR million"; }, /incompatible unit/);
  rejectsChange((d) => { d.slides[0].figures[0].status = "committed"; }, /incompatible status/);
  rejectsChange((d) => { d.slides[0].figures[0].basis = "gross-capacity"; }, /incompatible basis/);
  rejectsChange((d) => { d.slides[0].figures[0].as_of = "2026-11-08"; }, /incompatible as_of/);
  rejectsChange((d) => { d.slides[0].figures[0].value = "10.01"; }, /disagrees with renderer data/);
  useSample((s) => {
    const d = copy(s.document);
    d.slides[0].figures[0].value = "10.01";
    const ctx = { ...s.context, slides: [{ evidence_refs: ["E1", "E2"], data: { f1: 10.01, f2: 2.5, f3: 12.5 } }] };
    assert.throws(() => parseDeckLineage(d, ctx), /does not reconcile/);
  });
  rejectsChange((d) => { d.slides[0].relations[0].figure_ids.push("F1"); }, /duplicate identifier/);
});

test("lineage figures must point to matching numeric data in the actual renderer input", () => {
  rejectsChange((d) => { d.slides[0].figures[0].data_pointer = "/missing"; }, /absent renderer data field/);
  rejectsChange((d) => { d.slides[0].figures[0].data_pointer = "/f2"; }, /disagrees with renderer data/);
  rejectsChange((d) => { d.slides[0].figures[0].data_pointer = "/f1/~2"; }, /valid non-root JSON Pointer/);
  useSample((s) => {
    const d = copy(s.document);
    const ctx = { ...s.context, slides: [{ evidence_refs: ["E1", "E2"], data: { f1: "10.00", f2: "2.50", f3: "12.500" } }] };
    assert.equal(parseDeckLineage(d, ctx).slides.length, 1, "numeric strings are acceptable when exact");
  });
});

test("ordinary comparisons require a common unit/basis; parallel panels disclose non-comparable bases", () => {
  useSample((s) => {
    const d = copy(s.document);
    d.slides[0].figures[0].unit = "EUR million";
    d.slides[0].relations = [{ kind: "compare", figure_ids: ["F1", "F2"] }];
    assert.throws(() => parseDeckLineage(d, s.context), /incomparable unit/);
    d.slides[0].relations = [{ kind: "parallel", figure_ids: ["F1", "F2"] }];
    assert.equal(parseDeckLineage(d, s.context).slides[0].relations[0].kind, "parallel");
  });
});

test("figure units must match the renderer's declared global unit when one exists", () => {
  useSample((s) => {
    const ctx = { ...s.context, slides: [{ evidence_refs: ["E1", "E2"], data: { unit: "kt per year", f1: 10, f2: 2.5, f3: 12.5 } }] };
    assert.throws(() => parseDeckLineage(s.document, ctx), /disagrees with renderer data unit/);
  });
});

test("all published/model observation dates must remain inside the fixed research cutoff", () => {
  rejectsChange((d) => { d.sources[0].published_at = "2026-11-11"; }, /source date later/);
  rejectsChange((d) => { d.models[0].as_of = "2026-11-11"; }, /later than research cutoff/);
  rejectsChange((d) => { d.slides[0].figures[0].as_of = "2026-11-11"; }, /later than research cutoff/);
});

test("research parser integrates opt-in lineage and manifests preserve draft-only authority", async () => {
  const s = sample();
  try {
    const fixture = loadFixture("dumbbell");
    const data = copy(fixture.data) as { items: { from: number }[] };
    (data as { unit?: string }).unit = "USD million";
    data.items[0].from = 12.5;
    data.items[1].from = 10;
    data.items[2].from = 2.5;
    const lineage = copy(s.document);
    lineage.slides[0].figures[0].data_pointer = "/items/1/from";
    lineage.slides[0].figures[1].data_pointer = "/items/2/from";
    lineage.slides[0].figures[2].data_pointer = "/items/0/from";
    const doc = {
      classification: "research",
      title: "Opt-in lineage integration contract",
      evidence: [
        { id: "E1", url: "https://example.com/1", title: "Original research", locator: "Table 1" },
        { id: "E2", url: "https://example.com/2", title: "Financial supplement", locator: "Schedule A" },
      ],
      slides: [{ pattern: "dumbbell", label: "A", exhibit: {
        title: fixture.title, subtitle: fixture.subtitle, annotation: fixture.annotation,
        source: "Test-only evidence, Table 1", evidence_refs: ["E1", "E2"], data,
      } }],
      lineage,
    };
    const parsed = parseResearchDeck(doc, "lineage-test", s.dir);
    assert.equal(parsed.lineage?.slides[0].claim_ids[0], "C1");
    const specFile = join(s.dir, "research-spec.json");
    const out = join(s.dir, "draft.pptx");
    writeFileSync(specFile, JSON.stringify(doc));
    const manifest = await renderResearchDeck(specFile, out);
    const record = JSON.parse(readFileSync(manifest, "utf8"));
    assert.equal(record.review_gates, "pending-human-review");
    assert.equal(record.publication_authorization, "not-granted");
    assert.equal(record.lineage.models[0].sha256, lineage.models[0].sha256);
    assert.equal(record.lineage.slides[0].figures[2].value, "12.5");
  } finally {
    rmSync(s.dir, { recursive: true, force: true });
  }
});
