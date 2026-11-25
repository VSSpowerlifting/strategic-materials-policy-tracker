import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { MARK, MARK_SMALL } from "../lib/brand-mark";
import { site } from "../lib/site";
// The generator is plain ESM without types; the three exports used here are data.
import * as generator from "../scripts/brand/build-brand-assets.mjs";

const root = resolve(__dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const css = read("app/globals.css");
const tokens = JSON.parse(read("docs/design/publication-tokens.json")) as {
  palette: Record<string, { hex: string; site: string }>;
  brand: Record<string, { hex: string; site: string } | string>;
};

const { BRAND, COLOR, RESEARCH_CARDS, SERVED_RESEARCH_CARDS } = generator as unknown as {
  BRAND: { name: string; descriptor: string; tagline: string };
  COLOR: Record<string, string>;
  RESEARCH_CARDS: { slug: string; category: string; date: string; author: string; title: string }[];
  SERVED_RESEARCH_CARDS: string[];
};

function cssVar(name: string): string {
  const match = css.match(new RegExp(`${name}\\s*:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(match, `${name} not found in app/globals.css`);
  return match[1].toLowerCase();
}

/** PNG width and height from the IHDR chunk. */
function pngSize(path: string): [number, number] {
  const file = readFileSync(resolve(root, path));
  assert.equal(file.subarray(1, 4).toString("latin1"), "PNG", `${path} is not a PNG`);
  return [file.readUInt32BE(16), file.readUInt32BE(20)];
}

/** Visible text of a JSX file: entities decoded, typographic and straight apostrophes treated alike. */
const plain = (text: string) =>
  text.replace(/&apos;|&rsquo;|’/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");

test("the generator's identity strings are the site's", () => {
  assert.equal(BRAND.name, site.name);
  assert.equal(BRAND.descriptor, site.descriptor);
  assert.equal(BRAND.tagline, site.tagline);
});

test("the generator's palette mirrors app/globals.css", () => {
  const siteVar: Record<string, string> = {
    paper: "--bg", chalk: "--surface", plate: "--plate", elevated: "--elevated", ink: "--fg", slate: "--muted",
    faint: "--faint", rule: "--border", ruleStrong: "--border-strong", malachite: "--accent",
    malachiteDeep: "--accent-strong", seam: "--seam", seamBed: "--seam-bed", malachiteLight: "--malachite-light",
    onMalachite: "--on-malachite", mist: "--malachite-mist", tint: "--malachite-tint", hematite: "--negative",
    ochre: "--ochre",
  };
  assert.deepEqual(Object.keys(COLOR).sort(), Object.keys(siteVar).sort(), "every generator colour needs a site token");
  for (const [name, variable] of Object.entries(siteVar)) {
    assert.equal(COLOR[name].toLowerCase(), cssVar(variable), `${name} drifted from ${variable}`);
  }
});

test("the brand grounds in the publication tokens mirror app/globals.css and the generator", () => {
  for (const [name, token] of Object.entries(tokens.brand)) {
    if (typeof token === "string") continue; // the section's comment
    assert.equal(token.hex.toLowerCase(), cssVar(token.site), `brand.${name} drifted from ${token.site}`);
    assert.equal(token.hex.toLowerCase(), COLOR[name]?.toLowerCase(), `brand.${name} drifted from the generator`);
  }
});

test("the manifest and viewport colours are the page ground", () => {
  const ground = cssVar("--bg");
  const manifest = read("app/manifest.ts");
  assert.equal(manifest.match(/background_color:\s*"(#[0-9a-f]{6})"/)?.[1], ground);
  assert.equal(manifest.match(/theme_color:\s*"(#[0-9a-f]{6})"/)?.[1], ground);
  assert.equal(read("app/layout.tsx").match(/themeColor:\s*"(#[0-9a-f]{6})"/)?.[1], ground);
});

test("every icon the site and manifest name exists at its stated size", () => {
  assert.deepEqual(pngSize("app/icon.png"), [512, 512]);
  assert.deepEqual(pngSize("app/apple-icon.png"), [180, 180]);
  assert.deepEqual(pngSize("public/brand/icon-192.png"), [192, 192]);
  assert.deepEqual(pngSize("public/brand/icon-512.png"), [512, 512]);
  assert.deepEqual(pngSize("public/brand/icon-maskable-512.png"), [512, 512]);
  assert.ok(existsSync(resolve(root, "app/favicon.ico")));
  for (const icon of [...read("app/manifest.ts").matchAll(/src:\s*"([^"]+)"/g)].map((m) => m[1])) {
    assert.ok(existsSync(resolve(root, "public", icon.slice(1))), `${icon} is named by the manifest but missing`);
  }
});

test("the mark keeps one marker bed either side of the fault, at both sizes", () => {
  for (const geometry of [MARK, MARK_SMALL]) {
    assert.equal(geometry.shapes.filter((shape) => shape.role === "marker").length, 2);
    assert.ok(geometry.shapes.length >= 4);
    assert.ok(geometry.width > 0 && geometry.height > 0);
  }
  // The site draws the mark from the same geometry as the generated files.
  assert.match(read("components/ui/brand.tsx"), /from "@\/lib\/brand-mark"/);
  assert.match(read("scripts/brand/build-brand-assets.mjs"), /lib\/brand-mark\.ts"/);
});

test("research cards carry the title, category, date and byline published on /research", () => {
  const index = plain(read("app/research/page.tsx"));
  for (const card of RESEARCH_CARDS) {
    assert.ok(index.includes(`/research/${card.slug}`), `${card.slug} is not on /research`);
    assert.ok(index.includes(plain(card.title)), `${card.slug}: title differs from /research`);
    assert.ok(index.includes(plain(card.category)), `${card.slug}: category differs from /research`);
    assert.ok(index.includes(card.date), `${card.slug}: date differs from /research`);
    assert.ok(index.includes(card.author), `${card.slug}: byline differs from /research`);
    assert.deepEqual(pngSize(`brand/social/research/${card.slug}.png`), [1200, 630]);
  }
});

test("only cards a route serves are published, and each served card has its route", () => {
  for (const slug of SERVED_RESEARCH_CARDS) {
    assert.deepEqual(pngSize(`public/brand/social/research/${slug}.png`), [1200, 630]);
    assert.match(read(`app/research/${slug}/opengraph-image.tsx`), new RegExp(`socialCard\\("research/${slug}\\.png"\\)`));
  }
  for (const card of RESEARCH_CARDS) {
    if (SERVED_RESEARCH_CARDS.includes(card.slug)) continue;
    assert.ok(!existsSync(resolve(root, `public/brand/social/research/${card.slug}.png`)), `${card.slug} is published without a route`);
  }
  assert.deepEqual(pngSize("public/brand/social/og-default.png"), [1200, 630]);
});

test("social and document masters exist at their platform sizes", () => {
  const sizes: Record<string, [number, number]> = {
    "brand/social/og-default.png": [1200, 630],
    "brand/social/og-home.png": [1200, 630],
    "brand/social/linkedin-profile-800.png": [800, 800],
    "brand/social/linkedin-profile-400.png": [400, 400],
    "brand/social/linkedin-company-banner-2256x382.png": [2256, 382],
    "brand/social/linkedin-company-banner-1128x191.png": [1128, 191],
    "brand/social/linkedin-company-banner-1512x256.png": [1512, 256],
    "brand/social/linkedin-personal-banner-1584x396.png": [1584, 396],
    "brand/templates/research-announcement-1200x1200.png": [1200, 1200],
    "brand/templates/research-card-1200x630.png": [1200, 630],
  };
  for (const [path, size] of Object.entries(sizes)) assert.deepEqual(pngSize(path), size, path);
});

test("the old mark is kept as provenance and no longer served", () => {
  assert.ok(existsSync(resolve(root, "brand/legacy/smpt-lattice-mark.png")));
  assert.ok(!existsSync(resolve(root, "public/brand/smpt-lattice-mark.png")));
});
