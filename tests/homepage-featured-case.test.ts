import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FeaturedCase } from "../components/home/featured-case";
import { fi002, fi002Screens } from "../lib/fi002";

const rendered = renderToStaticMarkup(createElement(FeaturedCase));

test("flagship investment exhibit uses the published FI002 financial-model thresholds", () => {
  assert.match(rendered, /FI002 \/ Investment exhibit/);
  assert.match(rendered, /Required annual production-equivalent benefit/);
  for (const scenario of fi002Screens) {
    assert.ok(rendered.includes(scenario.name), scenario.name);
    assert.ok(rendered.includes(`${scenario.ktpa}`), `missing published output: ${scenario.ktpa} ktpa`);
  }
  assert.match(rendered, /Base-case capital/);
  assert.match(rendered, /\$5\.85bn/);
  assert.match(rendered, /not forecasts of plant production/);
});

test("the homepage visual links to the exact report and independent financial model", () => {
  assert.match(rendered, /href="\/research\/escondida-copper"/);
  assert.ok(rendered.includes(`href="${fi002.assets}/model.xlsx"`));
  assert.match(rendered, /Assumptions and sources/);
});

test("model bars remain legible without scripting or motion", () => {
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(rendered, /role="img"/);
  assert.match(rendered, /data-motion-kind="chart"/);
  assert.match(css, /prefers-reduced-motion: no-preference[\s\S]*featured-case-bar/);
  assert.doesNotMatch(rendered, /data-motion-ready="true"/);
});
