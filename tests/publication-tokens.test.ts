import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { brandThemeXml, contrastRatio, hex, neutralHex, rampHex, seriesHex, themeColourScheme, tokens, type PaletteName } from "../scripts/publication/tokens";

const root = resolve(__dirname, "..");
const css = readFileSync(resolve(root, "app/globals.css"), "utf8");
const markets = readFileSync(resolve(root, "components/markets/types.ts"), "utf8");

function cssVar(name: string): string {
  const m = css.match(new RegExp(`${name.replace(/[-]/g, "\\-")}\\s*:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(m, `${name} not found in app/globals.css`);
  return m[1].toLowerCase();
}

test("publication palette matches the site tokens in app/globals.css", () => {
  for (const [name, token] of Object.entries(tokens.palette)) {
    assert.equal(token.hex.toLowerCase(), cssVar(token.site), `${name} drifted from ${token.site}`);
  }
});

test("series set matches components/markets/types.ts", () => {
  const block = markets.slice(markets.indexOf("const PALETTE"), markets.indexOf("const PALETTE") + 600);
  const found = [...block.matchAll(/color:\s*"(#[0-9a-f]{6})",\s*dash:\s*(undefined|"[^"]+")/g)].map((m) => [m[1], m[2] === "undefined" ? null : m[2].slice(1, -1)]);
  assert.equal(found.length, tokens.seriesOrder.length);
  tokens.seriesOrder.forEach((name, i) => {
    assert.deepEqual([tokens.series[name].hex, tokens.series[name].dash], found[i], `series ${name} drifted`);
  });
  const extra = markets.match(/EXTRA_DASHES[^=]*=\s*\[([^\]]+)\]/);
  assert.ok(extra, "EXTRA_DASHES not found");
  assert.deepEqual([...extra[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]), tokens.seriesExtraDashes);
});

test("recorded contrast ratios are reproducible", () => {
  const key: Record<string, string> = {
    graphite: hex("graphite"), slate: hex("slate"), faint: hex("faint"), malachite: hex("malachite"),
    hematite: hex("hematite"), ochre: hex("ochre"), border: hex("border"), borderStrong: hex("borderStrong"),
    seriesMalachite: seriesHex("malachite"), seriesLapis: seriesHex("lapis"),
    seriesOchre: seriesHex("ochre"), seriesPlum: seriesHex("plum"),
  };
  for (const [ground, table] of [["plate", tokens.contrast.vsPlate], ["plaster", tokens.contrast.vsPlaster]] as const) {
    for (const [name, recorded] of Object.entries(table)) {
      const actual = contrastRatio(key[name], hex(ground as PaletteName));
      assert.ok(Math.abs(actual - recorded) < 0.011, `${name} on ${ground}: recorded ${recorded}, computed ${actual.toFixed(2)}`);
    }
  }
});

test("text colours clear AA on every surface and light text sits on dark fills", () => {
  for (const ink of ["graphite", "slate", "faint", "malachite", "hematite"] as const) {
    for (const ground of ["plaster", "chalk", "elevated", "plate"] as const) {
      assert.ok(contrastRatio(hex(ink), hex(ground)) >= 4.5, `${ink} on ${ground} below 4.5:1`);
    }
  }
  assert.ok(contrastRatio(hex("plate"), hex("graphite")) >= 7);
  assert.ok(contrastRatio(hex("plate"), hex("malachite")) >= 7);
  // Ochre and lapis are marks, not text: the token file must say so.
  assert.match(tokens.contrast.rules.join(" "), /never small text/);
});

test("sequential ramp ends on the series malachite and darkens monotonically", () => {
  const steps = rampHex();
  assert.equal(steps.at(-1), seriesHex("malachite"));
  for (let i = 1; i < steps.length; i++) {
    assert.ok(contrastRatio(steps[i], hex("plate")) > contrastRatio(steps[i - 1], hex("plate")));
  }
});

test("type policy: Spectral is editorial only and never silently substituted", () => {
  assert.equal(tokens.type.editorial.family, "Spectral");
  assert.equal(tokens.type.text.family, "Archivo");
  const never = (tokens.type.editorial as unknown as { never: string[] }).never.join(" ");
  for (const word of ["analytical slide titles", "tables", "chart labels", "source footers"]) assert.match(never, new RegExp(word));
  assert.match((tokens.type as unknown as { fallbackPolicy: string }).fallbackPolicy, /No silent substitution/);
});

test("Python loader agrees with the TypeScript loader", () => {
  const out = execFileSync("python3", ["-c",
    "import sys,json; sys.path.insert(0,'scripts/publication'); import tokens as t; print(json.dumps({k:t.hex_(k) for k in t.TOKENS['palette']}))"], { cwd: root }).toString();
  const py = JSON.parse(out) as Record<string, string>;
  for (const name of Object.keys(tokens.palette) as PaletteName[]) assert.equal(py[name], hex(name));
});

test("functional neutrals are marks, not text: dark reads as text, mid clears 3:1 as a mark", () => {
  for (const ground of [hex("plate"), hex("plaster")]) {
    assert.ok(contrastRatio(neutralHex("dark"), ground) >= 7, "dark neutral");
    assert.ok(contrastRatio(neutralHex("mid"), ground) >= 3, "mid neutral is a non-text mark");
  }
  assert.ok(contrastRatio(neutralHex("light"), hex("plate")) < 3, "light neutral is a fill, not a mark that must stand alone");
});

test("Python loader exposes the same neutrals and ramp", () => {
  const out = execFileSync("python3", ["-c",
    "import sys,json; sys.path.insert(0,'scripts/publication'); import tokens as t; print(json.dumps({'n':[t.neutral_hex(k) for k in ('dark','mid','light')],'r':t.ramp_hex()}))"], { cwd: root }).toString();
  const py = JSON.parse(out) as { n: string[]; r: string[] };
  assert.deepEqual(py.n, [neutralHex("dark"), neutralHex("mid"), neutralHex("light")]);
  assert.deepEqual(py.r, rampHex());
});

test("themed colour scheme uses tokens only and the Python mirror is identical", () => {
  const allowed = new Set([
    ...Object.keys(tokens.palette).map((k) => hex(k as PaletteName)),
    seriesHex("lapis"), seriesHex("plum"), neutralHex("mid"),
  ]);
  const used = [...themeColourScheme().matchAll(/srgbClr val="([0-9A-F]{6})"/g)].map((m) => m[1]);
  assert.equal(used.length, 12);
  for (const c of used) assert.ok(allowed.has(c), `theme colour ${c} is not a token`);
  assert.equal(brandThemeXml("<a:theme><a:clrScheme name=\"Office\"><a:dk1/></a:clrScheme></a:theme>"), `<a:theme>${themeColourScheme()}</a:theme>`);
  const py = execFileSync("python3", ["-c",
    "import sys; sys.path.insert(0,'scripts/publication'); import tokens as t; sys.stdout.write(t.theme_colour_scheme())"], { cwd: root }).toString();
  assert.equal(py, themeColourScheme());
});

test("check_deck.py passes the committed exhibit decks and rejects a legacy-palette deck", () => {
  const run = (file: string) => {
    try {
      return { status: 0, out: execFileSync("python3", ["scripts/publication/check_deck.py", file], { cwd: root }).toString() };
    } catch (e) {
      const err = e as { status: number; stdout: Buffer };
      return { status: err.status, out: err.stdout.toString() };
    }
  };
  for (const deck of ["exhibit-system/demo-deck.pptx", "exhibit-system/exhibit-gallery.pptx", "validation/output/smpt-validation-deck.pptx"]) {
    const r = run(`docs/design/presentations/${deck}`);
    assert.equal(r.status, 0, `${deck}: ${r.out}`);
  }
  // read-only negative control: the published v2 deck keeps its gold palette
  const legacy = run("public/research/fi001/presentation-v2-archivo.pptx");
  assert.equal(legacy.status, 1);
  assert.match(legacy.out, /is not a publication token/);
});
