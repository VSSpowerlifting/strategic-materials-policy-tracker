import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FeaturedCase } from "@/components/home/featured-case";
import { fi002Screens } from "@/lib/fi002";

const html = renderToStaticMarkup(createElement(FeaturedCase));
const source = readFileSync("components/home/featured-case.tsx", "utf8");

test("featured exhibit shows every approved screen in tonnes a year, drawn from fi002Screens", () => {
  for (const s of fi002Screens) {
    assert.ok(html.includes((s.ktpa * 1000).toLocaleString("en-US")), `${s.name} value`);
  }
  // No threshold is typed into the component; all come from the approved screens.
  for (const n of ["199", "275", "333", "416"]) assert.doesNotMatch(source, new RegExp(`\\b${n}\\b`));
  // Four scenarios in model order, so a larger requirement is always a longer bar on one zero-based scale.
  const order = ["Base case", "10 years of benefits", "10 years, starting later", "Cost, price and timing setbacks"].map((l) => html.indexOf(l));
  assert.ok(order.every((x, i) => x !== -1 && (i === 0 || x > order[i - 1])));
});

test("each scenario marks only the assumptions that differ from the base case", () => {
  const marks = html.match(/\(differs from base case\)/g) ?? [];
  // Shorter benefits: span. Shorter and later: span and start. Combined stress: capital, price and start.
  assert.equal(marks.length, 1 + 2 + 3);
  assert.match(html, /\$7\.02bn<span class="sr-only"> \(differs from base case\)/);
  assert.match(html, /\$8,500\/t<span class="sr-only"> \(differs from base case\)/);
  // The combined stress case returns to a 20-year horizon, so its span is not marked.
  assert.match(html, /20 years<\/span> from <span class="font-medium text-foreground">2034/);
});

test("featured analysis separates modeled thresholds from output and keeps its downloads", () => {
  assert.match(html, /not forecasts of plant output/);
  // The tonnes are a money benefit translated through an assumed margin, not physical output the plant must reach.
  assert.match(html, /after-tax\s+profit on 199,000 tonnes of copper in the base case/);
  assert.match(html, /Those tonnes describe financial value, not how\s+much copper the new plant must produce\./);
  assert.match(html, /How much yearly value would justify BHP/);
  assert.match(html, /approved \$0\.8 billion of gross pre-commitment/);
  assert.match(html, /research cutoff 5 November 2026/);
  assert.doesNotMatch(html, /230–270/, "the plant's design output is not drawn beside the requirement");
  for (const href of ["/research/escondida-copper", "/research/fi002/model.xlsx", "/research/fi002/report.pdf"]) {
    assert.ok(html.includes(`href="${href}"`), href);
  }
});
