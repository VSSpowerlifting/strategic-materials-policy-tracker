// Research-deck entry point: renders real SMPT exhibits with the registered
// patterns, kept apart from the synthetic gallery.
//
//   npm run exhibits:render -- <spec.json> <out.pptx> [--qc-record <path>]
//
// Rules this file enforces (and tests/exhibit-system.test.ts checks):
// - The spec and the output live OUTSIDE docs/design/presentations/exhibit-system,
//   so research data never sits beside synthetic fixtures.
// - The spec declares `"classification": "research"`; every exhibit names the
//   evidence-register or source ids behind it (`evidence_refs`, non-empty).
// - A spec cannot pull in a synthetic fixture (`fixture` keys are rejected) or
//   carry the synthetic notice text.
// - Slides carry a "DRAFT · REVIEW GATES PENDING" badge unless a QC record
//   path is given. The tool checks only that the file exists; it does not read
//   or judge the record, and never marks a gate as passed.
// - The build writes `<out>.manifest.json` beside the deck for
//   `verify_editability.py --deck <out.pptx> --manifest <out>.manifest.json`.

import fs from "node:fs";
import path from "node:path";
import { arr, ContractError, obj, oneOf, optStr, str, strList } from "./contract";
import { REPO, SYSTEM_DIR } from "./paths";
import { SYNTHETIC_NOTICE } from "./primitives";
import { RENDERERS } from "./renderers";
import type { Fixture } from "./types";

export interface ResearchSlide {
  label: string;
  table_reason?: string;
  fixture: Fixture;
}

export interface ResearchDeck {
  title: string;
  cover_lines: string[];
  qc_record?: string;
  slides: ResearchSlide[];
}

function inside(dir: string, file: string): boolean {
  const rel = path.relative(dir, path.resolve(file));
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/** Refuse any research spec or output placed inside the synthetic exhibit-system directory. */
export function assertOutsideSystemDir(file: string, what: string): void {
  if (inside(SYSTEM_DIR, file)) {
    throw new ContractError(
      `${what} ${path.relative(REPO, path.resolve(file))} is inside ${path.relative(REPO, SYSTEM_DIR)}; research material must be kept apart from the synthetic gallery`,
    );
  }
}

export function parseResearchDeck(raw: unknown, file: string, baseDir = REPO): ResearchDeck {
  if (JSON.stringify(raw).includes(SYNTHETIC_NOTICE.slice(0, 30))) {
    throw new ContractError(`${file}: research spec contains the synthetic-demonstration notice`);
  }
  const o = obj(raw, file);
  if (o.classification !== "research") throw new ContractError(`${file}: classification must be "research"`);
  const qc = optStr(o.qc_record, `${file}.qc_record`);
  if (qc !== undefined && !fs.existsSync(path.resolve(baseDir, qc))) {
    throw new ContractError(`${file}: qc_record ${qc} does not exist`);
  }
  const slides = arr(o.slides, `${file}.slides`).map((s, i): ResearchSlide => {
    const p = `${file}.slides[${i}]`;
    const so = obj(s, p);
    if ("fixture" in so) throw new ContractError(`${p}: research slides cannot reference a synthetic fixture`);
    const pattern = str(so.pattern, `${p}.pattern`);
    if (!RENDERERS.has(pattern)) throw new ContractError(`${p}: unknown pattern "${pattern}"`);
    const ex = obj(so.exhibit, `${p}.exhibit`);
    const title = str(ex.title, `${p}.exhibit.title`);
    return {
      label: str(so.label, `${p}.label`),
      table_reason: optStr(so.table_reason, `${p}.table_reason`),
      fixture: {
        pattern,
        classification: "research",
        title,
        subtitle: str(ex.subtitle, `${p}.exhibit.subtitle`),
        annotation: str(ex.annotation, `${p}.exhibit.annotation`),
        source: str(ex.source, `${p}.exhibit.source`),
        evidence_refs: strList(ex.evidence_refs, `${p}.exhibit.evidence_refs`),
        visual_text: ex.visual_text === undefined ? [title] : strList(ex.visual_text, `${p}.exhibit.visual_text`),
        layout: ex.layout === undefined ? undefined : oneOf(ex.layout, ["split", "wide"] as const, `${p}.exhibit.layout`),
        data: ex.data,
      },
    };
  });
  return {
    title: str(o.title, `${file}.title`),
    cover_lines: o.cover_lines === undefined ? [] : strList(o.cover_lines, `${file}.cover_lines`, 0),
    qc_record: qc,
    slides,
  };
}

export function loadResearchDeck(file: string): ResearchDeck {
  assertOutsideSystemDir(file, "research spec");
  const abs = path.resolve(file);
  return parseResearchDeck(JSON.parse(fs.readFileSync(abs, "utf8")), path.basename(abs), path.dirname(abs));
}

/** Build a research deck. Returns the manifest path. */
export async function renderResearchDeck(specFile: string, outFile: string, qcOverride?: string): Promise<string> {
  assertOutsideSystemDir(outFile, "research output");
  const deck = loadResearchDeck(specFile);
  const qc = qcOverride ?? deck.qc_record;
  if (qcOverride !== undefined && !fs.existsSync(path.resolve(qcOverride))) {
    throw new ContractError(`--qc-record ${qcOverride} does not exist`);
  }
  // Imported lazily so the pure loader above stays testable without pptxgenjs.
  const { buildDeck } = await import("./build-gallery");
  const slides = await buildDeck(
    deck.slides.map((s) => ({ fixture: s.fixture, label: s.label })),
    { title: deck.title, lines: deck.cover_lines },
    outFile,
    { classification: "research", qcRecord: qc },
  );
  const manifestFile = outFile.replace(/\.pptx$/i, "") + ".manifest.json";
  const manifest = {
    note: "Research exhibit manifest. Generated by scripts/exhibit-system/research-deck.ts.",
    classification: "research",
    spec: path.resolve(specFile),
    qc_record: qc ?? null,
    review_gates: qc ? "QC record named; its contents are not verified by the exhibit tools" : "pending",
    slides: slides.map((s) => {
      const src = deck.slides[s.slide - 2];
      return src ? { ...s, visual_text: src.fixture.visual_text, evidence_refs: src.fixture.evidence_refs } : s;
    }),
  };
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifestFile;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const qcAt = args.indexOf("--qc-record");
  const qc = qcAt >= 0 ? args[qcAt + 1] : undefined;
  const [spec, out] = qcAt >= 0 ? [...args.slice(0, qcAt), ...args.slice(qcAt + 2)] : args;
  if (!spec || !out) {
    console.error("usage: npm run exhibits:render -- <spec.json> <out.pptx> [--qc-record <path>]");
    process.exit(2);
  }
  renderResearchDeck(spec, out, qc)
    .then((m) => {
      console.log(`research deck → ${out}`);
      console.log(`manifest      → ${m}`);
      console.log(qc ? `QC record named: ${qc} (not verified by this tool)` : "Slides carry the draft badge: review gates A–E pending.");
    })
    .catch((e: unknown) => {
      console.error(e instanceof Error ? e.message : e);
      process.exit(1);
    });
}
