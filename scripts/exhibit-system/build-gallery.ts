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
import { assertFonts } from "../publication/fonts";
import { brandThemeXml } from "../publication/tokens";
import { contentArea, C, DRAFT_BADGE, drawFrame, FONT, FONT_SERIF, makeHelpers, SLIDE_H, SLIDE_W, SYNTHETIC_NOTICE, TYPE } from "./primitives";
import { DEMO_DECK_SPEC, DEMO_PPTX, GALLERY_PPTX, MANIFEST_FILE, REPO } from "./paths";
import type { ElementRecord, ExhibitClassification, Fixture, PptxSlide } from "./types";
import { researchCoverSlide, type ResearchCover } from "./research-cover";


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
export interface SlideManifest { slide: number; pattern: string; cover_pattern?: string; elements: ElementRecord[] }

/**
 * cover_hero_split: an opt-in research cover. Title, subtitle and thesis sit in
 * a left column; a hero image fills the right of the slide under a native,
 * semi-transparent graphite overlay, so a licensed photograph can later replace
 * the image (Change Picture) and keep the same darkening. An optional key-number
 * callout and a one-line footer complete it. Every element is a native,
 * editable object except the single hero bitmap (role `frame`).
 */
export interface HeroCover {
  /** Measured title lines; joined with spaces they equal the deck title. */
  titleLines: string[];
  subtitleLines: string[];
  thesis: string;
  /** Where the thesis wording comes from; written to the cover notes. */
  thesisSource: string;
  /** `label` may hold one measured line break ("\n"). */
  callout?: { value: string; label: string; evidenceRefs: string[]; basis: string };
  footer: string;
  hero: {
    /** Image bytes as a data URI (`image/png;base64,...`), already hash-checked. */
    data: string;
    alt: string;
    /** Visible label on the image, e.g. that it is conceptual artwork. */
    caption?: string;
    credit: string;
    sha256: string;
  };
}

/** Geometry of cover_hero_split on the 13.333 × 7.5 in slide. */
export const HERO_SPLIT = {
  textX: 0.8,
  textW: 6.0,
  imageX: 7.333,
  /** Overlay transparency in percent: 0 is opaque graphite, 100 shows the image unchanged. */
  overlayTransparency: 45,
} as const;

export interface BuildOptions {
  /** Every entry must carry this classification; a deck never mixes synthetic and research slides. */
  classification: ExhibitClassification;
  /** Research decks only: repository-relative path of the QC handoff record, if one exists. */
  qcRecord?: string;
  /** Research decks only. `label` is the short citation shown (and linked) in the slide footer. */
  evidence?: { id: string; title: string; url: string; locator: string; label?: string }[];
  /**
   * Research decks only, opt-in: omit decorative frame kickers (the cover
   * kicker and the "INTERPRETATION" heading). Source, status and draft labels stay.
   */
  plainFrame?: boolean;
  /** Research decks only: a publication cover (research-cover.ts) in place of the generic one. */
  researchCover?: ResearchCover;
}

function coverSlide(pptx: Pptx, title: string, lines: string[], records: ElementRecord[], opts: BuildOptions): void {
  const synthetic = opts.classification === "synthetic-demonstration";
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  const h = makeHelpers(slide, { x: 0, y: 0, w: SLIDE_W, h: SLIDE_H }, records, pptx.ShapeType, pptx.ChartType);
  // Centred title block, as on the site: kicker, Spectral title, hairline rule with a registration tick, then the lines.
  const x = 0.8;
  const w = SLIDE_W - 2 * x;
  if (!opts.plainFrame) {
    h.text("cover-kicker", "frame", synthetic ? "Strategic Materials Policy Tracker · Exhibit system" : "Strategic Materials Policy Tracker", {
      x, y: 1.35, w, h: 0.35, fontSize: 13, bold: true, color: C.accent, align: "center",
    });
  }
  h.text("cover-title", "frame", title, {
    x, y: 1.85, w, h: 1.5, fontSize: 44, fontFace: FONT_SERIF, color: C.ink, align: "center", valign: "middle",
  });
  h.shape("cover-rule", "frame", h.shapes.rect, {
    x, y: 3.62, w, h: 0.015, fill: { color: C.border }, line: { color: C.border, width: 0 },
  });
  h.shape("cover-rule-tick", "frame", h.shapes.rect, {
    x: x + w / 2 - 0.006, y: 3.62 - 0.05, w: 0.012, h: 0.115, fill: { color: C.borderStrong }, line: { color: C.borderStrong, width: 0 },
  });
  h.text("cover-lines", "frame", lines.map((t, i) => ({ text: t, options: { breakLine: i < lines.length - 1 } })), {
    x: 1.6, y: 3.95, w: SLIDE_W - 3.2, h: 1.6, fontSize: 16, color: C.muted, align: "center", valign: "top", paraSpaceAfter: 6,
  });
  const notice = synthetic ? SYNTHETIC_NOTICE : DRAFT_BADGE;
  h.text("cover-notice", "frame", notice, {
    x, y: 6.6, w, h: 0.3, fontSize: 11, bold: true, color: C.muted, align: "center",
  });
  slide.addNotes(
    synthetic
      ? "Cover. Classification: synthetic-demonstration. Contains no SMPT research finding."
      : `Cover. Classification: research. DRAFT · REVIEW GATES PENDING. Publication authorization is not granted by this tool. ${opts.qcRecord ? `QC record named: ${opts.qcRecord} (its contents are not verified by the exhibit tools).` : "No QC record attached; review gates A–E are pending."}`,
  );
}

function heroCoverSlide(pptx: Pptx, title: string, cover: HeroCover, records: ElementRecord[], opts: BuildOptions): void {
  if (opts.classification !== "research") throw new Error("exhibit build refused — cover_hero_split applies only to research decks");
  if (cover.titleLines.join(" ") !== title) throw new Error("exhibit build refused — cover title lines do not join to the deck title");
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  const h = makeHelpers(slide, { x: 0, y: 0, w: SLIDE_W, h: SLIDE_H }, records, pptx.ShapeType, pptx.ChartType);
  const { textX: x, textW: w, imageX } = HERO_SPLIT;
  const imageW = SLIDE_W - imageX;
  h.image("cover-hero", "frame", { data: cover.hero.data, x: imageX, y: 0, w: imageW, h: SLIDE_H, altText: cover.hero.alt });
  h.shape("cover-hero-overlay", "frame", pptx.ShapeType.rect, {
    x: imageX, y: 0, w: imageW, h: SLIDE_H,
    fill: { color: C.ink, transparency: HERO_SPLIT.overlayTransparency }, line: { color: C.ink, width: 0, transparency: 100 },
  });
  if (cover.hero.caption) {
    h.text("cover-hero-caption", "frame", cover.hero.caption, {
      x: imageX + 0.35, y: 6.95, w: imageW - 0.7, h: 0.3, fontSize: TYPE.footnote, color: C.plate, align: "right", valign: "bottom",
    });
  }
  const breakRuns = (lines: string[]) => lines.map((s, i) => ({ text: s, options: { breakLine: i < lines.length - 1 } }));
  h.text("cover-title", "frame", breakRuns(cover.titleLines), {
    x, y: 0.75, w, h: 2.6, fontSize: 40, fontFace: FONT_SERIF, color: C.ink, valign: "top", lineSpacingMultiple: 0.95,
  });
  h.text("cover-subtitle", "frame", breakRuns(cover.subtitleLines), {
    x, y: 3.5, w, h: 0.8, fontSize: 20, color: C.muted, valign: "top",
  });
  h.text("cover-thesis", "frame", cover.thesis, {
    x, y: 4.4, w, h: 1.15, fontSize: 14, color: C.ink, valign: "top", lineSpacingMultiple: 1.1,
  });
  if (cover.callout) {
    h.text("cover-callout-value", "frame", cover.callout.value, {
      x, y: 5.62, w, h: 0.55, fontSize: 34, bold: true, color: C.accent, valign: "top",
    });
    h.text("cover-callout-label", "frame", breakRuns(cover.callout.label.split("\n")), {
      x, y: 6.2, w, h: 0.45, fontSize: 11, color: C.muted, valign: "top",
    });
  }
  h.text("cover-notice", "frame", DRAFT_BADGE, { x, y: 6.72, w, h: 0.25, fontSize: 11, bold: true, color: C.muted });
  h.text("cover-footer", "frame", cover.footer, { x, y: 7.0, w, h: 0.25, fontSize: TYPE.footnote, color: C.faint });
  const evidence = new Map((opts.evidence ?? []).map((e) => [e.id, e]));
  const calloutSources = (cover.callout?.evidenceRefs ?? []).map((id) => {
    const e = evidence.get(id);
    if (!e) throw new Error(`exhibit build refused — cover callout cites unknown evidence ${id}`);
    return `${e.title}. ${e.url} · ${e.locator}`;
  });
  slide.addNotes(
    [
      `Cover. Classification: research. DRAFT · REVIEW GATES PENDING. Publication authorization is not granted by this tool. ${opts.qcRecord ? `QC record named: ${opts.qcRecord} (its contents are not verified by the exhibit tools).` : "No QC record attached; review gates A–E are pending."}`,
      `Thesis wording: ${cover.thesisSource}`,
      ...(cover.callout ? [`${cover.callout.value} ${cover.callout.label.replace(/\n/g, ". ")}. Basis: ${cover.callout.basis}`, ...calloutSources] : []),
      `Cover image: ${cover.hero.credit} SHA-256 ${cover.hero.sha256}.`,
    ].join("\n"),
  );
}

export async function buildDeck(
  entries: DeckEntry[],
  cover: { title: string; lines: string[]; hero?: HeroCover },
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
  if (cover.hero) {
    heroCoverSlide(pptx, cover.title, cover.hero, coverRecords, opts);
    manifest.push({ slide: 1, pattern: "cover", cover_pattern: "cover_hero_split", elements: coverRecords });
  } else if (opts.researchCover && opts.classification === "research") {
    const links = opts.researchCover.evidence_refs.flatMap((id) => {
      const ref = opts.evidence?.find((r) => r.id === id);
      return ref ? [{ id, label: ref.label ?? id, url: ref.url }] : [];
    });
    researchCoverSlide(pptx, opts.researchCover, coverRecords, links,
      `Cover. Classification: research. ${DRAFT_BADGE}. Publication authorization is not granted by this tool. ${opts.qcRecord ? `QC record named: ${opts.qcRecord} (its contents are not verified by the exhibit tools).` : "No QC record attached; review gates A–E are pending."}`);
    manifest.push({ slide: 1, pattern: "cover", elements: coverRecords });
  } else {
    coverSlide(pptx, cover.title, cover.lines, coverRecords, opts);
    manifest.push({ slide: 1, pattern: "cover", elements: coverRecords });
  }

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
    if (opts.plainFrame) h.plain = true;
    renderer.render(h, data, e.fixture);
    // Keep the fixed frame above native tables in renderers that reflow them.
    // Research slides with an evidence register get clickable footer citations, in evidence_refs order.
    const links = opts.classification === "research" && opts.evidence?.length
      ? (e.fixture.evidence_refs ?? []).flatMap((id) => {
          const ref = opts.evidence!.find((r) => r.id === id);
          return ref?.label ? [{ label: ref.label, url: ref.url }] : [];
        })
      : undefined;
    drawFrame(h, {
      label: e.label, slideNumber, fixture: e.fixture, annotationHeading: !opts.plainFrame,
      ...(links?.length ? { links } : {}),
    });
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
 * pptxgenjs writes speaker notes as a single run, so a newline in the notes
 * string stays a raw newline inside one <a:t>. Split such a run into one
 * paragraph per line. Notes without newlines are returned unchanged.
 */
export function splitNoteParagraphs(xml: string): string {
  return xml.replace(
    /<a:p><a:r>(<a:rPr[^>]*\/>)<a:t>([^<]*\n[^<]*)<\/a:t><\/a:r>(<a:endParaRPr[^>]*\/>)<\/a:p>/g,
    (_m, rPr: string, text: string, end: string) =>
      text.split("\n").map((line, i, all) => `<a:p><a:r>${rPr}<a:t>${line}</a:t></a:r>${i === all.length - 1 ? end : ""}</a:p>`).join(""),
  );
}

/**
 * pptxgenjs hard-codes Arial in pie/doughnut series data-label text properties
 * (no option reaches it). Point every chart typeface at the deck font so the
 * chart XML matches the rest of the deck. A no-op for charts already in FONT.
 */
export function unifyChartTypeface(chartXml: string): string {
  return chartXml.replace(/(<a:(?:latin|ea|cs) typeface=")Arial(")/g, `$1${FONT}$2`);
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
    } else if (/^ppt\/theme\/theme\d+\.xml$/.test(name)) {
      const xml = brandThemeXml((await entry.async("string")) as string);
      out.file(name, xml, { date: FIXED_DATE, createFolders: false });
    } else if (/^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(name)) {
      const xml = splitNoteParagraphs((await entry.async("string")) as string);
      out.file(name, xml, { date: FIXED_DATE, createFolders: false });
    } else if (/^ppt\/charts\/chart\d+\.xml$/.test(name)) {
      const xml = unifyChartTypeface(suppressHelperLabels((await entry.async("string")) as string));
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
  assertFonts(); // covers set Spectral; a deliverable never builds against a substitute face
  const registry = loadRegistry();
  const galleryEntries: DeckEntry[] = registry.map((p) => ({
    fixture: loadFixture(p.id),
    label: `${p.family_code}. ${p.family} · ${p.name}`,
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
