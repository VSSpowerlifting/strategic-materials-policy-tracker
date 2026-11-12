import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { photographs, researchCovers, researchCoverPhoto } from "../lib/photography";

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
