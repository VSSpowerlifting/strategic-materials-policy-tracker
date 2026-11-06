import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

test("Archivo is the default typeface for all site contexts", () => {
  const layout = read("app/layout.tsx");
  const css = read("app/globals.css");
  assert.match(layout, /import \{ Archivo, JetBrains_Mono \} from "next\/font\/google"/);
  assert.doesNotMatch(layout, /Newsreader|newsreader/);
  assert.match(css, /--font-display: var\(--font-archivo\)/);
  assert.match(css, /--font-sans: var\(--font-archivo\)/);
  // Legacy 'font-serif' utilities must resolve to Archivo rather than a real serif.
  assert.match(css, /--font-serif: var\(--font-archivo\)/);
  assert.match(css, /body \{[\s\S]*?font-family: var\(--font-archivo\)/);
  assert.doesNotMatch(css, /font-newsreader|Newsreader/);
  assert.match(read("app/research/escondida-copper/publication.module.css"), /font-family: var\(--font-archivo\)/);
});

test("site headings, financial articles and common UI labels use Archivo", () => {
  for (const path of [
    "app/page.tsx",
    "app/methodology/page.tsx",
    "app/research/hemerdon-financing/page.tsx",
    "components/framing-quote.tsx",
    "components/dossier/header.tsx",
    "components/projects/project-investigation.tsx",
  ]) {
    assert.doesNotMatch(read(path), /\bfont-serif\b/, path);
  }
  assert.match(read("components/ui/badge.tsx"), /font-display text-xs leading-5/);
  assert.match(read("components/ui/container.tsx"), /font-display text-xs/);
});

test("fixed-width typography remains for technical identifiers and literal URLs", () => {
  assert.match(read("app/globals.css"), /--font-mono: var\(--font-jetbrains\)/);
  assert.match(read("components/capital/primitives.tsx"), /font-mono text-xs text-faint">\{sourceId\}/);
  assert.match(read("components/source-ref.tsx"), /break-all font-mono text-xs/);
  assert.match(read("components/material-tile.tsx"), /font-mono font-medium leading-none/);
  assert.match(read("app/coverage/page.tsx"), /className="font-mono text-xs text-accent hover:text-accent-strong"/);
});

test("new research publication style names Archivo without modifying existing releases", () => {
  const style = read("docs/research/SMPT_RESEARCH_PUBLICATION_HOUSE_STYLE.md");
  assert.match(style, /Archivo is the SMPT primary typeface/);
  assert.match(style, /Existing publication binaries remain frozen/);
});
