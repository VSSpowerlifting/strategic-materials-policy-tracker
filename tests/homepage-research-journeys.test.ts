import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "../app/page";
import {
  designationStatusOn,
  financialReadingOn,
  getFinancingCase,
  getLegalControlCase,
  getTungstenCase,
} from "../lib/homepage-cases";
import { financialStatusOn } from "../lib/capital-control";
import { getFinancialCommitmentById, getProjectDesignationById } from "../lib/data";
import { site } from "../lib/site";

const view = renderToStaticMarkup(createElement(Home));

test("homepage presents research, a compact market preview and three clear database destinations", () => {
  assert.match(view, /href="\/research"/);
  assert.match(view, /href="\/research\/china-export-control-suspension-extension"/);
  assert.match(view, /href="\/research\/escondida-copper"/);
  assert.match(view, /href="\/research\/hemerdon-financing"/);
  assert.match(view, /id="home-market-heading"/);
  for (const href of ["/events", "/capital", "/projects", "/compare", "/materials", "/markets"])
    assert.ok(view.includes(`href="${href}"`), href);
  assert.match(view, /id="research"/);
  assert.match(view, /id="database-heading"/);
  assert.doesNotMatch(view, /id="browse"|id="examples"|id="chain-heading"/);
});

test("the homepage leads with research and keeps the data tools secondary", () => {
  const chart = view.indexOf('id="home-market-heading"');
  const research = view.indexOf('id="research"');
  const database = view.indexOf('id="database-heading"');
  assert.ok(chart !== -1 && chart < research && research < database);
  assert.ok(view.includes('aria-label="Database sections"'));
  assert.doesNotMatch(view, /aria-label="Materials in scope"/);
  assert.doesNotMatch(view, /Current corpus|Unlock insights/i);
  assert.equal((view.match(/<dd/g) ?? []).length, 0);
});

test("underlying source-backed legal, capital and tungsten cases remain intact", () => {
  const legal = getLegalControlCase();
  const financing = getFinancingCase();
  const tungsten = getTungstenCase();
  assert.ok(legal?.control.productScopeAsStated);
  assert.equal(financing.length, 3);
  assert.equal(tungsten.length, 4);
  assert.ok(legal?.later.status.until);
  assert.equal(new Set(financing.map((r) => r.status.key)).size, 3);
  for (const row of financing)
    assert.equal(row.status.key, financialStatusOn(row.commitment, site.lastUpdated));
});

test("the dated legal and financing case readings do not use future changes", () => {
  const dod = getFinancialCommitmentById("fin-us-dod-perpetua-stibnite-dpa")!;
  const later = {
    ...dod,
    financialStatusHistory: [
      ...dod.financialStatusHistory,
      { ...dod.financialStatusHistory.at(-1)!, status: "withdrawn" as const, date: "2099-01-01" },
    ],
  };
  const reading = financialReadingOn(later, site.lastUpdated)!;
  assert.equal(reading.key, financialStatusOn(dod, site.lastUpdated));
  assert.notEqual(reading.key, "withdrawn");
  assert.equal(financialReadingOn(dod, "2000-01-01"), null);
  const dsg = getProjectDesignationById("dsg-eu-crma-tungsten-west")!;
  const laterDsg = { ...dsg, statusHistory: [...dsg.statusHistory, { ...dsg.statusHistory[0], status: "withdrawn" as never, date: "2099-01-01" }] };
  assert.equal(designationStatusOn(laterDsg, site.lastUpdated), dsg.statusHistory[0].status);
});

test("headings have one h1 and no skipped levels", () => {
  const levels = [...view.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  assert.equal(levels.filter((level) => level === 1).length, 1);
  assert.equal(levels[0], 1);
  for (let i = 1; i < levels.length; i++)
    assert.ok(levels[i] <= levels[i - 1] + 1);
});

test("in-page links point to actual anchor targets", () => {
  for (const anchor of [...view.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]))
    assert.ok(view.includes(`id="${anchor}"`), anchor);
});
