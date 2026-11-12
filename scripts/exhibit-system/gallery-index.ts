// Development gallery page: gallery/index.html, generated from the registry.
//
//   npm run exhibits:gallery
//
// A local, static reference document for analysts. It is NOT part of the
// Next.js site, is not linked from any public route, and must not be deployed.
// Preview PNGs come from scripts/exhibit-system/render_previews.py, which
// rasterises exhibit-gallery.pptx (slide n + 1 = registry position n).
import fs from "node:fs";
import path from "node:path";
import { FAMILIES, REFERENCES, loadRegistry, type FamilyCode, type PatternSpec } from "./registry";
import { GALLERY_DIR, REPO } from "./paths";

export const GALLERY_INDEX = path.join(GALLERY_DIR, "index.html");

/** Relative preview path for a pattern, as linked from index.html. */
export const previewHref = (id: string) => `previews/${id}.png`;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const list = (items: string[]) => (items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "<p class=\"none\">None</p>");

function card(p: PatternSpec, slide: number): string {
  const e = p.editability;
  return `
<article class="pattern" id="${esc(p.id)}" data-family="${p.family_code}" data-tier="${esc(e.tier)}">
  <a class="preview" href="${previewHref(p.id)}" aria-label="Enlarge ${esc(p.name)}"><img src="${previewHref(p.id)}" alt="${esc(p.name)} with synthetic demonstration data" loading="lazy" width="960" height="540"></a>
  <header>
    <p class="code">${esc(p.family_code)}${p.order} · <code>${esc(p.id)}</code> · gallery slide ${slide}</p>
    <h3>${esc(p.name)}</h3>
    <p class="question">${esc(p.reader_question)}</p>
  </header>
  <div class="actions"><label><input type="checkbox" data-compare="${esc(p.id)}">Compare ${esc(p.name)}</label><a href="../exhibit-gallery.pptx" download>Editable PPTX · slide ${slide}</a></div>
  <dl>
    <dt>Relationship</dt><dd>${esc(p.relationship)}</dd>
    <dt>Question types</dt><dd>${p.question_types.map(esc).join(", ")}</dd>
    <dt>Requires</dt><dd>${p.requires.length ? p.requires.map(esc).join(", ") : "No special data trait"}</dd>
    <dt>Capacity</dt><dd>${p.capacity.min_items}–${p.capacity.max_items} ${esc(p.capacity.what)}</dd>
    <dt>Units</dt><dd>${esc(p.units)}</dd>
    <dt>Editability tier</dt><dd><span class="tier">${esc(e.tier)}</span></dd>
  </dl>
  <details><summary>Use, limits and editability</summary>
  <div class="cols">
    <section><h4>Use when</h4>${list(p.use_when)}</section>
    <section><h4>Avoid when</h4>${list(p.avoid_when)}</section>
    <section><h4>Editable</h4>${list(e.editable)}</section>
    <section><h4>Positioned, not data-bound</h4>${list(e.not_data_bound)}</section>
    <section><h4>Raster elements</h4>${list(e.raster)}</section>
    <section><h4>Limitations</h4>${list(p.limitations)}</section>
  </div>
  <p class="alt"><strong>Table alternative:</strong> ${esc(p.table_alternative)}</p>
  <p class="refs"><strong>Integrity rules:</strong> ${p.integrity_rules.map((r) => `<code>${esc(r)}</code>`).join(" ")}</p>
  <p class="refs"><strong>Design references:</strong> ${p.references.map((r) => esc(REFERENCES[r])).join("; ")}</p>
</details>
</article>`;
}

export function renderGalleryHtml(registry: readonly PatternSpec[]): string {
  const families = (Object.keys(FAMILIES) as FamilyCode[]).filter((f) => registry.some((p) => p.family_code === f));
  const nav = families
    .map((f) => `<li><a data-family-link="${f}" href="#family-${f}">${f}. ${esc(FAMILIES[f])}</a> (${registry.filter((p) => p.family_code === f).length})</li>`)
    .join("");
  const sections = families
    .map((f) => {
      const cards = registry
        .map((p, i) => ({ p, slide: i + 2 }))
        .filter(({ p }) => p.family_code === f)
        .map(({ p, slide }) => card(p, slide))
        .join("");
      return `<section class="family" id="family-${f}"><h2>${f}. ${esc(FAMILIES[f])}</h2><div class="pattern-grid">${cards}</div></section>`;
    })
    .join("\n");
  const tiers = new Map<string, number>();
  for (const p of registry) tiers.set(p.editability.tier, (tiers.get(p.editability.tier) ?? 0) + 1);
  const tierLine = [...tiers.entries()].map(([t, n]) => `${esc(t)}: ${n}`).join(" · ");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>SMPT exhibit pattern gallery (development reference)</title>
<style>
${fs.readFileSync(path.join(REPO, "scripts/exhibit-system/gallery.css"), "utf8")}
</style>
</head>
<body>
<div class="masthead">SMPT / Presentation library</div>
<main>
<p class="banner"><strong>Development reference — not for publication.</strong> All figures and entities are synthetic demonstration data.</p>
<h1>Exhibit pattern gallery</h1>
<p>${registry.length} editable patterns across ${families.length} analytical families. Browse by the comparison your reader needs to make.</p>
<div class="downloads"><a href="../exhibit-gallery.pptx" download>Download editable gallery</a><a href="../demo-deck.pptx" download>Download demonstration deck</a><a href="../exhibit-registry.json">Pattern registry</a><a href="../README.md">Build and review guide</a></div>
<p class="banner">Previews use LibreOffice. Microsoft PowerPoint open / Edit Data / save / reopen remains unverified. ${tierLine}. No raster exhibits.</p>
<nav aria-label="Families"><ul>${nav}</ul></nav>
<section id="controls" hidden aria-label="Find and compare patterns">
<div class="filters"><label>Search patterns<input id="search" type="search" placeholder="Name, question, data or integrity rule"></label>
<label>Family<select id="family"><option value="">All families</option>${families.map((f) => `<option value="${f}">${f}. ${esc(FAMILIES[f])}</option>`).join("")}</select></label>
<label>Editability<select id="tier"><option value="">All tiers</option>${[...tiers.keys()].map((t) => `<option>${esc(t)}</option>`).join("")}</select></label><button id="reset" type="button">Reset filters</button></div>
<div class="compare-bar"><output id="result-count" aria-live="polite"></output><button id="compare" type="button" disabled>Compare (0/2)</button><button id="clear-comparison" type="button">Clear selection</button></div>
<p id="selection-status" aria-live="polite"></p>
</section>
<p id="empty" hidden>No patterns match. Try fewer search terms or reset the filters.</p>
${sections}
</main>
<dialog id="preview-dialog" aria-labelledby="preview-title"><div class="dialog-header"><h2 id="preview-title">Pattern preview · synthetic demonstration</h2><button id="close-preview" type="button" autofocus>Close preview</button></div><div id="preview-contents"></div></dialog>
<script>${fs.readFileSync(path.join(REPO, "scripts/exhibit-system/gallery-browser.js"), "utf8")}</script>
</body>
</html>
`;
}

if (require.main === module) {
  const registry = loadRegistry();
  fs.mkdirSync(GALLERY_DIR, { recursive: true });
  fs.writeFileSync(GALLERY_INDEX, renderGalleryHtml(registry));
  console.log(`gallery index: ${registry.length} patterns → ${path.relative(REPO, GALLERY_INDEX)}`);
}
