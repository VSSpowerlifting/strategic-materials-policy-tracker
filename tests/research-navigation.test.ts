import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { headerNav, isNavCurrent, journeys, secondaryNav } from "../lib/site";

const homepage = () => readFileSync("app/page.tsx", "utf8");
const header = () => readFileSync("components/site-header.tsx", "utf8");

test("Research is promoted on the homepage without crowding desktop navigation", () => {
  assert.equal(journeys.length, 5);
  assert.equal(headerNav.length, 5);
  assert.ok(headerNav.every((item) => item.href !== "/research"));
  assert.ok(journeys.every((item) => !item.href.startsWith("/research")));
  assert.ok(homepage().includes('<Link href="/research" className="research-button">Read research</Link>'));
  assert.ok(homepage().includes('<Link href="/explore" className="research-button-secondary">Explore the data</Link>'));
  assert.ok(homepage().includes('href="/research" className="font-display text-sm text-accent underline underline-offset-4"'));
  assert.ok(homepage().includes("<FeaturedCase />"));
  assert.ok(readFileSync("lib/fi002.ts", "utf8").includes('"/research/escondida-copper"'));
});

test("Research remains accessible on mobile and in the footer", () => {
  assert.match(header(), /<Link href="\/research" onClick=\{closeMenu\}/);
  assert.ok(secondaryNav.some((item) => item.href === "/research"));
  assert.ok(headerNav.every((item) => !isNavCurrent("/research", item)));
  assert.ok(headerNav.every((item) => !isNavCurrent("/research/tungsten-supply-security", item)));
  assert.ok(isNavCurrent("/events", headerNav.find((item) => item.href === "/events")!));
});


test("Published research back links use reliable document navigation", () => {
  const articles = [
    "escondida-copper",
    "hemerdon-financing",
    "antimony-supply-resilience",
    "tungsten-supply-security",
    "china-export-control-suspension-extension",
  ];
  for (const slug of articles) {
    const source = readFileSync(`app/research/${slug}/page.tsx`, "utf8");
    assert.match(source, /<a\s+href="\/research"/, `${slug}: native return link`);
    assert.doesNotMatch(source, /<Link\s+href="\/research"[^>]*>\s*← Research/, `${slug}: no intercepted return link`);
  }
});

test("Escondida report downloads open separately without changing approved copy", () => {
  const source = readFileSync("app/research/escondida-copper/page.tsx", "utf8");
  assert.ok(source.includes('href={`${fi002.assets}/report.html`}'));
  assert.match(source, /Read online <span>→<\/span>/);
  assert.match(source, /Full report in HTML/);
  assert.match(source, /target="_blank"\s+rel="noopener noreferrer"/);
});

test("Social previews serve the generated brand cards at their routes", () => {
  // The cards are drawn by `npm run brand:build` and committed; the routes return those files unchanged. The
  // root `/opengraph-image` stays the default card. Four studies name their own card; FI002 uses the default.
  const root = readFileSync("app/opengraph-image.tsx", "utf8");
  assert.match(root, /socialCard\("og-default\.png"\)/);
  assert.match(root, /width: 1200, height: 630/);
  assert.match(root, /contentType = "image\/png"/);
  const studies = [
    "china-export-control-suspension-extension",
    "hemerdon-financing",
    "antimony-supply-resilience",
    "tungsten-supply-security",
  ];
  const fi002 = readFileSync("app/research/escondida-copper/page.tsx", "utf8");
  assert.equal(fi002.split('"/opengraph-image"').length - 1, 2, "FI002: Open Graph and Twitter metadata both name the default card");
  assert.ok(!fi002.includes("/research/escondida-copper/opengraph-image"), "FI002: no card of its own");
  assert.ok(!existsSync("app/research/escondida-copper/opengraph-image.tsx"), "FI002: no card route");
  for (const slug of studies) {
    const route = readFileSync(`app/research/${slug}/opengraph-image.tsx`, "utf8");
    assert.ok(route.includes(`socialCard("research/${slug}.png")`), `${slug}: route serves its card`);
    assert.match(route, /width: 1200, height: 630/);
    const page = readFileSync(`app/research/${slug}/page.tsx`, "utf8");
    const named = page.split(`/research/${slug}/opengraph-image`).length - 1 +
      page.split("/research/${SLUG}/opengraph-image").length - 1;
    assert.equal(named, 2, `${slug}: Open Graph and Twitter metadata both name the card`);
  }
  for (const file of ["og-default.png", ...studies.map(slug => `research/${slug}.png`)]) {
    const png = readFileSync(`public/brand/social/${file}`);
    assert.equal(png.readUInt32BE(16), 1200, `${file}: width`);
    assert.equal(png.readUInt32BE(20), 630, `${file}: height`);
  }
});
