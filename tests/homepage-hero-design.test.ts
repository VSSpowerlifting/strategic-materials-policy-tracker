import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "../app/page";

const html = renderToStaticMarkup(createElement(Home));
const source = readFileSync("app/page.tsx", "utf8");

test("industrial option preserves accessible text and a credited, real photograph", () => {
  assert.equal((html.match(/<h1[\\s>]/g) ?? []).length, 1);
  assert.match(html, /Critical minerals research for policy and investment decisions/);
  assert.ok(existsSync("public/home/escondida-aerial-nasa.jpg"), "photo asset must be hosted locally");
  assert.match(source, /<Image/);
  assert.match(source, /alt="Astronaut photograph/);
  assert.match(html, /NASA \\/ Expedition 22 photograph/);
  assert.match(html, /science\\.nasa\\.gov/);
});

test("industrial option keeps the flagship directly below its tightened two-column hero", () => {
  assert.ok(source.indexOf("<FeaturedCase />") > source.indexOf("Read research"));
  assert.ok(source.indexOf("<FeaturedCase />") < source.indexOf('id="research"'));
  assert.match(source, /lg:grid-cols-\\[minmax\\(0,1\\.08fr\\)_minmax\\(0,0\\.92fr\\)\\]/);
  assert.match(html, /href="\\/research\\/escondida-copper"/);
  assert.match(html, /href="\\/research\\/fi002\\/model.xlsx"/);
});
