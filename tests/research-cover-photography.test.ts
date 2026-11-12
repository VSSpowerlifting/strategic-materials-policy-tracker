import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { photographs, researchCovers, researchCoverPhoto, resolveResearchCover } from "../lib/photography";

const slugs = [
  "china-export-control-suspension-extension",
  "escondida-copper",
  "hemerdon-financing",
  "antimony-supply-resilience",
  "tungsten-supply-security",
] as const;

test("every published research page has a sourced photographic cover", () => {
  assert.equal(Object.keys(researchCovers).length, slugs.length);
  for (const slug of slugs) {
    const cover = researchCovers[slug];
    assert.equal(cover.kind, "photo", slug);
    const photo = researchCoverPhoto(slug);
    assert.ok(photo, slug);
    assert.ok(photo.src.startsWith("/") || photo.src.startsWith("https://"), slug);
    assert.ok(photo.sourceUrl.startsWith("https://"), slug);
    assert.ok(photo.rights.url.startsWith("https://"), slug);
    assert.ok(photo.alt && photo.shows && photo.limits && photo.credit, slug);
    const article = readFileSync(`app/research/${slug}/page.tsx`, "utf8");
    assert.match(article, /<ResearchCover/);
  }
  assert.equal(Object.keys(photographs).length, slugs.length);
});

test("external cover images keep attribution and accessible image descriptions", () => {
  const plate = readFileSync("components/editorial/photo-plate.tsx", "utf8");
  assert.match(plate, /unoptimized=\{p\.src\.startsWith\("https:\/\/"\)\}/);
  assert.match(plate, /rel="license"/);
  assert.match(plate, /alt=\{p\.alt\}/);
  assert.match(plate, /p\.limits/);
  const gallery = readFileSync("app/research/page.tsx", "utf8");
  for (const slug of slugs) assert.ok(gallery.includes(`data-cover="${slug}"`), slug);
});

// Future research pages inherit a cover without adding a new registry entry or a human artwork sign-off.
test("new research slugs resolve to an approved photograph or a branded plate", () => {
  assert.deepEqual(resolveResearchCover("future-hemerdon-refinancing"), { kind: "photo", photo: "drakelands-aster" });
  assert.deepEqual(resolveResearchCover("antimony-supply-outlook-2030"), { kind: "photo", photo: "antimony-ingot" });
  assert.deepEqual(resolveResearchCover("new-tungsten-refining"), { kind: "photo", photo: "tungsten-usgs" });
  assert.deepEqual(resolveResearchCover("escondida-capital-program"), { kind: "photo", photo: "escondida-tailings" });
  assert.deepEqual(resolveResearchCover("china-rare-earth-export-policy"), { kind: "photo", photo: "china-rare-earths" });
  assert.deepEqual(resolveResearchCover("japan-rare-earth-processing"), { kind: "mark", mark: "REE", line: "Rare-earth elements" });
  assert.deepEqual(resolveResearchCover("copper-policy-monitor"), { kind: "mark", mark: "Cu", line: "Copper · element 29" });
  assert.deepEqual(resolveResearchCover("jpmorgan-mp-materials-financing"), { kind: "mark", mark: "SMPT", line: "Research" });
  assert.equal(researchCoverPhoto("japan-rare-earth-processing"), undefined, "no misleading Chinese site image");
  assert.equal(researchCoverPhoto("some-new-research-case"), undefined, "safe editorial fallback");
  assert.ok(resolveResearchCover("some-new-research-case").kind === "mark", "never render a blank cover");
});

test("every published research article includes the automatic cover component", () => {
  const root = "app/research";
  const pages = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(`${root}/${entry.name}/page.tsx`))
    .map((entry) => entry.name);
  assert.ok(pages.length >= slugs.length);
  for (const slug of pages) {
    const article = readFileSync(`${root}/${slug}/page.tsx`, "utf8");
    assert.match(article, /<ResearchCover\b/, `Missing automatic research cover in ${slug}`);
    assert.ok(resolveResearchCover(slug), `No cover available for ${slug}`);
  }
});

test("registered images retain provenance, rights and limitations", () => {
  for (const [id, photo] of Object.entries(photographs)) {
    assert.ok(photo.alt && photo.shows && photo.limits && photo.credit, id);
    assert.ok(photo.photoId && photo.acquired && photo.place, id);
    assert.match(photo.sourceUrl, /^https:\/\//, id);
    assert.match(photo.rights.url, /^https:\/\//, id);
    assert.ok(photo.rights.statement.length >= 16, id);
    assert.ok(photo.src.startsWith("/photography/") || photo.src.startsWith("https://"), id);
  }
});
