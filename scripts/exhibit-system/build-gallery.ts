// Builds the exhibit gallery PPTX and the demo deck PPTX from fixtures.
//
//   npm run exhibits:build            # gallery + demo deck + element manifest
//
// This is the ONLY module that loads pptxgenjs and jszip. Both are exact-pinned
// devDependencies (package.json), so `npm ci && npm run exhibits:build` works on
// a clean machine. They are dev-only: nothing in the site bundle imports them.
// Output is normalised (fixed zip timestamps and core.xml dates) so a rebuild
// is byte-identical.

import { createHash } from "node:crypto";
import fs from "node:fs";
import JSZipModule from "jszip";
import PptxGenJS from "pptxgenjs";
import path from "node:path";
import { loadDeckSpec, loadFixture, loadRegistry } from "./registry";
import { RENDERERS } from "./renderers";
import { contentArea, C, DRAFT_BADGE, drawFrame, makeHelpers, SLIDE_H, SLIDE_W, SYNTHETIC_NOTICE, FONT } from "./primitives";
import { DEMO_DECK_SPEC, DEMO_PPTX, GALLERY_PPTX, MANIFEST_FILE, REPO } from "./paths";
import type { ElementRecord, ExhibitClassification, Fixture, PptxSlide } from "./types";


interface Pptx {
  layout: string;
  author: string;
  company: string;
  title: string;
  subject: string;
  theme: { headFontFace: string; bodyFontFace: string };
  ShapeType: Record<string, string>;
  ChartType: Record<string, string>;
  defineLayout(l: { name: string; width: number; height: number }): void;
  addSlide(): PptxSlide;
  write(o: { outputType: "nodebuffer" }): Promise<Buffer>;
}
type PptxCtor = new () => Pptx;

interface ZipEntry { dir: boolean; async(t: "string" | "nodebuffer"): Promise<string | Buffer> }
interface Zip {
  files: Record<string, ZipEntry>;
  file(name: string, data: string | Buffer, o?: { date?: Date; createFolders?: boolean }): Zip;
  generateAsync(o: { type: "nodebuffer"; compression: "DEFLATE"; compressionOptions: { level: number } }): Promise<Buffer>;
}
interface JSZipCtor { new (): Zip; loadAsync(b: Buffer): Promise<Zip> }

const FIXED_DATE = new Date("2026-01-01T00:00:00Z");
const FIXED_ISO = "2026-01-01T00:00:00Z";

export interface DeckEntry { fixture: Fixture; label: string }
export interface SlideManifest { slide: number; pattern: string; elements: ElementRecord[] }

export interface BuildOptions {
  /** Every entry must carry this classification; a deck never mixes synthetic and research slides. */
  classification: ExhibitClassification;
  /** Research decks only: repository-relative path of the QC handoff record, if one exists. */
  qcRecord?: string;
  evidence?: { id: string; title: string; url: string; locator: string }[];
  /**
   * Research decks only, opt-in: omit decorative frame kickers (the cover
   * kicker and the "INTERPRETATION" heading). Source, status and draft labels stay.
   */
  plainFrame?: boolean;
}

function coverSlide(pptx: Pptx, title: string, lines: string[], records: ElementRecord[], opts: BuildOptions): void {
  const synthetic = opts.classification === "synthetic-demonstration";
  const slide = pptx.addSlide();
  slide.background = { color: C.dark };
  const h = makeHelpers(slide, { x: 0, y: 0, w: SLIDE_W, h: SLIDE_H }, records, pptx.ShapeType, pptx.ChartType);
  if (!opts.plainFrame) {
    h.text("cover-kicker", "frame", synthetic ? "STRATEGIC MATERIALS POLICY TRACKER · EXHIBIT SYSTEM" : "STRATEGIC MATERIALS POLICY TRACKER", {
      x: 0.8, y: 1.6, w: 11.5, h: 0.35, fontSize: 12, bold: true, color: C.gold, charSpacing: 1.5,
    });
  }
  h.text("cover-title", "frame", title, { x: 0.8, y: 2.1, w: 11.5, h: 1.4, fontSize: 36, bold: true, color: C.paper, valign: "top" });
  h.text("cover-lines", "frame", lines.map((t, i) => ({ text: t, options: { breakLine: i < lines.length - 1 } })), {
    x: 0.8, y: 3.8, w: 11.0, h: 1.6, fontSize: 14, color: "D8D3C7", valign: "top", paraSpaceAfter: 6,
  });
  const notice = synthetic ? SYNTHETIC_NOTICE : DRAFT_BADGE;
  h.text("cover-notice", "frame", notice, {
    x: 0.8, y: 6.6, w: 11.5, h: 0.3, fontSize: 11, bold: true, color: C.gold,
  });
  slide.addNotes(
    synthetic
      ? "Cover. Classification: synthetic-demonstration. Contains no SMPT research finding."
      : `Cover. Classification: research. DRAFT · REVIEW GATES PENDING. Publication authorization is not granted by this tool. ${opts.qcRecord ? `QC record named: ${opts.qcRecord} (its contents are not verified by the exhibit tools).` : "No QC record attached; review gates A–E are pending."}`,
  );
}

export async function buildDeck(
  entries: DeckEntry[],
  cover: { title: string; lines: string[] },
  outFile: string,
  opts: BuildOptions = { classification: "synthetic-demonstration" },
): Promise<SlideManifest[]> {
  const mixed = entries.filter((e) => e.fixture.classification !== opts.classification);
  if (mixed.length) {
    throw new Error(
      `exhibit build refused — a ${opts.classification} deck cannot contain ${mixed[0].fixture.classification} slides (${mixed.map((e) => e.fixture.pattern).join(", ")})`,
    );
  }
  if (opts.plainFrame && opts.classification !== "research") {
    throw new Error("exhibit build refused — plainFrame applies only to research decks");
  }
  if (opts.qcRecord && opts.classification !== "research") {
    throw new Error("exhibit build refused — a QC record applies only to research decks");
  }
  const synthetic = opts.classification === "synthetic-demonstration";
  const Pptx = PptxGenJS as unknown as PptxCtor;
  const pptx = new Pptx();
  pptx.defineLayout({ name: "SMPT_WIDE", width: SLIDE_W, height: SLIDE_H });
  pptx.layout = "SMPT_WIDE";
  pptx.author = "SMPT exhibit system";
  pptx.company = "Strategic Materials Policy Tracker";
  pptx.title = cover.title;
  pptx.subject = synthetic ? "Synthetic demonstration exhibits — not SMPT findings" : "SMPT research exhibits";
  pptx.theme = { headFontFace: FONT, bodyFontFace: FONT };

  const manifest: SlideManifest[] = [];
  const coverRecords: ElementRecord[] = [];
  coverSlide(pptx, cover.title, cover.lines, coverRecords, opts);
  manifest.push({ slide: 1, pattern: "cover", elements: coverRecords });

  const problems: string[] = [];
  entries.forEach((e, i) => {
    const renderer = RENDERERS.get(e.fixture.pattern);
    if (!renderer) {
      problems.push(`${e.fixture.pattern}: no renderer`);
      return;
    }
    const data = renderer.parse(e.fixture.data);
    const issues = renderer.check(data);
    for (const is of issues) problems.push(`${e.fixture.pattern}: [${is.rule}] ${is.message}`);
    const slideNumber = i + 2;
    const slide = pptx.addSlide();
    slide.background = { color: C.paper };
    const records: ElementRecord[] = [];
    const h = makeHelpers(slide, contentArea(e.fixture), records, pptx.ShapeType, pptx.ChartType);
    renderer.render(h, data, e.fixture);
    // Keep the fixed frame above native tables in renderers that reflow them.
    drawFrame(h, { label: e.label, slideNumber, fixture: e.fixture, annotationHeading: !opts.plainFrame });
    slide.addNotes(
      synthetic
        ? [
            `Pattern: ${e.fixture.pattern}.`,
            `Classification: ${e.fixture.classification}. ${SYNTHETIC_NOTICE}.`,
            "Every name and number on this slide is invented to demonstrate the exhibit pattern.",
          ].join(" ")
        : [
            `Pattern: ${e.fixture.pattern}.`,
            "Classification: research. DRAFT · REVIEW GATES PENDING. Publication authorization is not granted by this tool.",
            `Evidence: ${(e.fixture.evidence_refs ?? []).join("; ")}.`,
            ...(opts.evidence ?? []).filter((ref) => e.fixture.evidence_refs?.includes(ref.id)).map((ref) => `${ref.id}: ${ref.title}. ${ref.url} · ${ref.locator}`),
            opts.qcRecord ? `QC record: ${opts.qcRecord}.` : "Review gates A–E pending.",
          ].join(" "),
    );
    manifest.push({ slide: slideNumber, pattern: e.fixture.pattern, elements: records });
  });
  if (problems.length) {
    throw new Error(`exhibit build refused — integrity or contract problems:\n  ${problems.join("\n  ")}`);
  }

  const raw = await pptx.write({ outputType: "nodebuffer" });
  const normalised = await normalise(raw);
  fs.writeFileSync(outFile, normalised);
  return manifest;
}

/** Helper series must carry no labels; fixed dates make rebuilds byte-identical. */
export function suppressHelperLabels(chartXml: string): string {
  return chartXml.replace(/<c:ser>[\s\S]*?<\/c:ser>/g, (ser) => {
    const name = /<c:tx>[\s\S]*?<c:v>([^<]*)<\/c:v>/.exec(ser)?.[1] ?? "";
    if (!name.startsWith("helper")) return ser;
    return ser.replace(/<c:dLbls>[\s\S]*?<\/c:dLbls>/, "<c:dLbls><c:delete val=\"1\"/></c:dLbls>");
  });
}

/**
 * Re-zips an OOXML package with fixed entry dates and fixed core.xml dates.
 * Native charts embed their data as nested .xlsx packages, which carry their
 * own timestamps, so those are normalised recursively.
 */
async function normalise(buf: Buffer): Promise<Buffer> {
  const JSZip = JSZipModule as unknown as JSZipCtor;
  const src = await JSZip.loadAsync(buf);
  const out = new JSZip();
  const names = Object.keys(src.files).sort();
  for (const name of names) {
    const entry = src.files[name];
    if (entry.dir) continue;
    if (name.endsWith(".xlsx")) {
      const inner = await normalise((await entry.async("nodebuffer")) as Buffer);
      out.file(name, inner, { date: FIXED_DATE, createFolders: false });
    } else if (name === "docProps/core.xml") {
      let xml = (await entry.async("string")) as string;
      xml = xml
        .replace(/(<dcterms:created[^>]*>)[^<]*(<\/dcterms:created>)/, `$1${FIXED_ISO}$2`)
        .replace(/(<dcterms:modified[^>]*>)[^<]*(<\/dcterms:modified>)/, `$1${FIXED_ISO}$2`);
      out.file(name, xml, { date: FIXED_DATE, createFolders: false });
    } else if (/^ppt\/charts\/chart\d+\.xml$/.test(name)) {
      const xml = suppressHelperLabels((await entry.async("string")) as string);
      out.file(name, xml, { date: FIXED_DATE, createFolders: false });
    } else {
      out.file(name, (await entry.async("nodebuffer")) as Buffer, { date: FIXED_DATE, createFolders: false });
    }
  }
  return out.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 9 } });
}

function sha256(file: string): string {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

async function main(): Promise<void> {
  const registry = loadRegistry();
  const galleryEntries: DeckEntry[] = registry.map((p) => ({
    fixture: loadFixture(p.id),
    label: `${p.family_code}. ${p.family.toUpperCase()} · ${p.name.toUpperCase()}`,
  }));
  const galleryManifest = await buildDeck(
    galleryEntries,
    {
      title: "Exhibit pattern gallery",
      lines: [
        `${registry.length} editable exhibit patterns, one per slide, in registry order.`,
        "Every name and figure is synthetic and exists only to demonstrate the pattern.",
        "Development reference — not a research product and not for publication.",
      ],
    },
    GALLERY_PPTX,
  );

  const spec = loadDeckSpec(DEMO_DECK_SPEC);
  const demoEntries: DeckEntry[] = spec.slides.map((s) => ({ fixture: loadFixture(s.fixture), label: s.label }));
  const demoManifest = await buildDeck(demoEntries, { title: spec.title, lines: spec.cover_lines }, DEMO_PPTX);

  const rel = (f: string) => path.relative(REPO, f);
  const manifest = {
    note: "Every object is named role:element. Generated by scripts/exhibit-system/build-gallery.ts.",
    decks: [
      { file: rel(GALLERY_PPTX), sha256: sha256(GALLERY_PPTX), slides: galleryManifest },
      { file: rel(DEMO_PPTX), sha256: sha256(DEMO_PPTX), slides: demoManifest },
    ],
  };
  fs.writeFileSync(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`gallery: ${galleryManifest.length} slides → ${rel(GALLERY_PPTX)} (${manifest.decks[0].sha256.slice(0, 12)})`);
  console.log(`demo:    ${demoManifest.length} slides → ${rel(DEMO_PPTX)} (${manifest.decks[1].sha256.slice(0, 12)})`);
}

if (require.main === module) {
  main().catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
