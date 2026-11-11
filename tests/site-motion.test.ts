import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "@/app/page";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { MarketExplorer } from "@/components/markets/market-monitor";
import { buildMonitorSeries, buildReleaseNotices } from "@/components/markets/series";

test("scroll reveal keeps server-rendered content visible until JS opts into motion", () => {
  const html = renderToStaticMarkup(
    createElement(
      ScrollReveal,
      { kind: "cards" },
      createElement("article", { "data-motion-item": true }, "Evidence first"),
    ),
  );
  assert.match(html, /data-motion-kind="cards"/);
  assert.match(html, /Evidence first/);
  assert.doesNotMatch(html, /data-motion-ready|data-motion-entered/);
  const script = readFileSync("components/ui/scroll-reveal.tsx", "utf8");
  assert.match(script, /IntersectionObserver/);
  assert.match(script, /observer.disconnect\(\)/);
  assert.match(script, /prefers-reduced-motion: reduce/);
});

test("homepage chart enters in view without reintroducing the long animated lattice", () => {
  const html = renderToStaticMarkup(createElement(Home));
  assert.equal((html.match(/data-motion-kind="chart"/g) ?? []).length, 1);
  assert.equal((html.match(/data-motion-kind="cards"/g) ?? []).length, 0);
  assert.equal((html.match(/data-motion-kind="chain"/g) ?? []).length, 0);
  assert.doesNotMatch(html, /class="chain-stage |class="element-tile group/);
  assert.ok(html.indexOf('id="home-market-heading"') < html.indexOf('id="research"'));
  assert.ok(html.indexOf('id="research"') < html.indexOf('id="database-heading"'));
});

test("market selector reports monthly/annual availability and chart enters once in view", () => {
  const html = renderToStaticMarkup(
    createElement(MarketExplorer, {
      series: buildMonitorSeries(),
      releaseNotices: buildReleaseNotices(),
    }),
  );
  assert.match(html, /data-motion-kind="chart"/);
  assert.match(html, /Element-style material selector/);
  assert.match(html, /M = monthly data; A = annual data/);
  assert.match(html, /Tin · Monthly/);
  assert.match(html, /Copper · Monthly · Annual/);
  assert.match(html, /group-focus-visible:opacity-100/);
  assert.match(html, /class="market-line-reveal"/);
});

test("research reading bar is restricted to article pages and does not hijack scrolling", () => {
  const layout = readFileSync("app/research/layout.tsx", "utf8");
  const progress = readFileSync("components/ui/reading-progress.tsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(layout, /<ReadingProgress \/>/);
  assert.match(progress, /pathname === "\/research"/);
  assert.match(progress, /window.addEventListener\("scroll", schedule, \{ passive: true \}\)/);
  assert.match(progress, /role="progressbar"/);
  assert.match(progress, /aria-valuenow=\{percent\}/);
  assert.match(css, /\.reading-progress-fill/);
  assert.match(css, /pointer-events: none/);
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)[\s\S]*?data-motion-entered/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
