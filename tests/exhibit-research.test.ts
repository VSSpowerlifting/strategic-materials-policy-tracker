import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import JSZip from "jszip";
import { parseResearchDeck, renderResearchDeck, assertOutsideSystemDir } from "../scripts/exhibit-system/research-deck";
import { loadFixture } from "../scripts/exhibit-system/registry";
import { makeHelpers } from "../scripts/exhibit-system/primitives";
import { reviewDeck } from "../scripts/exhibit-system/deck-review";
import { RENDERERS } from "../scripts/exhibit-system/renderers";
import type { PptxSlide } from "../scripts/exhibit-system/types";

// Test-only invented data, never a research product. Kept outside the gallery.
function spec() {
  const fx = loadFixture("dumbbell");
  return { classification: "research", title: "Research pathway contract test", evidence: [{ id: "E1", url: "https://example.org/test-only", title: "Test-only evidence stub", locator: "Table A" }], slides: [{ pattern: "dumbbell", label: "TEST", exhibit: { title: fx.title, subtitle: fx.subtitle, annotation: fx.annotation, data: fx.data, source: "Test-only evidence stub, Table A", evidence_refs: ["E1"] } }] };
}
test("research parser resolves evidence and validates the complete renderer contract", () => {
  const s = spec();
  assert.equal(parseResearchDeck(s, "test").slides.length, 1);
  assert.throws(() => parseResearchDeck({ ...s, evidence: [] }, "test"), /evidence/);
  assert.throws(() => parseResearchDeck({ ...s, evidence: [s.evidence[0], s.evidence[0]] }, "test"), /duplicate evidence/);
  s.slides[0].exhibit.evidence_refs = ["missing"];
  assert.throws(() => parseResearchDeck(s, "test"), /unresolved evidence/);
  s.slides[0].exhibit.evidence_refs = ["E1"];
  s.slides[0].exhibit.data = {};
  assert.throws(() => parseResearchDeck(s, "test"), /data/);
  const invalid = spec();
  (invalid.slides[0].exhibit.data as { axisMax: number }).axisMax = 0;
  assert.throws(() => parseResearchDeck(invalid, "test"), /bounded-values/);
});
test("research rejects synthetic fixture references and notice text", () => {
  const s = spec();
  assert.throws(() => parseResearchDeck({ ...s, classification: "synthetic-demonstration" }, "test"), /classification/);
  assert.throws(() => parseResearchDeck({ ...s, slides: [{ fixture: "dumbbell" }] }, "test"), /synthetic fixture/);
  assert.throws(() => parseResearchDeck({ ...s, title: "Synthetic demonstration data — not an SMPT finding" }, "test"), /notice/);
});
test("QC attachment cannot remove draft classification or grant release authority", async () => {
  const dir = mkdtempSync(join(tmpdir(), "smpt-research-contract-"));
  try {
    const qc = join(dir, "qc.json");
    writeFileSync(qc, '{"approved":true}');
    const input = join(dir, "spec.json");
    writeFileSync(input, JSON.stringify({ ...spec(), qc_record: "qc.json" }));
    const out = join(dir, "draft.pptx");
    const manifest = await renderResearchDeck(input, out);
    const m = JSON.parse(readFileSync(manifest, "utf8"));
    assert.equal(m.review_gates, "pending-human-review");
    assert.equal(m.publication_authorization, "not-granted");
    assert.equal(m.evidence[0].locator, "Table A");
    const zip = await JSZip.loadAsync(readFileSync(out));
    for (const part of Object.keys(zip.files).filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))) {
      assert.match(await zip.file(part)!.async("string"), /DRAFT · REVIEW GATES PENDING/);
    }
    const notes = await zip.file("ppt/notesSlides/notesSlide2.xml")!.async("string");
    assert.match(notes, /https:\/\/example.org\/test-only/);
    const verify = spawnSync("python3", ["-B", "scripts/exhibit-system/verify_editability.py", "--deck", out, "--manifest", manifest], { encoding: "utf8" });
    assert.equal(verify.status, 0, verify.stdout + verify.stderr);
    await assert.rejects(renderResearchDeck(input, out), /overwrite/);
    await assert.rejects(renderResearchDeck(input, join(dir, "bad.pdf")), /end in .pptx/);
    await assert.rejects(renderResearchDeck(input, resolve("public/research/prohibited-draft.pptx")), /cannot be written under public/);
    const linked = join(dir, "gallery-link");
    symlinkSync(resolve("docs/design/presentations/exhibit-system"), linked);
    assert.throws(() => assertOutsideSystemDir(join(linked, "escape.pptx"), "output"), /inside/);
    writeFileSync(out, "tampered");
    const altered = spawnSync("python3", ["-B", "scripts/exhibit-system/verify_editability.py", "--deck", out, "--manifest", manifest], { encoding: "utf8" });
    assert.equal(altered.status, 1);
    assert.match(altered.stderr, /hash/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test("renderer helpers enforce the exhibit typography floor", () => {
  const slide = { addText() {}, addShape() {}, addChart() {}, addTable() {}, addNotes() {} } as PptxSlide;
  const h = makeHelpers(slide, { x: 0, y: 0, w: 8, h: 4 }, [], {}, {});
  assert.throws(() => h.text("tiny", "label", "small", { fontSize: 10 }), /11 pt floor/);
  assert.throws(() => h.chart("tiny-chart", "bar", [], { catAxisLabelFontSize: 8 }), /11 pt floor/);
});
test("counterparty map refuses duplicate identities and overcrowded labels", () => {
  const r = RENDERERS.get("counterparty-map")!;
  const fx = loadFixture("counterparty-map");
  assert.deepEqual(r.check(r.parse(fx.data)), []);
  const d = structuredClone(fx.data) as { parties: { label: string; role: string }[] };
  d.parties[1].label = d.parties[0].label;
  assert.ok(r.check(r.parse(d)).some((i) => i.rule === "unique-labels"));
  d.parties[1].label = "Unique";
  d.parties[1].role = "x".repeat(45);
  assert.ok(r.check(r.parse(d)).some((i) => i.rule === "label-length"));
});

test("research composition reads exhibit metadata and counts the generated cover", () => {
  const s = spec();
  const review = reviewDeck(s);
  assert.equal(review.shape, "research-deck");
  assert.equal(review.slides.length, 2);
  assert.equal(review.slides[1].kind, "dumbbell");
  const long = reviewDeck({ ...s, slides: Array.from({ length: 20 }, () => s.slides[0]) });
  assert.ok(long.findings.some((f) => f.severity === "HOLD" && f.rule === "slide-cap"));
});
