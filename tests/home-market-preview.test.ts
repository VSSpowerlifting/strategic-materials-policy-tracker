import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeMarketPreview } from "@/components/home/home-market-preview";
import { getObservations } from "@/lib/market-data";
import { addMonths, indexSeries } from "@/lib/markets";

test("homepage market preview uses published observations and an honest common period", () => {
  const ids = ["wb-copper", "wb-nickel", "imf-cobalt"];
  const observations = ids.map((id) => getObservations(id));
  assert.ok(observations.every((obs) => obs.length > 36));
  const end = observations.map((obs) => obs.at(-1)!.period).sort()[0];
  const start = addMonths(end, -36);
  for (const obs of observations) {
    const indexed = indexSeries(obs, start, start, end);
    assert.equal(indexed.length, 37);
    assert.equal(indexed[0].period, start);
    assert.equal(indexed[0].value, 100);
    assert.equal(indexed.at(-1)?.period, end);
  }
  const html = renderToStaticMarkup(createElement(HomeMarketPreview));
  assert.match(html, /Copper, nickel and cobalt indexed monthly prices/);
  assert.match(html, /World Bank Pink Sheet and IMF PCPS/);
  assert.match(html, /historical comparison, not live prices/);
  assert.match(html, /href="\/markets"/);
  assert.equal((html.match(/class="market-line-reveal"/g) ?? []).length, 3);
  for (const id of ids) assert.ok(html.includes(`home-market-reveal-${id}`), id);
});

test("homepage chart replaces the corpus aside, stays chart-first and honors reduced motion", () => {
  const page = readFileSync("app/page.tsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(page, /<HomeMarketPreview \/>/);
  assert.doesNotMatch(page, /Current corpus|corpus-heading/);
  assert.ok(page.indexOf("<HomeMarketPreview />") < page.indexOf('id="research"'));
  assert.doesNotMatch(page, /<ElementStrip|<SupplyChainStrip|<LatticeOverview/);
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)[\s\S]*?\.market-line-reveal/);
});
