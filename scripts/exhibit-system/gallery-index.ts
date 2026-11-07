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
<article class="pattern" id="${esc(p.id)}">
  <header>
    <p class="code">${esc(p.family_code)}${p.order} · <code>${esc(p.id)}</code> · gallery slide ${slide}</p>
    <h3>${esc(p.name)}</h3>
    <p class="question">${esc(p.reader_question)}</p>
  </header>
  <a class="preview" href="${previewHref(p.id)}"><img src="${previewHref(p.id)}" alt="Preview of the ${esc(p.name)} pattern rendered with synthetic demonstration data" loading="lazy" width="960" height="540"></a>
  <dl>
    <dt>Relationship</dt><dd>${esc(p.relationship)}</dd>
    <dt>Question types</dt><dd>${p.question_types.map(esc).join(", ")}</dd>
    <dt>Requires</dt><dd>${p.requires.length ? p.requires.map(esc).join(", ") : "No special data trait"}</dd>
    <dt>Capacity</dt><dd>${p.capacity.min_items}–${p.capacity.max_items} ${esc(p.capacity.what)}</dd>
    <dt>Units</dt><dd>${esc(p.units)}</dd>
    <dt>Editability tier</dt><dd><span class="tier">${esc(e.tier)}</span></dd>
  </dl>
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
</article>`;
}

export function renderGalleryHtml(registry: readonly PatternSpec[]): string {
  const families = (Object.keys(FAMILIES) as FamilyCode[]).filter((f) => registry.some((p) => p.family_code === f));
  const nav = families
    .map((f) => `<li><a href="#family-${f}">${f}. ${esc(FAMILIES[f])}</a> (${registry.filter((p) => p.family_code === f).length})</li>`)
    .join("");
  const sections = families
    .map((f) => {
      const cards = registry
        .map((p, i) => ({ p, slide: i + 2 }))
        .filter(({ p }) => p.family_code === f)
        .map(({ p, slide }) => card(p, slide))
        .join("");
      return `<section class="family" id="family-${f}"><h2>${f}. ${esc(FAMILIES[f])}</h2>${cards}</section>`;
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
:root { --ink:#1f2328; --muted:#5b6470; --rule:#d8dde3; --paper:#fbfaf7; --accent:#8a5a14; }
* { box-sizing: border-box; }
body { margin:0; font-family: Archivo, "Helvetica Neue", Arial, sans-serif; color:var(--ink); background:var(--paper); line-height:1.45; }
main { max-width: 1040px; margin: 0 auto; padding: 24px 16px 64px; }
.banner { border:1px solid var(--accent); padding:10px 14px; font-size:14px; }
h1 { font-size: 28px; margin: 20px 0 4px; }
h2 { font-size: 20px; border-bottom: 2px solid var(--ink); padding-bottom: 4px; margin-top: 48px; }
h3 { font-size: 18px; margin: 2px 0; }
h4 { font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); margin: 0 0 4px; }
nav ul { columns: 2; padding-left: 18px; }
.pattern { border-top: 1px solid var(--rule); padding: 20px 0; }
.code, .question { margin: 0; color: var(--muted); font-size: 14px; }
.question { color: var(--ink); font-style: italic; }
.preview img { display:block; width:100%; height:auto; border:1px solid var(--rule); margin: 12px 0; background:#fff; }
.preview:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
dl { display:grid; grid-template-columns: 9.5em 1fr; gap: 2px 12px; font-size: 14px; margin: 0 0 8px; }
dt { color: var(--muted); }
dd { margin: 0; }
.tier { font-family: ui-monospace, Menlo, monospace; font-size: 13px; }
.cols { display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 8px 24px; font-size: 14px; }
.cols ul { margin: 0 0 8px; padding-left: 18px; }
.none { margin: 0 0 8px; color: var(--muted); }
.alt, .refs { font-size: 14px; margin: 6px 0; }
code { font-size: 12.5px; }
@media (max-width: 560px) { dl { grid-template-columns: 1fr; } nav ul { columns: 1; } }
</style>
</head>
<body>
<main>
<p class="banner"><strong>Development reference — not for publication.</strong> Every name, figure and date in these previews is synthetic demonstration data and is not an SMPT research finding. This page is generated by <code>scripts/exhibit-system/gallery-index.ts</code> and is not part of the public site.</p>
<h1>Exhibit pattern gallery</h1>
<p>${registry.length} registered patterns. Editability tiers: ${tierLine}. The editable source for every preview is <a href="../exhibit-gallery.pptx">exhibit-gallery.pptx</a>; the machine-readable registry is <a href="../exhibit-registry.json">exhibit-registry.json</a>.</p>
<p>Previews are LibreOffice renders of the native PPTX objects. PowerPoint may differ in font metrics and bubble scaling; manual PowerPoint open/edit/save testing has not been performed.</p>
<nav aria-label="Families"><ul>${nav}</ul></nav>
${sections}
</main>
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
