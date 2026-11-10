import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import JSZip from "jszip";
import { parseResearchDeck, renderResearchDeck } from "../scripts/exhibit-system/research-deck";
import { loadFixture } from "../scripts/exhibit-system/registry";
import { makeHelpers } from "../scripts/exhibit-system/primitives";
import type { PptxSlide } from "../scripts/exhibit-system/types";

// Test-only invented data, never a research product. The image is the FI002
// conceptual artwork, copied into a temp folder so the spec can pin it.
const ART = "docs/research/fi002-bhp-copper/output/review/revision-6/assets/fi002-cover-contours.png";
const TITLE = "Hero cover contract test";

function spec(dir: string) {
  copyFileSync(ART, join(dir, "hero.png"));
  const sha = createHash("sha256").update(readFileSync(join(dir, "hero.png"))).digest("hex");
  const fx = loadFixture("dumbbell");
  return {
    classification: "research",
    title: TITLE,
    evidence: [{ id: "E1", url: "https://example.org/test-only", title: "Test-only evidence stub", locator: "Table A" }],
    cover: {
      pattern: "cover_hero_split",
      title_lines: ["Hero cover", "contract test"],
      subtitle_lines: ["A subtitle"],
      thesis: "One test-only sentence.",
      thesis_source: "Test-only.",
      callout: { value: "$1bn", label: "Test-only figure\nsecond line", basis: "Test-only basis.", evidence_refs: ["E1"] },
      footer: "Test footer",
      hero: { image: "hero.png", sha256: sha, alt: "Test-only conceptual artwork.", caption: "Conceptual artwork, not a map", credit: "Test credit." },
    },
    slides: [{ pattern: "dumbbell", label: "TEST", exhibit: { title: fx.title, subtitle: fx.subtitle, annotation: fx.annotation, data: fx.data, source: "Test-only evidence stub, Table A", evidence_refs: ["E1"] } }],
  };
}

test("cover_hero_split parser pins the image and checks title, callout and exclusivity", () => {
  const dir = mkdtempSync(join(tmpdir(), "smpt-hero-parse-"));
  try {
    const s = spec(dir);
    assert.equal(parseResearchDeck(s, "test", dir).cover?.titleLines.length, 2);
    const clone = () => JSON.parse(JSON.stringify(s));
    const badHash = clone();
    badHash.cover.hero.sha256 = "0".repeat(64);
    assert.throws(() => parseResearchDeck(badHash, "test", dir), /not the pinned value/);
    const badLines = clone();
    badLines.cover.title_lines = ["Hero cover", "contract"];
    assert.throws(() => parseResearchDeck(badLines, "test", dir), /title_lines/);
    assert.throws(() => parseResearchDeck({ ...clone(), cover_lines: ["x"] }, "test", dir), /not both/);
    const badRef = clone();
    badRef.cover.callout.evidence_refs = ["missing"];
    assert.throws(() => parseResearchDeck(badRef, "test", dir), /unresolved evidence/);
    const noCaption = clone();
    delete noCaption.cover.hero.caption;
    assert.equal(parseResearchDeck(noCaption, "test", dir).cover?.hero.caption, undefined);
    const blankCaption = clone();
    blankCaption.cover.hero.caption = 5;
    assert.throws(() => parseResearchDeck(blankCaption, "test", dir), /caption/);
    const badType = clone();
    badType.cover.hero.image = "hero.gif";
    assert.throws(() => parseResearchDeck(badType, "test", dir), /png or \.jpg/);
    const badPattern = clone();
    badPattern.cover.pattern = "cover_full_bleed";
    assert.throws(() => parseResearchDeck(badPattern, "test", dir), /pattern/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("image helper only places alt-texted frame rasters", () => {
  const slide = { addText() {}, addShape() {}, addChart() {}, addTable() {}, addImage() {}, addNotes() {} } as PptxSlide;
  const records: never[] = [];
  const h = makeHelpers(slide, { x: 0, y: 0, w: 8, h: 4 }, records, {}, {});
  assert.throws(() => h.image("chart-png", "data" as "frame", { altText: "x" }), /role "frame"/);
  assert.throws(() => h.image("no-alt", "frame", { altText: " " }), /alt text/);
  h.image("hero", "frame", { altText: "Artwork" });
  assert.deepEqual(records, [{ name: "frame:hero", role: "frame", tier: "raster", kind: "image" }]);
});

test("hero cover renders one declared raster, splits notes into paragraphs and passes the verifier", async () => {
  const dir = mkdtempSync(join(tmpdir(), "smpt-hero-render-"));
  try {
    const input = join(dir, "spec.json");
    writeFileSync(input, JSON.stringify(spec(dir)));
    const out = join(dir, "hero.pptx");
    const manifestFile = await renderResearchDeck(input, out);
    const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
    assert.equal(manifest.slides[0].cover_pattern, "cover_hero_split");
    const zip = await JSZip.loadAsync(readFileSync(out));
    const cover = await zip.file("ppt/slides/slide1.xml")!.async("string");
    assert.equal((cover.match(/<p:pic>/g) ?? []).length, 1);
    assert.match(cover, /descr="Test-only conceptual artwork\."/);
    assert.match(cover, /Conceptual artwork, not a map/);
    assert.match(cover, /DRAFT · REVIEW GATES PENDING/);
    assert.doesNotMatch(await zip.file("ppt/slides/slide2.xml")!.async("string"), /<p:pic>/);
    const notes = await zip.file("ppt/notesSlides/notesSlide1.xml")!.async("string");
    assert.doesNotMatch(notes, /<a:t>[^<]*\n/);
    assert.ok((notes.match(/<a:p>/g) ?? []).length >= 4, "each notes line is its own paragraph");
    assert.match(notes, /https:\/\/example.org\/test-only/);
    const run = () => spawnSync("python3", ["-B", "scripts/exhibit-system/verify_editability.py", "--deck", out, "--manifest", manifestFile], { encoding: "utf8" });
    const ok = run();
    assert.equal(ok.status, 0, ok.stdout + ok.stderr);
    // A raster the manifest does not declare as the cover hero must fail.
    manifest.slides[0].elements = manifest.slides[0].elements.filter((e: { kind: string }) => e.kind !== "image");
    writeFileSync(manifestFile, JSON.stringify(manifest));
    const undeclared = run();
    assert.equal(undeclared.status, 1);
    assert.match(undeclared.stdout, /not a declared cover hero image/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("hero cover without a caption renders no caption shape and still passes the verifier", async () => {
  const dir = mkdtempSync(join(tmpdir(), "smpt-hero-nocap-"));
  try {
    const s = spec(dir);
    delete (s as { cover: { hero: { caption?: string } } }).cover.hero.caption;
    const input = join(dir, "spec.json");
    writeFileSync(input, JSON.stringify(s));
    const out = join(dir, "hero.pptx");
    const manifestFile = await renderResearchDeck(input, out);
    const zip = await JSZip.loadAsync(readFileSync(out));
    const cover = await zip.file("ppt/slides/slide1.xml")!.async("string");
    assert.doesNotMatch(cover, /cover-hero-caption/);
    assert.doesNotMatch(cover, /Conceptual artwork/);
    const ok = spawnSync("python3", ["-B", "scripts/exhibit-system/verify_editability.py", "--deck", out, "--manifest", manifestFile], { encoding: "utf8" });
    assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
