// Exhibit system: registry, fixtures, integrity rules, selection, deck review,
// gallery index and the committed editability evidence. Pure: none of these
// tests loads pptxgenjs or LibreOffice; they read the generated artifacts.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { renderGalleryHtml, previewHref } from "../scripts/exhibit-system/gallery-index";
import {
  binsContiguous,
  dateOrder,
  datesAscending,
  edgesResolve,
  inVocabulary,
  nonNegative,
  ordered,
  reconciles,
  sumsTo,
  uniqueLabels,
  STATUS_TAXONOMY,
} from "../scripts/exhibit-system/integrity";
import { reviewDeck, reviewSlides, SLIDE_CAP, type ReviewSlide } from "../scripts/exhibit-system/deck-review";
import { loadDeckSpec, loadFixture, loadRegistry, parseFixture, registryJson } from "../scripts/exhibit-system/registry";
import { RENDERERS } from "../scripts/exhibit-system/renderers";
import { selectPatterns } from "../scripts/exhibit-system/select";

const SYSTEM = "docs/design/presentations/exhibit-system";
const registry = loadRegistry();
const read = (p: string) => readFileSync(resolve(p), "utf8");
const json = <T>(p: string) => JSON.parse(read(p)) as T;

test("registry covers all eleven analytical families without a pattern quota", () => {
  assert.ok(registry.length > 0);
  const families = new Set(registry.map((p) => p.family_code));
  assert.deepEqual([...families].sort(), ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"]);
});

test("committed exhibit-registry.json matches the pattern files", () => {
  assert.equal(read(`${SYSTEM}/exhibit-registry.json`), registryJson(registry), "run npm run exhibits:registry");
});

test("every pattern has a renderer, and every renderer a pattern", () => {
  const ids = new Set(registry.map((p) => p.id));
  for (const p of registry) assert.ok(RENDERERS.has(p.id), `no renderer for ${p.id}`);
  for (const id of RENDERERS.keys()) assert.ok(ids.has(id), `renderer ${id} has no pattern spec`);
});

test("every pattern fixture parses and passes its renderer's integrity checks", () => {
  for (const p of registry) {
    const fx = loadFixture(p.id);
    assert.equal(fx.pattern, p.id, `${p.id}: fixture names pattern ${fx.pattern}`);
    assert.match(fx.source, /synthetic/i, `${p.id}: source line must say the data is synthetic`);
    const r = RENDERERS.get(p.id)!;
    const issues = r.check(r.parse(fx.data));
    assert.deepEqual(issues, [], `${p.id}: ${issues.map((i) => i.message).join("; ")}`);
  }
});

test("fixtures must declare synthetic-demonstration classification", () => {
  assert.throws(
    () => parseFixture({ pattern: "x", classification: "research", title: "t", subtitle: "s", annotation: "a", source: "s", visual_text: ["t"], data: {} }, "x.json"),
    /synthetic-demonstration/,
  );
});

test("synthetic fixtures name no SMPT organization, project, programme, jurisdiction or material", () => {
  type Named = { name?: string; nameEn?: string; shortName?: string };
  const names = new Set<string>();
  for (const f of ["organizations", "projects", "programmes", "jurisdictions", "materials"]) {
    for (const r of json<Named[]>(`data/seed/${f}.json`)) {
      for (const v of [r.name, r.nameEn, r.shortName]) if (typeof v === "string" && v.length > 3) names.add(v);
    }
  }
  assert.ok(names.size > 50, "seed names loaded");
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const fixtures = readdirSync(resolve(`${SYSTEM}/fixtures`)).filter((f) => f.endsWith(".json"));
  for (const f of fixtures) {
    const text = read(`${SYSTEM}/fixtures/${f}`);
    for (const n of names) assert.doesNotMatch(text, new RegExp(`\\b${escape(n)}\\b`, "i"), `${f} mentions seed name "${n}"`);
    for (const code of ["USD", "EUR", "CNY", "AUD", "JPY", "CAD"]) assert.doesNotMatch(text, new RegExp(`\\b${code}\\b`), `${f} uses real currency ${code}`);
  }
});

test("integrity rules reject broken data", () => {
  assert.equal(reconciles(100, [10, -5], 105).length, 0);
  assert.equal(reconciles(100, [10, -5], 110).length, 1, "bridge that does not reconcile");
  assert.equal(edgesResolve(["a", "b"], [{ from: "a", to: "b" }]).length, 0);
  assert.ok(edgesResolve(["a", "b"], [{ from: "a", to: "c" }]).length > 0, "edge to unknown node");
  assert.equal(binsContiguous([{ from: 0, to: 5 }, { from: 5, to: 10 }]).length, 0);
  assert.ok(binsContiguous([{ from: 0, to: 5 }, { from: 6, to: 10 }]).length > 0, "gap between bins");
  assert.ok(nonNegative([3, -1]).length > 0);
  assert.ok(uniqueLabels(["A", "A"]).length > 0);
  assert.ok(sumsTo([40, 40], 100, "shares").length > 0);
  assert.equal(sumsTo([60, 40], 100, "shares").length, 0);
  assert.ok(ordered(5, 3, 4, "interval").length > 0);
  assert.ok(datesAscending(["2026-03-01", "2026-01-01"], "milestones").length > 0);
  assert.ok(dateOrder("2026-05-01", "2026-04-01", "bar").length > 0);
  assert.ok(inVocabulary(["announced", "rumoured"], STATUS_TAXONOMY, "status").length > 0);
});

test("renderer parse rejects a contract violation", () => {
  const r = RENDERERS.get("waterfall")!;
  assert.throws(() => r.parse({}));
});

test("selection matches by question and traits and rejects with reasons", () => {
  const res = selectPatterns(registry, { question: "compare-two-observations", traits: ["two-observations"], items: 6 });
  assert.ok(res.matches.some((m) => m.pattern.id === "dumbbell"), "dumbbell offered for two observations");
  for (const m of res.matches) assert.ok(m.pattern.question_types.includes("compare-two-observations"));

  const tooMany = selectPatterns(registry, { question: "rank", traits: ["single-measure"], items: 500 });
  const rankedBar = tooMany.rejected.find((r) => r.pattern.id === "ranked-bar");
  assert.ok(rankedBar, "ranked-bar rejected at 500 items");
  assert.ok(rankedBar.reasons.some((r) => /holds at most/.test(r)), "capacity reason names the table alternative");

  const noTraits = selectPatterns(registry, { question: "reconcile", traits: [] });
  const wf = noTraits.rejected.find((r) => r.pattern.id === "waterfall");
  assert.ok(wf && wf.reasons.some((r) => /needs data trait/.test(r)), "waterfall needs additive movements");
});

test("demo deck has no automated findings and stays within the slide cap", () => {
  const spec = loadDeckSpec();
  const review = reviewDeck(json(`${SYSTEM}/demo-deck.json`));
  assert.equal(review.shape, "deck-spec");
  assert.equal(review.slides.length, spec.slides.length + 1, "cover plus content slides");
  assert.ok(review.slides.length <= SLIDE_CAP);
  assert.deepEqual(review.findings, []);
  assert.ok(Object.keys(review.familyCounts).length >= 8, "demo deck shows family variety");
});

const slide = (index: number, over: Partial<ReviewSlide> = {}): ReviewSlide => ({
  index,
  title: `Programme ${index} carries a distinct committed balance this period`,
  subtitle: "Committed support, CU million",
  annotation: "Committed amounts only.",
  source: "Synthetic fixture",
  kind: "ranked-bar",
  family: `F${index}`,
  structural: false,
  ...over,
});
const rules = (slides: ReviewSlide[]) => reviewSlides(slides, "slide-specs").findings.map((f) => `${f.severity}:${f.rule}`);

test("deck review flags missing sources, stock phrases, negations and run-on families", () => {
  assert.ok(rules([slide(1, { source: "" })]).includes("HOLD:source"));
  assert.ok(rules([slide(1, { title: "Key takeaways from the programme landscape" })]).includes("REVIEW:stock-phrase"));
  assert.ok(rules([slide(1, { title: "Why did programme balances shift this period?" })]).includes("REVIEW:question-title"));
  assert.ok(rules([slide(1), slide(2, { title: slide(1).title })]).includes("REVIEW:duplicate-title"));
  assert.ok(rules([slide(1, { annotation: "The scenario goes beyond the base case in every stage." })]).includes("REVIEW:rhetorical-negation"));
  assert.ok(rules([slide(1, { kind: "criterion-matrix", tier: "table" })]).includes("REVIEW:table-reason"));
  assert.ok(!rules([slide(1, { kind: "criterion-matrix", tier: "table", tableReason: "Readers check each cell." })]).includes("REVIEW:table-reason"));
  assert.ok(rules([1, 2, 3].map((i) => slide(i, { family: "A" }))).includes("REVIEW:family-run"));
  assert.ok(rules(Array.from({ length: SLIDE_CAP + 1 }, (_, i) => slide(i + 1))).includes("HOLD:slide-cap"));
});

test("deck review reads all three manifest shapes", () => {
  const content = reviewDeck([{ title: "Programme Alpha carries the largest balance", visibleReferences: ["Synthetic"], exhibit: { kind: "ranked bar" } }]);
  assert.equal(content.shape, "slide-content");
  const specs = reviewDeck({ slides: [{ title: "Programme Alpha carries the largest balance", subtitle: "s", source: "Synthetic", exhibit: "waterfall" }] });
  assert.equal(specs.shape, "slide-specs");
  assert.equal(reviewDeck(json(`${SYSTEM}/demo-deck.json`)).shape, "deck-spec");
});

test("gallery index links every pattern preview and is marked not for publication", () => {
  const html = renderGalleryHtml(registry);
  assert.equal(read(`${SYSTEM}/gallery/index.html`), html, "run npm run exhibits:gallery");
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(html, /not for publication/);
  for (const p of registry) {
    assert.ok(html.includes(`id="${p.id}"`), `${p.id} card`);
    assert.ok(existsSync(resolve(`${SYSTEM}/gallery/${previewHref(p.id)}`)), `${p.id} preview PNG; run npm run exhibits:previews`);
  }
  const previews = readdirSync(resolve(`${SYSTEM}/gallery/previews`)).filter((f) => f.endsWith(".png"));
  assert.equal(previews.length, registry.length, "no stale previews");
});

test("the gallery is not reachable from the public site", () => {
  assert.ok(!existsSync(resolve("public/exhibit-system")), "no public copy");
  assert.ok(!existsSync(resolve("app/exhibits")), "no app route");
});

type Report = {
  note: string;
  decks: {
    file: string;
    sha256: string;
    slides: number;
    element_tiers: Record<string, number>;
    structural: { status: string };
    libreoffice: { status: string };
    powerpoint: { status: string };
  }[];
};
type Manifest = { decks: { file: string; sha256: string; slides: { slide: number; pattern: string }[] }[] };

test("editability evidence covers both decks, current hashes, zero raster, PowerPoint not claimed", () => {
  const report = json<Report>(`${SYSTEM}/editability-report.json`);
  const manifest = json<Manifest>(`${SYSTEM}/element-manifest.json`);
  assert.deepEqual(report.decks.map((d) => d.file).sort(), [`${SYSTEM}/demo-deck.pptx`, `${SYSTEM}/exhibit-gallery.pptx`]);
  for (const d of report.decks) {
    const m = manifest.decks.find((x) => x.file === d.file)!;
    const sha = createHash("sha256").update(readFileSync(resolve(d.file))).digest("hex");
    assert.equal(m.sha256, sha, `${d.file}: manifest hash is stale; run npm run exhibits:build`);
    assert.equal(d.sha256, sha, `${d.file}: report hash is stale; run npm run exhibits:verify`);
    assert.equal(d.slides, m.slides.length);
    assert.equal(d.element_tiers.raster ?? 0, 0, `${d.file} contains raster elements`);
    assert.equal(d.structural.status, "pass");
    assert.equal(d.libreoffice.status, "pass");
    assert.equal(d.powerpoint.status, "not-performed");
  }
  const gallery = manifest.decks.find((x) => x.file.endsWith("exhibit-gallery.pptx"))!;
  assert.deepEqual(
    gallery.slides.filter((s) => s.pattern !== "cover").map((s) => s.pattern),
    registry.map((p) => p.id),
    "gallery slide order follows the registry",
  );
});
