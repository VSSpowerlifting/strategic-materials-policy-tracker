import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "../app/page";

const html = renderToStaticMarkup(createElement(Home));
const source = readFileSync("app/page.tsx", "utf8");

test("editorial option leads with one oversized headline and keeps the flagship immediately below", () => {
  assert.equal((html.match(/<h1[\\s>]/g) ?? []).length, 1);
  assert.match(html, /Critical minerals research for policy and investment decisions/);
  assert.ok(source.indexOf("<FeaturedCase />") > source.indexOf("Read research"));
  assert.ok(source.indexOf("<FeaturedCase />") < source.indexOf('id="research"'));
  assert.match(source, /clamp\\(3\\.1rem,7\\.1vw,6\\.5rem\\)/);
  assert.doesNotMatch(source, /escondida-aerial-nasa\\.jpg/);
});

test("editorial option retains direct paths to research, records and the featured model", () => {
  assert.match(html, /href="\\/research"/);
  assert.match(html, /href="\\/events"/);
  assert.match(html, /href="\\/research\\/escondida-copper"/);
  assert.match(html, /href="\\/research\\/fi002\\/model.xlsx"/);
});
